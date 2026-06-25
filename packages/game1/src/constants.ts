/**
 * 游戏1《红魔特种兵》共享具名常量。
 *
 * 这些常量是对反编译魔法数字的**等值重命名**——数值与 CFR 基准
 * （reverse/game1/2-decompiled-cfr/tjge/）逐一相等，仅替换表示形式，
 * 运行时行为位级不变。语义来源见各常量注释。
 */

/**
 * 主状态机状态值（对应 CFR 基准的 `a.p` / TS `GameScreen.state`）。
 * 权威表见 docs/game1-红魔特种兵/游戏状态机.md §1（CFR `a.paint` 的 `switch(this.p)`）。
 */
export enum GameState {
  /** 开机 Logo 序列（构造后初始状态） */
  Logo = 1,
  /** 主菜单 */
  MainMenu = 4,
  /** 关卡加载中 */
  LevelLoading = 2,
  /** 关卡前剧情简报过场 */
  MissionBriefing = 22,
  /** 关卡卷动过场（关卡 2 / 7） */
  LevelScroll = 21,
  /** 关卡入场动画 */
  LevelEnter = 14,
  /** 关卡内·游戏进行中（主玩法） */
  Playing = 10,
  /** 任务失败结算 */
  MissionFailed = 18,
  /** 片尾「剧终」 */
  Ending = 15,
  /** 任务完成结算 */
  MissionComplete = 16,
  /** 通关 / 到达终点过场 */
  GoalCutscene = 19,
  /** 暂停 / 游戏内菜单 */
  Paused = 13,
  /** 关于 */
  About = 3,
  /** 帮助 */
  Help = 6,
  /** 剧情 / 被捕过场 */
  CaptureCutscene = 20,
}

/**
 * 精灵帧整数的高位标志（与序列 id 按位或/与）。
 * 来源：reverse/game1/3-readable/SYMBOLS.md:513-514、SpriteAtlas.flipHorizontalBit/flipVerticalBit。
 */
/** 水平镜像（朝左）。= Integer.MIN_VALUE = 0x80000000（JS 中按位运算下等于 -2147483648）。 */
export const MIRROR_FLAG = -2147483648;
/** 垂直翻转。= 0x40000000。 */
export const FLIP_VERTICAL_BIT = 0x40000000;
