// 构建 TS port 的"混淆名 → 友好名"重命名映射表（确定性，来自已验证数据）
//   类名:   glossary.classNames        （b → TileMap）
//   方法名: porting-contract(ts↔orig+desc) ⋈ glossary(orig=名+描述符 ↔ friendly)
//   字段名: glossary.fields            （TS 字段名 = 单字母 orig → friendly）
// 输出: tools/rename-map.<game>.json  + 覆盖率/gap/冲突 报告
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function sanitize(name) {
  // 友好名须是合法 TS 标识符；非法则返回 null（留原名）
  if (typeof name !== "string") return null;
  let s = name.trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s)) return null;
  // TS/JS 关键字保护
  const KW = new Set(["class","function","return","new","this","super","const","let","var","if","else","for","while","switch","case","break","default","void","null","true","false","static","public","private","import","export","extends","number","string","boolean","any"]);
  if (KW.has(s)) return null;
  return s;
}

// Java 参数列表 → JVM 参数描述符。 "int, byte[], tjge.l" → "(I[BLtjge/l;)"
function paramsJvm(inside) {
  const s = inside.trim();
  if (!s) return "()";
  const prim = { int: "I", long: "J", boolean: "Z", byte: "B", char: "C", short: "S", float: "F", double: "D", void: "V" };
  const obj = { Graphics: "javax/microedition/lcdui/Graphics", Image: "javax/microedition/lcdui/Image", String: "java/lang/String" };
  const one = (t) => {
    t = t.trim().replace(/\s+[A-Za-z_$][\w$]*$/, ""); // 去掉可能的参数名
    let arr = "";
    while (t.endsWith("[]")) { arr += "["; t = t.slice(0, -2).trim(); }
    if (prim[t]) return arr + prim[t];
    return arr + "L" + (obj[t] || t.replace(/\./g, "/")) + ";";
  };
  return "(" + s.split(",").map(one).join("") + ")";
}
// 归一化方法为 "名|(参数描述符)"，兼容三种 AI 记录格式（忽略返回类型——Java 不许仅返回类型重载）
//   标准: orig=名, sig=JVM描述符 "(II)V"
//   异类b: orig="名(JVM描述符)返回" "a(II)V"
//   game1 g: orig="名(Java参数)" "a(int, tjge.l)"
function glKey(m) {
  const o = m.orig || "";
  const i = o.indexOf("(");
  if (i >= 0) {
    const name = o.slice(0, i);
    const inside = o.slice(i + 1, o.lastIndexOf(")"));
    const isJava = /[,.\s]/.test(inside) || /\b(int|long|boolean|byte|char|short|float|double|void)\b/.test(inside) || inside.includes("[]");
    return name + "|" + (isJava ? paramsJvm(inside) : "(" + inside + ")");
  }
  if (typeof m.sig === "string" && m.sig.startsWith("(")) return o + "|" + m.sig.slice(0, m.sig.indexOf(")") + 1);
  return o + "|(?)";
}
const pcKey = (m) => m.orig + "|" + m.desc.slice(0, m.desc.indexOf(")") + 1);

for (const game of ["game1", "game2"]) {
  const pc = JSON.parse(fs.readFileSync(`${ROOT}/reverse/${game}/porting-naming/porting-contract.json`, "utf8"));
  const gl = JSON.parse(fs.readFileSync(`${ROOT}/reverse/${game}/3-readable/glossary.json`, "utf8"));

  const map = { classes: {} };
  const stat = { classes: 0, methods: 0, fields: 0, mGap: 0, fGap: 0, collisions: [] };

  for (const cls of Object.keys(pc)) {
    const friendlyClass = sanitize(gl.classNames?.[cls]);
    const glMethods = new Map((gl.classes?.[cls]?.methods || []).map((m) => [glKey(m), m.friendly])); // key = 名|描述符
    const glFields = new Map((gl.classes?.[cls]?.fields || []).map((f) => [f.orig, f.friendly]));

    const entry = { className: friendlyClass, methods: {}, fields: {} };
    const usedFriendly = new Set(); // 同类内防撞

    if (friendlyClass) stat.classes++;

    // 方法: pc.ts → friendly
    for (const m of pc[cls].methods || []) {
      if (m.ts === "constructor") continue; // 构造不改
      // 框架方法保持原名（paint/run/keyPressed…）——porting-contract 已让它们 ts=原名
      const key = pcKey(m);
      const fr = sanitize(glMethods.get(key));
      if (!fr) { stat.mGap++; continue; }
      if (usedFriendly.has("m:" + fr)) { stat.collisions.push(`${game} ${cls}.method ${m.ts}→${fr}(撞名)`); continue; }
      usedFriendly.add("m:" + fr);
      entry.methods[m.ts] = fr;
      stat.methods++;
    }
    // 字段: TS 字段名(=orig 单字母) → friendly
    for (const f of gl.classes?.[cls]?.fields || []) {
      const fr = sanitize(f.friendly);
      if (!fr) { stat.fGap++; continue; }
      if (usedFriendly.has("f:" + fr)) { stat.collisions.push(`${game} ${cls}.field ${f.orig}→${fr}(撞名)`); continue; }
      usedFriendly.add("f:" + fr);
      entry.fields[f.orig] = fr;
      stat.fields++;
    }
    map.classes[cls] = entry;
  }

  // 手工消歧：AI glossary 里给不同成员起了同名的，按真实含义改精确名
  const MANUAL = { game2: { h: { fields: { K: "collisionTypeMask" } } } }[game] || {};
  for (const cls in MANUAL) {
    for (const kind in MANUAL[cls]) for (const orig in MANUAL[cls][kind]) {
      if (map.classes[cls]?.[kind]?.[orig] !== undefined) map.classes[cls][kind][orig] = MANUAL[cls][kind][orig];
    }
  }

  // 继承解析：被 override 的方法/字段，子类一律采用基类友好名（TS override 须与基类同名）
  const INH = { game1: { base: "g", subs: ["c", "e", "f", "h", "k", "l"] }, game2: { base: "h", subs: ["c", "e", "f", "g", "k"] } }[game];
  let resolved = 0;
  if (INH && map.classes[INH.base]) {
    const bM = map.classes[INH.base].methods, bF = map.classes[INH.base].fields;
    for (const sub of INH.subs) {
      const e = map.classes[sub]; if (!e) continue;
      for (const ts of Object.keys(e.methods)) if (bM[ts] && bM[ts] !== e.methods[ts]) { e.methods[ts] = bM[ts]; resolved++; }
      for (const ts of Object.keys(e.fields)) if (bF[ts] && bF[ts] !== e.fields[ts]) { e.fields[ts] = bF[ts]; resolved++; }
    }
  }
  stat.resolved = resolved;

  fs.writeFileSync(`${ROOT}/tools/rename-map.${game}.json`, JSON.stringify(map, null, 2));
  console.log(`=== ${game} ===`);
  console.log(`  类名映射: ${stat.classes} | 方法: ${stat.methods}(gap ${stat.mGap}) | 字段: ${stat.fields}(gap ${stat.fGap})`);
  console.log(`  同类撞名(跳过): ${stat.collisions.length} | 继承统一为基类名: ${stat.resolved} 处`);
}
