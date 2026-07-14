package javax.microedition.lcdui;

/**
 * 屏幕尺寸配置（oracle 侧）。
 *
 * 原版游戏是分辨率自适应的（如 game1 a.java:114 `b = this.getHeight() - 32`），
 * 会按 Canvas.getWidth()/getHeight() 推导布局。要与 TS port 逐 op 对拍，
 * 两侧必须同分辨率——否则每个坐标都不同、差分全红。
 *
 * TS port 侧（packages/web/src/main.ts、behavior-net/src/game{1,2}-adapter.ts）：
 *   game1 = 176x208，game2 = 176x204。
 *
 * 默认值 240x320 仅为兼容早期实验基线；实际对拍须经 -Doracle.width/-Doracle.height 指定。
 */
public final class ScreenConfig {
  private ScreenConfig() {}

  public static final int WIDTH = Integer.getInteger("oracle.width", 240);
  public static final int HEIGHT = Integer.getInteger("oracle.height", 320);
}
