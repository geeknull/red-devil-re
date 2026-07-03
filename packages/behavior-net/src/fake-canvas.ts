// 用录制 ctx 替换 shim 的离屏画布工厂（官方缝 setCanvasFactory）。
// 每个离屏画布把自己的录制 ctx 挂在 __ctx 上：主 ctx 的 drawImage 据此按「离屏内容」
// （写入其中的 op 序列 + 尺寸）标识来源，而非分配序号——见 recording-context.ts 的 imgId。
// 这样离屏缓冲/换色精灵的内容变化会进主帧哈希（防误绿），
// 而行为中性的分配顺序/对象缓存不影响身份（防误红）。__cid 仅留作调试兜底，不进哈希。
import { setCanvasFactory } from "@red-devil/j2me-shim";
import { RecordingContext } from "./recording-context.ts";

let cid = 0;

export function installCanvasFactory(): void {
  setCanvasFactory((w: number, h: number) => {
    const ctx = new RecordingContext(w, h);
    const canvas = { __cid: cid++, width: w, height: h, __ctx: ctx };
    return { canvas, ctx: ctx as unknown as CanvasRenderingContext2D };
  });
}
