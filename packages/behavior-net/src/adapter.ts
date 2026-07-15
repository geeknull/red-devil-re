import type { Graphics } from "@red-devil/j2me-shim";

/** 一帧的状态字段快照（可读副本，与绘制哈希互补）。 */
export type StateSnapshot = Record<string, number | string | null>;

/** 单游戏的 headless 驱动句柄。bootstrap 已在 create* 里完成，此对象只负责逐帧驱动。 */
export interface GameHarness {
  readonly game: 1 | 2;
  readonly width: number;
  readonly height: number;
  readonly frameStepMs: number;
  injectKey(code: number, down: boolean): void;
  paint(g: Graphics): void;
  snapshotState(): StateSnapshot;
  /** 只读 actor 视图（纯观测）：供与 jvm-oracle 对拍 drawQueue 定位分歧根因。 */
  dumpActors?(): Array<{ t: number; x: number; y: number; vy: number; tvy: number; ay: number; mvy: number; on: boolean } | null>;
}

export type CreateHarness = (seed: number) => Promise<GameHarness>;
