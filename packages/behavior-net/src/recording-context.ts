// 录制型 CanvasRenderingContext2D 替身：不真画，把每次绘制调用（含当时的样式）记成一条 op。
// 覆盖 Graphics.ts + Image.ts 实际用到的全部方法/属性（见计划顶部"绘制 ctx 表面"）。
import { createHash } from "node:crypto";

export type DrawOp = Record<string, unknown>;

export class RecordingContext {
  ops: DrawOp[] = [];
  // 属性沉淀区：绘制时快照进 op（Graphics 在每次绘制前设置这些）
  fillStyle = "";
  strokeStyle = "";
  font = "";
  textAlign = "";
  textBaseline = "";
  imageSmoothingEnabled = false;
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private imgId(src: unknown): string {
    if (src && typeof src === "object") {
      const o = src as Record<string, unknown>;
      if ("__imgKey" in o) return String(o.__imgKey); // 预注册 stub 图：稳定逻辑键
      // 离屏画布：按其内容标识（写入的 op 序列 + 尺寸），不用分配序号。
      // 内容变→身份变（防误绿：瓦片/换色精灵内容错误可见）；
      // 分配顺序/缓存复用→身份不变（防误红：行为中性优化不触发假红）。
      if ("__ctx" in o) return `canvas@${o.width}x${o.height}#${hashOps((o.__ctx as RecordingContext).ops)}`;
      if ("__cid" in o) return `canvas#${o.__cid}`; // 兜底（挂了 __ctx 后理论不达）
    }
    return "?";
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.ops.push({ op: "fillRect", x, y, w, h, fill: this.fillStyle });
  }
  strokeRect(x: number, y: number, w: number, h: number): void {
    this.ops.push({ op: "strokeRect", x, y, w, h, stroke: this.strokeStyle });
  }
  fillText(t: string, x: number, y: number): void {
    this.ops.push({ op: "fillText", t, x, y, fill: this.fillStyle, font: this.font, align: this.textAlign, base: this.textBaseline });
  }
  drawImage(src: unknown, ...a: number[]): void {
    this.ops.push({ op: "drawImage", img: this.imgId(src), a });
  }
  save(): void {
    this.ops.push({ op: "save" });
  }
  restore(): void {
    this.ops.push({ op: "restore" });
  }
  beginPath(): void {
    this.ops.push({ op: "beginPath" });
  }
  rect(x: number, y: number, w: number, h: number): void {
    this.ops.push({ op: "rect", x, y, w, h });
  }
  clip(): void {
    this.ops.push({ op: "clip" });
  }
  translate(x: number, y: number): void {
    this.ops.push({ op: "translate", x, y });
  }
  rotate(a: number): void {
    this.ops.push({ op: "rotate", a });
  }
  scale(x: number, y: number): void {
    this.ops.push({ op: "scale", x, y });
  }
  moveTo(x: number, y: number): void {
    this.ops.push({ op: "moveTo", x, y });
  }
  lineTo(x: number, y: number): void {
    this.ops.push({ op: "lineTo", x, y });
  }
  stroke(): void {
    this.ops.push({ op: "stroke", stroke: this.strokeStyle });
  }
  createImageData(w: number, h: number): { width: number; height: number; data: Uint8ClampedArray } {
    return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  }
  putImageData(data: unknown, x: number, y: number): void {
    // 记录像素内容哈希：game1 换色管线（createRGBImage）经此写像素，
    // 只记 x,y 会让换色内容不可见（误绿）。哈希像素字节使内容变化进离屏 op 哈希。
    const d = (data as { data?: Uint8ClampedArray } | null)?.data;
    const pix = d ? createHash("sha256").update(d).digest("hex") : "";
    this.ops.push({ op: "putImageData", x, y, pix });
  }
}

/** 把一帧的绘制 op 序列规范化为稳定哈希（跨平台位级确定：坐标为整数、rotate 用 IEEE754 常量）。 */
export function hashOps(ops: DrawOp[]): string {
  return createHash("sha256").update(JSON.stringify(ops)).digest("hex");
}
