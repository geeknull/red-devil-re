# recorder —— 通关脚本录制器（生成 jvm-oracle 通关夹具）

把「打通一关」变成**可从源码重生的确定性输入脚本**，供 `packages/jvm-oracle` 与原版字节码逐帧对拍。

## 为什么要它

`jvm-oracle/regress/*.txt` 里的**通关夹具**（如 `game1-beat-level3.txt`：打穿 boss→结算/通关屏）
此前是**不可复现的 blob**——唯一出处是一次性 scratch 控制器，删了就没人能独立重生它来核验。
这和本仓「信任根/可复核、别信标签去测」的精神抵触（见 `docs/复盘-CFR不是权威.md`）。

本模块把「策略 → 脚本」变成一等制品：策略（policy）是**读游戏内部状态逐帧决策的函数**，
录制器跑真物理 sim、录下键位、产出脚本。任何人可 `cli.ts <scenario>` 重生同一份脚本。

## 用法

```bash
# 列出场景
node --experimental-transform-types packages/behavior-net/recorder/cli.ts --list
# 重生某夹具（含独立重放自检；自检失败拒绝出脚本）
node --experimental-transform-types packages/behavior-net/recorder/cli.ts game1-beat-level3 \
  --out packages/jvm-oracle/regress/game1-beat-level3.txt
# 最终绝对闸门（逐 op 对拍 + 覆盖断言）：
packages/jvm-oracle/diff.sh --script packages/jvm-oracle/regress/game1-beat-level3.txt 1
```

## 三层验证（缺一不可）

1. **录制阶段**自检必达状态（policy 真走到了 goal/结算）。
2. **独立重放自检**（`replay-states.ts`，**子进程 + 真 behavior-net 适配器**，与 oracle:diff 同一条 port 驱动）：
   刻意不复用录制器的自写 sim → 最大独立性。专抓「录出的脚本漏帧/不可复现」。
   > 教训来源：曾出现「控制器内部 `reached19=true` 但录出的脚本独立重放却 died」——因**漏录了导航宏 keyframe**。
   > **「控制器声称到达」≠「脚本可复现」**，必须独立重放裁决。本自检把它制度化。
3. **oracle:diff**（绝对闸门）：脚本同时驱动原版字节码与 port，逐 op 对拍 + `coverage/*.cover` 覆盖断言。

## 加新场景

在 `policies.ts` 的 `SCENARIOS` 加一条：`{game, saveCsv(跳关存档), seed, frames, fixed(入关+导航 keyframe),
policyStart, policy(读内部状态→keyCode), expectStates(自检必达)}`。策略读什么内部字段由该关机制决定
（game1 读 `screen.state/player/scriptFlagL/boss`；game2 读 `canvas.uiState/player/scene`）。

## 已注册

- **game1-beat-level3**：关卡3 通关。导航宏（beam 搜出）送到 boss 竞技场；反应式 boss policy＝
  静止窗口开火(weapon0 换弹免费=无限弹)、蹲伏躲导弹、每波结算 boss 左冲刺时 leapleft 腾空躲、
  20 击穿→爬梯→RescueNpc→GoalCutscene(19)→MissionComplete(16)。
- **game2-fail-level2**：关卡2 LevelFailed(18)。Continue 跳关卡2 → 过开场简报 → 走右撞敌交叉火力致死
  → showResult(false) → LevelFailed 结算屏（含时钟驱动耗时 00:20）。覆盖此前从未对拍的 game2 结算渲染。
  选关卡2＝其开场走 enterBriefing（非 MissionDialog），避开 drawWrappedLines 按宽度换行的字体度量盲区。

## game2 单进程静态重置（`resetGame2Statics`，已兑现旧 TODO）

game2 曾**不做**静态重置（依赖新进程原生初始化），单进程批量重放不可行。`record.ts` 现导出
`resetGame2Statics()`：把每个**有状态的**静态量重置回**类静态初始化块的原值**，使单进程内第 2、3…
次 `new GameMIDlet` 与全新进程**逐字节一致**——单进程网格/搜索从此可行。踩过的坑：`ammoReserve`
静态块置 `[99,6,3]`、`throwCooldownQueue` 置 4×`Int32Array(3)`，多清少清都偏离 fresh。
`reset-game2.verify.ts` 把「对拍 fresh-process 标定」制度化（证不重置→污染、重置→复现 fresh），
已并入 `pnpm verify`。⚠️ 仅按 Continue 入关（关卡1-6）验证过；关卡0（跳伞开场）未单独验证。
