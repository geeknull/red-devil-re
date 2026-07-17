package harness;

/**
 * 虚拟时钟 —— 修 oracle 的「两侧不共享时钟」洞（见 docs/jvm-oracle-保真审计.md 第四份产出）。
 *
 * <p>{@code patch-clock.mjs} 把原版 {@code tjge/*.class} 常量池里
 * {@code Methodref(java/lang/System, currentTimeMillis:()J)} 的 class_index 重指向本类
 * （**方法名与描述符一字未改，字节码指令一条未动**）→ 原版每次读时钟都读到这里。
 *
 * <p><b>为什么要虚拟</b>：{@code System.currentTimeMillis()} <b>有 3 处在 {@code tjge.a.paint()} 内</b>，
 * 且该值<b>直接驱动绘制</b>（关卡耗时 mm:ss）。harness 按固定帧预算全速直调 paint（2127 帧只花 &lt;1s
 * 墙钟）→ 显示 {@code 0:00}；而真机 10FPS 跑 1860 帧就是 186 秒 → 应显示 {@code 3:06}。
 * 不虚拟化 = oracle 在这条路径上<b>说谎</b>。
 *
 * <p><b>步长独立取自原版字节码，不是抄 port</b>（否则差分就成了「用它自己验它自己」）：
 * <ul>
 *   <li>game1：{@code tjge.a.<init>} 的 {@code ldc2_w long 100l → putfield W:J} → <b>100ms</b></li>
 *   <li>game2：{@code tjge.a.run()} 的 {@code ldc2_w long 80l} 紧邻 {@code Thread.sleep} → <b>80ms</b></li>
 * </ul>
 *
 * <p><b>语义须与 port 侧假时钟对齐</b>：port（behavior-net {@code installClock(0)}）从 0 起、
 * <b>每帧 paint 之后</b> {@code advance(frameStepMs)} → 第 f 帧 paint 期间时刻 = {@code f*step}。
 * 故 harness 必须 <b>paint 之后</b>才 {@link #tick()}。（两侧都只用<b>差值</b>，故绝对原点无关紧要；
 * 但每帧步进必须一致。）
 */
public final class VClock {
  private VClock() {}

  /** 当前虚拟时刻（ms）。从 0 起。 */
  public static long now = 0L;

  /** 每帧步进（ms）：game1=100 / game2=80，由 OracleRun 按游戏号设定（值取自原版字节码）。 */
  public static long step = 100L;

  /**
   * 原版所有 {@code System.currentTimeMillis()} 调用经补丁后落到这里。
   * <b>名字与描述符必须与 {@code System.currentTimeMillis()J} 完全一致</b>——补丁只换了持有类。
   */
  public static long currentTimeMillis() {
    return now;
  }

  /** 推进一帧（harness 在每次 paint <b>之后</b>调用，与 port 侧 clock.advance 对称）。 */
  public static void tick() {
    now += step;
  }

  /** 复位（每次 run 开始时调用，保证可复现）。 */
  public static void reset(long stepMs) {
    now = 0L;
    step = stepMs;
  }
}
