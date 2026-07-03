// ⚠️ 循环导入 TDZ 规避：必须先导 ProjectileActor.ts 再导 index（ActorBase↔ProjectileActor 互导）。
// 勿调整下面两行顺序、勿删这行 import。见 docs/superpowers/specs/2026-07-03-行为测试网-design.md §12。
import "@red-devil/game1/src/ProjectileActor.ts";
import { GameMIDlet } from "@red-devil/game1";
import { configureScreen } from "@red-devil/j2me-shim";
import { installDomStubs } from "./fake-dom.ts";
import { installCanvasFactory } from "./fake-canvas.ts";
import { loadGameFixtures } from "./fixtures.ts";
import type { GameHarness } from "./adapter.ts";

export async function createGame1Harness(seed: number): Promise<GameHarness> {
  installDomStubs();
  installCanvasFactory();
  await loadGameFixtures(1);
  // configureScreen 必须先于 new GameMIDlet（Canvas 构造读模块级 SCREEN）
  configureScreen({ width: 176, height: 208, scale: 1, screen: { width: 0, height: 0 } as unknown as HTMLCanvasElement });
  const midlet = new GameMIDlet();
  // 杀构造期自启的常驻 setTimeout 循环（run() while 判 loopThread != null）
  (midlet.screen as unknown as { loopThread: unknown }).loopThread = null;
  GameMIDlet.random.setSeed(seed);
  const s = midlet.screen;

  return {
    game: 1,
    width: 176,
    height: 208,
    frameStepMs: 100,
    injectKey(code, down) {
      if (down) s.keyPressed(code);
      else s.keyReleased(code);
    },
    paint(g) {
      s.paint(g);
    },
    snapshotState() {
      const p = (s.player as unknown as { posX: number; posY: number; velX: number; frameIndex: number } | undefined) ?? null;
      return {
        state: s.state,
        frameCounter: s.frameCounter,
        killCount: s.killCount,
        drawQueueCount: s.drawQueueCount, // 关卡内 actor 数（敌人/Boss/特效/道具/玩家）：actor 覆盖的可读信号
        enemyAliveCount: s.enemyAliveCount,
        levelIndex: s.levelIndex,
        menuSelection: s.menuSelection,
        cameraX: s.cameraX,
        cameraY: s.cameraY,
        stateTimer: s.stateTimer,
        animFrameIndex: s.animFrameIndex,
        playerPosX: p ? p.posX : null,
        playerPosY: p ? p.posY : null,
        playerVelX: p ? p.velX : null,
        playerFrame: p ? p.frameIndex : null,
        rngSeed: String((GameMIDlet.random as unknown as { seed: bigint }).seed),
      };
    },
  };
}
