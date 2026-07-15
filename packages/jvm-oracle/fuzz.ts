/**
 * 差分模糊测试器（**状态覆盖引导**）—— 系统性审计「TS 移植 vs 原版」的既有保真度。
 *
 * 用法：node --experimental-transform-types packages/jvm-oracle/fuzz.ts <1|2> [轮数] [起始种子] [帧数]
 *   例：fuzz.ts 1 200          —— game1 跑 200 轮（默认 800 帧/轮）
 *       fuzz.ts 2 300 1 1500  —— game2 跑 300 轮、种子从 1 起、每轮 1500 帧（探深层路径）
 *
 * 做法：随机生成输入脚本 → 同一份脚本同时驱动 jvm-oracle（原版 .class 字节码）与 TS port
 *       → 逐帧对拍 J2ME 语义级 draw-op。**任何分歧 = 一个真 bug**（op 层已剔除故意偏差：
 *       字体字形/alpha 合成/MIDI 音色/像素内容都落在该层之下，见 docs/jvm-oracle-保真审计.md）。
 *
 * 为什么用模糊而不是手写 scenario：
 *   移植的多数路径（攀爬/跳跃/武器1,2/手雷/载具/Boss相位/结算/死亡）**从未与原版对照过**——
 *   它们此前只有「人工逐行读 CFR」这一层验证，而该层已被证明会漏（Nokia rot90/270 缺陷 survive 多年，
 *   手雷弹道缺陷更是 CFR 自己反编译错了）。手写脚本需先猜出每条路怎么走（实测失败：探针够不到
 *   任务选择屏），模糊则自动探索「我想不到」的路径。
 *
 * ## 为什么要「状态覆盖引导」（v2 的核心改动）
 *   v1 起点固定（一条写死的引导段）、只 400 帧、且**只报「全绿」不报走到哪**——
 *   **绿而没走到 = 没意义**。v2 做三件事：
 *     ① 用 oracle 自己吐的 `[oracle] statesSeen=[...]`（信任根＝原版字节码的真实状态机）当覆盖度量；
 *     ② **保留能达到新状态的脚本进语料库**，后续在其上变异/延长 → 逐步深入（经典 coverage-guided fuzzing）；
 *     ③ 报告**必须给出实际达到的状态集合 + 未达到的状态**，否则「绿」没有信息量。
 *
 * 只发游戏**真正解码**的键码（取自 CFR：game1 `a.java` h(int)、game2 `a.java` d(int) 的 case 表），
 * 否则等于在测无效输入。模糊器自身用确定性 PRNG，失败用例可原样复跑（脚本留 `out/fuzz/s<seed>.txt`）。
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
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

/**
 * 状态号 → 名字（取自 packages/game{1,2}/src/constants.ts 的 GameState / UiState 枚举）。
 * 只用于**报告可读性**；覆盖判定本身只认 oracle 吐的数字，不依赖这张表。
 */
const STATE_NAMES: Record<1 | 2, Record<number, string>> = {
  1: {
    1: "Logo", 2: "LevelLoading", 3: "About", 4: "MainMenu", 6: "Help",
    10: "Playing", 13: "Paused", 14: "LevelEnter", 15: "Ending", 16: "MissionComplete",
    18: "MissionFailed", 19: "GoalCutscene", 20: "CaptureCutscene", 21: "LevelScroll", 22: "MissionBriefing",
  },
  2: {
    1: "LoadingProgress", 2: "LevelIntroLoading", 3: "Splash", 4: "MainMenu", 6: "Help",
    10: "InGame", 16: "LevelClear", 18: "LevelFailed", 19: "About", 20: "CutsceneIntro",
    21: "GameComplete", 22: "MissionBrief", 100: "NoSave",
  },
};

/**
 * 引导段候选（**不再是写死的一条**）。
 * v1 只有「主菜单直接进新游戏」这一条 → 菜单分支（关于/帮助/读档）永远够不到。
 * 这里给若干「先按 N 次方向键再确认」的变体 + 一条空引导（＝纯菜单探索），
 * 具体哪条能到哪个状态**不靠猜**——由覆盖引导自己筛（能达新状态的才留进语料库）。
 */
function bootVariants(game: 1 | 2): string[][] {
  const sel = game === 1 ? 48 : 53; // 既有 level 场景所用的确认键（已实证能进关卡）
  const down = game === 1 ? -2 : -2;
  const out: string[][] = [[]]; // 空引导：纯菜单探索
  for (let n = 0; n <= 4; n++) {
    const lines: string[] = [];
    let f = 100;
    for (let i = 0; i < n; i++) {
      lines.push(`${f},${down},1`, `${f + 1},${down},0`);
      f += 8;
    }
    lines.push(`${f},${sel},1`, `${f + 1},${sel},0`);
    if (game === 2) {
      // game2 进关卡还需过一层过场确认（既有 game2-level 场景实证：130 按 22）
      lines.push(`${f + 30},22,1`, `${f + 31},22,0`);
    }
    out.push(lines);
  }
  return out;
}

const game = Number(process.argv[2] || 1) as 1 | 2;
const rounds = Number(process.argv[3] || 20);
const seed0 = Number(process.argv[4] || 1);
const FRAMES = Number(process.argv[5] || 800);

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

/** 一条输入脚本 = 头部（seed/frames）+ 若干 `<帧>,<键码>,<1按下|0抬起>`。 */
interface Script {
  frames: number;
  events: string[]; // 纯事件行（不含 seed=/frames= 头）
}

function render(s: Script, tag: string): string {
  return [`# fuzz ${tag} game=${game}`, `seed=12345`, `frames=${s.frames}`, ...s.events].join("\n") + "\n";
}

/** 从零生成：随机挑一条引导段 + 其后随机按键。 */
function genFresh(rngSeed: number): Script {
  const r = mulberry32(rngSeed);
  const keys = KEYS[game];
  const boots = bootVariants(game);
  const boot = boots[Math.floor(r() * boots.length)]!;
  const events = [...boot];
  let f = 150;
  while (f < FRAMES - 5) {
    const code = keys[Math.floor(r() * keys.length)]!;
    const hold = 1 + Math.floor(r() * 12);
    events.push(`${f},${code},1`);
    events.push(`${Math.min(f + hold, FRAMES - 1)},${code},0`);
    f += hold + 1 + Math.floor(r() * 10);
  }
  return { frames: FRAMES, events };
}

/** 在语料库亲本上变异（覆盖引导的关键：好脚本要能被继续深挖）。 */
function mutate(parent: Script, rngSeed: number): Script {
  const r = mulberry32(rngSeed);
  const keys = KEYS[game];
  const events = [...parent.events];
  const op = Math.floor(r() * 4);
  if (op === 0 && events.length > 0) {
    // 改一个事件的键码（保持时序）
    const i = Math.floor(r() * events.length);
    const [f, , d] = events[i]!.split(",");
    events[i] = `${f},${keys[Math.floor(r() * keys.length)]!},${d}`;
  } else if (op === 1 && events.length > 2) {
    // 删一段事件（简化 → 有时反而能走通别的分支）
    const i = Math.floor(r() * (events.length - 2));
    events.splice(i, 2);
  } else if (op === 2 && events.length > 0) {
    // 平移一个事件的帧号
    const i = Math.floor(r() * events.length);
    const p = events[i]!.split(",");
    const nf = Math.max(0, Math.min(parent.frames - 1, Number(p[0]) + Math.floor(r() * 21) - 10));
    events[i] = `${nf},${p[1]},${p[2]}`;
  }
  // 无论哪种变异，都在尾部追加一段新的随机探索（这是「延长」的主力）
  const lastF = events.reduce((m, e) => Math.max(m, Number(e.split(",")[0])), 0);
  let f = lastF + 5;
  const target = parent.frames;
  while (f < target - 5) {
    const code = keys[Math.floor(r() * keys.length)]!;
    const hold = 1 + Math.floor(r() * 12);
    events.push(`${f},${code},1`);
    events.push(`${Math.min(f + hold, target - 1)},${code},0`);
    f += hold + 1 + Math.floor(r() * 10);
  }
  events.sort((a, b) => Number(a.split(",")[0]) - Number(b.split(",")[0]));
  return { frames: parent.frames, events };
}

/**
 * **已知 oracle 盲区**的**收紧**识别：game2 由 `substringWidth` 驱动的自动换行。
 *
 * 凭据（docs/jvm-oracle-保真审计.md 三类 + README「已知边界」）：
 *   shim 的 `Font.substringWidth` 返回 `len*6` —— **真机字模我们根本没有**，是编造的；
 *   而 game2 `a.java:961-975` 是一个**由 substringWidth 驱动的自动换行循环**
 *   （`a.java:967` 的 `n10 = n3 + graphics.getFont().substringWidth(...)` 直接参与坐标）。
 *   → oracle 编造的度量塞得下 16 字，port 的真实 12/13px 中文宽只塞得下 9 字 → 断点必不同。
 *   **该处 oracle 无权威性：它不能证明 port 错，port 也不能证明 oracle 错。** 这不是工程可解的，
 *   是真机字模缺失的固有限制。
 *
 * ⚠️ **为什么不把两侧度量对齐了事**：那等于让 oracle 抄 port 的字体实现 →
 *    差分就成了「用它自己验它自己」，对字体相关缺陷**永远盲**。宁可留着这个不可判定。
 *
 * ⚠️ **签名刻意收紧**（假阴性比假阳性危险得多）：必须**同帧 + 两侧都是 drawStr +
 *    一侧文本是另一侧的严格前缀**（＝同一源字符串的不同换行断点）。任何其它形态一律当**真 bug** 报，
 *    宁可我事后人工排除，也不让真缺陷从这条缝里溜走。
 *
 * ⚠️ **命中它的那一轮不算绿**：首个失配之后的 op 全部**未被判定**（换行错位会把整段对话都推歪），
 *    故单独计为「不可判定」，既不计绿也不计 bug —— 绝不能拿它冒充已验证。
 */
function isKnownFontBlindSpot(oracleOp: string | undefined, portOp: string | undefined): boolean {
  if (game !== 2 || !oracleOp || !portOp) return false;
  const re = /^(F\d+)\tdrawStr \[(.*)\] (.+)$/;
  const mo = oracleOp.match(re);
  const mp = portOp.match(re);
  if (!mo || !mp) return false;
  if (mo[1] !== mp[1]) return false; // 必须同帧
  const ot = mo[2]!, pt = mp[2]!;
  if (ot === pt) return false;
  return ot.startsWith(pt) || pt.startsWith(ot); // 同一源串的不同断点
}

/**
 * **已知 oracle 盲区 ②（2026-07-16 新发现，由本模糊器捞出）**：**两侧不共享时钟**。
 *
 * 这是**信任根自己的一个洞**，且它推翻了审计文档原先的断言「无需虚拟化时钟」。
 *
 * 真字节码裁决（`javap tjge.a`，game1）：
 *   · `<init>`：`5: ldc2_w // long 100l` → `8: putfield W:J`  —— 帧周期 **100ms**（独立取自原版，非抄 port）
 *   · `paint()` bci 1655：`this.D = System.currentTimeMillis()`            —— 关卡开始打点
 *   · `paint()` bci 3078：`this.D = System.currentTimeMillis() - this.D`   —— 算出耗时
 *   · `paint()` bci 2246/3202：`a(D)` → mm:ss 格式化（`1000l/60l/60l`）→ `drawString(s,36,105,20)`
 *   → **`System.currentTimeMillis()` 有 3 处在 `paint()` 内**（不只是 run() 线程里）。
 *     原断言「原版 run() 只做 sleep/gc/repaint 故无需虚拟化时钟」**把两件事混为一谈**：
 *     「逻辑都在 paint 内」为真，但**paint 自己会读墙钟、且该值直接驱动绘制** → 断言为假。
 *
 * 分歧成因：oracle harness **不虚拟化时钟**（按固定帧预算全速直调 paint，2127 帧只花 <1s 墙钟 → 显示 `0:00`）；
 * port 的 behavior-net harness **有假时钟**（每帧 +100ms → 1860 帧 = 186s → 显示 `3:06`）。
 * **真机 10FPS 跑 1860 帧就是 186s → port 才是对的，oracle 是错的**（算术闭合，实测吻合）。
 * 这是**两侧 harness 的差异，不是两侧实现的差异**。
 *
 * ⚠️ **豁免刻意收紧到「一条 op」**（假阴性比假阳性危险得多）：已用字节码证明该计时器
 * **只喂显示**——`D:J` 全部 7 处读写都在 `paint()` 内，两处读都直接进 mm:ss 格式化再 drawString，
 * **不参与玩法/计分/存档**。实测印证：整轮 130932 条 op **只差这 1 条**（seed=70080）。
 * 故只豁免**该条 op 本身**，其余照常判定 —— 不是把整轮放过。
 *
 * 签名：同帧 + 两侧都是 drawStr + **坐标完全相同** + 时间戳之前的文本**完全相同** + 仅 mm:ss 不同。
 *
 * 🔧 **可根治**（未做，见 docs）：给 oracle 打 javaagent 把 tjge 类里的
 * `invokestatic System.currentTimeMillis` 改写到一个每帧 +W(100/80ms) 的虚拟时钟。
 * 帧周期 W 独立取自原版字节码，**不是抄 port** → 不构成「用它自己验它自己」。
 */
const TIME_RE = /^(F\d+)\tdrawStr \[(.*?)(\d+:\d{2})\] (.+)$/;
function isKnownClockBlindSpot(oracleOp: string | undefined, portOp: string | undefined): boolean {
  if (!oracleOp || !portOp) return false;
  const mo = oracleOp.match(TIME_RE);
  const mp = portOp.match(TIME_RE);
  if (!mo || !mp) return false;
  return (
    mo[1] === mp[1] && // 同帧
    mo[2] === mp[2] && // 时间戳之前的文本完全相同
    mo[4] === mp[4] && // 坐标完全相同
    mo[3] !== mp[3] //    仅 mm:ss 不同
  );
}

interface OracleResult {
  ops: string;
  states: number[];
  rngDraws: number;
  totalOps: number;
}

function runOracle(scriptPath: string): OracleResult {
  const [w, h] = SCREEN[game];
  const raw = execFileSync(
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
  );
  const ops = raw.split("\n").filter((l) => l && !l.startsWith("[")).join("\n");
  // 覆盖度量取自 **oracle 侧**（信任根＝原版字节码的真实状态机），不是 port 的自我报告。
  const ms = raw.match(/statesSeen=\[([^\]]*)\]/);
  const states = ms?.[1]
    ? ms[1].split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n))
    : [];
  const mr = raw.match(/totalRngDraws=(\d+)/);
  const mo = raw.match(/totalDrawOps=(\d+)/);
  return { ops, states, rngDraws: mr ? Number(mr[1]) : 0, totalOps: mo ? Number(mo[1]) : 0 };
}

function runPort(scriptPath: string): string {
  return execFileSync(
    process.execPath,
    ["--experimental-transform-types", join(REPO, "packages/behavior-net/dump-ops.ts"), "--script", scriptPath, String(game)],
    { encoding: "utf8", maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "ignore"] },
  ).trimEnd();
}

console.log(`[fuzz] game${game} 轮数=${rounds} 起始种子=${seed0} 每轮${FRAMES}帧（状态覆盖引导）`);
console.log(`[fuzz] 判据：同一输入下两侧语义层 op 必须逐字节一致；任何分歧=真 bug`);
console.log(`[fuzz] 覆盖度量：oracle 侧 statesSeen（信任根＝原版字节码的真实状态机）\n`);

let green = 0;
let ran = 0;
const diverged: Array<{ seed: number; detail: string }> = [];
/** 撞上已知 oracle 盲区（字体度量）→ 该轮**不可判定**：既不算绿，也不算 bug。 */
const blind: Array<{ seed: number; detail: string }> = [];
/** 已豁免的时钟 op 总数 / 命中的 seed（逐 op 豁免，其余照常判定 → 该轮仍算绿）。 */
let clockExempt = 0;
const clockSeeds: number[] = [];
const globalStates = new Map<number, number>(); // 状态 → 首次达到它的 seed
const corpus: Array<{ script: Script; seed: number }> = [];

for (let i = 0; i < rounds; i++) {
  const s = seed0 + i;
  const r = mulberry32(s ^ 0x5eed);
  // 30% 从零生成（保持多样性、防语料库把搜索卡在一条沟里），否则在语料库亲本上变异
  const script = corpus.length === 0 || r() < 0.3 ? genFresh(s) : mutate(corpus[Math.floor(r() * corpus.length)]!.script, s);
  const sp = join(WORK, `s${s}.txt`);
  writeFileSync(sp, render(script, `seed=${s}`));

  let o: OracleResult, p: string;
  try {
    o = runOracle(sp);
    p = runPort(sp);
  } catch (e) {
    console.log(`  seed=${s}  ⚠️ 运行失败（非分歧，须单独查）：${(e as Error).message.split("\n")[0]}`);
    continue;
  }
  ran++;

  // 覆盖引导：达到了任何**此前没见过**的状态 → 该脚本进语料库，后续在其上继续深挖
  const fresh = o.states.filter((st) => !globalStates.has(st));
  if (fresh.length) {
    for (const st of fresh) globalStates.set(st, s);
    corpus.push({ script, seed: s });
  }
  const freshTag = fresh.length ? `  ⭐新状态 ${fresh.map((x) => `${x}=${STATE_NAMES[game][x] ?? "?"}`).join(",")}` : "";

  if (o.ops === p) {
    green++;
    process.stdout.write(`  seed=${s}  ✅ ${o.totalOps} op 一致  states=[${o.states.join(",")}]${freshTag}\n`);
    continue;
  }
  const ol = o.ops.split("\n");
  const pl = p.split("\n");

  // ① 时钟盲区：**逐 op 豁免**（已证其影响面就是那一条 drawString，见 isKnownClockBlindSpot 抬头）。
  //    只有当「所有不同的 op 全部命中该收紧签名」时才算绿，其余任何一条不同 → 照常当真 bug。
  if (ol.length === pl.length) {
    let clockOps = 0;
    let bad = -1;
    for (let i = 0; i < ol.length; i++) {
      if (ol[i] === pl[i]) continue;
      if (isKnownClockBlindSpot(ol[i], pl[i])) { clockOps++; continue; }
      bad = i;
      break;
    }
    if (bad === -1 && clockOps > 0) {
      green++;
      clockExempt += clockOps;
      clockSeeds.push(s);
      process.stdout.write(
        `  seed=${s}  ✅ ${o.totalOps} op 一致（已豁免 ${clockOps} 条时钟 op：两侧 harness 不共享时钟，见 README）  states=[${o.states.join(",")}]${freshTag}\n`,
      );
      continue;
    }
  }

  let k = 0;
  while (k < Math.min(ol.length, pl.length) && ol[k] === pl[k]) k++;
  const detail = `op 数 oracle=${ol.length} port=${pl.length}；首个失配 #${k}\n    < ${ol[k] ?? "(无)"}\n    > ${pl[k] ?? "(无)"}`;
  // ② 字体盲区：换行断点不同会把**其后整段**推歪 → 该轮**不可判定**（不算绿，也不算 bug）。
  if (isKnownFontBlindSpot(ol[k], pl[k])) {
    blind.push({ seed: s, detail });
    process.stdout.write(`  seed=${s}  🟡 不可判定（已知字体度量盲区，非 bug；此后 op 未被判定）  states=[${o.states.join(",")}]${freshTag}\n`);
    continue;
  }
  diverged.push({ seed: s, detail });
  process.stdout.write(`  seed=${s}  ❌ 分歧！${detail}${freshTag}\n`);
}

// ── 报告 ────────────────────────────────────────────────────────────────────
// **绿也必须报覆盖**：绿而没走到 = 没意义（见 docs/复盘-CFR不是权威.md）。
console.log(`\n[fuzz] === 结果 ===`);
console.log(`[fuzz] 实际跑完 ${ran}/${rounds} 轮：一致 ${green}，分歧 ${diverged.length}，不可判定 ${blind.length}`);
console.log(`[fuzz] 语料库（能达新状态的脚本）：${corpus.length} 条`);
if (clockExempt) {
  console.log(`\n[fuzz] ⏱  已豁免 ${clockExempt} 条**时钟 op**（命中 ${clockSeeds.length} 轮：${clockSeeds.join(", ")}）`);
  console.log(`[fuzz]    成因：**两侧 harness 不共享时钟**（oracle 无虚拟时钟、全速跑 → 显示 0:00；`);
  console.log(`[fuzz]    port 假时钟每帧+100ms → 显示真实耗时）。真机 10FPS 跑 N 帧就是 N*100ms → **port 对、oracle 错**。`);
  console.log(`[fuzz]    这是 harness 差异、不是实现差异；**且推翻了审计文档原先「无需虚拟化时钟」的断言**`);
  console.log(`[fuzz]    （javap 实证：System.currentTimeMillis 有 3 处在 paint() 内）。`);
  console.log(`[fuzz]    豁免收紧到「一条 op」：已证该计时器只喂显示（D:J 全部 7 处读写都在 paint 内、直接进 mm:ss→drawString，`);
  console.log(`[fuzz]    不参与玩法/计分/存档），实测整轮 130932 op 只差这 1 条。可根治：javaagent 虚拟时钟（未做）。`);
}
if (blind.length) {
  console.log(`\n[fuzz] 🟡 不可判定 ${blind.length} 轮 —— **已知 oracle 盲区**：game2 由 substringWidth 驱动的自动换行`);
  console.log(`[fuzz]    shim 的 Font 度量是编造的（len*6），真机字模我们没有 → 该处 oracle **无权威性**，`);
  console.log(`[fuzz]    不能证明 port 错、port 也不能证明 oracle 错（真机字模缺失的固有限制，非工程可解）。`);
  console.log(`[fuzz]    ⚠️ 这些轮**首个失配之后的 op 全部未被判定** —— 不算绿，别当已验证。`);
  console.log(`[fuzz]    seeds: ${blind.map((b) => b.seed).join(", ")}`);
}

const all = Object.keys(STATE_NAMES[game]).map(Number).sort((a, b) => a - b);
const reached = [...globalStates.keys()].sort((a, b) => a - b);
const missed = all.filter((st) => !globalStates.has(st));
console.log(`\n[fuzz] === 覆盖（本次实际达到的状态集合）===`);
console.log(`[fuzz] 达到 ${reached.length}/${all.length} 个已知状态：`);
for (const st of reached) {
  console.log(`  ✅ ${String(st).padStart(3)} ${(STATE_NAMES[game][st] ?? "?").padEnd(16)} 首次由 seed=${globalStates.get(st)} 达到`);
}
if (missed.length) {
  console.log(`[fuzz] **未达到** ${missed.length} 个（本次模糊没走到 → 这些路径本轮未被验证，别当已验）：`);
  for (const st of missed) console.log(`  ⬜ ${String(st).padStart(3)} ${STATE_NAMES[game][st] ?? "?"}`);
}
const unknown = reached.filter((st) => !(st in STATE_NAMES[game]));
if (unknown.length) console.log(`[fuzz] ⚠️ 达到了 STATE_NAMES 表里没有的状态：${unknown.join(",")}（表可能过时，去核 constants.ts）`);

if (diverged.length) {
  console.log(`\n[fuzz] 分歧用例（可原样复跑：脚本在 ${WORK}/s<seed>.txt）：`);
  for (const d of diverged) console.log(`  · seed=${d.seed}\n    ${d.detail}`);
  console.log(`\n[fuzz] ⚠️ 每个分歧都必须**定性到根因**（port 错 / CFR 错 / oracle 盲区 / 已知偏差），不许只报数字。`);
  console.log(`[fuzz]    已知 oracle 盲区：game2 a.java:967 由 substringWidth 驱动的自动换行（字体度量是编造的）。`);
  process.exit(1);
}
console.log(`\n[fuzz] ✅ 本轮未发现分歧（覆盖见上；**未达到的状态不算已验证**）`);
