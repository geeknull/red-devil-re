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
 *
 * 角色：整个游戏2 的程序入口与"基础设施层"。三大职责——
 *   ① MIDlet 生命周期（startApp/pauseApp/destroyApp）并持有唯一的主 Canvas（{@link GameCanvas}）与 Display；
 *   ② .bin 归档的字节 IO 原语（小端读取、定位流、整条切片、PNG/字符串/MIDI 加载），是全游戏唯一的资源读取入口；
 *   ③ 音频（MIDI）与存档（RMS→localStorage）的全局静态服务。
 * 协作者：构造时创建 {@link GameCanvas}（主循环/渲染/状态机均在其中）；c 是**全游戏唯一随机源**，
 *   被各处的 {@link GameMIDlet.randomBelow} 复用。
 *
 * 存档 k=saveRecord[5] 各字节语义（据 docs「类清单与职责」）：
 *   [0]=当前关、[1]=继续次数、[2]=声音开关(1=开)、[3]=最高已通关、[4]=存档时玩家生命。
 *
 * CFR 基准：reverse/game2/2-decompiled-cfr/tjge/GameMIDlet.java；语义参见
 *   docs/game2-深海战舰/{类清单与职责.md,资源映射.md}。
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

  /**
   * 构造 MIDlet：创建主 Canvas、取 Display、初始化全局随机源。
   * 严格复刻 Java 求值顺序（字段初始化器先于构造体）：先 `new GameCanvas(this)`、
   * 再 `Display.getDisplay(this)`，最后才是构造体里的 `c = new Random(); c.setSeed(currentTimeMillis())`。
   * c 随后成为全游戏唯一随机源。CFR：GameMIDlet.java 字段 + 构造 54-57。
   */
  constructor() {
    super();
    // Java 字段初始化器先于构造体执行：`a a = new a(this)`、`b = Display.getDisplay(this)`
    // 在构造体之前求值，最后才是构造体里的 c。严格复刻此求值顺序。
    this.canvas = new GameCanvas(this);
    this.display = Display.getDisplay(this);
    GameMIDlet.random = new Random();
    GameMIDlet.random.setSeed(Date.now());
  }

  /**
   * MIDlet 暂停回调：若正处于游戏中（InGame），清输入动作并复位菜单状态、强制切回主菜单。
   * 复刻原 pauseApp（来电/切后台时让游戏挂起到菜单）。CFR：GameMIDlet.java pauseApp。
   */
  pauseApp(): void {
    if (this.canvas.uiState === UiState.InGame) {
      this.canvas.inputAction = 0;
      this.canvas.uiState = UiState.MainMenu;
      this.canvas.menuStartItem = 0;
      this.canvas.menuSelection = 0;
    }
  }

  /**
   * MIDlet 启动回调：把主 Canvas 设为当前显示，进入游戏。CFR：GameMIDlet.java startApp。
   */
  startApp(): void {
    this.display.setCurrent(this.canvas);
  }

  /**
   * MIDlet 销毁回调：写存档（{@link GameMIDlet.accessSaveRecord} 传 1=写）、解绑显示、
   * 停主循环线程，最后 notifyDestroyed()。CFR：GameMIDlet.java destroyApp。
   */
  destroyApp(_unconditional: boolean): void {
    GameMIDlet.accessSaveRecord(1);
    this.display.setCurrent(null);
    this.canvas.running = false;
    this.canvas.mainThread = null as unknown as GameCanvas["mainThread"];
    this.notifyDestroyed();
  }

  /** GameMIDlet.a(int)：随机数绝对值取模，返回 [0,bound) 内的值。 */
  static randomBelow(bound: number): number {
    let value = GameMIDlet.random.nextInt();
    if (value < 0) value = -value;
    return value % bound;
  }

  /** GameMIDlet.a(InputStream)：读 1 字节（有符号）。 */
  static readByte(inputStream: InputStream): number {
    inputStream.read(GameMIDlet.byteBuf1);
    return GameMIDlet.byteBuf1[0];
  }

  /** GameMIDlet.b(InputStream)：读小端 16 位（高字节有符号，`(x<<16)>>16` 复现 Java short 截断）。 */
  static readShortLE(inputStream: InputStream): number {
    inputStream.read(GameMIDlet.byteBuf2);
    let value = GameMIDlet.byteBuf2[1];
    value <<= 8;
    value |= GameMIDlet.byteBuf2[0] & 0xff;
    return (value << 16) >> 16;
  }

  /** GameMIDlet.a(byte[],int,int)：从 bytes 偏移 offset 按小端读 byteCount 字节为 int（最高字节有符号，低字节 `&0xff` 去符号）。 */
  static readIntLE(bytes: Int8Array, offset: number, byteCount: number): number {
    let result = 0;
    let i = byteCount - 1;
    while (i >= 0) {
      result <<= 8;
      if (i === byteCount - 1) result |= bytes[i + offset];
      else result |= bytes[i + offset] & 0xff;
      --i;
    }
    return result | 0;
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
    let trackIndex = 0;
    while (trackIndex < GameMIDlet.soundTrackCount) {
      try {
        const bytes = GameMIDlet.readEntryBytes("/res/sound.bin", trackIndex);
        if (bytes != null) {
          GameMIDlet.soundPlayers[trackIndex] = new MidiSynth(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength), ctx);
        }
      } catch (exception) {
        /* ignore */
      }
      ++trackIndex;
    }
  }
  /** 原 a(int,int)：播放音轨 trackIndex（k[2]=声音开关；setLoopCount(1)=单次）。_n2 为保留匹配原签名的死参。 */
  static playSound(trackIndex: number, _n2: number): void {
    if (GameMIDlet.saveRecord[2] === 0) return; // 声音关
    try {
      GameMIDlet.stopSound();
      const p = GameMIDlet.soundPlayers[trackIndex];
      if (p) {
        p.play(false); // 原 setLoopCount(1)：单次播放
        GameMIDlet.soundTimeout = 2;
        GameMIDlet.currentSoundIndex = trackIndex;
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

  /**
   * GameMIDlet.b(int)：RMS 存档 "REDDEVIL2"(5 字节 [关/继续数/声音/进度/储备弹]) ↔ localStorage。
   * @param mode 0=读入 saveRecord；1=写出 saveRecord；2=清头两字节（关卡/继续数归零，不落盘）
   */
  static accessSaveRecord(mode: number): void {
    try {
      if (mode === 2) {
        GameMIDlet.saveRecord[0] = 0;
        GameMIDlet.saveRecord[1] = 0;
        return;
      }
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("REDDEVIL2") : null;
      if (raw) {
        if (mode === 0) {
          const arr = raw.split(",").map((x) => Number(x));
          GameMIDlet.saveRecord = Int8Array.from(arr);
        } else if (mode === 1) {
          localStorage.setItem("REDDEVIL2", Array.from(GameMIDlet.saveRecord.slice(0, 5)).join(","));
        }
      } else {
        if (mode === 0) {
          GameMIDlet.saveRecord[0] = 0;
          GameMIDlet.saveRecord[1] = 0;
        } else if (mode === 1) {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("REDDEVIL2", Array.from(GameMIDlet.saveRecord.slice(0, 5)).join(","));
          }
        }
      }
    } catch (exception) {
      /* ignore */
    }
  }

  /** GameMIDlet.a(int,String)：从 archivePath 第 entryIndex 条读 UTF-16 文本，存入 tempText1(entryIndex<7) 或 tempText3。 */
  static loadTextEntry(entryIndex: number, archivePath: string): void {
    const bytes = GameMIDlet.readEntryBytes(archivePath, entryIndex);
    if (bytes != null) {
      const chars = new Array<number>(bytes.length / 2);
      let i = 0;
      while (i < ((bytes.length / 2) | 0)) {
        chars[i] = GameMIDlet.readIntLE(bytes, i * 2, 2);
        ++i;
      }
      const text = String.fromCharCode(...chars);
      if (entryIndex < 7) GameMIDlet.tempText1 = text;
      else GameMIDlet.tempText3 = text;
      // System.gc();
    }
  }

  /** GameMIDlet.a(String,int)：从 archivePath 第 entryIndex 条 PNG 取图（预解码缓存）。 */
  static loadImage(archivePath: string, entryIndex: number): Image {
    // 原版：c(archivePath,entryIndex) 取 PNG 字节 → Image.createImage；这里取预解码缓存（见 docs/05 §5）
    return getCachedImage<Image>(archivePath, entryIndex);
  }

  /** GameMIDlet.b(String,int)：返回定位到 archivePath 第 entryIndex 条起始的输入流。 */
  static openEntryStream(archivePath: string, entryIndex: number): InputStream | null {
    let offset = 0;
    try {
      const inputStream = getResourceAsStream(archivePath)!;
      inputStream.read(GameMIDlet.byteBuf4);
      const entryCount = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
      let i = 0;
      while (i < entryCount) {
        inputStream.read(GameMIDlet.byteBuf4);
        if (i === entryIndex) offset = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
        ++i;
      }
      inputStream.skip(offset);
      return inputStream;
    } catch (exception) {
      return null;
    }
  }

  /** GameMIDlet.c(String,int)：取 archivePath 第 entryIndex 条目的字节切片（读第 entryIndex 与 entryIndex+1 条 offset 之差为长度）。 */
  static readEntryBytes(archivePath: string, entryIndex: number): Int8Array | null {
    let startOffset = 0;
    let byteCount = 0;
    try {
      const inputStream = getResourceAsStream(archivePath)!;
      inputStream.read(GameMIDlet.byteBuf4);
      const entryCount = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
      let i = 0;
      while (i < entryCount) {
        inputStream.read(GameMIDlet.byteBuf4);
        if (i === entryIndex) startOffset = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4);
        else if (i === entryIndex + 1) byteCount = GameMIDlet.readIntLE(GameMIDlet.byteBuf4, 0, 4) - startOffset;
        ++i;
      }
      inputStream.skip(startOffset);
      const result = new Int8Array(byteCount);
      inputStream.read(result);
      inputStream.close();
      return result;
    } catch (exception) {
      return null;
    }
  }
}
