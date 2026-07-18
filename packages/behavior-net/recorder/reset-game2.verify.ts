/**
 * 验证 game2 单进程静态重置（{@link resetGame2Statics}）的正确性——把「对拍 fresh-process 标定」制度化。
 *
 * 单进程内跑同一 game2 场景 3 次，逐帧哈希 gameplay 字段（uiState/subState/相机/玩家 pos·vel·frame·health·reserved）：
 *   A = 第 1 次（进程起始＝fresh-init，不重置）——fresh 基准
 *   B = 第 2 次（**不重置**）——应被上一次污染 → 与 A 不同（证污染真实存在）
 *   C = 第 3 次（**重置后**）——应与 A 逐字节一致（证重置把状态复原回 fresh）
 * 判据：A !== B（污染真实）且 A === C（重置正确）。任一不成立即 exit 1。
 *
 * 用法：node --experimental-transform-types packages/behavior-net/recorder/reset-game2.verify.ts
 */
import "@red-devil/game1/src/ProjectileActor.ts";
import { GameMIDlet as Game2Midlet } from "@red-devil/game2";
import { configureScreen, Graphics, Image } from "@red-devil/j2me-shim";
import { installClock } from "../src/fake-clock.ts";
import { installDomStubs } from "../src/fake-dom.ts";
import { installCanvasFactory } from "../src/fake-canvas.ts";
import { loadGameFixtures } from "../src/fixtures.ts";
import { resetGame2Statics } from "./record.ts";

const STEP = 80, D = 8;
// 覆盖入关+简报+走右撞敌+若干动作，跑到 ~500 帧（够触发多类 actor/静态量）
const MACROS = "RRRRRRFFRRLLUUDDRRRRJJ";
const nullCtx: any = new Proxy({}, {
  get: (_t, p) => { if (p === "canvas") return { width: 176, height: 204 }; if (p === "measureText") return () => ({ width: 0 }); if (p === "globalAlpha" || p === "lineWidth") return 1; return () => nullCtx; },
  set: () => true,
});
function injectSave(csv: string): void {
  const s = new Map<string, string>(); s.set("REDDEVIL2", csv);
  (globalThis as any).localStorage = { getItem: (k: string) => s.has(k) ? s.get(k)! : null, setItem: (k: string, v: string) => void s.set(k, v), removeItem: (k: string) => void s.delete(k), clear: () => s.clear() };
}

let fixturesLoaded = false;
async function runG2Once(level: number, doReset: boolean): Promise<string> {
  const clock = installClock(0);
  if (doReset) resetGame2Statics();
  injectSave(`0,0,1,${level},0`);
  installDomStubs(); installCanvasFactory();
  if (!fixturesLoaded) { await loadGameFixtures(2); fixturesLoaded = true; }
  configureScreen({ width: 176, height: 204, scale: 1, screen: { width: 0, height: 0 } as any });
  Image.resetOracleIds();
  const midlet: any = new Game2Midlet(); midlet.canvas.running = false; midlet.canvas.mainThread = null; Game2Midlet.random.setSeed(54321);
  const canvas: any = midlet.canvas, g = new Graphics(nullCtx, 176, 204);
  const entry = new Map<number, Array<[number, boolean]>>();
  const push = (f: number, c: number, d: boolean) => { const a = entry.get(f) ?? []; a.push([c, d]); entry.set(f, a); };
  push(100, 6, true); push(101, 6, false); push(105, 53, true); push(106, 53, false);
  let ok = -99, ns = -1, sb = false, held = -1, hash = 0;
  const mix = (v: number) => { hash = (Math.imul(hash, 31) + (v | 0)) | 0; };
  const CODE: Record<string, number> = { R: 5, L: 2, J: 51, j: 49, U: 50, D: 6, F: 53 };
  for (let f = 0; f < 700; f++) {
    for (const [c, d] of entry.get(f) ?? []) { if (d) canvas.keyPressed(c); else canvas.keyReleased(c); }
    if (f >= 108) {
      if (ns < 0) {
        let w = -1;
        if (canvas.uiState === 22) { w = 22; sb = true; } else if (canvas.uiState === 10 && canvas.scene?.subState === 4) w = 53;
        if (w !== ok) { if (w >= 0) canvas.keyPressed(w); else canvas.keyReleased(5); ok = w; } else if (w >= 0) { canvas.keyReleased(w); canvas.keyPressed(w); }
        if (canvas.uiState === 10 && canvas.scene?.subState === 0 && sb) ns = f + 1;
      } else {
        const mi = Math.floor((f - ns) / D);
        const ch = mi < MACROS.length ? MACROS[mi]! : ".";
        const w = CODE[ch] ?? -1;
        if (w !== held) { canvas.keyReleased(w < 0 ? 5 : w); if (w >= 0) canvas.keyPressed(w); held = w; }
      }
    }
    canvas.paint(g); clock.advance(STEP);
    const p = canvas.player;
    mix(canvas.uiState); mix(canvas.scene?.subState ?? -1); mix(canvas.cameraX); mix(canvas.cameraY);
    if (p) { mix(p.posX); mix(p.posY); mix(p.velX); mix(p.velY | 0); mix(p.frameIndex); mix(p.health); mix(p.reserved); }
  }
  clock.uninstall();
  return (hash >>> 0).toString(16);
}

const LEVEL = 3;
const A = await runG2Once(LEVEL, false); // fresh 基准
const B = await runG2Once(LEVEL, false); // 不重置 → 污染
const C = await runG2Once(LEVEL, true); // 重置 → 复现 fresh
let fail = 0;
if (A === B) { console.error(`❌ 期望「不重置→污染」但 A===B（${A}）——本测试失去意义（污染未发生或场景未触及有状态静态量）`); fail = 1; }
else console.log(`✅ 污染真实：不重置的第 2 次 (${B}) ≠ fresh 基准 (${A})`);
if (A !== C) { console.error(`❌ 重置不正确：重置后 (${C}) ≠ fresh 基准 (${A})——resetGame2Statics 漏清/错清某静态量`); fail = 1; }
else console.log(`✅ 重置正确：重置后的第 3 次 (${C}) === fresh 基准 (${A}) —— 单进程批量重放与全新进程逐字节一致`);
if (fail) process.exit(1);
console.log("✅ game2 单进程静态重置验证通过");
