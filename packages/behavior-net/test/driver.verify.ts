import { Asserter } from "../src/assert.ts";
import { runScenario, type RunResult } from "../src/driver.ts";
import { createGame1Harness } from "../src/game1-adapter.ts";
import type { Scenario } from "../src/scenario.ts";

const a = new Asserter();

const scn: Scenario = {
  id: "t-det",
  game: 1,
  seed: 999,
  frames: 20,
  inputs: [{ frame: 5, code: 48, down: true }, { frame: 6, code: 48, down: false }],
};

const r1: RunResult = await runScenario(scn, createGame1Harness, { keepOps: false });
a.eq("产出帧数", r1.frames.length, 20);
a.ok("每帧有 drawHash", r1.frames.every((f) => typeof f.drawHash === "string" && f.drawHash.length === 64));
a.eq("meta 记录种子/步长", [r1.meta.seed, r1.meta.frameStepMs], [999, 100]);

// 确定性：注意每次跑必须新进程或此处两次跑会共享静态单例。此测试单独验证"同进程连跑两次"是否稳定；
// 若因静态污染不稳定，说明必须靠子进程隔离（run.ts 已如此），此断言可能失败——那是预期的隔离信号。
const r2: RunResult = await runScenario(scn, createGame1Harness, { keepOps: false });
a.ok(
  "同进程连跑：drawHash 序列一致（若失败=静态污染，靠子进程隔离解决）",
  JSON.stringify(r1.frames.map((f) => f.drawHash)) === JSON.stringify(r2.frames.map((f) => f.drawHash)),
);

a.done("driver");
