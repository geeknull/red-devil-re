/**
 * 游戏1《红魔特种兵》MIDlet 入口。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/GameMIDlet.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 别名（见 docs/game1-红魔特种兵/类清单与职责.md）：
 *   字段 a=主Canvas, b=Display, c=全局Random, d=4字节读缓冲, e=菜单文案表
 *   a_I=随机数(abs(nextInt)%n), a_In=读小端u16, b_In=读字节, c_In=读小端i32, a_SI=定位资源流
 */
import { MIDlet, Display, Random, InputStream, getResourceAsStream } from "@red-devil/j2me-shim";
import { GameScreen } from "./GameScreen.ts";
import { GameState } from "./constants.ts";

export class GameMIDlet extends MIDlet {
  screen: GameScreen;
  display: Display;
  static random: Random;
  static readBuffer: Int8Array = new Int8Array(4);
  // 菜单文案：新游戏/继续/选择任务/声音 开/帮助/关于/退出/声音 关/返回游戏/菜单
  static menuTexts: string[] = [
    "新游戏", "继续", "选择任务", "声音 开",
    "帮助", "关于", "退出", "声音 关", "返回游戏", "菜单",
  ];

  constructor() {
    super();
    // Java 字段初始化器先于构造体执行：`a a = new a(this)`、`b = Display.getDisplay(this)`
    // 在构造体之前求值，最后才是构造体里的 c。严格复刻此求值顺序。
    this.screen = new GameScreen(this);
    this.display = Display.getDisplay(this);
    GameMIDlet.random = new Random();
    GameMIDlet.random.setSeed(Date.now()); // System.currentTimeMillis()
  }

  pauseApp(): void {
    if (this.screen.state === GameState.Playing) {
      this.screen.menuSelection = 0;
      this.screen.clearInputQueue();
      this.screen.state = GameState.Paused;
    }
  }

  startApp(): void {
    this.display.setCurrent(this.screen);
  }

  destroyApp(_unconditional: boolean): void {
    this.display.setCurrent(null);
  }

  /** GameMIDlet.a(int)：取随机数绝对值后对 n 取模。 */
  static nextRandomMod(n: number): number {
    let n2 = GameMIDlet.random.nextInt();
    if (n2 < 0) n2 = -n2;
    return n2 % n;
  }

  /** GameMIDlet.a(InputStream)：读小端 16 位（高字节有符号，返回 short 语义）。 */
  static readU16Le(inputStream: InputStream): number {
    const byArray = new Int8Array(2);
    inputStream.read(byArray);
    let s = byArray[0];
    if (s < 0) s = s + 256;
    s = s + byArray[1] * 256;
    return (s << 16) >> 16; // (short) 截断
  }

  /** GameMIDlet.b(InputStream)：读 1 字节（有符号）。 */
  static readByte(inputStream: InputStream): number {
    const byArray = new Int8Array(1);
    inputStream.read(byArray);
    return byArray[0];
  }

  /** GameMIDlet.c(InputStream)：读小端 32 位整数。 */
  static readI32Le(inputStream: InputStream): number {
    let n = 0;
    inputStream.read(GameMIDlet.readBuffer);
    let n2 = 3;
    while (n2 >= 0) {
      n <<= 8;
      n += GameMIDlet.readBuffer[n2];
      if (GameMIDlet.readBuffer[n2] < 0) n += 256;
      --n2;
    }
    return n | 0;
  }

  /** GameMIDlet.a(String,int)：返回定位到归档第 n 条目起始的输入流。 */
  static openArchiveEntryStream(string: string, n: number): InputStream | null {
    let n2 = 0;
    try {
      const inputStream = getResourceAsStream(string)!;
      const n3 = GameMIDlet.readI32Le(inputStream);
      let n4 = 0;
      while (n4 < n3) {
        if (n4 === n) n2 = GameMIDlet.readI32Le(inputStream);
        else inputStream.read(GameMIDlet.readBuffer);
        ++n4;
      }
      inputStream.skip(n2);
      return inputStream;
    } catch (exception) {
      return null;
    }
  }
}
