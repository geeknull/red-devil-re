import { parseOTT } from "../src/Midi.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const data = new Uint8Array(readFileSync(join(ROOT, "reverse/game1/1-jar-unpacked/res/sound.bin")));
const dv = new DataView(data.buffer);
const count = dv.getUint32(0, true);
const offs: number[] = [];
for (let i = 0; i < count; i++) offs.push(dv.getUint32(4 + 4 * i, true));
const base = 4 + 4 * count;
for (const ei of [0, 1, 2]) {
  const chunk = data.subarray(base + offs[ei], base + offs[ei + 1]);
  const { notes, duration } = parseOTT(chunk);
  const ons = notes.filter((n) => n.on);
  console.log(`entry[${ei}] ${chunk.length}B → 音符on=${ons.length} 时长=${duration.toFixed(2)}s 前几音=${ons.slice(0, 6).map((n) => n.note).join(",")}`);
}
