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
      if ("__imgKey" in o) return String(o.__imgKey);
      if ("__cid" in o) return `canvas#${o.__cid}`;
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
  putImageData(_data: unknown, x: number, y: number): void {
    this.ops.push({ op: "putImageData", x, y });
  }
}

/** 把一帧的绘制 op 序列规范化为稳定哈希（跨平台位级确定：坐标为整数、rotate 用 IEEE754 常量）。 */
export function hashOps(ops: DrawOp[]): string {
  return createHash("sha256").update(JSON.stringify(ops)).digest("hex");
}
