import { Asserter } from "../src/assert.ts";
import { RecordingContext, hashOps } from "../src/recording-context.ts";

const a = new Asserter();

const ctx = new RecordingContext(176, 208);
ctx.fillStyle = "#ff0000";
ctx.fillRect(1, 2, 3, 4);
ctx.font = "10px x";
ctx.textAlign = "left";
ctx.textBaseline = "top";
ctx.fillText("A", 5, 6);
ctx.drawImage({ __imgKey: "/res/image.bin#3", width: 8, height: 8 }, 10, 20);

a.eq("记录 3 条 op", ctx.ops.length, 3);
a.eq("fillRect 记录几何+颜色", ctx.ops[0], { op: "fillRect", x: 1, y: 2, w: 3, h: 4, fill: "#ff0000" });
a.eq("fillText 记录文本+样式", ctx.ops[1], { op: "fillText", t: "A", x: 5, y: 6, fill: "#ff0000", font: "10px x", align: "left", base: "top" });
a.eq("drawImage 记录图 key", ctx.ops[2], { op: "drawImage", img: "/res/image.bin#3", a: [10, 20] });

// createImageData 返回可写像素缓冲（game1 RGB444 管线依赖）
const img = ctx.createImageData(2, 2);
a.eq("createImageData 尺寸", [img.width, img.height, img.data.length], [2, 2, 16]);

// hash 对相同 op 序列稳定、对不同序列相异
const h1 = hashOps(ctx.ops);
const ctx2 = new RecordingContext(176, 208);
ctx2.fillStyle = "#ff0000";
ctx2.fillRect(1, 2, 3, 4);
ctx2.font = "10px x";
ctx2.textAlign = "left";
ctx2.textBaseline = "top";
ctx2.fillText("A", 5, 6);
ctx2.drawImage({ __imgKey: "/res/image.bin#3", width: 8, height: 8 }, 10, 20);
a.eq("相同序列哈希相等", hashOps(ctx2.ops), h1);
ctx2.fillRect(0, 0, 1, 1);
a.ok("不同序列哈希相异", hashOps(ctx2.ops) !== h1);

// 容忍不配对 restore（applyClip 首次）
const ctx3 = new RecordingContext(10, 10);
ctx3.restore();
a.eq("裸 restore 被记录且不抛", ctx3.ops[0], { op: "restore" });

a.done("recording-context");
