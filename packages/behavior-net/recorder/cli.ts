/**
 * 通关脚本录制器 —— CLI。录制 → **独立重放自检**（子进程真适配器）→ 写夹具。
 *
 * 用法：
 *   node --experimental-transform-types packages/behavior-net/recorder/cli.ts <scenario> [--out <path>]
 *   node --experimental-transform-types packages/behavior-net/recorder/cli.ts --list
 *
 * 自检**失败即拒绝写夹具**（把「控制器内部声称 reached ≠ 脚本可复现」制度化）。
 * 写出后仍须跑 `packages/jvm-oracle/diff.sh --script <path> <game>` 做最终绝对闸门（逐 op 对拍 + 覆盖断言）。
 */
import { record, toScriptText } from "./record.ts";
import { SCENARIOS, FIXTURE_HEADER } from "./policies.ts";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const args = process.argv.slice(2);
if (args[0] === "--list" || args.length === 0) {
  console.log("scenarios:", Object.keys(SCENARIOS).join(", "));
  process.exit(0);
}
const name = args[0];
const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

const scn = SCENARIOS[name];
if (!scn) {
  console.error(`未知 scenario：${name}；可选：${Object.keys(SCENARIOS).join(", ")}`);
  process.exit(2);
}

// 1) 录制（自写 sim + policy）
const res = await record(scn);
console.log(`[record] statesSeen=[${res.statesSeen.join(",")}] finalState=${res.finalState} keyframes=${res.recorded.length}`);
const recMissing = scn.expectStates.filter((s) => !res.statesSeen.includes(s));
if (recMissing.length) {
  console.error(`⛔ 录制阶段就没走到必达状态 ${JSON.stringify(recMissing)} —— policy/参数有问题，拒绝出脚本`);
  process.exit(1);
}

// 2) 独立重放自检（子进程 + 真适配器）
const scriptText = toScriptText(scn, res.recorded, FIXTURE_HEADER[name]);
const tmp = join(mkdtempSync(join(tmpdir(), "rec-")), `${name}.txt`);
writeFileSync(tmp, scriptText);
const here = dirname(fileURLToPath(import.meta.url));
let replayOut = "";
try {
  replayOut = execFileSync(
    process.execPath,
    ["--experimental-transform-types", join(here, "replay-states.ts"), tmp, String(scn.game)],
    { encoding: "utf8", cwd: join(here, "..", "..", ".."), stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (e: any) {
  console.error("⛔ 独立重放子进程崩溃：", e?.stderr ?? e?.message ?? e);
  process.exit(1);
}
const m = replayOut.match(/STATES=\[([^\]]*)\]/);
const replayStates = m ? m[1].split(",").filter(Boolean).map(Number) : [];
console.log(`[self-check] 独立重放(真适配器,子进程) statesSeen=[${replayStates.join(",")}]`);
const missing = scn.expectStates.filter((s) => !replayStates.includes(s));
if (missing.length) {
  console.error(`⛔ 自检失败：录出的脚本**独立重放**未达状态 ${JSON.stringify(missing)}`);
  console.error(`   （录制时声称达到了，但脚本本身不可复现——正是「控制器声称≠脚本可复现」那类缺陷）。拒绝写夹具。`);
  process.exit(1);
}
console.log(`✅ 自检通过：录出的脚本独立重放确实达到必达状态 ${JSON.stringify(scn.expectStates)}`);

// 3) 写夹具
if (outPath) {
  writeFileSync(outPath, scriptText);
  console.log(`wrote ${outPath}`);
  console.log(`→ 最终闸门：packages/jvm-oracle/diff.sh --script ${outPath} ${scn.game}`);
} else {
  process.stdout.write(scriptText);
}
