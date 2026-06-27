/**
 * 游戏2《红魔特种兵2-深海战舰》共享具名常量。
 *
 * 对反编译魔法数字的**等值重命名**——数值与 CFR 基准
 * （reverse/game2/2-decompiled-cfr/tjge/）逐一相等，仅替换表示形式，
 * 运行时行为位级不变。
 */

/**
 * 主 UI 状态机（对应 CFR 基准 `a.b` / TS `GameCanvas.uiState`）。
 * 权威表见 docs/game2-深海战舰/游戏状态机.md §1（`a.paint` 的 `switch(this.b)`）。
 * 注意：取值不连续（缺 0/5/7-9/11-15/17，是 tjge 引擎在游戏1 用过、游戏2 未复用的历史值）。
 */
export enum UiState {
  /** 标题画面 + 资源进度条加载 */
  LoadingProgress = 1,
  /** 关卡加载中（黑屏 + 载入中） */
  LevelIntroLoading = 2,
  /** 启动 Logo 序列 */
  Splash = 3,
  /** 主菜单 */
  MainMenu = 4,
  /** 帮助页 */
  Help = 6,
  /** 游戏进行中 */
  InGame = 10,
  /** 关卡完成结算页 */
  LevelClear = 16,
  /** 关卡失败菜单 */
  LevelFailed = 18,
  /** 关于页 */
  About = 19,
  /** 新游戏开场过场 */
  CutsceneIntro = 20,
  /** 通关画面 */
  GameComplete = 21,
  /** 关卡任务简报 */
  MissionBrief = 22,
  /** 「没有存档记录」提示 */
  NoSave = 100,
}

/**
 * 关卡场景子状态机（对应 CFR 基准 `j.w` / TS `LevelScene.subState`）。
 * 权威表见 docs/game2-深海战舰/游戏状态机.md §4。
 * ⚠️ 仅用于 `LevelScene.subState`（及外部对 `scene.subState` 的引用）；
 *    `GameCanvas.subState` 是另一回事（开场动画帧计数器），不属此枚举。
 */
export enum LevelSubState {
  /** 常规游玩（相机跟随玩家） */
  Normal = 0,
  /** 剧情演出（运镜 + 脚本生成） */
  Cutscene = 1,
  /** 屏幕切出（黑幕展开） */
  TransitionOut = 2,
  /** 屏幕切入（黑幕收起） */
  TransitionIn = 3,
  /** 任务 / 对话框（底部文字框逐字推进） */
  MissionDialog = 4,
  /** 触发战斗波（守点刷敌） */
  BattleWave = 5,
  /** Boss 关剧本 */
  BossScript = 6,
}

/**
 * 精灵帧整数的高位标志（与序列 id 按位或/与）。
 * 来源：reverse/game2/3-readable/SYMBOLS.md。
 */
/** 水平镜像（朝左）。= Integer.MIN_VALUE = 0x80000000（JS 按位运算下 = -2147483648）。 */
export const MIRROR_FLAG = -2147483648;
/** 垂直翻转。= 0x40000000。 */
export const FLIP_VERTICAL_BIT = 0x40000000;

/**
 * actor 生成类型 id（对应 CFR 基准 actor 的 `h` 字段 / TS `ActorBase.typeId`）。
 * 工厂 `GameCanvas.createActor(n)` 据此 new 子类，各 actor 内部又 `switch(typeId)` 分派行为。
 * 语义经"行为代码 + docs + 精灵画廊看图"考据；★ 标的为看图修正项。
 * 注：type 8 在工厂无 case（孤儿精灵），故不入枚举。
 */
export enum ActorType {
  /** 玩家主角 */
  Player = 0,
  /** 标准步兵（直射 type10） */
  RiflemanGrunt = 1,
  /** 载具炮手（绑定 BossActor 载具，由其驱动开火） */
  VehicleGunner = 2,
  /** 投掷型步兵（抛物弹） */
  GrenadierGrunt = 3,
  /** 守点/碾压敌 */
  SentryGrunt = 4,
  /** 固定炮台（发 type16 抛物炮弹） */
  TurretEmplacement = 5,
  /** ★白制服人物（军官/NPC，转身面向玩家；非路标） */
  NavalOfficerNpc = 6,
  /** 可拾取道具 */
  ItemPickup = 7,
  /** 抛投/追踪榴弹飞行体 */
  GuidedGrenade = 9,
  /** 直射弹（玩家步枪/敌人通用） */
  DirectBullet = 10,
  /** 移动机关炮（中型 Boss/机关，血10） */
  MobileGunEmplacement = 11,
  /** 爆炸/碎片特效（播完即销毁，期间造爆炸伤害） */
  ExplosionDebris = 12,
  /** 可破坏控制台/机关（耐久3） */
  DestructibleConsole = 13,
  /** 竖卷关漂浮残骸 */
  DriftingFlotsam = 14,
  /** 巡逻飞行小怪 */
  PatrolFlyer = 15,
  /** 敌方炮台抛物炮弹 */
  ArcCannonShell = 16,
  /** 巡逻发射器机关（沿轴往返，血3） */
  PatrolLauncher = 17,
  /** ★跟随玩家的附属特效（蓝色长条，具体形态待考） */
  PlayerAttachedEffect = 18,
  /** 关5 直升机 Boss（血200，多阶段） */
  HelicopterBoss = 19,
  /** 落水/爆炸短特效 */
  SplashEffect = 20,
  /** ★关6 终 Boss */
  FinalBoss = 21,
  /** 终 Boss 近身生成的抓取标记/演出实体 */
  GrappleMarker = 22,
}
