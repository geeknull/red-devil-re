package javax.microedition.lcdui;

/**
 * 模块级 op tap —— 与 TS port 侧 `packages/j2me-shim/src/optap.ts` **对称**。
 *
 * 为什么必须是模块级、而不是每个 Graphics 实例各记各的：
 *   游戏会用 `Image.getGraphics()` 拿到**离屏缓冲**的 Graphics 往里画（如 game2 TileMap
 *   的滚动缓冲）。若只读 `paint(g)` 那个 g 的 ops，这些离屏绘制会被**整段漏掉**——
 *   实测漏掉 1402 条 setClip + 1402 条 drawImage（正是瓦片缓冲的逐格贴图）。
 *   port 侧 tap 本就是模块级，故 oracle 必须对称，否则两侧 op 流不可比。
 */
public final class OpTap {
  private OpTap() {}

  private static java.util.List<String> ops = null;

  /** 开始收集（会清空上一批）。 */
  public static void begin() {
    ops = new java.util.ArrayList<>();
  }

  /** 取走已收集的 op 并清空，便于逐帧切分。 */
  public static java.util.List<String> take() {
    if (ops == null) return new java.util.ArrayList<>();
    java.util.List<String> out = ops;
    ops = new java.util.ArrayList<>();
    return out;
  }

  /** 记录一条 op（未开启收集时为 no-op）。 */
  public static void record(String op) {
    if (ops != null) ops.add(op);
  }
}
