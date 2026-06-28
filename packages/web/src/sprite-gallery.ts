/**
 * 精灵画廊（开发工具，非游戏运行壳）。
 * 用游戏自己的解码器把每个 actor 类型 id 的「动作0·帧0」渲染出来，便于二开认物 / 核对 ActorType 命名。
 * 资源加载流程与 main.ts 一致；用 ?game=1|2 切游戏。
 */
import { Image, registerResource, registerImage, ResourceArchive } from "@red-devil/j2me-shim";
import { SpriteDef as SpriteDef1 } from "../../game1/src/SpriteDef.ts";
import { SpriteDef as SpriteDef2 } from "../../game2/src/SpriteDef.ts";
import { TileSheet as TileSheet2 } from "../../game2/src/TileSheet.ts";

interface Cfg {
  title: string;
  bins: string[];
  pngArchives: string[];
  fetchDir: string;
  preloadFrames?: () => { index: number; frame: number; bytes: Int8Array }[];
  /** type id → 建议名（⚠ 前缀 = med 置信待确认）。 */
  names: Record<number, string>;
}

const GAMES: Record<string, Cfg> = {
  "1": {
    title: "① 红魔特种兵",
    bins: ["a", "f", "image", "s", "sound", "t", "x"],
    pngArchives: ["image"],
    fetchDir: "/res",
    names: {
      0: "Player", 1: "ReconScoutEnemy", 2: "MeleeBomberEnemy", 3: "AmmoSupplyPickup",
      4: "RescueTargetNpc", 5: "CaptureTrigger", 6: "ParachuteTrailEffect", 7: "ExplosiveBarrel",
      8: "AtvVehicleBoss", 9: "RegeneratingBarrier", 10: "PlayerBounceShot", 11: "HealthPickup",
      12: "GatedTrigger", 13: "LevelExitGate", 14: "ScriptedFuseTrigger", 15: "GrenadeProjectile",
      16: "ExplosionEffect", 17: "DivingHazard", 18: "ScrollChaserHeavy", 19: "TreasureChestProp",
      20: "FallingBombProjectile", 21: "GuidedMissileProjectile", 22: "GrabAnchorZone",
    },
  },
  "2": {
    title: "② 深海战舰",
    bins: ["a", "actorPng", "b", "bpng", "fpng", "logo", "m", "p", "s", "sound", "string", "t"],
    pngArchives: ["actorPng", "bpng", "fpng", "logo"],
    fetchDir: "/res2",
    preloadFrames: () => TileSheet2.a_PaletteFrames(),
    names: {
      0: "Player", 1: "RiflemanGrunt", 2: "VehicleGunner", 3: "GrenadierGrunt", 4: "SentryGrunt",
      5: "TurretEmplacement", 6: "NavalOfficerNpc", 7: "ItemPickup", 8: "(孤儿/未用)", 9: "GuidedGrenade",
      10: "DirectBullet", 11: "MobileGunEmplacement", 12: "ExplosionDebris", 13: "DestructibleConsole",
      14: "DriftingFlotsam", 15: "PatrolFlyer", 16: "ArcCannonShell", 17: "PatrolLauncher",
      18: "PlayerAttachedEffect", 19: "HelicopterBoss", 20: "SplashEffect", 21: "FinalBoss",
      22: "GrappleMarker",
    },
  },
};

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];
const CELL = 96;

async function fetchBytes(path: string): Promise<Uint8Array> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`资源加载失败 ${path}: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function preloadImages(logicalPath: string, bytes: Uint8Array): Promise<void> {
  const arc = new ResourceArchive(bytes);
  for (let i = 0; i < arc.entryCount; i++) {
    const entry = arc.entry(i);
    if (!(entry.length >= 8 && PNG_SIG.every((b, k) => entry[k] === b))) continue;
    // entry 为 Uint8Array<ArrayBufferLike>；TS6 起 Blob 入参须断言为 BlobPart（仅类型，运行时不变）。
    const bmp = await createImageBitmap(new Blob([entry as BlobPart], { type: "image/png" }));
    registerImage(logicalPath, i, Image.fromSource(bmp, bmp.width, bmp.height));
  }
}

/** 渲染单个类型 id 的精灵到一张 CELL×CELL 离屏图，返回其 canvas（含成功标志）。 */
function renderType(which: string, n: number): { canvas: HTMLCanvasElement; ok: boolean; err?: string } {
  const img = Image.createMutable(CELL, CELL);
  const g = img.getGraphics();
  g.setColor(0x0b0d10);
  g.fillRect(0, 0, CELL, CELL);
  const ax = (CELL / 2) | 0;
  const ay = (CELL * 0.62) | 0; // 锚点偏下，给头顶留空间
  let ok = true;
  let err: string | undefined;
  try {
    if (which === "1") {
      const def = SpriteDef1.loadFromBin(n);
      if (!def) { ok = false; err = "无定义"; }
      else def.paintSequenceFrame(g, ax, ay, 0, 0, 0, 0);
    } else {
      const def = SpriteDef2.loadFromArchive(n);
      if (!def) { ok = false; err = "无定义"; }
      else def.drawFrame(g, ax, ay, 0, 0, 0, 0);
    }
  } catch (e) {
    ok = false;
    err = String((e as Error)?.message ?? e);
  }
  // createMutable 底层可能是 OffscreenCanvas（非 DOM 节点，不能 appendChild）；画到真实 <canvas> 再上屏。
  const out = document.createElement("canvas");
  out.width = CELL;
  out.height = CELL;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingEnabled = false;
  try { octx.drawImage(img.source() as CanvasImageSource, 0, 0); } catch { /* 留空 */ }
  return { canvas: out, ok, err };
}

async function boot(): Promise<void> {
  const which = new URLSearchParams(location.search).get("game") ?? "2";
  const cfg = GAMES[which] ?? GAMES["2"];
  document.getElementById("t")!.textContent = cfg.title;
  document.title = `精灵画廊 ${cfg.title}`;

  for (const name of cfg.bins) {
    const bytes = await fetchBytes(`${cfg.fetchDir}/${name}.bin`);
    const logical = `/res/${name}.bin`;
    registerResource(logical, bytes);
    if (cfg.pngArchives.includes(name)) await preloadImages(logical, bytes);
  }
  if (cfg.preloadFrames) {
    for (const fr of cfg.preloadFrames()) {
      const bmp = await createImageBitmap(new Blob([new Uint8Array(fr.bytes)], { type: "image/png" }));
      registerImage("/res/actorPng.bin", fr.index, Image.fromSource(bmp, bmp.width, bmp.height), fr.frame);
    }
  }

  const grid = document.getElementById("grid")!;
  for (let n = 0; n <= 22; n++) {
    const name = cfg.names[n] ?? "?";
    const amb = name.startsWith("⚠");
    const { canvas, ok, err } = renderType(which, n);
    const cell = document.createElement("div");
    cell.className = "cell" + (amb ? " amb" : "");
    cell.appendChild(canvas);
    const id = document.createElement("div");
    id.className = "id";
    id.textContent = `type ${n}`;
    const nm = document.createElement("div");
    nm.className = "nm";
    nm.textContent = name.replace(/^⚠/, "");
    cell.appendChild(id);
    cell.appendChild(nm);
    if (!ok) {
      const e = document.createElement("div");
      e.className = "err";
      e.textContent = err ?? "渲染失败";
      cell.appendChild(e);
    }
    grid.appendChild(cell);
  }
}

boot().catch((e) => {
  console.error(e);
  const el = document.getElementById("err");
  if (el) el.textContent = String(e?.stack ?? e);
});
