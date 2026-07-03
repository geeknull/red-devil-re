// 逐场景独立子进程录制黄金。用法 pnpm bless:behavior。仅在确认当前行为即基准时运行。
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SCENARIOS } from "./src/scenarios.ts";

const here = dirname(fileURLToPath(import.meta.url));
const runner = join(here, "run-scenario.ts");

for (const s of SCENARIOS) {
  process.stdout.write(`\n===== 录制 ${s.id} =====\n`);
  execFileSync(process.execPath, ["--experimental-transform-types", runner, s.id, "record"], { stdio: "inherit" });
}
process.stdout.write(`\n✅ 已录制 ${SCENARIOS.length} 个场景黄金\n`);
