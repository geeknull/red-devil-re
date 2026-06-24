/**
 * javax.microedition.lcdui.Image 的复刻。
 *
 * 用一块离屏画布作为后备存储：
 *  - PNG 图片在资源预加载阶段异步解码后包成 Image（见 web 运行壳）。
 *  - createImage(w,h) 创建可变图，getGraphics() 返回其绘图上下文。
 *  - 支持 Nokia DirectGraphics 风格的 RGBA 像素图（游戏1 的 4bit 解码管线）。
 */
import { Graphics } from "./Graphics.ts";

/** 离屏画布工厂；浏览器默认用 OffscreenCanvas / <canvas>，可被运行壳替换。 */
export type CanvasFactory = (w: number, h: number) => {
  canvas: any;
  ctx: CanvasRenderingContext2D;
};

let canvasFactory: CanvasFactory = (w, h) => {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
    return { canvas, ctx };
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
};

export function setCanvasFactory(f: CanvasFactory): void {
  canvasFactory = f;
}

export class Image {
  private constructor(
    private readonly canvas: any,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly w: number,
    private readonly h: number,
    private readonly mutable: boolean
  ) {}

  getWidth(): number {
    return this.w;
  }
  getHeight(): number {
    return this.h;
  }
  isMutable(): boolean {
    return this.mutable;
  }

  /** 作为绘制源（drawImage / drawRegion 用）。 */
  source(): CanvasImageSource {
    return this.canvas;
  }

  /** 对应 Image.getGraphics()，仅可变图可用。 */
  getGraphics(): Graphics {
    if (!this.mutable) throw new Error("不可变图不能获取 Graphics");
    return new Graphics(this.ctx, this.w, this.h);
  }

  // ---- 工厂方法 ----

  /** 对应 Image.createImage(int w, int h)：可变图，初始填充白色。 */
  static createMutable(w: number, h: number): Image {
    const { canvas, ctx } = canvasFactory(w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    return new Image(canvas, ctx, w, h, true);
  }

  /** 把已解码的图像源（ImageBitmap/HTMLImageElement/Canvas）包成不可变 Image。 */
  static fromSource(src: CanvasImageSource, w: number, h: number): Image {
    const { canvas, ctx } = canvasFactory(w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0);
    return new Image(canvas, ctx, w, h, false);
  }

  /**
   * 对应 Nokia DirectGraphics / Image.createRGBImage(int[] argb, w, h, processAlpha)。
   * 用于游戏1 把自解码的 RGB444/4bit 像素写成图像。
   * @param argb 长度 w*h 的 0xAARRGGBB 数组
   */
  static createRGBImage(argb: Int32Array | number[], w: number, h: number, processAlpha: boolean): Image {
    const { canvas, ctx } = canvasFactory(w, h);
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;
    for (let i = 0; i < w * h; i++) {
      const p = argb[i];
      d[i * 4] = (p >> 16) & 0xff;
      d[i * 4 + 1] = (p >> 8) & 0xff;
      d[i * 4 + 2] = p & 0xff;
      d[i * 4 + 3] = processAlpha ? (p >> 24) & 0xff : 0xff;
    }
    ctx.putImageData(imgData, 0, 0);
    return new Image(canvas, ctx, w, h, false);
  }

  /** 对应 createImage(Image, x, y, w, h, transform) 的无变换子图裁剪。 */
  static subImage(src: Image, x: number, y: number, w: number, h: number): Image {
    const { canvas, ctx } = canvasFactory(w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src.source(), x, y, w, h, 0, 0, w, h);
    return new Image(canvas, ctx, w, h, false);
  }
}
