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
];
