/**
 * 游戏2《红魔特种兵2-深海战舰》普通敌人/步兵 Actor 类（继承自 Actor 基类 h）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/f.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 与游戏1 差异（game2 专属）：
 *   - Actor 基类是 h（构造 (int, tjge.d) 两参，无 a 引用），状态字段为 a.b（非 a.p）；
 *   - 屏幕 176×204；帧率 80ms；定点坐标/速度 << 10（×1024）原样保留。
 *
 * 字段别名（混淆名沿用原版）：
 *   af/ag/ah=静态攻击/发射偏移参数表；a=血量/命数；b=朝向系数(±1)；c=计时；
 *   d/e/f=出生参数（巡逻范围/类型/连射）；Q=本帧 AI 判定；R=上帧 AI 判定；
 *   S=出生参数；T=初始朝向；U=受击前子状态备份；V=攻击节奏阈值；W=巡逻剩余次数；
 *   X=已开火标记；Y/Z=巡逻左右边界(定点)；aa=反应速度系数；ab=需转向；ac=已进入瞄准；
 *   ad=玩家 tjge.g；ae=关联 tjge.c（载具/炮台）。
 *   基类 h 字段：h=类型ID, l=动作低24位, n=帧索引, t=对象槽位, J=受击闪烁计时,
 *   G=AI 子状态, H=朝向标志位(0/Integer.MIN_VALUE/0x40000000), K=碰撞掩码,
 *   u/v=定点坐标(<<10), y/z=水平/垂直速度, L=主控 tjge.a, m=剩余命数语义无关此处。
 *
 * 跨类方法名按契约表：
 *   super.a_AY(byte[])=h.a(byte[])；this.a_I=h.a(int) 切动作；this.h_=h.h()动画结束；
 *   this.b_I=h.b(int)碰撞掩码判定；this.b_Th=h.b(tjge.h)相交；this.d_Th=h.d(tjge.h)；
 *   this.m_=h.m()；ad.c_Th=g.c(tjge.h)；ad.a_Th=g.a(tjge.h)；ae.c_=c.c()；
 *   k.a_IIIIIAI=tjge.k.a(...) 静态生成子弹；GameMIDlet.a_I=随机数。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用。
 */
import { GameMIDlet } from "./GameMIDlet.ts";
import { BossActor } from "./BossActor.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { LevelScene } from "./LevelScene.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { MIRROR_FLAG, FLIP_VERTICAL_BIT, ActorType } from "./constants.ts";

export class EnemyActor extends ActorBase {
  private static readonly fireOffsetTable: number[][] = [
    [-6, -56, 0, -10, 0],
    [28, -26, 10, 0, 1],
    [28, -15, 10, 0, 1],
    [4, 4, 0, 10, FLIP_VERTICAL_BIT],
  ];
  private static readonly throwOffsetTable: number[][] = [
    [0, -32],
    [0, -24],
  ];
  private static readonly turretShotParams: number[] = [16, 0, 0, 8192];
  hp: number = 0;
  facingSign: number = 0;
  timer: number = 0;
  patrolRange: number = 0;
  enemyVariant: number = 0;
  burstCount: number = 0;
  threatCode: number = 0;
  prevThreatCode: number = 0;
  spawnParam: number = 0;
  initialFacing: number = 0;
  preHitSubState: number = 0;
  attackRhythm: number = 0;
  patrolRemaining: number = 0;
  hasFired: boolean = false;
  patrolLeftBound: number = 0;
  patrolRightBound: number = 0;
  reactionFactor: number = 0;
  needTurn: boolean = false;
  isAiming: boolean = false;
  player!: PlayerActor;
  linkedVehicle: BossActor | null = null;

  /**
   * 构造普通敌人 Actor。
   * 对应 CFR f.java 构造：先 super(typeId, def) 走基类 h 的初始化，
   * 再把碰撞分组掩码 K 固定为 1（敌方分组），供 b_I 碰撞判定使用。
   * @param n 类型 ID（工厂分派值，取 1/2/3/4/5）
   * @param d2 该类型的动作帧定义（a.bin → tjge.d）
   */
  constructor(n: number, d2: SpriteDef) {
    super(n, d2);
    this.collisionTypeMask = 1;
  }

  /**
   * 从场景实例字节流初始化本敌人（对应 CFR f.java a(byte[]) → 契约名 a_AY）。
   * 先调用基类 spawnFromBytes 解出公共字段（坐标/朝向/动作等），失败则返回 false。
   * 随后按 typeId 分派读取专属出生参数：
   *  - type1/3（步兵/投手）：随机反应系数 aa=1+rand(3)，读巡逻距离 d、武器变体 e、连射数 f、巡逻剩余 W，血量=f+1；
   *    按初始朝向算出巡逻左右边界 Y/Z；变体 22 时进入横扫子状态 G=8；
   *  - type4：血量=2，变体 22 时巡逻边界锚定到相机可视区两侧；
   *  - type5（固定炮台）：读发射间隔 S，血量=1，计时 timer=5；
   *  - type2（随载具机关）：从 LevelScene.activeActors[by] 取关联 BossActor（Java 向下转型 h→c）。
   * 末尾记录初始朝向 T、缓存玩家引用 ad、清 isAiming/hasFired，返回 true。
   * @param byArray s.bin 解出的本 actor 实例参数字节
   * @returns 初始化是否成功（基类失败则透传 false）
   */
  // a(byte[]) → a_AY
  spawnFromBytes(byArray: Int8Array): boolean {
    if (!super.spawnFromBytes(byArray)) {
      return false;
    }
    this.timer = 0;
    this.patrolRemaining = 0;
    this.attackRhythm = 4;
    this.patrolLeftBound = this.posX;
    this.patrolRightBound = this.posX;
    this.reserved = 0;
    switch (this.typeId) {
      case ActorType.RiflemanGrunt:
      case ActorType.GrenadierGrunt: {
        this.reactionFactor = 1 + GameMIDlet.randomBelow(3);
        this.patrolRange = byArray[7] & 0xff;
        this.enemyVariant = byArray[8];
        this.burstCount = byArray[9];
        this.patrolRemaining = byArray[10];
        this.hp = this.burstCount + 1;
        if (this.patrolRange <= 0) break;
        if (this.actionHighByte === 0) {
          this.patrolRightBound = this.posX + (this.patrolRange << 10);
        } else {
          this.patrolLeftBound = this.posX - (this.patrolRange << 10);
        }
        if (this.enemyVariant !== 22) break;
        this.reserved = 8;
        break;
      }
      case ActorType.SentryGrunt: {
        this.patrolRange = byArray[7] & 0xff;
        this.enemyVariant = byArray.length > 8 ? byArray[8] : 0;
        this.hp = 2;
        if (this.patrolRange <= 0) break;
        if (this.enemyVariant === 22) {
          this.patrolLeftBound = this.canvas.cameraX - (this.boxLeft << 10);
          this.patrolRightBound = this.canvas.cameraX + this.canvas.viewportWidth - (this.boxRight << 10);
          break;
        }
        if (this.actionHighByte === 0) {
          this.patrolRightBound = this.posX + (this.patrolRange << 10);
          break;
        }
        this.patrolLeftBound = this.posX - (this.patrolRange << 10);
        break;
      }
      case ActorType.TurretEmplacement: {
        this.spawnParam = byArray[7];
        this.hp = 1;
        this.timer = 5;
        break;
      }
      case ActorType.VehicleGunner: {
        const by: number = byArray[7];
        this.spawnParam = byArray[8];
        this.patrolRange = byArray[9];
        this.patrolLeftBound = byArray[9];
        if (LevelScene.activeActors[by] == null) break;
        this.linkedVehicle = LevelScene.activeActors[by] as unknown as BossActor; // (c)tjge.j.e[by]：Java 向下转型 h→c
      }
    }
    this.initialFacing = this.actionHighByte;
    this.player = this.canvas.player;
    this.isAiming = false;
    this.hasFired = false;
    return true;
  }

  /**
   * 每帧主更新（对应 CFR f.java b() → 契约名 b_，由 LevelScene 主循环逐 actor 调用）。
   * 先据当前朝向高字节算出朝向系数 facingSign(±1)，再按 typeId 分派 AI：
   *  - type1/3/4 → updateWalkerAi（陆战/步兵 AI）；
   *  - type2/5 → updateTurretAi（炮台/机关 AI）。
   * 末尾做对玩家的近身判定：当本敌人未处于受击/死亡子状态(reserved≠6/7)、存活，
   * 且玩家正处于动作组 23（受擒/被控）并在水平 25600/垂直 10240 定点范围内时，调 player.onCollide。
   */
  // b() → b_
  update(): void {
    this.facingSign = this.actionHighByte === 0 ? 1 : -1;
    switch (this.typeId) {
      case ActorType.RiflemanGrunt:
      case ActorType.GrenadierGrunt:
      case ActorType.SentryGrunt: {
        this.updateWalkerAi();
        break;
      }
      case ActorType.VehicleGunner:
      case ActorType.TurretEmplacement: {
        this.updateTurretAi();
      }
    }
    if (this.reserved !== 6 && this.reserved !== 7 && this.hp > 0 && this.player.frameGroupIndex === 23 && Math.abs(this.player.posY - this.posY) <= 10240 && Math.abs(this.player.posX - this.posX) <= 25600) {
      this.player.onCollide(this);
    }
  }

  /**
   * 陆战/步兵敌人的 AI 状态机（对应 CFR f.java a() → 契约名 a_，服务 type1/3/4）。
   * 先用 evaluateThreat 求本帧威胁码 threatCode（0 无/1 视野内/2 上方/3 下方/4 近身），
   * 与上帧不同则复位瞄准；威胁>0 时判断是否需要转向 needTurn 并进入瞄准。
   * 主体按 AI 子状态 reserved(G) 分支：
   *  0=待命/瞄准开火（转向后调 aimAndFire；否则按巡逻倒计时切到追击 4，或回放待机动画）；
   *  1=攻击动画播放中（动画结束回 0，type3 在第 2 帧抛出手雷 type10）；
   *  2=转身停顿（计时到切追击 4 并翻面）；
   *  4/8=巡逻/横扫行走（设水平速度，越界后切转身 2 或重锚横扫边界）；
   *  5=开火出枪（type1 生成 type10 子弹并赋初速、type3 切投掷动作）；
   *  6=受击（动画结束后存活回 0、否则切死亡 7 并起爆闪）；
   *  7=死亡（动画结束后扣场景计数并 killAndMarkSpawned 回收）。
   * 末尾 type4 额外做对玩家的接触伤害（applyDamage(10) + player.onHitBy）。
   */
  // a() → a_
  private updateWalkerAi(): void {
    this.threatCode = this.evaluateThreat();
    if (this.threatCode !== this.prevThreatCode) {
      this.isAiming = false;
      this.prevThreatCode = this.threatCode;
    }
    if (this.threatCode > 0) {
      this.needTurn = (this.actionHighByte === 0 && this.posX > this.player.posX) || (this.actionHighByte !== 0 && this.posX < this.player.posX);
      if (!this.isAiming) {
        this.targetVelX = 0;
        this.isAiming = true;
        this.timer = this.threatCode === 4 && !this.hasFired ? 0 : this.attackRhythm;
        this.reserved = 0;
      }
    } else {
      this.isAiming = false;
    }
    switch (this.reserved) {
      case 0: {
        if (this.isAiming) {
          if (this.needTurn) {
            this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
          }
          this.aimAndFire();
          break;
        }
        if (this.timer-- < 0 && this.patrolRange > 0) {
          this.reserved = 4;
        }
        if (this.frameGroupIndex === 0) break;
        this.setAction(0 | (this.patrolRange > 0 ? this.actionHighByte : this.initialFacing));
        break;
      }
      case 1: {
        if (this.isAnimationDone()) {
          this.reserved = 0;
          this.timer = 8;
          if (this.typeId === ActorType.GrenadierGrunt) {
            this.timer = 16;
          }
          this.attackRhythm = this.timer;
          this.setAction((this.frameGroupIndex === 8 ? 0 : 4) | this.actionHighByte);
        } else if (this.typeId === ActorType.GrenadierGrunt && this.frameIndex === 2) {
          const n: number = this.frameGroupIndex === 8 ? 0 : 1;
          const n2: number = 6 | this.actionHighByte;
          const n3: number = this.posX + (EnemyActor.throwOffsetTable[n][0] << 10) * this.facingSign;
          const n4: number = this.posY + (EnemyActor.throwOffsetTable[n][1] << 10);
          this.launchProjectile(ProjectileActor.spawnProjectile(ActorType.DirectBullet, n2, n3, n4, 25, null)); // this.a(tjge.k)：传入投射物 → a_Tk
        }
        this.hasFired = false;
        break;
      }
      case 2: {
        if (this.timer-- >= 0) break;
        this.reserved = 4;
        this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
        this.setAction(0 | this.actionHighByte);
        break;
      }
      case 4:
      case 8: {
        this.targetVelX = 4096 * this.facingSign;
        this.hasFired = false;
        if ((this.facingSign > 0 && this.posX > this.patrolRightBound) || (this.facingSign < 0 && this.posX < this.patrolLeftBound)) {
          if (this.reserved === 8) {
            this.patrolLeftBound = this.canvas.cameraX + 20480;
            this.patrolRightBound = this.canvas.cameraX + this.canvas.viewportWidth - 20480;
            this.preHitSubState = 0;
            this.reserved = 4;
          } else {
            this.reserved = 2;
            this.targetVelX = 0;
            this.timer = 15;
          }
          this.setAction(0 | this.actionHighByte);
          break;
        }
        if (this.frameGroupIndex === 3) break;
        this.setAction(3 | this.actionHighByte);
        break;
      }
      case 5: {
        this.attackRhythm = 8;
        if (this.frameGroupIndex === 7) {
          this.hasFired = true;
          if (this.collidesWith(this.player)) {
            this.player.onHitBy(this);
          }
          if (!this.isAnimationDone()) break;
          this.reserved = this.preHitSubState === 8 ? this.preHitSubState : 0;
          this.setAction(0 | this.actionHighByte);
          break;
        }
        if (this.typeId === ActorType.RiflemanGrunt) {
          const n: number = this.frameGroupIndex - 8;
          const n5: number = EnemyActor.fireOffsetTable[n][4] | this.actionHighByte;
          const n6: number = this.posX + (EnemyActor.fireOffsetTable[n][0] << 10) * this.facingSign;
          const n7: number = this.posY + (EnemyActor.fireOffsetTable[n][1] << 10);
          const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(ActorType.DirectBullet, n5, n6, n7, 25, null);
          if (k2 == null) break;
          if (!k2.hitWall) {
            k2.targetVelX = (EnemyActor.fireOffsetTable[n][2] << 10) * this.facingSign;
            k2.targetVelY = EnemyActor.fireOffsetTable[n][3] << 10;
          }
          this.reserved = 1;
          this.setAction(this.frameGroupIndex | this.actionHighByte);
          break;
        }
        if (this.typeId !== ActorType.GrenadierGrunt) break;
        this.setAction((this.frameGroupIndex === 0 ? 8 : 9) | this.actionHighByte);
        this.reserved = 1;
        this.attackRhythm = this.timer = 16;
        break;
      }
      case 6: {
        if (!this.isAnimationDone()) break;
        if (this.hp > 0) {
          this.hasFired = false;
          this.reserved = this.preHitSubState === 8 ? this.preHitSubState : 0;
          this.setAction(0 | this.actionHighByte);
          break;
        }
        this.reserved = 7;
        this.setAction(1 | this.actionHighByte);
        this.hitFlashTimer = 10;
        break;
      }
      case 7: {
        if (!this.isAnimationDone()) break;
        if (this.frameGroupIndex === 1) {
          this.setAction(2 | this.actionHighByte);
          break;
        }
        if (this.frameGroupIndex !== 2 || this.hitFlashTimer > 1) break;
        if (this.slotIndex >= this.canvas.scene.residentActorSlots) {
          --this.canvas.scene.waveSpawnCount;
        }
        ++this.canvas.scene.reservedD;
        this.killAndMarkSpawned();
      }
    }
    if (this.typeId === ActorType.SentryGrunt && this.reserved !== 6 && this.reserved !== 7 && this.player.health > 0 && this.collidesWith(this.player)) {
      this.applyDamage(10, 0);
      this.player.onHitBy(this);
    }
  }

  /**
   * 炮台/机关敌人的 AI 状态机（对应 CFR f.java c() → 契约名 c_，服务 type2/5）。
   * 开头：type2 的关联载具 linkedVehicle 已被摧毁时，本机关自毁（applyDamage(10) 后解除引用并返回）。
   * 主体按 AI 子状态 reserved(G) 分支：
   *  0=待命（回待机帧；evaluateThreat>0 后 type5 先转向对准玩家再倒计时切开火 5，type2 直接切 5）；
   *  1=冷却（计时到回 0；动画结束回待机帧）；
   *  5=开火（type5 生成直线子弹 type16 并赋水平初速、切冷却 1；type2 调 linkedVehicle.requestFire 按节奏发射）；
   *  6=受击（动画结束后存活回 0、否则切死亡 7 并起爆闪）；
   *  7=死亡（动画结束后扣场景计数并 killAndMarkSpawned 回收）。
   */
  // c() → c_
  private updateTurretAi(): void {
    if (this.typeId === ActorType.VehicleGunner && this.linkedVehicle != null && this.linkedVehicle.health <= 0) {
      this.applyDamage(10, 0);
      this.linkedVehicle = null;
      return;
    }
    switch (this.reserved) {
      case 0: {
        if (this.frameGroupIndex !== 0) {
          this.setAction(0 | this.actionHighByte);
        }
        if (this.evaluateThreat() <= 0) break;
        if (this.typeId === ActorType.TurretEmplacement) {
          if ((this.actionHighByte === 0 && this.posX > this.player.posX) || (this.actionHighByte !== 0 && this.posX < this.player.posX)) {
            this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
            this.setAction(this.frameGroupIndex | this.actionHighByte);
          }
          if (this.timer-- >= 0) break;
          this.reserved = 5;
          return;
        }
        this.reserved = 5;
        return;
      }
      case 1: {
        if (this.timer-- < 0) {
          this.timer = 5;
          this.reserved = 0;
          return;
        }
        if (!this.isAnimationDone()) break;
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case 5: {
        if (this.typeId === ActorType.TurretEmplacement) {
          const n: number = EnemyActor.turretShotParams[2] | this.actionHighByte;
          const n2: number = this.posX + (EnemyActor.turretShotParams[0] << 10) * this.facingSign;
          const n3: number = this.posY + (EnemyActor.turretShotParams[1] << 10);
          const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(ActorType.ArcCannonShell, n, n2, n3, 1, null);
          if (k2 == null) break;
          k2.targetVelX = EnemyActor.turretShotParams[3] * this.facingSign;
          this.reserved = 1;
          this.timer = 12;
          this.setAction(3 | this.actionHighByte);
          return;
        }
        if (this.typeId !== ActorType.VehicleGunner) break;
        if (this.linkedVehicle != null && this.linkedVehicle.requestFire()) {
          this.setAction(3 | this.actionHighByte);
          --this.patrolLeftBound;
        }
        if (this.patrolLeftBound > 0) break;
        this.patrolLeftBound = this.patrolRange;
        this.timer = this.spawnParam;
        this.reserved = 1;
        return;
      }
      case 6: {
        if (!this.isAnimationDone()) break;
        if (this.hp > 0) {
          this.timer = 5;
          this.reserved = 0;
          this.setAction(0 | this.actionHighByte);
          return;
        }
        this.reserved = 7;
        this.setAction(1 | this.actionHighByte);
        this.hitFlashTimer = 10;
        return;
      }
      case 7: {
        if (!this.isAnimationDone()) break;
        if (this.frameGroupIndex === 1) {
          this.setAction(2 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex !== 2 || this.hitFlashTimer > 1) break;
        ++this.canvas.scene.reservedD;
        this.killAndMarkSpawned();
      }
    }
  }

  /**
   * 计算本帧对玩家的威胁/感知码（对应 CFR f.java o() → 契约名 o_）。
   * 处于受击/死亡/开火/冷却子状态或玩家已死亡时直接返回 0（不感知）。
   * 否则按朝向构造前/后向感知矩形（视宽的 9/10 加权），并据 typeId 细分：
   * type1/3 命中近身框且玩家非受控动作组(23/24)返回 4（近身）、按反应系数 aa 与玩家相对位置返回 2（上方）/3（下方）。
   * @returns 0=无威胁 / 1=视野内 / 2=玩家在上方 / 3=玩家在下方 / 4=近身
   */
  // o() → o_
  private evaluateThreat(): number {
    if (this.reserved === 6 || this.reserved === 7 || this.reserved === 5 || this.reserved === 1 || this.player.health <= 0) {
      return 0;
    }
    const bl: boolean = false;
    let n: number = 0;
    let n2: number = 0;
    let n3: number = 0;
    let n4: number = 0;
    let n5: number = 2;
    let n6: number = 2;
    const bl2: boolean = false;
    if (this.actionHighByte === 0) {
      n5 = 1;
    } else {
      n6 = 1;
    }
    n = (((this.canvas.viewportWidth * 9) / 10) | 0) / ((2 / n5) | 0) | 0;
    n2 = (((this.canvas.viewportWidth * 9) / 10) | 0) / ((2 / n6) | 0) | 0;
    n3 = 20480;
    n4 = 20480;
    switch (this.typeId) {
      case ActorType.RiflemanGrunt:
      case ActorType.GrenadierGrunt: {
        let n7: number = this.posX - 30720;
        let n8: number = this.posX + 30720;
        let n9: number = this.posY - 20480;
        let n10: number = this.posY + 20480;
        if (this.player.posX > n7 && this.player.posX < n8 && this.player.posY > n9 && this.player.posY < n10 && this.player.frameGroupIndex !== 23 && this.player.frameGroupIndex !== 24) {
          return 4;
        }
        if (this.reserved === 8) {
          return 0;
        }
        if (this.enemyVariant <= 0) break;
        if (this.typeId === ActorType.GrenadierGrunt) {
          n3 = this.canvas.viewportHeight;
          n4 = this.canvas.viewportHeight;
          break;
        }
        n7 = n >> 2;
        n8 = n2 >> 2;
        n9 = this.canvas.viewportHeight;
        n10 = this.canvas.viewportHeight;
        if (this.player.posX < this.posX - ((n7 / this.reactionFactor) | 0) || this.player.posX > this.posX + ((n8 / this.reactionFactor) | 0)) break;
        if (this.player.posY > this.posY - n9 && this.player.posY < this.posY - (n9 >> 2)) {
          return 2;
        }
        if (this.player.posY >= this.posY + n10 || this.player.posY <= this.posY + (n10 >> 2)) break;
        return 3;
      }
    }
    if (this.player.posX < this.posX - n || this.player.posX > this.posX + n2 || this.player.posY < this.posY - n3 || this.player.posY > this.posY + n4) {
      return 0;
    }
    return 1;
  }

  /**
   * 被其他 Actor 命中的回调（对应 CFR f.java a(tjge.h) → 契约名 a_Th，由碰撞系统调用）。
   * 命中方需带碰撞标志位 2、本帧为新接触、且本敌人未死亡(reserved≠7)，否则返回 false。
   * 按命中方 typeId 受理：type0（玩家）仅在其挥刀动作组 24 时受近战伤害；
   * type10/12（玩家子弹/爆炸）受伤并返回 true（吃掉该投射物）。
   * @param h2 命中本敌人的 Actor
   * @returns 是否消费此次命中（true=投射物应销毁）
   */
  // a(tjge.h) → a_Th
  public onHitBy(h2: ActorBase): boolean {
    if (!h2.hasCollisionFlag(2) || !this.isNewContact(h2) || this.reserved === 7) {
      return false;
    }
    switch (h2.typeId) {
      case ActorType.Player: {
        if (h2.frameGroupIndex !== 24) break;
        this.applyDamage(h2.getDamage(), h2.actionHighByte);
        break;
      }
      case ActorType.DirectBullet:
      case ActorType.ExplosionDebris: {
        this.applyDamage(h2.getDamage(), h2.actionHighByte);
        return true;
      }
    }
    return false;
  }

  /**
   * 结算一次伤害并切换受击/死亡动作（对应 CFR f.java b(int,int) → 契约名 b_II）。
   * 扣血 hp、停水平速度、备份当前子状态到 preHitSubState(U) 以便受击后恢复，
   * 再按 typeId 切受击子状态 reserved=6：type1/3 据来袭方向选正/背面受击帧；
   * type2/5 切对应受击帧；type4 在血量耗尽时先生成两处爆炸(type12)再进受击。
   * @param n 伤害值（≤0 直接返回，不结算）
   * @param n2 来袭方向高字节（与本敌人朝向比较以选受击帧）
   */
  // b(int,int) → b_II
  private applyDamage(n: number, n2: number): void {
    if (n <= 0) {
      return;
    }
    this.hp -= n;
    this.targetVelX = 0;
    this.preHitSubState = this.reserved;
    switch (this.typeId) {
      case ActorType.RiflemanGrunt:
      case ActorType.GrenadierGrunt: {
        this.reserved = 6;
        if (n2 === this.actionHighByte) {
          this.setAction(6 | this.actionHighByte);
          return;
        }
        this.setAction(5 | this.actionHighByte);
        return;
      }
      case ActorType.VehicleGunner: {
        this.reserved = 6;
        this.setAction(4 | this.actionHighByte);
        return;
      }
      case ActorType.SentryGrunt: {
        if (this.hp > 0 || this.reserved === 6 || this.reserved === 7) break;
        ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX - 5120, this.posY - 10240, 0, null);
        ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX + 5120, this.posY - 20480, 0, null);
        this.reserved = 6;
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case ActorType.TurretEmplacement: {
        this.reserved = 6;
        this.setAction(1 | this.actionHighByte);
      }
    }
  }

  /**
   * 为已生成的投掷物（手雷）设置抛物线初速（对应 CFR f.java a(tjge.k) → 契约名 a_Tk）。
   * 据本敌人与玩家的水平距离反算竖直初速/重力，使手雷大致落在玩家处：
   * 水平速度固定 facingSign*5120，竖直初速 -n、加速度 accelY=n2、限速 maxVelY、飞行计时 timer。
   * @param k2 已由 ProjectileActor.spawnProjectile 生成的手雷（null 直接返回）
   */
  // a(tjge.k) → a_Tk
  launchProjectile(k2: ProjectileActor | null): void {
    if (k2 == null) {
      return;
    }
    let n: number = 0;
    let n2: number = 0;
    let n3: number = Math.abs(this.player.posX - k2.posX);
    n3 = Math.max(40960, n3);
    const n4: number = (n3 / 5120) | 0;
    const n5: number = n4 >>> 1;
    let n6: number = 0;
    while (n6 < n5) {
      n2 += n6;
      ++n6;
    }
    n3 = (n3 >>> 2) * 3;
    n2 = ((n3 >>> 1) / n2) | 0;
    n = (n5 - 1) * n2;
    n = Math.min(15360, n);
    k2.targetVelX = this.facingSign * 5120;
    k2.targetVelY = -n;
    k2.accelY = n2;
    k2.maxVelY = n;
    k2.timer = n4;
  }

  /**
   * 瞄准并选择攻击动作（对应 CFR f.java p() → 契约名 p_，由 updateWalkerAi 子状态 0 调用）。
   * 威胁码 4（近身）时停步，巡逻次数与计时耗尽后切到开火子状态 5 并播放近战动作。
   * 否则按 typeId 选射击/出拳动作序列：type1 据威胁方向(1/2/3)从 [9,10,8,11] 选帧、
   * 节奏点随机出招；type3 在 [0,4] 间随机；type4 切到追击行走。
   * 计时与连射数耗尽后切开火 5 或结束本轮瞄准。
   */
  // p() → p_
  private aimAndFire(): void {
    if (this.threatCode === 4) {
      this.targetVelX = 0;
      if (--this.patrolRemaining < 0 && --this.timer < 0) {
        this.reserved = 5;
        this.setAction(7 | this.actionHighByte);
        return;
      }
      this.setAction(0 | this.actionHighByte);
      return;
    }
    switch (this.typeId) {
      case ActorType.RiflemanGrunt: {
        const nArray: number[] = [9, 10, 8, 11];
        if (this.threatCode === 1) {
          if (this.timer === this.attackRhythm) {
            if (this.burstCount > 0) {
              this.setAction(nArray[GameMIDlet.randomBelow(2)] | this.actionHighByte);
            } else {
              this.setAction(nArray[0] | this.actionHighByte);
            }
          } else {
            this.setAction(this.frameGroupIndex | this.actionHighByte);
          }
        } else {
          this.setAction(nArray[this.threatCode] | this.actionHighByte);
        }
        if (this.player.frameGroupIndex === 24 || this.timer-- >= 0) break;
        if (this.burstCount === 1 && this.frameGroupIndex === nArray[this.burstCount]) {
          this.isAiming = false;
          return;
        }
        if (--this.patrolRemaining >= 0) break;
        this.reserved = 5;
        return;
      }
      case ActorType.GrenadierGrunt: {
        const nArray: number[] = [0, 4];
        if (this.timer === this.attackRhythm && this.burstCount > 0) {
          this.setAction(nArray[GameMIDlet.randomBelow(2)] | this.actionHighByte);
        }
        if (this.player.frameGroupIndex === 24 || this.timer-- >= 0) break;
        if (this.burstCount === 1 && this.frameGroupIndex === nArray[this.burstCount]) {
          this.isAiming = false;
          return;
        }
        if (--this.patrolRemaining >= 0) break;
        this.reserved = 5;
        return;
      }
      case ActorType.SentryGrunt: {
        this.reserved = 4;
        this.setAction(3 | this.actionHighByte);
      }
    }
  }

  /**
   * 返回本敌人当前的近战接触伤害（对应 CFR f.java m() → 契约名 m_）。
   * 仅当处于挥击/攻击动作组 7 时造成 1 点伤害，其余动作为 0（无伤害）。
   * @returns 近战伤害值（动作组 7 时为 1，否则 0）
   */
  // m() → m_
  public getDamage(): number {
    if (this.frameGroupIndex === 7) {
      return 1;
    }
    return 0;
  }
}
