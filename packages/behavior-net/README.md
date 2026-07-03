# 行为测试网

结构重构前的位级行为回归网。设计见 `docs/superpowers/specs/2026-07-03-行为测试网-design.md`。

## 用法
- `pnpm test:behavior` — 逐场景独立子进程跑，对比 `golden/*.json`。
- `pnpm bless:behavior` — 重录黄金（仅在确认当前行为即新基准时）。
- 失配时 dump 完整实际结果（含绘制 ops）到 `golden/<id>.actual.json`（已 gitignore）。

## 工作流（重构时）
1. 改结构前：`pnpm test:behavior` 确认全绿（当前行为已锁）。
2. 改结构。
3. 改后：`pnpm test:behavior`。全绿=位级行为不变；变红=看失配帧的 state diff 与 actual ops 定位。
4. 若行为**有意**改变（罕见），复核无误后 `pnpm bless:behavior` 重录并在 commit 说明。

## 变异自检（已验证）
临时把 game1 `menuTexts[0]` 改字 → 网变红；还原 → 变绿。证明网观测真实行为，非恒绿。

## 覆盖（首版最小闭环）
game1/game2 各 boot(无输入) + play(脚本输入)。绘制调用日志哈希 + 状态字段双快照。
后续扩展：菜单→关卡→结算的脚本化输入、game2 换色帧渲染路径、fall-through/死代码守卫高危路径。
