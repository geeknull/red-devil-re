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

## 绘制身份 = 内容哈希（不是分配序号）
离屏画布（位图字形、瓦片缓冲、game1 换色精灵 createRGBImage）blit 到主 ctx 时，
按**写入其中的 op 序列 + 尺寸的哈希**标识来源（`recording-context.ts` 的 `imgId`），
而非分配计数器。`putImageData` 也哈希像素字节。两条共同保证：
- **内容变→身份变**（防误绿）：瓦片/字形/换色像素错误可见。
- **分配顺序/对象缓存复用→身份不变**（防误红）：行为中性的优化（缓存图对象、改分配顺序）不触发假红。

## 变异自检（已验证）
- 变异 game1 `menuTexts[0]` **等长**改字（"新游戏"→"开始吧"，布局/op 数不变，仅字形内容变）→ 两个 game1 场景在帧 42 变红；还原 → 变绿。
- **等长**这点关键：证明网抓的是**内容**而非仅 op 数量（旧的"分配序号进哈希"方案下等长改动会误绿）。game2 不受影响，血缘边界正确。

## 覆盖与已知缺口
6 个场景，绘制调用日志哈希 + 状态字段双快照：
- **菜单层**：`game1/game2-boot`（无输入，锁 Logo/菜单）+ `game1/game2-play`（脚本输入，锁 keyPressed/输入译码）。
- **✅ actor 层（关卡内）**：`game1-level`（进 PLAYING，drawQueue 有 4×EnemyActor+3×BossActor+EffectActor+PickupActor+PlayerActor 逐帧模拟）+ `game2-level`（进 InGame，场景含 PlayerActor+EnemyActor+ItemActor+ProjectileActor）。**敌人/Boss/投射物/物理更新——历史上"语义化改名致敌人静默消失"的那类代码——现在被 drawHash 观测。**
  - **actor 变异自检（已验证）**：给两游戏 `ActorBase` 物理（`posX += velX`）各加 1px/帧位移 → **仅 `game1-level`（帧221）+ `game2-level`（帧134）变红**，菜单层四场景保持绿 → 证明 level 场景真观测 actor 模拟、且菜单场景对 actor 变化不敏感（正是需要 level 场景的原因）；还原 → 全绿。

**已知缺口/后续**：
- **持久瓦片缓冲的内容哈希**：`TileMap` 的静态离屏缓冲跨帧累积 op，其内容哈希逐帧变（确定、能抓内容变化，但对"瓦片重绘次数/顺序"的行为中性改动仍可能误红）——若后续 level 场景要长时间停在关卡内滚动，需评估给离屏缓冲加"清屏即重置 op"的机制。当前 level 场景关卡内帧数适中，未触发问题。
- **game2 进关后 ~166 帧游戏自身脚本会切到 MissionBrief(22)**（真实确定行为，golden 已锁）；如需更长的纯 InGame actor 模拟窗口，后续可调输入避开该转移。
- 其它后续：结算页（过关/死亡）场景、game2 换色帧真渲染路径、fall-through/死代码守卫高危路径的定向输入脚本。
