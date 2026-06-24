/**
 * Random 位级一致验证。
 * 期望值硬编码于下方 CASES，由 JDK 17 `java.util.Random` 输出抄录（见 docs/04-验证方法）。
 * 运行：node --experimental-strip-types packages/j2me-shim/test/random.verify.ts
 */
import { Random } from "../src/Random.ts";

type Case = { seed: bigint; nextInt: number[]; nextIntN: number[]; absMod: number[] };

// 来自 JDK 17 `java.util.Random` 的权威输出
const CASES: Case[] = [
  {
    seed: 0n,
    nextInt: [-1155484576, -723955400, 1033096058, -1690734402, -1557280266, 1327362106, -1930858313, 502539523],
    nextIntN: [60, 48, 29, 47, 15, 53, 91, 61],
    absMod: [76, 0, 58, 2, 66, 6, 13, 23],
  },
  {
    seed: 1n,
    nextInt: [-1155869325, 431529176, 1761283695, 1749940626, 892128508, 155629808, 1429008869, -1465154083],
    nextIntN: [85, 88, 47, 13, 54, 4, 34, 6],
    absMod: [25, 76, 95, 26, 8, 8, 69, 83],
  },
  {
    seed: 42n,
    nextInt: [-1170105035, 234785527, -1360544799, 205897768, 1325939940, -248792245, 1190043011, -1255373459],
    nextIntN: [30, 63, 48, 84, 70, 25, 5, 18],
    absMod: [35, 27, 99, 68, 40, 45, 11, 59],
  },
  {
    seed: 1234567890123n,
    nextInt: [-8722476, -1977939436, -999828940, -741339138, -916778800, -1183211565, -1030857102, -187463566],
    nextIntN: [10, 30, 78, 79, 48, 65, 97, 65],
    absMod: [76, 36, 40, 38, 0, 65, 2, 66],
  },
];

let fail = 0;
function check(label: string, got: number[], want: number[]) {
  const ok = got.length === want.length && got.every((v, i) => v === want[i]);
  if (!ok) {
    fail++;
    console.error(`✗ ${label}\n   got=${got.join(",")}\n  want=${want.join(",")}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

for (const c of CASES) {
  let r = new Random(c.seed);
  check(`seed=${c.seed} nextInt()`, Array.from({ length: 8 }, () => r.nextInt()), c.nextInt);

  r = new Random(c.seed);
  check(`seed=${c.seed} nextInt(100)`, Array.from({ length: 8 }, () => r.nextInt(100)), c.nextIntN);

  r = new Random(c.seed);
  check(`seed=${c.seed} absMod(100)`, Array.from({ length: 8 }, () => r.absMod(100)), c.absMod);
}

if (fail > 0) {
  console.error(`\n❌ Random 验证失败：${fail} 项不一致`);
  process.exit(1);
}
console.log("\n✅ Random 与 JDK 17 位级一致（全部用例通过）");
