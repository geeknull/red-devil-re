/**
 * 游戏2《红魔特种兵2-深海战舰》MIDlet 入口。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/GameMIDlet.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 与游戏1 差异：状态字段为 a.b（非 a.p）；资源 int 经字节数组读取器 a_AYII（小端）；
 *   音频用 javax.microedition.media（MIDI Player）—— 暂以空实现占位（音频后续接入，不影响画面/逻辑一致）；
 *   存档 RMS "REDDEVIL2"(5字节) → localStorage。
 *
 * 别名：c=全局Random, d/e/f=读缓冲, g=音超时, h=音轨数, i=MIDI播放器[], j=当前音轨,
 *   k=5字节存档, l/m/n=临时字符串, o/p/q/r=菜单/过场/任务/数字 文案表。
 */
import {
  MIDlet,
  Display,
  Random,
  InputStream,
  getResourceAsStream,
  getCachedImage,
  Image,
  MidiSynth,
  getAudioContext,
} from "@red-devil/j2me-shim";
import { GameCanvas } from "./GameCanvas.ts";
import { UiState } from "./constants.ts";

export class GameMIDlet extends MIDlet {
  canvas: GameCanvas;
  display: Display;
  static random: Random;
  static byteBuf1: Int8Array = new Int8Array(1);
  static byteBuf2: Int8Array = new Int8Array(2);
  static byteBuf4: Int8Array = new Int8Array(4);
  static soundTimeout = 0;
  static soundTrackCount = 2;
  static soundPlayers: (MidiSynth | null)[] = new Array(GameMIDlet.soundTrackCount).fill(null); // MIDI 合成器[]
  static currentSoundIndex = -1;
  static saveRecord: Int8Array = Int8Array.from([0, 0, 1, 0, 6]); // 5 字节存档
  static tempText1 = "";
  static tempText2 = "";
  static tempText3 = "";
  // 菜单文案：返回游戏/新游戏/继续/声音 开/帮助/关于/退出/声音 关
  static menuTexts: string[] = ["返回游戏", "新游戏", "继续", "声音 开", "帮助", "关于", "退出", "声音 关"];
  // 过场/结算文案
  static interludeTexts: string[] = [
    "继续", "跳过", "任务", "返回", "完成", "击毙敌人:", "所用时间:", "继续次数:", "失败", "菜单", "游戏结束", "载入中", ".",
  ];
  // 任务目标文案
  static missionTexts: string[] = [
    "找到船舱入口。", "找到罗斯上校。", "控制台输入锁死密码", "摧毁动力装置", "摧毁备用动力装置", "摧毁直升飞机", "摧毁导弹艇",
  ];
  // 关卡序号（一~十）
  static numeralTexts: string[] = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

  constructor() {
    super();
    // Java 字段初始化器先于构造体执行：`a a = new a(this)`、`b = Display.getDisplay(this)`
    // 在构造体之前求值，最后才是构造体里的 c。严格复刻此求值顺序。
    this.canvas = new GameCanvas(this);
    this.display = Display.getDisplay(this);
    GameMIDlet.random = new Random();
    GameMIDlet.random.setSeed(Date.now());
  }

  pauseApp(): void {
    if (this.canvas.uiState === UiState.InGame) {
      this.canvas.inputAction = 0;
      this.canvas.uiState = UiState.MainMenu;
      this.canvas.menuStartItem = 0;
      this.canvas.menuSelection = 0;
    }
  }

  startApp(): void {
    this.display.setCurrent(this.canvas);
  }

  destroyApp(_unconditional: boolean): void {
    GameMIDlet.accessSaveRecord(1);
    this.display.setCurrent(null);
    this.canvas.running = false;
    this.canvas.mainThread = null as unknown as GameCanvas["mainThread"];
    this.notifyDestroyed();
  }

  /** GameMIDlet.a(int)：随机数绝对值取模。 */
  static randomBelow(n: number): number {
    let n2 = GameMIDlet.random.nextInt();
    if (n2 < 0) n2 = -n2;
    return n2 % n;
  }

  /** GameMIDlet.a(InputStream)：读 1 字节（有符号）。 */
  static readByte(inputStream: InputStream): number {
    inputStream.read(GameMIDlet.byteBuf1);
    return GameMIDlet.byteBuf1[0];
  }

  /** GameMIDlet.b(InputStream)：读小端 16 位（高字节有符号，short 语义）。 */
  static readShortLE(inputStream: InputStream): number {
    inputStream.read(GameMIDlet.byteBuf2);
    let n = GameMIDlet.byteBuf2[1];
    n <<= 8;
    n |= GameMIDlet.byteBuf2[0] & 0xff;
    return (n << 16) >> 16;
  }

  /** GameMIDlet.a(byte[],int,int)：从字节数组按小端读 n2 字节为 int（最高字节有符号）。 */
  static readIntLE(byArray: Int8Array, n: number, n2: number): number {
    let n3 = 0;
    let n4 = n2 - 1;
    while (n4 >= 0) {
      n3 <<= 8;
      if (n4 === n2 - 1) n3 |= byArray[n4 + n];
      else n3 |= byArray[n4 + n] & 0xff;
      --n4;
    }
    return n3 | 0;
  }

  // ---- 音频（MIDI）：自带轻量 WebAudio 合成器播放 sound.bin 的标准 MIDI（设备相关，最佳努力）----
  /** 原 a()：单次播放结束后的超时回收（g 倒计时，曲终且 g 到期则释放）。 */
  static tickSoundTimeout(): void {
    if (GameMIDlet.currentSoundIndex >= 0 && --GameMIDlet.soundTimeout < 0) {
      const p = GameMIDlet.soundPlayers[GameMIDlet.currentSoundIndex];
      if (p && !p.isPlaying()) {
        p.stop();
        GameMIDlet.currentSoundIndex = -1;
      }
    }
  }
  /** 原 b()：加载 sound.bin 的 MIDI 到合成器数组。 */
  static loadSounds(): void {
    const ctx = getAudioContext();
    if (!ctx) return;
    let n = 0;
    while (n < GameMIDlet.soundTrackCount) {
      try {
        const bytes = GameMIDlet.readEntryBytes("/res/sound.bin", n);
        if (bytes != null) {
          GameMIDlet.soundPlayers[n] = new MidiSynth(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), ctx);
        }
      } catch (exception) {
        /* ignore */
      }
      ++n;
    }
  }
  /** 原 a(int,int)：播放音轨 n（k[2]=声音开关；setLoopCount(1)=单次）。 */
  static playSound(n: number, _n2: number): void {
    if (GameMIDlet.saveRecord[2] === 0) return; // 声音关
    try {
      GameMIDlet.stopSound();
      const p = GameMIDlet.soundPlayers[n];
      if (p) {
        p.play(false); // 原 setLoopCount(1)：单次播放
        GameMIDlet.soundTimeout = 2;
        GameMIDlet.currentSoundIndex = n;
      }
    } catch (exception) {
      /* ignore */
    }
  }
  /** 原 c()：停止当前音轨。 */
  static stopSound(): void {
    if (GameMIDlet.currentSoundIndex < 0) return;
    try {
      GameMIDlet.soundPlayers[GameMIDlet.currentSoundIndex]?.stop();
    } catch (exception) {
      /* ignore */
    }
  }

  /** GameMIDlet.b(int)：RMS 存档 "REDDEVIL2"(5字节) → localStorage。 */
  static accessSaveRecord(n: number): void {
    try {
      if (n === 2) {
        GameMIDlet.saveRecord[0] = 0;
        GameMIDlet.saveRecord[1] = 0;
        return;
      }
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("REDDEVIL2") : null;
      if (raw) {
        if (n === 0) {
          const arr = raw.split(",").map((x) => Number(x));
          GameMIDlet.saveRecord = Int8Array.from(arr);
        } else if (n === 1) {
          localStorage.setItem("REDDEVIL2", Array.from(GameMIDlet.saveRecord.slice(0, 5)).join(","));
        }
      } else {
        if (n === 0) {
          GameMIDlet.saveRecord[0] = 0;
          GameMIDlet.saveRecord[1] = 0;
        } else if (n === 1) {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("REDDEVIL2", Array.from(GameMIDlet.saveRecord.slice(0, 5)).join(","));
          }
        }
      }
    } catch (exception) {
      /* ignore */
    }
  }

  /** GameMIDlet.a(int,String)：从 string.bin 第 n 条读 UTF-16 文本，存入 l 或 n。 */
  static loadTextEntry(n: number, string: string): void {
    const byArray = GameMIDlet.readEntryBytes(string, n);
    if (byArray != null) {
      const cArray = new Array<number>(byArray.length / 2);
      let n2 = 0;
      while (n2 < ((byArray.length / 2) | 0)) {
        cArray[n2] = GameMIDlet.readIntLE(byArray, n2 * 2, 2);
        ++n2;
      }
      const s = String.fromCharCode(...cArray);
      if (n < 7) GameMIDlet.tempText1 = s;
      else GameMIDlet.tempText3 = s;
      // System.gc();
    }
  }

  /** GameMIDlet.a(String,int)：从归档第 n 条 PNG 取图（预解码缓存）。 */
  static loadImage(string: string, n: number): Image {
    // 原版：c(string,n) 取 PNG 字节 → Image.createImage；这里取预解码缓存（见 docs/05 §5）
    return getCachedImage<Image>(string, n);
  }

  /** GameMIDlet.b(String,int)：返回定位到归档第 n 条起始的输入流。 */
  static openEntryStream(string: string, n: number): InputStream | null {
    let n2 = 0;
    try {
      const inputStream = getResourceAsStream(string)!;
      inputStream.read(GameMIDlet.byteBuf4);
      const n3 = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
      let n4 = 0;
      while (n4 < n3) {
        inputStream.read(GameMIDlet.byteBuf4);
        if (n4 === n) n2 = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
        ++n4;
      }
      inputStream.skip(n2);
      return inputStream;
    } catch (exception) {
      return null;
    }
  }

  /** GameMIDlet.c(String,int)：取归档第 n 条目的字节切片。 */
  static readEntryBytes(string: string, n: number): Int8Array | null {
    let n2 = 0;
    let n3 = 0;
    try {
      const inputStream = getResourceAsStream(string)!;
      inputStream.read(GameMIDlet.byteBuf4);
      const n4 = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
      let n5 = 0;
      while (n5 < n4) {
        inputStream.read(GameMIDlet.byteBuf4);
        if (n5 === n) n2 = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
        else if (n5 === n + 1) n3 = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4) - n2;
        ++n5;
      }
      inputStream.skip(n2);
      const byArray = new Int8Array(n3);
      inputStream.read(byArray);
      inputStream.close();
      return byArray;
    } catch (exception) {
      return null;
    }
  }
}
