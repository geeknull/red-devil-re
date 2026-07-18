/**
 * 通关脚本录制器 —— 核心。
 *
 * 用「真物理 headless sim」（no-op 图形、逐字节不变、静态重置、save 注入）驱动 port，
 * 每帧读内部字段跑 policy 决策、**录键位成确定性脚本**（jvm-oracle / behavior-net 同格式）。
 *
 * 为什么要它：`regress/*.txt` 通关夹具此前是**不可复现的 blob**（唯一出处是一次性 scratch 控制器）。
 * 本模块把「策略 → 脚本」变成**可从源码重生**的一等制品，符合本仓「信任根/可复核」精神。
 * **内建独立重放自检**（`recorder/cli.ts` 用真适配器子进程重放，断言 statesSeen）——把
 * 「控制器内部声称 reached ≠ 录出的脚本可复现」这条教训制度化，见 docs/复盘-CFR不是权威.md 同源判据。
 */
import "@red-devil/game1/src/ProjectileActor.ts"; // game1 循环导入 TDZ：必须最先
import { GameMIDlet as Game1Midlet } from "@red-devil/game1";
import { LevelLoader } from "@red-devil/game1/src/LevelLoader.ts";
import { GameMIDlet as Game2Midlet } from "@red-devil/game2";
import { LevelScene } from "@red-devil/game2/src/LevelScene.ts";
import { configureScreen, Graphics, Image } from "@red-devil/j2me-shim";
import { installDomStubs } from "../src/fake-dom.ts";
import { installCanvasFactory } from "../src/fake-canvas.ts";
import { loadGameFixtures } from "../src/fixtures.ts";

export type KF = { frame: number; code: number; down: boolean };

export interface PolicyCtx {
  screen: any; // game1: GameScreen / game2: GameCanvas（直接内部访问）
  frame: number;
  game: 1 | 2;
}
/** 返回本帧要按下的 keyCode；-1 = 释放（idle）；null = 不发 keyframe（保持上一状态）。 */
export type PolicyFn = (ctx: PolicyCtx) => number | null;

export interface Scenario {
  name: string;
  game: 1 | 2;
  saveCsv: string; // 注入 RMS 存档（跳关）
  seed: number;
  frames: number;
  /** 固定前缀 keyframe（入关 + 导航宏等），**原样录入脚本**。 */
  fixed: KF[];
  /** policy 从该帧起接管（此前由 fixed 驱动）。 */
  policyStart: number;
  policy: PolicyFn;
  /** 自检必达状态：录出的脚本独立重放后 statesSeen 必须**全包含**这些，否则拒绝出脚本。 */
  expectStates: number[];
  /** 关卡内主玩法状态号（game1=10 / game2=10），用于「死亡」判定辅助（可选）。 */
  playingState?: number;
}

const nullCtx: any = new Proxy(
  {},
  {
    get: (_t, p) => {
      if (p === "canvas") return { width: 176, height: 208 };
      if (p === "measureText") return () => ({ width: 0 });
      if (p === "globalAlpha" || p === "lineWidth") return 1;
      return (..._a: any[]) => nullCtx;
    },
    set: () => true,
  },
);

let g1FixturesLoaded = false;
let g2FixturesLoaded = false;

function injectSave(game: 1 | 2, saveCsv: string): void {
  const store = new Map<string, string>();
  store.set(game === 1 ? "TGS_CT" : "REDDEVIL2", saveCsv);
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

/**
 * game1 静态重置（单进程内多次 new GameMIDlet 时玩家不生成的规避；已随 game1-beat-level3 验证）。
 * ⚠️ game2 **不做**静态重置：实测把 `LevelScene.cutsceneState` 等清空会破坏开场跳伞过场的初始化
 * （玩家卡 reserved=4、cutsceneState=undefined）。game2 与真 game2-adapter 一样**依赖新进程的原生初始化**。
 * 若将来要 game2 单进程批量重放，须先**对拍真适配器标定一份正确的 game2 重置**（TODO），别再照 game1 猜。
 */
export function resetStatics(game: 1 | 2): void {
  if (game === 1) {
    LevelLoader.actorPools = [];
    LevelLoader.activeActors = [];
    LevelLoader.spriteDefPool = [];
    LevelLoader.spriteDefRetained = [];
    (LevelLoader as any).tileMap = null;
  }
  // game2: 有意 no-op（见上）。
}

export async function setupSim(game: 1 | 2, saveCsv: string, seed: number): Promise<{ screen: any; g: Graphics; getState: () => number }> {
  injectSave(game, saveCsv);
  installDomStubs();
  installCanvasFactory();
  if (game === 1) {
    if (!g1FixturesLoaded) { await loadGameFixtures(1); g1FixturesLoaded = true; }
    resetStatics(1);
    configureScreen({ width: 176, height: 208, scale: 1, screen: { width: 0, height: 0 } as any });
    Image.resetOracleIds();
    const midlet = new Game1Midlet();
    (midlet.screen as any).loopThread = null;
    Game1Midlet.random.setSeed(seed);
    const screen: any = midlet.screen;
    return { screen, g: new Graphics(nullCtx, 176, 208), getState: () => screen.state };
  } else {
    if (!g2FixturesLoaded) { await loadGameFixtures(2); g2FixturesLoaded = true; }
    resetStatics(2); // game2: no-op（见 resetStatics 注释）；依赖新进程原生初始化
    configureScreen({ width: 176, height: 204, scale: 1, screen: { width: 0, height: 0 } as any });
    Image.resetOracleIds();
    const midlet = new Game2Midlet();
    midlet.canvas.running = false;
    (midlet.canvas as any).mainThread = null;
    Game2Midlet.random.setSeed(seed);
    const canvas: any = midlet.canvas;
    return { screen: canvas, g: new Graphics(nullCtx, 176, 204), getState: () => canvas.uiState };
  }
}

export interface RecordResult {
  recorded: KF[];
  statesSeen: number[];
  finalState: number;
  frames: number;
}

/** 跑 scenario，录键位。fixed 前缀原样录入，policyStart 起由 policy 决策并录入。 */
export async function record(scn: Scenario): Promise<RecordResult> {
  const { screen, g, getState } = await setupSim(scn.game, scn.saveCsv, scn.seed);
  const byFrame = new Map<number, KF[]>();
  for (const kf of scn.fixed) {
    const arr = byFrame.get(kf.frame) ?? [];
    arr.push(kf);
    byFrame.set(kf.frame, arr);
  }
  const recorded: KF[] = [...scn.fixed];
  const states = new Set<number>();
  for (let f = 0; f < scn.frames; f++) {
    for (const kf of byFrame.get(f) ?? []) {
      if (kf.down) screen.keyPressed(kf.code);
      else screen.keyReleased(kf.code);
    }
    if (f >= scn.policyStart) {
      const want = scn.policy({ screen, frame: f, game: scn.game });
      if (want != null) {
        if (want >= 0) {
          screen.keyPressed(want);
          recorded.push({ frame: f, code: want, down: true });
        } else {
          screen.keyReleased(5);
          recorded.push({ frame: f, code: 5, down: false });
        }
      }
    }
    screen.paint(g);
    states.add(getState());
  }
  return { recorded, statesSeen: [...states].sort((a, b) => a - b), finalState: getState(), frames: scn.frames };
}

/** 序列化成 jvm-oracle / dump-ops 同格式脚本文本。 */
export function toScriptText(scn: Scenario, recorded: KF[], header?: string): string {
  const lines: string[] = [];
  if (header) for (const l of header.split("\n")) lines.push(l.startsWith("#") ? l : `# ${l}`);
  lines.push(`seed=${scn.seed}`, `frames=${scn.frames}`, `save=${scn.saveCsv}`);
  for (const kf of recorded) lines.push(`${kf.frame},${kf.code},${kf.down ? 1 : 0}`);
  return lines.join("\n") + "\n";
}
