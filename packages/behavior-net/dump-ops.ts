/**
 * port 侧语义层 op dump —— 与 `packages/jvm-oracle`（无头 JVM 直跑原版字节码）对拍用。
 *
 * 用法：node --experimental-transform-types packages/behavior-net/dump-ops.ts <scenarioId>
 * 输出：逐行 `F<帧号>\t<op>`，与 jvm-oracle 的 `-Doracle.dumpOps=true` 同格式。
 *
 * 复用 behavior-net 既有的场景/适配器/假时钟，保证与 golden 回归网走**同一条**驱动路径。
 */
import { Graphics, Image, beginOpCapture, takeOps } from "@red-devil/j2me-shim";
import { RecordingContext } from "./src/recording-context.ts";
import { installClock } from "./src/fake-clock.ts";
import { SCENARIOS } from "./src/scenarios.ts";
import { createGame1Harness } from "./src/game1-adapter.ts";
import { createGame2Harness } from "./src/game2-adapter.ts";
import type { KeyInput, Scenario } from "./src/scenario.ts";

// 用法：dump-ops.ts <scenarioId>              —— 跑既有 behavior-net 场景
//       dump-ops.ts --script <file> <1|2>     —— 跑外部输入脚本（差分模糊测试用）
// 脚本为极简行格式（与 jvm-oracle 的 -Doracle.scriptFile 同格式，两侧吃同一份）：
//   seed=<n> / frames=<n> / <frame>,<keyCode>,<1按下|0抬起>
let scn: Scenario | undefined;
if (process.argv[2] === "--script") {
  const { readFileSync } = await import("node:fs");
  const game = Number(process.argv[4]) as 1 | 2;
  let seed = game === 1 ? 12345 : 54321;
  let frames = game === 1 ? 330 : 300;
  const inputs: KeyInput[] = [];
  for (const raw of readFileSync(process.argv[3], "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("seed=")) { seed = Number(line.slice(5)); continue; }
    if (line.startsWith("frames=")) { frames = Number(line.slice(7)); continue; }
    const [f, c, d] = line.split(",").map(Number);
    inputs.push({ frame: f!, code: c!, down: d === 1 });
  }
  scn = { id: "fuzz", game, seed, frames, inputs };
} else {
  scn = SCENARIOS.find((s) => s.id === process.argv[2]);
}
if (!scn) {
  console.error(`未知场景：${process.argv[2]}；可选：${SCENARIOS.map((s) => s.id).join(", ")}`);
  process.exit(2);
}

const DUMP_ACTORS = process.env.DUMP_ACTORS === "1";
const byFrame = new Map<number, KeyInput[]>();
for (const inp of scn.inputs) {
  const arr = byFrame.get(inp.frame) ?? [];
  arr.push(inp);
  byFrame.set(inp.frame, arr);
}

const clock = installClock(0);
try {
  // 两侧图像逻辑身份都从 0 起算（oracle 侧 Image.id 亦然）
  Image.resetOracleIds();
  const h = scn.game === 1 ? await createGame1Harness(scn.seed) : await createGame2Harness(scn.seed);
  beginOpCapture();
  const out: string[] = [];
  for (let f = 0; f < scn.frames; f++) {
    for (const inp of byFrame.get(f) ?? []) h.injectKey(inp.code, inp.down);
    const ctx = new RecordingContext(h.width, h.height);
    const g = new Graphics(ctx as unknown as CanvasRenderingContext2D, h.width, h.height);
    h.paint(g);
    if (DUMP_ACTORS) {
      // drawQueue 逐 actor dump（与 oracle 的 -Doracle.dumpActors 同格式），定位分歧根因用
      takeOps();
      const acts = h.dumpActors?.() ?? [];
      acts.forEach((a, j) => out.push(a ? `F${f}\tACTOR ${j} t=${a.t} x=${a.x} y=${a.y} vy=${a.vy} tvy=${a.tvy} ay=${a.ay} mvy=${a.mvy} on=${a.on}` : `F${f}\tACTOR ${j} null`));
    } else {
      for (const op of takeOps()) out.push(`F${f}\t${op}`);
    }
    clock.advance(h.frameStepMs);
  }
  process.stdout.write(out.join("\n") + "\n");
  // RMS 存档字节：已核实会驱动绘制（game1 Q[2] 影响绘制取值 a.java:322；game2 k[2] 决定
  // drawString 画哪段文字 a.java:218）。两侧存档必须一致，否则差分红了也不知是回归还是前置条件不符。
  // 故 dump 出来由 diff.sh 显式断言，而不是假设。见 docs/jvm-oracle-保真审计.md 四类。
  // GameScreen 未从 game1 的 index 导出，直接取模块（game1 index 只导出 GameMIDlet）
  const save = scn.game === 1
    ? (await import("@red-devil/game1/src/GameScreen.ts")).GameScreen.saveData // 原版 tjge.a.Q（3 字节）
    : (await import("@red-devil/game2")).GameMIDlet.saveRecord;                // 原版 GameMIDlet.k（5 字节）
  console.error(`[port] SAVE=[${Array.from(save as ArrayLike<number>).join(",")}]`);
  console.error(`[port] scenario=${scn.id} screen=${h.width}x${h.height} frames=${scn.frames} ops=${out.length}`);
} finally {
  clock.uninstall();
}
