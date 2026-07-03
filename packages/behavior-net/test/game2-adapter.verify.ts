import { Asserter } from "../src/assert.ts";
import { installClock } from "../src/fake-clock.ts";
import { Graphics } from "@red-devil/j2me-shim";
import { RecordingContext } from "../src/recording-context.ts";
import { createGame2Harness } from "../src/game2-adapter.ts";

const a = new Asserter();
const clock = installClock(0);

const h = await createGame2Harness(54321);
a.eq("game2 尺寸/步长", [h.game, h.width, h.height, h.frameStepMs], [2, 176, 204, 80]);

const ctx = new RecordingContext(h.width, h.height);
const g = new Graphics(ctx as unknown as CanvasRenderingContext2D, h.width, h.height);
h.paint(g);
a.ok("首帧产出绘制 op", ctx.ops.length > 0);

const s = h.snapshotState();
a.ok("uiState 是数字", typeof s.uiState === "number");
a.ok("globalFrame 是数字", typeof s.globalFrame === "number");
a.ok("rngSeed 是字符串", typeof s.rngSeed === "string");

clock.uninstall();
a.done("game2-adapter");
