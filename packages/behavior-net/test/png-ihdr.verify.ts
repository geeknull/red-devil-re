import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ResourceArchive } from "@red-devil/j2me-shim";
import { Asserter } from "../src/assert.ts";
import { parsePngSize } from "../src/png-ihdr.ts";

const a = new Asserter();
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

// 手工构造最小 PNG 头：签名 + IHDR(len=13,"IHDR", w=176 BE, h=208 BE)
const hdr = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // 签名
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // len=13, "IHDR"
  0x00, 0x00, 0x00, 0xb0, // width = 176
  0x00, 0x00, 0x00, 0xd0, // height = 208
]);
a.eq("解析构造 PNG 头 176x208", parsePngSize(hdr), { width: 176, height: 208 });

// 真 PNG：reverse/game1/1-jar-unpacked/res/image.bin entry0
const bytes = new Uint8Array(readFileSync(join(ROOT, "reverse", "game1", "1-jar-unpacked", "res", "image.bin")));
const e0 = new ResourceArchive(bytes).entry(0);
const size = parsePngSize(e0);
a.ok("真 PNG 宽高为正", size.width > 0 && size.height > 0);

a.done("png-ihdr");
