/**
 * Resource (.bin 归档) 解析验证：与 tools/extract_bin.py 的结果对齐。
 * 运行：node --experimental-strip-types packages/j2me-shim/test/resource.verify.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ResourceArchive } from "../src/Resource.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
let fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    fail++;
    console.error(`✗ ${label}\n   got=${JSON.stringify(got)}\n  want=${JSON.stringify(want)}`);
  } else console.log(`✓ ${label}`);
}

function arc(game: string, name: string): ResourceArchive {
  const buf = readFileSync(join(ROOT, "reverse", game, "1-jar-unpacked", "res", name));
  return new ResourceArchive(new Uint8Array(buf));
}

// 游戏1 image.bin：count=10，已知偏移表，entry0 是 PNG
{
  const a = arc("game1", "image.bin");
  eq("g1 image.bin count", a.count, 10);
  eq("g1 image.bin offsets", a.offsets, [0, 1058, 1460, 3457, 5158, 9871, 13333, 16967, 17493, 18745]);
  eq("g1 image.bin entryCount", a.entryCount, 9);
  const e0 = a.entry(0);
  eq("g1 image.bin entry0 PNG签名", [e0[0], e0[1], e0[2], e0[3]], [0x89, 0x50, 0x4e, 0x47]);
  eq("g1 image.bin entry0 size", a.entrySize(0), 1058);
}

// 游戏1 x.bin：UTF-16LE 字符串，BOM FF FE
{
  const a = arc("game1", "x.bin");
  eq("g1 x.bin count", a.count, 4);
  const r = a.reader(0);
  eq("g1 x.bin entry0 BOM", [r.readUByte(), r.readUByte()], [0xff, 0xfe]);
}

// 游戏2 sound.bin：MIDI（MThd）
{
  const a = arc("game2", "sound.bin");
  eq("g2 sound.bin count", a.count, 3);
  const e0 = a.entry(0);
  eq("g2 sound.bin entry0 MThd", String.fromCharCode(e0[0], e0[1], e0[2], e0[3]), "MThd");
}

// 游戏2 m.bin：地图头 01 00 04 04 W H
{
  const a = arc("game2", "m.bin");
  const r = a.reader(0);
  const head = [r.readUByte(), r.readUByte(), r.readUByte(), r.readUByte()];
  eq("g2 m.bin entry0 头部 01 00 04 04", head, [0x01, 0x00, 0x04, 0x04]);
}

if (fail > 0) {
  console.error(`\n❌ Resource 验证失败：${fail} 项`);
  process.exit(1);
}
console.log("\n✅ Resource 解析与 extract_bin.py 一致");
