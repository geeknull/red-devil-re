// 运行全部 j2me-shim 位级验证套件并聚合结果。
//   用法: pnpm test:shim
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const suites = ["random", "resource", "midi", "ott"];

let failed = 0;
for (const s of suites) {
  process.stdout.write(`\n===== ${s}.verify.ts =====\n`);
  try {
    execFileSync(process.execPath, ["--experimental-strip-types", join(here, `${s}.verify.ts`)], { stdio: "inherit" });
  } catch {
    failed++;
    process.stdout.write(`✗ ${s} 失败\n`);
  }
}

process.stdout.write(failed === 0 ? `\n✅ 全部 ${suites.length} 个 shim 验证套件通过\n` : `\n❌ ${failed}/${suites.length} 个套件失败\n`);
process.exit(failed === 0 ? 0 : 1);
