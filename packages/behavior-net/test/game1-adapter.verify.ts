import { Asserter } from "../src/assert.ts";
import { installClock } from "../src/fake-clock.ts";
import { Graphics } from "@red-devil/j2me-shim";
import { RecordingContext } from "../src/recording-context.ts";
import { createGame1Harness } from "../src/game1-adapter.ts";

const a = new Asserter();
const clock = installClock(0);

const h = await createGame1Harness(12345);
a.eq("game1 尺寸/步长", [h.game, h.width, h.height, h.frameStepMs], [1, 176, 208, 100]);

// 首帧 paint 不抛，且产出绘制 op（Logo 分支应有绘制）
const ctx = new RecordingContext(h.width, h.height);
const g = new Graphics(ctx as unknown as CanvasRenderingContext2D, h.width, h.height);
h.paint(g);
a.ok("首帧产出绘制 op", ctx.ops.length > 0);

// 状态字段齐全且类型正确
const s = h.snapshotState();
a.ok("state 是数字", typeof s.state === "number");
a.ok("frameCounter 是数字", typeof s.frameCounter === "number");
a.ok("rngSeed 是字符串（BigInt 序列化）", typeof s.rngSeed === "string");

clock.uninstall();
a.done("game1-adapter");
