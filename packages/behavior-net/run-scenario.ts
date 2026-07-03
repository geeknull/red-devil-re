// 子进程入口：跑单场景。用法 run-scenario.ts <id> <check|record>。每进程只加载一个游戏（动态 import），静态干净。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SCENARIOS } from "./src/scenarios.ts";
import { runScenario, compareRuns, type RunResult } from "./src/driver.ts";
import type { GameHarness } from "./src/adapter.ts";

const here = dirname(fileURLToPath(import.meta.url));
const goldenDir = join(here, "golden");
const id = process.argv[2];
const mode = process.argv[3] ?? "check";
const scn = SCENARIOS.find((s) => s.id === id);
if (!scn) {
  console.error(`未知场景: ${id}`);
  process.exit(2);
}

const create: (seed: number) => Promise<GameHarness> =
  scn.game === 1
    ? (await import("./src/game1-adapter.ts")).createGame1Harness
    : (await import("./src/game2-adapter.ts")).createGame2Harness;

const result: RunResult = await runScenario(scn, create, { keepOps: true });
const goldenFile = join(goldenDir, `${scn.id}.json`);

/** 黄金不含 ops（紧凑）；ops 仅失配时 dump。 */
function stripOps(r: RunResult): RunResult {
  return { meta: r.meta, frames: r.frames.map((f) => ({ frame: f.frame, drawHash: f.drawHash, state: f.state })) };
}

if (mode === "record") {
  mkdirSync(goldenDir, { recursive: true });
  writeFileSync(goldenFile, JSON.stringify(stripOps(result), null, 2) + "\n");
  console.log(`✓ 录制 ${scn.id}: ${result.frames.length} 帧`);
  process.exit(0);
}

// check
let golden: RunResult;
try {
  golden = JSON.parse(readFileSync(goldenFile, "utf8")) as RunResult;
} catch {
  console.error(`✗ ${scn.id} 无黄金文件（先跑 bless:behavior）`);
  process.exit(1);
}
const diff = compareRuns(golden, stripOps(result));
if (diff) {
  console.error(`✗ ${scn.id} 失配：${diff}`);
  writeFileSync(join(goldenDir, `${scn.id}.actual.json`), JSON.stringify(result, null, 2) + "\n");
  console.error(`  已 dump 完整实际结果（含 ops）到 golden/${scn.id}.actual.json`);
  process.exit(1);
}
console.log(`✓ ${scn.id} 通过（${result.frames.length} 帧）`);
process.exit(0);
