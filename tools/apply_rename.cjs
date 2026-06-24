// 用 ts-morph 把 TS port 的混淆名机械重命名为友好名（确定性，作用域安全，只动标识符）
//   用法: node tools/apply_rename.cjs <game1|game2>
//   - 基类(g/h)先处理：方法/字段重命名经 TS 语言服务自动传播到所有子类 override + 全部引用点
//   - 按"当前 AST 名"查找：override 被基类重命名后，子类按旧名找不到→跳过（防双改/冲突）
const path = require("path");
const { Project } = require("ts-morph");
const ROOT = path.resolve(__dirname, "..");

const game = process.argv[2];
if (!["game1", "game2"].includes(game)) { console.error("用法: node apply_rename.cjs <game1|game2>"); process.exit(1); }

const map = require(`${ROOT}/tools/rename-map.${game}.json`).classes;
const BASE = { game1: "g", game2: "h" }[game];
const order = [BASE, ...Object.keys(map).filter((c) => c !== BASE)];

const project = new Project({ tsConfigFilePath: `${ROOT}/packages/web/tsconfig.json` });

const stat = { cls: 0, methods: 0, fields: 0, skip: 0, err: [] };

// 在类里按当前名找成员（方法/字段，含静态），返回可 rename 的节点
function findMember(classDecl, name) {
  for (const m of classDecl.getMembers()) {
    if (typeof m.getName === "function") {
      try { if (m.getName() === name) return m; } catch (_) {}
    }
  }
  return null;
}
function tryRename(node, newName, label) {
  if (!node) { stat.skip++; return; }
  try {
    if (node.getName() === newName) return; // 已是目标名
    node.rename(newName);
    return true;
  } catch (e) {
    stat.err.push(`${label}: ${String(e).slice(0, 80)}`);
  }
}

for (const cls of order) {
  const file = project.getSourceFile(`${ROOT}/packages/${game}/src/${cls}.ts`);
  if (!file) { stat.err.push(`无源文件 ${cls}.ts`); continue; }
  const classDecl = file.getClass(cls);
  if (!classDecl) { stat.err.push(`无类声明 ${cls}`); continue; }
  const e = map[cls];

  // 方法
  for (const [oldN, newN] of Object.entries(e.methods)) {
    if (tryRename(findMember(classDecl, oldN), newN, `${cls}.method ${oldN}`)) stat.methods++;
  }
  // 字段
  for (const [oldN, newN] of Object.entries(e.fields)) {
    if (tryRename(findMember(classDecl, oldN), newN, `${cls}.field ${oldN}`)) stat.fields++;
  }
  // 类名最后改（前面都用旧类名 getSourceFile/getClass 定位）
  if (e.className && e.className !== cls) {
    if (tryRename(classDecl, e.className, `class ${cls}`)) stat.cls++;
  }
}

project.saveSync();

console.log(`=== ${game} 重命名完成 ===`);
console.log(`  类名: ${stat.cls} | 方法: ${stat.methods} | 字段: ${stat.fields} | 跳过(已改/未找到): ${stat.skip}`);
if (stat.err.length) { console.log(`  ⚠️ 错误 ${stat.err.length} 处:`); stat.err.slice(0, 20).forEach((x) => console.log("    " + x)); }
else console.log("  ✅ 零错误");
