// 驱动核（游戏无关）：装假时钟 → create 适配器 → 逐帧 [注入输入 → paint → 抓双快照 → 推进时钟]。
import { Graphics } from "@red-devil/j2me-shim";
import { RecordingContext, hashOps, type DrawOp } from "./recording-context.ts";
import { installClock } from "./fake-clock.ts";
import type { GameHarness, StateSnapshot } from "./adapter.ts";
import type { Scenario, KeyInput } from "./scenario.ts";

export interface FrameRecord {
  frame: number;
  drawHash: string;
  state: StateSnapshot;
  ops?: DrawOp[]; // 仅 keepOps 时保留（失配时 dump 用），不进黄金
}

export interface RunResult {
  meta: { game: 1 | 2; seed: number; frames: number; frameStepMs: number; screen: string };
  frames: FrameRecord[];
}

function groupInputs(inputs: KeyInput[]): Map<number, KeyInput[]> {
  const m = new Map<number, KeyInput[]>();
  for (const inp of inputs) {
    const arr = m.get(inp.frame) ?? [];
    arr.push(inp);
    m.set(inp.frame, arr);
  }
  return m;
}

export async function runScenario(
  scn: Scenario,
  createHarness: (seed: number) => Promise<GameHarness>,
  opts?: { keepOps?: boolean },
): Promise<RunResult> {
  const clock = installClock(0);
  try {
    const h = await createHarness(scn.seed);
    const byFrame = groupInputs(scn.inputs);
    const frames: FrameRecord[] = [];
    for (let f = 0; f < scn.frames; f++) {
      for (const inp of byFrame.get(f) ?? []) h.injectKey(inp.code, inp.down);
      const ctx = new RecordingContext(h.width, h.height);
      const g = new Graphics(ctx as unknown as CanvasRenderingContext2D, h.width, h.height);
      h.paint(g);
      const rec: FrameRecord = { frame: f, drawHash: hashOps(ctx.ops), state: h.snapshotState() };
      if (opts?.keepOps) rec.ops = ctx.ops;
      frames.push(rec);
      clock.advance(h.frameStepMs);
    }
    return {
      meta: { game: h.game, seed: scn.seed, frames: scn.frames, frameStepMs: h.frameStepMs, screen: `${h.width}x${h.height}` },
      frames,
    };
  } finally {
    clock.uninstall();
  }
}

/** 对比两次跑（忽略 ops）：返回首个差异描述，全等返回 null。 */
export function compareRuns(golden: RunResult, actual: RunResult): string | null {
  if (JSON.stringify(golden.meta) !== JSON.stringify(actual.meta)) {
    return `meta 不一致：golden=${JSON.stringify(golden.meta)} actual=${JSON.stringify(actual.meta)}`;
  }
  const n = Math.max(golden.frames.length, actual.frames.length);
  for (let i = 0; i < n; i++) {
    const gf = golden.frames[i];
    const af = actual.frames[i];
    if (!gf || !af) return `帧数不一致：golden=${golden.frames.length} actual=${actual.frames.length}`;
    if (gf.drawHash !== af.drawHash) return `帧 ${i} 绘制哈希不一致（golden=${gf.drawHash.slice(0, 12)}… actual=${af.drawHash.slice(0, 12)}…）`;
    if (JSON.stringify(gf.state) !== JSON.stringify(af.state)) {
      return `帧 ${i} 状态字段不一致：\n  golden=${JSON.stringify(gf.state)}\n  actual=${JSON.stringify(af.state)}`;
    }
  }
  return null;
}
