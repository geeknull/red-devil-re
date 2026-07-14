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
import type { KeyInput } from "./src/scenario.ts";

const id = process.argv[2];
const scn = SCENARIOS.find((s) => s.id === id);
if (!scn) {
  console.error(`未知场景：${id}；可选：${SCENARIOS.map((s) => s.id).join(", ")}`);
  process.exit(2);
}

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
    for (const op of takeOps()) out.push(`F${f}\t${op}`);
    clock.advance(h.frameStepMs);
  }
  process.stdout.write(out.join("\n") + "\n");
  console.error(`[port] scenario=${scn.id} screen=${h.width}x${h.height} frames=${scn.frames} ops=${out.length}`);
} finally {
  clock.uninstall();
}
