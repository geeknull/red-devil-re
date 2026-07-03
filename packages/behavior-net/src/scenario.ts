/** 一次脚本化按键（在指定帧号前注入）。 */
export interface KeyInput {
  frame: number;
  code: number; // J2ME 键码（game1: 1/6/2/5/48…；game2: 50/56/52/54/53…）
  down: boolean;
}

/** 一个可复现场景：固定种子 + 帧数 + 输入脚本。 */
export interface Scenario {
  id: string;
  game: 1 | 2;
  seed: number;
  frames: number;
  inputs: KeyInput[];
}
