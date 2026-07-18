/**
 * 独立重放自检 —— 用**真 behavior-net 适配器**（与 oracle:diff 同一条 port 驱动）重放一个脚本，
 * 打印 statesSeen。刻意**不复用录制器的自写 sim**：录制用自写 sim（policy 需内部访问），
 * 自检用生产驱动的另一进程 → 最大独立性，专抓「录出的脚本漏帧/不可复现」这类缺陷。
 *
 * 用法：node --experimental-transform-types recorder/replay-states.ts <script.txt> <1|2>
 * 输出：`STATES=[a,b,...]`（供 cli.ts 解析）。
 */
import { Graphics, Image } from "@red-devil/j2me-shim";
import { RecordingContext } from "../src/recording-context.ts";
import { installClock } from "../src/fake-clock.ts";
import { createGame1Harness } from "../src/game1-adapter.ts";
import { createGame2Harness } from "../src/game2-adapter.ts";
import type { KeyInput } from "../src/scenario.ts";
import { readFileSync } from "node:fs";

const scriptPath = process.argv[2];
const game = Number(process.argv[3]) as 1 | 2;
let seed = game === 1 ? 12345 : 54321;
let frames = game === 1 ? 330 : 300;
let saveCsv: string | null = null;
const inputs: KeyInput[] = [];
for (const raw of readFileSync(scriptPath, "utf8").split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  if (line.startsWith("seed=")) { seed = Number(line.slice(5)); continue; }
  if (line.startsWith("frames=")) { frames = Number(line.slice(7)); continue; }
  if (line.startsWith("save=")) { saveCsv = line.slice(5).trim(); continue; }
  const [f, c, d] = line.split(",").map(Number);
  inputs.push({ frame: f!, code: c!, down: d === 1 });
}

if (saveCsv != null) {
  const store = new Map<string, string>();
  store.set(game === 1 ? "TGS_CT" : "REDDEVIL2", saveCsv);
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

const byFrame = new Map<number, KeyInput[]>();
for (const inp of inputs) {
  const arr = byFrame.get(inp.frame) ?? [];
  arr.push(inp);
  byFrame.set(inp.frame, arr);
}

const clock = installClock(0);
const states = new Set<number>();
try {
  Image.resetOracleIds();
  const h = game === 1 ? await createGame1Harness(seed) : await createGame2Harness(seed);
  for (let f = 0; f < frames; f++) {
    for (const inp of byFrame.get(f) ?? []) h.injectKey(inp.code, inp.down);
    const ctx = new RecordingContext(h.width, h.height);
    const g = new Graphics(ctx as unknown as CanvasRenderingContext2D, h.width, h.height);
    h.paint(g);
    const snap = h.snapshotState() as Record<string, number>;
    states.add(game === 1 ? snap.state : snap.uiState);
    clock.advance(h.frameStepMs);
  }
} finally {
  clock.uninstall();
}
process.stdout.write(`STATES=[${[...states].sort((a, b) => a - b).join(",")}]\n`);
