/**
 * 游戏1《红魔特种兵》MIDlet 入口 + 全局字节读取原语。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/GameMIDlet.java（CFR 权威源，117 行）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 角色（见 docs/game1-红魔特种兵/类清单与职责.md §1）：
 *   - J2ME 应用生命周期入口（extends MIDlet），由平台调用 startApp/pauseApp/destroyApp。
 *   - 持有并创建核心 Canvas（GameScreen，对应 CFR 的 `a` 类，承载游戏循环/状态机/HUD）。
 *   - 同时是全局工具箱：提供唯一随机数源与一组 .bin 归档的小端字节读取原语，
 *     被 b/i/j 等资源加载类与 a 的资源方法共用。
 *
 * 关键字段（与协作者）：
 *   - screen(CFR `a`)：主 Canvas 单例，持有全部子系统（地图/精灵/敌人/玩家等）。
 *   - display(CFR `b`)：平台 Display，startApp 时把 screen 设为当前屏。
 *   - random(CFR static `c`)：全游戏唯一随机来源，构造时以当前毫秒播种。
 *   - readBuffer(CFR static `d`)：4 字节 int32 读取缓冲，被多个静态读取原语复用。
 *   - menuTexts(CFR static `e`)：10 条菜单文案，供 GameScreen 绘制菜单/暂停界面。
 *
 * 别名（CFR 单字母 → 本类成员）：
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

  /**
   * GameMIDlet()（CFR 29）：构造应用实例。
   * 严格复刻 Java 求值顺序——字段初始化器先于构造体：先 `new GameScreen(this)`、
   * 再 `Display.getDisplay(this)`，最后才在构造体中创建全局 Random 并以当前毫秒
   * （System.currentTimeMillis）播种。详见下方注释。
   */
  constructor() {
    super();
    // Java 字段初始化器先于构造体执行：`a a = new a(this)`、`b = Display.getDisplay(this)`
    // 在构造体之前求值，最后才是构造体里的 c。严格复刻此求值顺序。
    this.screen = new GameScreen(this);
    this.display = Display.getDisplay(this);
    GameMIDlet.random = new Random();
    GameMIDlet.random.setSeed(Date.now()); // System.currentTimeMillis()
  }

  /**
   * pauseApp()（CFR 34）：平台暂停回调（如来电/切后台）。
   * 仅当当前正处于游戏中（Playing）时生效：把菜单选项归零、清空输入队列，
   * 再切换到暂停菜单状态（Paused）。其它状态下不做任何处理。
   * 对应 CFR：`a.y=0; a.f(); a.p=13`。
   */
  pauseApp(): void {
    if (this.screen.state === GameState.Playing) {
      this.screen.menuSelection = 0;
      this.screen.clearInputQueue();
      this.screen.state = GameState.Paused;
    }
  }

  /**
   * startApp()（CFR 42）：平台启动/恢复回调。
   * 把主 Canvas（screen）设为当前显示屏，使游戏画面可见并开始接收输入。
   * 对应 CFR：`b.setCurrent(a)`。
   */
  startApp(): void {
    this.display.setCurrent(this.screen);
  }

  /**
   * destroyApp(unconditional)（CFR 46）：平台销毁回调。
   * 清空当前显示屏（setCurrent(null)）以释放屏幕；参数 unconditional 在此实现中未使用。
   */
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
