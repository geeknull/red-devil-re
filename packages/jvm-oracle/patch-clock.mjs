/**
 * 时钟虚拟化补丁 —— 修 oracle 自己的一个洞：**两侧不共享时钟**。
 *
 * 用法：node packages/jvm-oracle/patch-clock.mjs <原版classes目录> <输出目录>
 *
 * ## 为什么需要它（背景见 docs/jvm-oracle-保真审计.md 第四份产出）
 * `System.currentTimeMillis()` **有 3 处在 `tjge.a.paint()` 内**（game2 同构），且该值**直接驱动绘制**：
 *   paint() bci1655 `D=now()` → bci3078 `D=now()-D` → bci2246/3202 mm:ss → `drawString(s,36,105,20)`
 * oracle harness 无虚拟时钟、全速直调 paint（2127 帧只花 <1s 墙钟）→ 显示 `0:00`；
 * 真机 10FPS 跑 1860 帧 = 186s → 应显示 `3:06`。**是 oracle 错，不是 port 错。**
 *
 * ## 手法：只改常量池，**不碰任何一条字节码指令**
 * `invokestatic #M` 里的 M 是个 `Methodref(Class, NameAndType)`。本补丁：
 *   ① 在常量池**末尾追加** `Utf8("harness/VClock")` + `Class(→它)`（**追加不会移动既有索引**）
 *   ② 把 `Methodref(System, currentTimeMillis:()J)` 的 **class_index 两个字节**改指向新 Class
 * 于是每条 `invokestatic #M` 自动调到 `harness.VClock.currentTimeMillis()J`
 * ——**方法名与描述符一字未改**，故无需遍历指令流（不需要 opcode 长度表、不需要 ASM）。
 * `Class("java/lang/System")` 本身**不动** → `System.gc()` / `System.out` 等照常。
 *
 * ## ⚠️ 方法论代价（必须诚实标注）
 * oracle 的核心卖点是「**直跑原版未修改的字节码**」。本补丁**修改了字节码** →
 * 严格说信任根从「原版 .class」变成了「原版 .class + 本补丁」，**本补丁自己就成了一个「中间物」**
 * （判据见 docs/复盘-CFR不是权威.md §2.2：隔 ≥1 跳且中间物未验证 = 只能证「没变」不能证「对」）。
 * 故**本补丁必须被机器验证是最小的**：`--verify` 会用 `javap` 对拍补丁前后的反汇编，
 * **断言唯一差异就是 `java/lang/System.currentTimeMillis` → `harness/VClock.currentTimeMillis`**，
 * 任何其它差异一律 exit 1。别信「我写得很小心」——去测。
 *
 * ## 为什么这不是「用它自己验它自己」
 * 虚拟时钟的步长 W 是**独立取自原版字节码**的，不是抄 port：
 *   game1 `tjge.a.<init>`：`ldc2_w long 100l → putfield W:J`  → 100ms
 *   game2 `tjge.a.run()` ：`ldc2_w long 80l` 紧邻 `Thread.sleep` → 80ms
 *
 * ## RNG 安全性（已核实，非假设）
 * 两游戏**构造函数**里都有 `c.setSeed(System.currentTimeMillis())`，本补丁会让它变成 `setSeed(0)`。
 * **无影响**：harness 在 `newInstance()` 之后、`startApp()` 之前把 `GameMIDlet.c` 整体替换为固定种子的
 * LoggingRandom（见 OracleRun）→ 构造函数里那个 Random 当场被丢弃。
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { execFileSync } from "node:child_process";

const TARGET_CLASS = "java/lang/System";
const TARGET_NAME = "currentTimeMillis";
const TARGET_DESC = "()J";
const NEW_CLASS = "harness/VClock";

/** 解析常量池，返回每条目的 {tag, offset(条目起始，含tag), ...}。索引从 1 起。 */
function parseConstantPool(buf) {
  const count = buf.readUInt16BE(8);
  const entries = new Array(count); // entries[i] 对应常量池索引 i
  let p = 10;
  for (let i = 1; i < count; i++) {
    const tag = buf[p];
    const e = { tag, offset: p };
    switch (tag) {
      case 1: { // Utf8
        const len = buf.readUInt16BE(p + 1);
        e.text = buf.toString("utf8", p + 3, p + 3 + len);
        p += 3 + len;
        break;
      }
      case 7: case 8: case 16: case 19: case 20: // Class/String/MethodType/Module/Package
        e.nameIndex = buf.readUInt16BE(p + 1);
        p += 3;
        break;
      case 15: // MethodHandle
        p += 4;
        break;
      case 3: case 4: // Integer/Float
        p += 5;
        break;
      case 5: case 6: // Long/Double —— **占两个槽**（经典坑）
        p += 9;
        entries[i] = e;
        i++; // 跳过下一个槽
        continue;
      case 9: case 10: case 11: // Fieldref/Methodref/InterfaceMethodref
        e.classIndex = buf.readUInt16BE(p + 1);
        e.natIndex = buf.readUInt16BE(p + 3);
        e.classIndexOffset = p + 1; // ← 要改的就是这两个字节
        p += 5;
        break;
      case 12: // NameAndType
        e.nameIndex = buf.readUInt16BE(p + 1);
        e.descIndex = buf.readUInt16BE(p + 3);
        p += 5;
        break;
      case 17: case 18: // Dynamic/InvokeDynamic
        p += 5;
        break;
      default:
        throw new Error(`未知常量池 tag=${tag} @${p}（索引 ${i}）`);
    }
    entries[i] = e;
  }
  return { count, entries, endOffset: p };
}

/** 给单个 .class 打补丁；返回 {patched:Buffer|null, hits:number}。hits=0 表示该类不调时钟，原样返回。 */
function patchClass(buf) {
  const { count, entries, endOffset } = parseConstantPool(buf);
  const utf8 = (i) => (entries[i]?.tag === 1 ? entries[i].text : null);

  // 找 Methodref(Class"java/lang/System", NameAndType"currentTimeMillis":"()J")
  const targets = [];
  for (let i = 1; i < count; i++) {
    const e = entries[i];
    if (!e || e.tag !== 10) continue;
    const cls = entries[e.classIndex];
    const nat = entries[e.natIndex];
    if (!cls || cls.tag !== 7 || !nat || nat.tag !== 12) continue;
    if (utf8(cls.nameIndex) !== TARGET_CLASS) continue;
    if (utf8(nat.nameIndex) !== TARGET_NAME || utf8(nat.descIndex) !== TARGET_DESC) continue;
    targets.push(e);
  }
  if (targets.length === 0) return { patched: null, hits: 0 };

  // 追加 Utf8("harness/VClock") + Class(→它)。追加在常量池末尾 → **既有索引全部不变**。
  const nameBytes = Buffer.from(NEW_CLASS, "utf8");
  const utf8Entry = Buffer.alloc(3 + nameBytes.length);
  utf8Entry[0] = 1;
  utf8Entry.writeUInt16BE(nameBytes.length, 1);
  nameBytes.copy(utf8Entry, 3);
  const newUtf8Index = count;      // 追加后的第一个新索引
  const newClassIndex = count + 1;
  const classEntry = Buffer.alloc(3);
  classEntry[0] = 7;
  classEntry.writeUInt16BE(newUtf8Index, 1);

  const out = Buffer.concat([
    buf.subarray(0, endOffset),        // 头 + 原常量池
    utf8Entry,
    classEntry,
    buf.subarray(endOffset),           // access_flags 及其后全部
  ]);
  out.writeUInt16BE(count + 2, 8);     // constant_pool_count += 2
  // 把每个命中 Methodref 的 class_index 改指向新 Class（偏移在常量池内，未被移动）
  for (const t of targets) out.writeUInt16BE(newClassIndex, t.classIndexOffset);
  return { patched: out, hits: targets.length };
}

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith(".class")) out.push(p);
  }
  return out;
}

const [srcDir, dstDir, ...rest] = process.argv.slice(2);
if (!srcDir || !dstDir) {
  console.error("用法: node patch-clock.mjs <原版classes目录> <输出目录> [--verify]");
  process.exit(2);
}
const doVerify = rest.includes("--verify");

let totalHits = 0;
const patchedFiles = [];
for (const f of walk(srcDir)) {
  const rel = relative(srcDir, f);
  const { patched, hits } = patchClass(readFileSync(f));
  if (hits === 0) continue;
  const dst = join(dstDir, rel);
  mkdirSync(dirname(dst), { recursive: true });
  writeFileSync(dst, patched);
  patchedFiles.push({ rel, hits, src: f, dst });
  totalHits += hits;
}
console.log(`[patch-clock] 打补丁 ${patchedFiles.length} 个类、共重定向 ${totalHits} 处 currentTimeMillis Methodref`);
for (const p of patchedFiles) console.log(`  · ${p.rel}  (${p.hits} 处)`);
if (totalHits === 0) {
  console.error(`[patch-clock] ⛔ 一处都没打中 —— 补丁没生效却「成功」了，这正是最危险的静默失败。`);
  process.exit(1);
}

// ── 机器验证补丁是最小的（别信「我写得很小心」）──────────────────────────────
// 用 javap 对拍补丁前后的反汇编：唯一允许的差异 = System.currentTimeMillis → VClock.currentTimeMillis。
if (doVerify) {
  let bad = 0;
  for (const p of patchedFiles) {
    const cn = p.rel.replace(/\.class$/, "").replace(/[/\\]/g, ".");
    const dis = (cp) => execFileSync("javap", ["-c", "-p", "-cp", cp, cn], { encoding: "utf8", maxBuffer: 1 << 28 });
    const before = dis(srcDir).split("\n");
    const after = dis(dstDir).split("\n");
    if (before.length !== after.length) {
      console.error(`[patch-clock] ⛔ ${cn}: 反汇编行数变了（${before.length} → ${after.length}）—— 补丁不是最小的`);
      bad++;
      continue;
    }
    for (let i = 0; i < before.length; i++) {
      if (before[i] === after[i]) continue;
      const okBefore = before[i].includes(`java/lang/System.${TARGET_NAME}:${TARGET_DESC}`);
      const okAfter = after[i].includes(`harness/VClock.${TARGET_NAME}:${TARGET_DESC}`);
      if (okBefore && okAfter) continue;
      console.error(`[patch-clock] ⛔ ${cn}: 出现**非预期**差异 —— 补丁不是最小的\n    < ${before[i]}\n    > ${after[i]}`);
      bad++;
    }
  }
  if (bad) {
    console.error(`[patch-clock] ⛔ 最小性验证失败（${bad} 处）→ 拒绝出结论`);
    process.exit(1);
  }
  console.log(`[patch-clock] ✅ 最小性已机器验证：反汇编逐行对拍，唯一差异就是`);
  console.log(`             java/lang/System.currentTimeMillis:()J → harness/VClock.currentTimeMillis:()J`);
}
