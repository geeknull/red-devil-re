import { parseSMF } from "../src/Midi.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
let fail = 0;
for (const f of ["reverse/game2/assets/sounds/track_0.mid", "reverse/game2/assets/sounds/track_1.mid"]) {
  const buf = new Uint8Array(readFileSync(join(ROOT, f)));
  const { notes, duration } = parseSMF(buf);
  const ons = notes.filter((n) => n.on).length;
  const ok = ons > 0 && duration > 0;
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${f}: 事件=${notes.length} 音符on=${ons} 时长=${duration.toFixed(2)}s 前5音符=${notes.filter((n) => n.on).slice(0, 5).map((n) => n.note).join(",")}`);
}
process.exit(fail ? 1 : 0);
