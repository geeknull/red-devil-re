// 用录制 ctx 替换 shim 的离屏画布工厂（官方缝 setCanvasFactory）。
// 每个离屏画布带唯一 __cid，供录制 ctx 的 drawImage 识别绘制来源。
// 离屏画布的 op 各自独立、不参与帧哈希（帧哈希只取主 ctx）。
import { setCanvasFactory } from "@red-devil/j2me-shim";
import { RecordingContext } from "./recording-context.ts";

let cid = 0;

export function installCanvasFactory(): void {
  setCanvasFactory((w: number, h: number) => {
    const ctx = new RecordingContext(w, h);
    const canvas = { __cid: cid++, width: w, height: h };
    return { canvas, ctx: ctx as unknown as CanvasRenderingContext2D };
  });
}
