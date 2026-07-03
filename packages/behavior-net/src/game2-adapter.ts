// game2 无 game1 的循环导入 TDZ（扫描实测 index 直接导入即可）。
import { GameMIDlet } from "@red-devil/game2";
import { configureScreen } from "@red-devil/j2me-shim";
import { installDomStubs } from "./fake-dom.ts";
import { installCanvasFactory } from "./fake-canvas.ts";
import { loadGameFixtures } from "./fixtures.ts";
import type { GameHarness } from "./adapter.ts";

export async function createGame2Harness(seed: number): Promise<GameHarness> {
  installDomStubs();
  installCanvasFactory();
  await loadGameFixtures(2);
  configureScreen({ width: 176, height: 204, scale: 1, screen: { width: 0, height: 0 } as unknown as HTMLCanvasElement });
  const midlet = new GameMIDlet();
  // 杀构造期自启的常驻循环（run() while 判 mainThread != null）
  midlet.canvas.running = false;
  (midlet.canvas as unknown as { mainThread: unknown }).mainThread = null;
  GameMIDlet.random.setSeed(seed);
  const c = midlet.canvas;

  return {
    game: 2,
    width: 176,
    height: 204,
    frameStepMs: 80,
    injectKey(code, down) {
      if (down) c.keyPressed(code);
      else c.keyReleased(code);
    },
    paint(g) {
      c.paint(g);
    },
    snapshotState() {
      const p = (c.player as unknown as { posX: number; posY: number; velX: number; frameIndex: number } | undefined) ?? null;
      const scene = (c.scene as unknown as { subState: number } | undefined) ?? null;
      return {
        uiState: c.uiState,
        subState: c.subState,
        globalFrame: c.globalFrame,
        levelIndex: c.levelIndex,
        menuSelection: c.menuSelection,
        cameraX: c.cameraX,
        cameraY: c.cameraY,
        elapsedSeconds: c.elapsedSeconds,
        inputAction: c.inputAction,
        sceneSubState: scene ? scene.subState : null,
        playerPosX: p ? p.posX : null,
        playerPosY: p ? p.posY : null,
        playerVelX: p ? p.velX : null,
        playerFrame: p ? p.frameIndex : null,
        rngSeed: String((GameMIDlet.random as unknown as { seed: bigint }).seed),
      };
    },
  };
}
