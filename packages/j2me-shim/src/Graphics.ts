/**
 * javax.microedition.lcdui.Graphics 的 Canvas 2D 复刻。
 *
 * 仅实现两款游戏实际用到的方法，语义严格对齐 MIDP-1.0 + Nokia DirectGraphics +
 * Game API Sprite 变换常量。坐标系左上角原点，与 J2ME 一致。
 */
import type { Image } from "./Image.ts";
import { Font } from "./Font.ts";
import { recordOp } from "./optap.ts";

// 锚点常量（Graphics）
export const HCENTER = 1;
export const VCENTER = 2;
export const LEFT = 4;
export const RIGHT = 8;
export const TOP = 16;
export const BOTTOM = 32;
export const BASELINE = 64;

// Sprite 变换常量（javax.microedition.lcdui.game.Sprite）
export const TRANS_NONE = 0;
export const TRANS_MIRROR_ROT180 = 1;
export const TRANS_MIRROR = 2;
export const TRANS_ROT180 = 3;
export const TRANS_MIRROR_ROT270 = 4;
export const TRANS_ROT90 = 5;
export const TRANS_ROT270 = 6;
export const TRANS_MIRROR_ROT90 = 7;

export class Graphics {
  private tx = 0;
  private ty = 0;
  private color = 0x000000;
  private clip = { x: 0, y: 0, w: 0, h: 0 };

  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  private font: Font = Font.getDefaultFont();

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.clip = { x: 0, y: 0, w: width, h: height };
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = "top";
  }

  // ---- 字体 ----
  setFont(font: Font): void {
    recordOp("setFont");
    this.font = font ?? Font.getDefaultFont();
  }

  getFont(): Font {
    return this.font;
  }

  // ---- 颜色 ----
  setColor(rgb: number): void;
  setColor(r: number, g: number, b: number): void;
  setColor(a: number, b?: number, c?: number): void {
    // 与 jvm-oracle 同 schema：1 参形式记 setColor、3 参形式记 setColor3
    if (b === undefined) recordOp(`setColor ${a & 0xffffff}`);
    else recordOp(`setColor3 ${a},${b},${c}`);
    if (b === undefined) this.color = a & 0xffffff;
    else this.color = ((a & 0xff) << 16) | ((b & 0xff) << 8) | (c! & 0xff);
  }

  getColor(): number {
    return this.color;
  }

  private css(): string {
    return `#${this.color.toString(16).padStart(6, "0")}`;
  }

  // ---- 平移 ----
  translate(x: number, y: number): void {
    this.tx += x;
    this.ty += y;
  }

  getTranslateX(): number {
    return this.tx;
  }
  getTranslateY(): number {
    return this.ty;
  }

  // ---- 裁剪 ----
  setClip(x: number, y: number, w: number, h: number): void {
    recordOp(`setClip ${x},${y},${w},${h}`);
    this.clip = { x: x + this.tx, y: y + this.ty, w, h };
    this.applyClip();
  }

  clipRect(x: number, y: number, w: number, h: number): void {
    // 与当前裁剪求交（J2ME clipRect 语义）
    const nx = x + this.tx;
    const ny = y + this.ty;
    const x1 = Math.max(this.clip.x, nx);
    const y1 = Math.max(this.clip.y, ny);
    const x2 = Math.min(this.clip.x + this.clip.w, nx + w);
    const y2 = Math.min(this.clip.y + this.clip.h, ny + h);
    this.clip = { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
    this.applyClip();
  }

  getClipX(): number {
    return this.clip.x - this.tx;
  }
  getClipY(): number {
    return this.clip.y - this.ty;
  }
  getClipWidth(): number {
    return this.clip.w;
  }
  getClipHeight(): number {
    return this.clip.h;
  }

  private applyClip(): void {
    this.ctx.restore();
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.clip.x, this.clip.y, this.clip.w, this.clip.h);
    this.ctx.clip();
    this.ctx.imageSmoothingEnabled = false;
  }

  // ---- 基本图元 ----
  fillRect(x: number, y: number, w: number, h: number): void {
    recordOp(`fillRect ${x},${y},${w},${h}`);
    this.ctx.fillStyle = this.css();
    this.ctx.fillRect(x + this.tx, y + this.ty, w, h);
  }

  drawRect(x: number, y: number, w: number, h: number): void {
    recordOp(`drawRect ${x},${y},${w},${h}`);
    this.ctx.strokeStyle = this.css();
    // J2ME drawRect 宽高表示像素跨度，描边宽 1，偏移半像素对齐
    this.ctx.strokeRect(x + this.tx + 0.5, y + this.ty + 0.5, w, h);
  }

  fillRoundRect(x: number, y: number, w: number, h: number, _aw: number, _ah: number): void {
    // 圆角退化为直角即可满足菜单底框（如需精确再补）
    this.fillRect(x, y, w, h);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    recordOp(`drawLine ${x1},${y1},${x2},${y2}`);
    this.ctx.strokeStyle = this.css();
    this.ctx.beginPath();
    this.ctx.moveTo(x1 + this.tx + 0.5, y1 + this.ty + 0.5);
    this.ctx.lineTo(x2 + this.tx + 0.5, y2 + this.ty + 0.5);
    this.ctx.stroke();
  }

  // ---- 图像 ----
  /** drawImage(img, x, y, anchor)：anchor 指定 (x,y) 对应图像的哪个角/中心。 */
  drawImage(img: Image, x: number, y: number, anchor: number): void {
    // 规范化（同 drawRegion 处说明）：game1 另有一条 4bit 解码路径（GameScreen b_G，paint case1/13）
    // 走「createRGBImage(synth:) → drawImage(x,y,TOP|LEFT)」，而原版走 drawPixels(...,manipulation=0)。
    // manipulation=0 即无变换，故 drawImage 于 TOP|LEFT 与 drawPixels 的左上角贴图**语义等价**，
    // 归一为 blitSprite t=0。⚠️ 仅 anchor===TOP|LEFT 时成立；其它锚点语义不同，照常记 drawImage
    // （届时会在差分中暴露，而不是被悄悄掩盖）。
    if (img.oracleId.startsWith("synth:") && anchor === (TOP | LEFT)) {
      recordOp(`blitSprite ${img.getWidth()}x${img.getHeight()} t=${TRANS_NONE} d=${x},${y}`);
    } else {
      recordOp(`drawImage ${img.oracleId} ${x},${y},${anchor}`);
    }
    const [dx, dy] = this.anchorTopLeft(x, y, img.getWidth(), img.getHeight(), anchor);
    this.ctx.drawImage(img.source(), dx + this.tx, dy + this.ty);
  }

  /**
   * drawRegion：从 src 取 (sx,sy,w,h) 区域，按 transform 变换后，
   * 以 anchor 锚定到 (dx,dy)。J2ME Game API 语义。
   */
  drawRegion(
    src: Image,
    sx: number,
    sy: number,
    w: number,
    h: number,
    transform: number,
    dx: number,
    dy: number,
    anchor: number
  ): void {
    // 规范化：game1 的精灵走「4bit 自解码 → createRGBImage(synth:) → drawRegion」，而原版走
    // Nokia DirectGraphics.drawPixels（浏览器无 DirectGraphics，已文档化的必要偏差）。两侧归一为
    // blitSprite，比几何与变换；合成图的像素内容本就是偏差，不作身份比较。
    if (src.oracleId.startsWith("synth:")) recordOp(`blitSprite ${w}x${h} t=${transform} d=${dx},${dy}`);
    else recordOp(`drawRegion ${src.oracleId} src=${sx},${sy},${w},${h} t=${transform} d=${dx},${dy}`);
    // 变换后的目标尺寸（旋转 90/270 交换宽高）
    const swap = transform >= TRANS_ROT90 || transform === TRANS_MIRROR_ROT90 || transform === TRANS_MIRROR_ROT270;
    const dw = swap ? h : w;
    const dh = swap ? w : h;
    const [tlx, tly] = this.anchorTopLeft(dx, dy, dw, dh, anchor);

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(tlx + this.tx, tly + this.ty);
    // 将变换矩阵设置到“目标区域局部坐标”，再以 (-sx,-sy) 贴源
    this.applyTransform(ctx, transform, dw, dh);
    ctx.drawImage(src.source(), sx, sy, w, h, 0, 0, w, h);
    ctx.restore();
  }

  /** 把 Sprite 变换施加到上下文（局部坐标已平移到目标左上角）。 */
  private applyTransform(ctx: CanvasRenderingContext2D, t: number, dw: number, dh: number): void {
    switch (t) {
      case TRANS_NONE:
        break;
      case TRANS_MIRROR:
        ctx.translate(dw, 0);
        ctx.scale(-1, 1);
        break;
      case TRANS_ROT180:
        ctx.translate(dw, dh);
        ctx.rotate(Math.PI);
        break;
      case TRANS_MIRROR_ROT180:
        ctx.translate(0, dh);
        ctx.scale(1, -1);
        break;
      case TRANS_ROT90:
        ctx.translate(dw, 0);
        ctx.rotate(Math.PI / 2);
        break;
      case TRANS_ROT270:
        ctx.translate(0, dh);
        ctx.rotate(-Math.PI / 2);
        break;
      case TRANS_MIRROR_ROT90:
        ctx.rotate(Math.PI / 2);
        ctx.scale(1, -1);
        break;
      case TRANS_MIRROR_ROT270:
        ctx.translate(dw, dh);
        ctx.rotate(-Math.PI / 2);
        ctx.scale(1, -1);
        break;
    }
  }

  /** 由锚点换算出绘制左上角。 */
  private anchorTopLeft(x: number, y: number, w: number, h: number, anchor: number): [number, number] {
    let dx = x;
    let dy = y;
    if (anchor & HCENTER) dx = x - ((w / 2) | 0);
    else if (anchor & RIGHT) dx = x - w;
    if (anchor & VCENTER) dy = y - ((h / 2) | 0);
    else if (anchor & BOTTOM) dy = y - h;
    // LEFT / TOP 为默认（dx=x, dy=y）
    return [dx, dy];
  }

  // ---- 文本：用 J2ME Font 度量逐字网格绘制（测宽与绘制一致，换行精确；小号+最近邻放大=点阵观感）----
  drawString(str: string, x: number, y: number, anchor: number): void {
    this.drawSubstring(str, 0, str.length, x, y, anchor);
  }

  /** 对应 Graphics.drawSubstring(str, offset, len, x, y, anchor)。 */
  drawSubstring(str: string, offset: number, len: number, x: number, y: number, anchor: number): void {
    // 规范 op：drawString(s,x,y,a) 语义上 === drawSubstring(s,0,len,x,y,a)，两者归一为 drawStr。
    // 只在此打点：本 port 的 drawString 内部委托至此，故 game 调任一形式都恰好产生一条规范 op。
    // ⚠️ 记的是 J2ME 调用层参数（文本/坐标/锚点），不含字形与度量——故意的字体偏差落在此层之下。
    recordOp(`drawStr [${str.substring(offset, offset + len)}] ${x},${y},${anchor}`);
    const f = this.font;
    const w = f.substringWidth(str, offset, len);
    const h = f.getHeight();
    // 水平锚点
    let sx = x;
    if (anchor & HCENTER) sx = x - ((w / 2) | 0);
    else if (anchor & RIGHT) sx = x - w;
    // 垂直锚点（默认 TOP）
    let topY = y;
    if (anchor & BOTTOM) topY = y - h;
    else if (anchor & VCENTER) topY = y - ((h / 2) | 0);
    else if (anchor & BASELINE) topY = y - f.getBaselinePosition();
    // 逐字网格渲染：推进量取自字体度量，保证绘制布局与 substringWidth 一致
    this.ctx.fillStyle = this.css();
    this.ctx.font = f.cssFont;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    let cx = sx + this.tx;
    const cy = topY + this.ty;
    for (let i = 0; i < len; i++) {
      this.ctx.fillText(str.charAt(offset + i), cx, cy);
      cx += f.charWidth(str.charCodeAt(offset + i));
    }
  }

  /** 对应 Graphics.drawChar。 */
  drawChar(ch: string | number, x: number, y: number, anchor: number): void {
    const s = typeof ch === "number" ? String.fromCharCode(ch) : ch;
    this.drawSubstring(s, 0, 1, x, y, anchor);
  }
}
