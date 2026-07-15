/**
 * 差分模糊测试器 —— 系统性审计「TS 移植 vs 原版」的既有保真度。
 *
 * 用法：node --experimental-transform-types packages/jvm-oracle/fuzz.ts <1|2> [轮数] [起始种子]
 *
 * 做法：随机生成输入脚本 → 同一份脚本同时驱动 jvm-oracle（原版 .class 字节码）与 TS port
 *       → 逐帧对拍 J2ME 语义级 draw-op。**任何分歧 = 一个真 bug**（op 层已剔除故意偏差：
 *       字体字形/alpha 合成/MIDI 音色/像素内容都落在该层之下，见 docs/jvm-oracle-保真审计.md）。
 *
 * 为什么用模糊而不是手写 scenario：
 *   移植的多数路径（攀爬/跳跃/武器1,2/手雷/载具/Boss相位/结算/死亡/game2换色帧）**从未与原版
 *   对照过**——它们此前只有「人工逐行读 CFR」这一层验证，而该层已被证明会漏（Nokia rot90/270
 *   缺陷survive 多年）。手写脚本需先猜出每条路怎么走（实测失败：够不到任务选择屏），
 *   模糊则自动探索「我想不到」的路径。
 *
 * 只发游戏**真正解码**的键码（取自 CFR：game1 `a.java` h(int)、game2 `a.java` d(int) 的 case 表），
 * 否则等于在测无效输入。
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const OUT = join(HERE, "out");
const WORK = join(OUT, "fuzz");
mkdirSync(WORK, { recursive: true });

// 游戏真正解码的键码（CFR case 表原样搬运）
const KEYS: Record<1 | 2, number[]> = {
  1: [-1, 1, -2, 6, -3, 2, -4, 5, -6, -5, -7, 42, 48, 55, 56, 35, 57, 51, 54, 49, 50, 52],
  2: [-1, 1, 50, -6, 6, 56, -2, 2, 52, -5, 5, 54, -20, 20, 53, 55, 35, 57, 42, 49, 51, -21, 21, -22, 22],
};
const SCREEN: Record<1 | 2, [number, number]> = { 1: [176, 208], 2: [176, 204] };

const game = Number(process.argv[2] || 1) as 1 | 2;
const rounds = Number(process.argv[3] || 20);
const seed0 = Number(process.argv[4] || 1);
const FRAMES = 400;

/** 确定性 PRNG（模糊器自身也要可复现——失败用例必须能原样重跑）。 */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genScript(rngSeed: number): string {
  const r = mulberry32(rngSeed);
  const keys = KEYS[game];
  const lines: string[] = [`# fuzz script seed=${rngSeed} game=${game}`, `seed=${12345}`, `frames=${FRAMES}`];
  // 先给一段「进得去关卡」的引导（否则绝大多数随机脚本只在菜单里打转，白测）：
  // 与既有 level 场景同款确定键，随后才是随机探索。
  if (game === 1) lines.push("100,48,1", "101,48,0");
  else lines.push("100,53,1", "101,53,0", "130,22,1", "131,22,0");
  // 随机按键：每次挑一个键，按下若干帧后抬起
  let f = 150;
  while (f < FRAMES - 5) {
    const code = keys[Math.floor(r() * keys.length)]!;
    const hold = 1 + Math.floor(r() * 12);
    lines.push(`${f},${code},1`);
    lines.push(`${Math.min(f + hold, FRAMES - 1)},${code},0`);
    f += hold + 1 + Math.floor(r() * 10);
  }
  return lines.join("\n") + "\n";
}

function runOracle(scriptPath: string): string {
  const [w, h] = SCREEN[game];
  return execFileSync(
    "java",
    [
      `--patch-module`, `java.base=${join(OUT, `.respatch${game}`)}`,
      `--add-opens`, `java.base/res=ALL-UNNAMED`,
      `-Djava.awt.headless=true`, `-Doracle.dumpOps=true`,
      `-Doracle.width=${w}`, `-Doracle.height=${h}`,
      `-Doracle.scriptFile=${scriptPath}`,
      `-cp`, `${OUT}:${join(REPO, "reverse", `game${game}`, "1-jar-unpacked")}`,
      `harness.OracleRun`, String(game),
    ],
    { encoding: "utf8", maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] },
  )
    .split("\n")
    .filter((l) => l && !l.startsWith("["))
    .join("\n");
}

function runPort(scriptPath: string): string {
  return execFileSync(
    process.execPath,
    ["--experimental-transform-types", join(REPO, "packages/behavior-net/dump-ops.ts"), "--script", scriptPath, String(game)],
    { encoding: "utf8", maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] },
  ).trimEnd();
}

console.log(`[fuzz] game${game} 轮数=${rounds} 起始种子=${seed0} 每轮${FRAMES}帧`);
console.log(`[fuzz] 判据：同一输入下两侧语义层 op 必须逐字节一致；任何分歧=真 bug\n`);

let green = 0;
const diverged: Array<{ seed: number; detail: string }> = [];

for (let i = 0; i < rounds; i++) {
  const s = seed0 + i;
  const sp = join(WORK, `s${s}.txt`);
  writeFileSync(sp, genScript(s));
  let o: string, p: string;
  try {
    o = runOracle(sp);
    p = runPort(sp);
  } catch (e) {
    console.log(`  seed=${s}  ⚠️ 运行失败（非分歧，须单独查）：${(e as Error).message.split("\n")[0]}`);
    continue;
  }
  if (o === p) {
    green++;
    process.stdout.write(`  seed=${s}  ✅ ${o.split("\n").length} op 一致\n`);
    continue;
  }
  // 定位首个失配
  const ol = o.split("\n");
  const pl = p.split("\n");
  let k = 0;
  while (k < Math.min(ol.length, pl.length) && ol[k] === pl[k]) k++;
  const detail = `op 数 oracle=${ol.length} port=${pl.length}；首个失配 #${k}\n    < ${ol[k] ?? "(无)"}\n    > ${pl[k] ?? "(无)"}`;
  diverged.push({ seed: s, detail });
  process.stdout.write(`  seed=${s}  ❌ 分歧！${detail}\n`);
}

console.log(`\n[fuzz] === 结果 ===`);
console.log(`[fuzz] 一致 ${green}/${rounds}，分歧 ${diverged.length}`);
if (diverged.length) {
  console.log(`[fuzz] 分歧用例（可原样复跑：脚本在 ${WORK}/s<seed>.txt）：`);
  for (const d of diverged) console.log(`  · seed=${d.seed}\n    ${d.detail}`);
  process.exit(1);
}
console.log(`[fuzz] ✅ 本轮未发现分歧`);
