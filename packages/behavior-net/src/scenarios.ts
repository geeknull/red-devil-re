// 首版最小闭环：每游戏一个无输入 boot（锁 Logo/菜单的确定行为）+ 一个脚本输入 play（锁 keyPressed/输入译码路径）。
// 输入脚本为尽力值：黄金录的是"实际发生的确定行为"，不要求脚本精确到达某状态。扩展见计划末"后续扩展"。
import type { Scenario } from "./scenario.ts";

export const SCENARIOS: Scenario[] = [
  { id: "game1-boot", game: 1, seed: 12345, frames: 90, inputs: [] },
  {
    id: "game1-play",
    game: 1,
    seed: 12345,
    frames: 180,
    inputs: [
      { frame: 30, code: 48, down: true }, { frame: 31, code: 48, down: false }, // 确定（h_I:48→bit16）
      { frame: 60, code: 48, down: true }, { frame: 61, code: 48, down: false },
      { frame: 90, code: 5, down: true }, { frame: 96, code: 5, down: false }, // 向右（h_I:5）
      { frame: 100, code: 48, down: true }, { frame: 101, code: 48, down: false }, // 开火
    ],
  },
  {
    // 真进第 1 关卡：确定选新游戏 → 简报/进场动画自动过 → PLAYING(state=10)@~199。
    // 关卡内 drawQueue 有 4×EnemyActor + 3×BossActor + EffectActor + PickupActor + PlayerActor，
    // 全部逐帧 update+draw → 覆盖 actor/敌人/Boss/物理模拟（历史静默崩溃区），进 drawHash。
    id: "game1-level",
    game: 1,
    seed: 12345,
    frames: 330,
    inputs: [
      { frame: 100, code: 48, down: true }, { frame: 101, code: 48, down: false }, // 确定：菜单→新游戏
      { frame: 210, code: 5, down: true }, // 进关后持续右移（覆盖 PlayerActor 输入/物理/碰撞/相机）
      { frame: 240, code: 48, down: true }, { frame: 241, code: 48, down: false }, // 开火（覆盖 ProjectileActor 池）
      { frame: 260, code: 5, down: false }, // 松开右
      { frame: 290, code: 48, down: true }, { frame: 291, code: 48, down: false }, // 再开火
    ],
  },
  { id: "game2-boot", game: 2, seed: 54321, frames: 90, inputs: [] },
  {
    id: "game2-play",
    game: 2,
    seed: 54321,
    frames: 180,
    inputs: [
      { frame: 30, code: 53, down: true }, { frame: 31, code: 53, down: false }, // 确定（d_I:53→bit16）
      { frame: 60, code: 53, down: true }, { frame: 61, code: 53, down: false },
      { frame: 90, code: 54, down: true }, { frame: 96, code: 54, down: false }, // 向右（d_I:54）
      { frame: 100, code: 53, down: true }, { frame: 101, code: 53, down: false }, // 开火
    ],
  },
  {
    // 真进第 1 关卡：确定选新游戏 → CutsceneIntro(20) → 跳过键(22)推进 → LevelIntroLoading(2) → InGame(10)@~133。
    // 关卡场景含 PlayerActor + EnemyActor + ItemActor + ProjectileActor，逐帧模拟 → 进 drawHash。
    // 进关后游戏自身脚本会在 ~166 帧插入 MissionBrief(22)，为真实确定行为。
    id: "game2-level",
    game: 2,
    seed: 54321,
    frames: 300,
    inputs: [
      { frame: 100, code: 53, down: true }, { frame: 101, code: 53, down: false }, // 确定：菜单→新游戏（进开场过场）
      { frame: 130, code: 22, down: true }, { frame: 131, code: 22, down: false }, // 跳过键：过场→进关
      { frame: 145, code: 54, down: true }, // 进关后右移
      { frame: 160, code: 53, down: true }, { frame: 161, code: 53, down: false }, // 开火
      { frame: 175, code: 54, down: false }, // 松开右
    ],
  },
];
