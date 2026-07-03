// 资源夹具：从 reverse/ 权威副本 fs 直读 .bin，注册逻辑键 /res/<name>.bin；
// PNG 归档扫描 IHDR 取宽高、注册 stub 图（游戏逻辑只消费尺寸，不回读像素）。
// game2 换色帧（PLTE 补丁帧）经 TileSheet.a_PaletteFrames() 离线取字节、按 archive#index@frame 注册。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { registerResource, registerImage, ResourceArchive } from "@red-devil/j2me-shim";
import { parsePngSize } from "./png-ihdr.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];

interface GameFixtureDef {
  dir: string;
  bins: string[];
  pngArchives: string[];
}

// bins/pngArchives 与 packages/web/src/main.ts 的 GAMES 表一致
const DEFS: Record<1 | 2, GameFixtureDef> = {
  1: { dir: "game1", bins: ["a", "f", "image", "s", "sound", "t", "x"], pngArchives: ["image"] },
  2: {
    dir: "game2",
    bins: ["a", "actorPng", "b", "bpng", "fpng", "logo", "m", "p", "s", "sound", "string", "t"],
    pngArchives: ["actorPng", "bpng", "fpng", "logo"],
  },
};

/** 轻量 stub Image：实现游戏绘制路径实际调用的子集（getWidth/getHeight/isMutable/source）。 */
function makeStub(key: string, w: number, h: number): object {
  const src = { __imgKey: key, width: w, height: h };
  return { getWidth: () => w, getHeight: () => h, isMutable: () => false, source: () => src };
}

export async function loadGameFixtures(game: 1 | 2): Promise<void> {
  const def = DEFS[game];
  for (const name of def.bins) {
    const bytes = new Uint8Array(readFileSync(join(ROOT, "reverse", def.dir, "1-jar-unpacked", "res", `${name}.bin`)));
    const logical = `/res/${name}.bin`;
    registerResource(logical, bytes);
    if (!def.pngArchives.includes(name)) continue;
    const arc = new ResourceArchive(bytes);
    for (let i = 0; i < arc.entryCount; i++) {
      const e = arc.entry(i);
      const isPng = e.length >= 8 && PNG_SIG.every((b, k) => e[k] === b);
      if (!isPng) continue;
      const { width, height } = parsePngSize(e);
      registerImage(logical, i, makeStub(`${logical}#${i}`, width, height));
    }
  }

  // game2 actor 换色帧（PLTE 补丁帧）：兼容层无运行时同步 PNG 解码，离线取字节 → 注册 stub。
  if (game === 2) {
    const { TileSheet } = await import("@red-devil/game2");
    for (const fr of TileSheet.a_PaletteFrames()) {
      const u8 = new Uint8Array(fr.bytes);
      const { width, height } = parsePngSize(u8);
      registerImage("/res/actorPng.bin", fr.index, makeStub(`/res/actorPng.bin#${fr.index}@${fr.frame}`, width, height), fr.frame);
    }
  }
}
