// 逐场景独立子进程跑（隔离模块级静态单例），聚合退出码。用法 pnpm test:behavior。
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SCENARIOS } from "./src/scenarios.ts";

const here = dirname(fileURLToPath(import.meta.url));
const runner = join(here, "run-scenario.ts");

let failed = 0;
for (const s of SCENARIOS) {
  process.stdout.write(`\n===== ${s.id} =====\n`);
  try {
    execFileSync(process.execPath, ["--experimental-transform-types", runner, s.id, "check"], { stdio: "inherit" });
  } catch {
    failed++;
  }
}
process.stdout.write(failed === 0 ? `\n✅ 全部 ${SCENARIOS.length} 个场景通过\n` : `\n❌ ${failed}/${SCENARIOS.length} 个场景失配\n`);
process.exit(failed === 0 ? 0 : 1);
