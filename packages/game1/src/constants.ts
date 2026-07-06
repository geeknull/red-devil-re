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
/** 帧整数低 24 位 = 序列 / 动作 id（剥掉翻转/朝向高位后得逻辑帧）。 */
export const SEQUENCE_MASK = 0xffffff;
/** 帧整数高字节 = 朝向 / 色调位。 */
export const FACING_MASK = 0xff000000;

/**
 * 定点像素 helper：`px(n) = n << 10`，即 n 像素的定点表示
 * （原版坐标/速度/距离均以 1px = 1024 的定点数表示）。
 * 仅用于把"本就是 N×1024 的定点字面量"显形为 `px(N)`，运行时同值（`px(8) === 8192`）。
 */
export const px = (n: number): number => n << 10;

/**
 * actor 生成类型 id（对应 CFR 基准 actor 的 `q` 字段 / TS `ActorBase.typeId`）。
 * 工厂 `GameScreen.createActor(n)` 据此 new 子类，各 actor 内部又 `switch(typeId)` 分派行为。
 * 语义经"行为代码 + docs + 精灵画廊看图"考据；★ 标的为看图修正项。
 */
export enum ActorType {
  /** 玩家主角 */
  Player = 0,
  /** 侦察兵：远程兵，发 type21 制导弹 */
  ReconScoutEnemy = 1,
  /** 轰炸/近战兵：发 type20 近战判定/投弹 */
  MeleeBomberEnemy = 2,
  /** 武器/弹药/手雷补给箱 */
  AmmoSupplyPickup = 3,
  /** ★白大褂人物：抵达即触发通关过场（救援/目标 NPC） */
  RescueTargetNpc = 4,
  /** 关键目标感应器：打爆触发被捕过场 */
  CaptureTrigger = 5,
  /** ★白伞：飞行敌的伴随拖尾 */
  ParachuteTrailEffect = 6,
  /** ★绿油桶：耐久3 可破坏物，毁时生成 type16 爆炸 */
  ExplosiveBarrel = 7,
  /** ★越野车 Boss（关3/6 多阶段；关4 为载具随从） */
  AtvVehicleBoss = 8,
  /** 高耐久(9)可再生破坏物 */
  RegeneratingBarrier = 9,
  /** 玩家武器1弹：直射可弹道 */
  PlayerBounceShot = 10,
  /** 血包（医疗箱） */
  HealthPickup = 11,
  /** 受 flagE 门控的触发器 */
  GatedTrigger = 12,
  /** 关卡门 / 出口 */
  LevelExitGate = 13,
  /** 一次性脚本点火触发器 */
  ScriptedFuseTrigger = 14,
  /** 榴弹飞行体（spawnProjectile） */
  GrenadeProjectile = 15,
  /** 爆炸特效 */
  ExplosionEffect = 16,
  /** 俯冲/突进危险物 */
  DivingHazard = 17,
  /** 关4/7 卷轴追逼大型敌（走 scrollChaserUpdate，仍属 EnemyActor，非真 Boss） */
  ScrollChaserHeavy = 18,
  /** ★宝箱/木箱：无每帧逻辑的静态道具 */
  TreasureChestProp = 19,
  /** 下落炸弹飞行体 */
  FallingBombProjectile = 20,
  /** 制导/追踪弹 */
  GuidedMissileProjectile = 21,
  /** 抓附/吸附交互锚点（驱动被捕过场） */
  GrabAnchorZone = 22,
}
