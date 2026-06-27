/**
 * 游戏2《红魔特种兵2-深海战舰》Boss / 机关 / 触发器 Actor 类（继承自 Actor 基类 h）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/c.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 字段别名（混淆名沿用原版）：
 *   c=血量/计时；N=锚定 x 或动作计数；O/P=攻击节奏（基准/计数）；Q/R=移动范围下/上界(定点)；
 *   S=移动轴或阶段；T=随机移动计时；U=巡逻倒计时；V=阶段/序号；
 *   d=被击退中；W=待触发开火；X=可触发；e=休眠/不激活；Y=关联从属实体 tjge.h；
 *   静态 a/b=各 Boss 子弹参数表；静态 f=当前最终 Boss 实例。
 *   基类 h 字段：h=类型ID, l=动作低24位, t=实体索引, H=朝向位(0/Integer.MIN_VALUE),
 *   u/v=定点坐标(<<10), y/z=水平/垂直速度, I=动画?, p/q/r=碰撞框, L=主控 tjge.a。
 *   L.m/q=关卡水平基准/宽度, L.n=垂直基准, L.y=玩家 tjge.g, L.z=场景 tjge.j, L.d=当前状态。
 *
 * 跨类方法名按契约表：
 *   super.a_AY(byte[]) / a_I(int) / f_() / h_() / b_Th(h) / e_() 为基类 h 方法；
 *   tjge.k.a_IIIIIAI(...) 为静态生成实体；
 *   L.y(g).c_Th(this) 受击转交；L.z(j).c_II/c_/a_I；L.b_I(int) 为 tjge.a.b(int)。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用；System.gc() 原版无；
 *   GameMIDlet.a_I 为随机数（绝对值取模）。
 */
import { GameMIDlet } from "./GameMIDlet.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ActorBase } from "./ActorBase.ts";
import { LevelScene } from "./LevelScene.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { MIRROR_FLAG, FLIP_VERTICAL_BIT, LevelSubState, ActorType } from "./constants.ts";

/**
 * 游戏2《红魔特种兵2-深海战舰》中的 **Boss / 机关 / 触发器 Actor**（继承自基类 {@link ActorBase}）。
 *
 * 一个类同时承载 5 种关卡实体（由工厂 `tjge.a.a(int,d)` 按 typeId 分派实例化，见
 * docs/game2-深海战舰/类清单与职责.md §12 与 §2）：
 *  - **type11**：会瞄准玩家发射弹幕、可被击退归位的炮台型 Boss（血量 10）；
 *  - **type13**：固定机关/可破坏触发物（血量 3，破坏后置触发标志、切静止层）；
 *  - **type17**：沿 x 或 y 轴巡逻的移动机关，按节奏开火（血量 3，轴向由 `axisOrPhase` 决定）；
 *  - **type19**：本作**最终 Boss**（血量 200），多阶段子状态机（入场→召唤编队→俯冲→空袭），
 *    维护全局单例 {@link BossActor.instance}，被击退时进入坠落死亡剧情；
 *  - **type21**：关底通关触发器/被抱实体（血量 10，玩家贴靠并按动作 16 即清关）。
 *
 * 角色定位：玩法上覆盖了「中途机关」「炮台」「关底 Boss」「通关开关」等所有非普通敌人的特殊单位，
 * 与玩家 {@link PlayerActor}、子弹 {@link ProjectileActor}、场景 {@link LevelScene} 协作，
 * 受击与碰撞逻辑由基类的碰撞框/分组驱动。
 *
 * 关键字段：`health` 血量；`knockedBack` 被击退中（沿 x 推回 `cN` 锚点）；`pendingFire`/`fireable`
 * 待开火/可开火节奏位；`dormant` 休眠（最终 Boss 未激活时直接跳过 update）；`rangeMin/rangeMax`
 * 巡逻/横移边界；`axisOrPhase` 轴向或阶段；`phaseIndex` 最终 Boss 阶段索引；`attachedEntity`
 * 关联从属实体（type21 抱住玩家时生成的特效）。
 *
 * CFR 基准：逐行移植自 reverse/game2/2-decompiled-cfr/tjge/c.java（512 行，权威源）；
 * 字段/方法名映射见同文件顶部说明、reverse/game2/3-readable/SYMBOLS.md 与
 * reverse/game2/porting-naming/porting-contract.json。
 */
export class BossActor extends ActorBase {
  static BULLET_PARAMS_T11: number[][] = [
    [-12, -50, 9, 1, -10, -10],
    [-30, -34, -2147483647, 3, -10, 0],
  ];
  static BULLET_PARAMS_T17: number[][] = [
    [-8, -8, 1, 1, -10, 0, 2],
    [0, 4, FLIP_VERTICAL_BIT, 4, 0, 10, 5],
  ];
  health: number = 0;
  private cN: number = 0;
  private cO: number = 0;
  private cP: number = 0;
  private rangeMin: number = 0;
  private rangeMax: number = 0;
  private axisOrPhase: number = 0;
  private randomMoveTimer: number = 0;
  private patrolCountdown: number = 0;
  private phaseIndex: number = 0;
  knockedBack: boolean = false;
  private pendingFire: boolean = false;
  private fireable: boolean = false;
  dormant: boolean = false;
  private attachedEntity: ActorBase | null = null;
  static instance: BossActor | null = null;

  /**
   * 构造 Boss/机关 Actor：以类型 ID 与精灵定义初始化，直接转交基类 {@link ActorBase} 构造。
   * 具体类型的血量/范围/节奏在 {@link spawnFromBytes} 中按 typeId 设定，构造阶段不分派。
   * @param n typeId（11/13/17/19/21 之一，由工厂 `tjge.a.a(int,d)` 传入）
   * @param d2 动作/动画定义（{@link SpriteDef}）
   * 对应 CFR c.java:33-35。
   */
  constructor(n: number, d2: SpriteDef) {
    super(n, d2);
  }

  /**
   * 从关卡实例字节数据初始化各类型 Boss/机关：先调基类 `super.spawnFromBytes`，
   * 再按 `typeId` 设置血量 `health`、巡逻/横移范围 `rangeMin/rangeMax`、轴向 `axisOrPhase`、
   * 复位锚点 `cN` 与攻击节奏 `cO/cP` 等；type19（最终 Boss）额外置 `dormant=true` 并登记单例
   * {@link BossActor.instance}。末尾统一复位 `knockedBack/pendingFire/attachedEntity` 并置 `fireable=true`。
   * @param byArray 关卡注入的实例参数字节（如 `[7]` 攻击节奏、`[8]` 轴向、`[9]` 移动跨度）
   * @returns 基类解析失败时返回 false，成功初始化返回 true
   * 对应 CFR c.java:37-92。
   */
  // a(byte[]) → a_AY
  spawnFromBytes(byArray: Int8Array): boolean {
    if (!super.spawnFromBytes(byArray)) {
      return false;
    }
    switch (this.typeId) {
      case ActorType.MobileGunEmplacement: {
        this.health = 10;
        this.cN = this.posX;
        break;
      }
      case ActorType.PatrolLauncher: {
        this.cO = byArray[7];
        this.cP = byArray[7];
        this.axisOrPhase = byArray[8];
        this.health = 3;
        if (this.axisOrPhase === 0) {
          this.rangeMin = this.posX;
          this.rangeMax = this.posX + (byArray[9] << 10);
          this.targetVelX = 2048;
          break;
        }
        if (this.axisOrPhase !== 1) break;
        this.rangeMin = this.posY;
        this.rangeMax = this.posY + (byArray[9] << 10);
        this.targetVelY = 2048;
        break;
      }
      case ActorType.DestructibleConsole: {
        this.health = 3;
        break;
      }
      case ActorType.FinalBoss: {
        this.health = 10;
        this.cN = this.posX;
        this.cP = byArray[7];
        break;
      }
      case ActorType.HelicopterBoss: {
        this.dormant = true;
        this.axisOrPhase = 0;
        this.health = 200;
        this.cN = 0;
        this.phaseIndex = 0;
        this.cP = this.cO = 10;
        this.randomMoveTimer = 0;
        this.rangeMin = this.canvas.cameraX - (this.boxLeft << 10);
        this.rangeMax = this.canvas.cameraX + this.canvas.viewportWidth - (this.boxRight << 10);
        BossActor.instance = this;
      }
    }
    this.knockedBack = false;
    this.pendingFire = false;
    this.fireable = true;
    this.attachedEntity = null;
    return true;
  }

  /**
   * 最终 Boss（type19）登场就位/重置：把自身定位到相机中上方
   * （`posX=相机中线, posY=相机上方 20480`），设血量 16、攻击节奏、横移范围、`dormant=true`、
   * 阶段索引 `phaseIndex=3`、动作 0，并复位各开火/击退/关联标志。
   * 供剧情脚本在 Boss 出场时驱动（区别于 {@link spawnFromBytes} 的 200 血常规初始化）。
   * 对应 CFR c.java:94-111。
   */
  // a() → a_
  resetBoss(): void {
    this.posX = this.canvas.cameraX + ((this.canvas.viewportWidth / 2) | 0);
    this.posY = this.canvas.cameraY - 20480;
    this.health = 16;
    this.cN = 0;
    this.cO = 10;
    this.cP = 16;
    this.rangeMin = this.canvas.cameraX - 819200;
    this.rangeMax = this.canvas.cameraX + this.canvas.viewportWidth + 819200;
    this.axisOrPhase = 1;
    this.knockedBack = false;
    this.pendingFire = false;
    this.fireable = true;
    this.attachedEntity = null;
    this.dormant = true;
    this.setAction(0);
    this.phaseIndex = 3;
  }

  /**
   * 每帧 AI 行为（覆写基类 `update`），按 `typeId` 分派到 5 套独立逻辑：
   *  - **type11**：消费 `pendingFire` 按动作选弹道参数 `BULLET_PARAMS_T11` 发射 type10 子弹
   *    （首发调 {@link aimProjectile} 瞄准玩家）；动画播完恢复 `fireable`；`knockedBack` 时沿 x 推回
   *    锚点 `cN`；血量 `<=0` 回收；碰到玩家则触发 `onCollide`。
   *  - **type13**：固定机关，按帧组判定破坏，破坏后抖屏、切动作并置 `triggerHitFlags`，最终切层 10。
   *  - **type17**：在 `rangeMin/rangeMax` 之间沿 `axisOrPhase` 轴往返巡逻，按 `cP` 节奏发射 type10。
   *  - **type19**：最终 Boss 多阶段子状态机（`phaseIndex` 0=入场/召唤编队、1=等待清场、2=俯冲蓄势、
   *    3=空袭投弹）；被击退时进入坠落死亡剧情（设置 {@link LevelScene.cutsceneState} 并切
   *    `BossScript` 子状态），平时随机横移并按 `phaseIndex` 选发射点发射 type9。`dormant` 时直接返回。
   *  - **type21**：通关触发器，玩家贴靠时锁定其动作并生成关联实体 `attachedEntity`；按下动作 16 即清关。
   * 对应 CFR c.java:113-407。
   */
  // b() → b_
  update(): void {
    switch (this.typeId) {
      case ActorType.MobileGunEmplacement: {
        if (this.pendingFire) {
          let n: number;
          let n2: number;
          let n3: number;
          let n4: number;
          let k2: ProjectileActor | null;
          this.pendingFire = false;
          this.fireable = false;
          let n5 = 0;
          if (this.frameGroupIndex >= 2) {
            n5 = 1;
          }
          if ((k2 = ProjectileActor.spawnProjectile(ActorType.DirectBullet, (n4 = BossActor.BULLET_PARAMS_T11[n5][2]), (n3 = this.posX + (BossActor.BULLET_PARAMS_T11[n5][0] << 10) * (n2 = this.actionHighByte === 0 ? 1 : -1)), (n = this.posY + (BossActor.BULLET_PARAMS_T11[n5][1] << 10)), 1, null)) != null) {
            if (n5 === 1) {
              k2.targetVelX = (BossActor.BULLET_PARAMS_T11[n5][4] << 10) * n2;
              k2.targetVelY = BossActor.BULLET_PARAMS_T11[n5][5] << 10;
            } else {
              this.aimProjectile(k2);
            }
          }
          this.setAction(BossActor.BULLET_PARAMS_T11[n5][3] | this.actionHighByte);
        } else if (this.isAnimationDone()) {
          if (this.frameGroupIndex === 1) {
            this.setAction(0 | this.actionHighByte);
          } else if (this.frameGroupIndex === 3) {
            this.setAction(2 | this.actionHighByte);
          }
          this.fireable = true;
        }
        if (this.knockedBack) {
          if (this.posX === this.cN) {
            this.posX += 2048;
          } else {
            this.posX = this.cN;
            this.knockedBack = false;
          }
        }
        if (this.health <= 0) {
          this.killAndMarkSpawned();
          return;
        }
        if (!this.collidesWith(this.canvas.player)) break;
        this.canvas.player.onCollide(this);
        return;
      }
      case ActorType.PatrolLauncher: {
        let n: number;
        let n6: number;
        let n7: number;
        let n8: number;
        let n9: number;
        let k3: ProjectileActor | null;
        if (this.axisOrPhase === 0) {
          if (this.posX < this.rangeMin) {
            this.targetVelX = 2048;
          } else if (this.posX > this.rangeMax) {
            this.targetVelX = -2048;
          }
        } else if (this.axisOrPhase === 1) {
          if (this.posY < this.rangeMin) {
            this.targetVelY = 2048;
          } else if (this.posY > this.rangeMax) {
            this.targetVelY = -2048;
          }
        }
        if (this.cP-- < 0 && (k3 = ProjectileActor.spawnProjectile(ActorType.DirectBullet, (n9 = BossActor.BULLET_PARAMS_T17[(n8 = (this.frameGroupIndex / 3) | 0)][2] | (this.actionHighByte ^ MIRROR_FLAG)), (n7 = this.posX + this.targetVelX + (BossActor.BULLET_PARAMS_T17[n8][0] << 10) * (n6 = this.actionHighByte === 0 ? 1 : -1)), (n = this.posY + this.targetVelY + (BossActor.BULLET_PARAMS_T17[n8][1] << 10)), 1, null)) != null) {
          k3.targetVelX = (BossActor.BULLET_PARAMS_T17[n8][4] << 10) * n6;
          k3.targetVelY = BossActor.BULLET_PARAMS_T17[n8][5] << 10;
          this.setAction(BossActor.BULLET_PARAMS_T17[n8][3] | this.actionHighByte);
          this.cP = this.cO;
        }
        if (this.frameGroupIndex === BossActor.BULLET_PARAMS_T17[(this.frameGroupIndex / 3) | 0][6]) {
          if (this.isAnimationDone()) {
            this.knockedBack = false;
            this.setAction((BossActor.BULLET_PARAMS_T17[(this.frameGroupIndex / 3) | 0][6] - 2) | this.actionHighByte);
          }
        } else if (this.knockedBack) {
          this.setAction(BossActor.BULLET_PARAMS_T17[(this.frameGroupIndex / 3) | 0][6] | this.actionHighByte);
        } else if (this.frameGroupIndex === BossActor.BULLET_PARAMS_T17[(this.frameGroupIndex / 3) | 0][3] && this.isAnimationDone()) {
          this.setAction((BossActor.BULLET_PARAMS_T17[(this.frameGroupIndex / 3) | 0][3] - 1) | this.actionHighByte);
        }
        if (this.health > 0) break;
        this.killAndMarkSpawned();
        return;
      }
      case ActorType.DestructibleConsole: {
        switch (this.frameGroupIndex) {
          case 1: {
            if (this.health <= 0) {
              this.canvas.startShake(2);
              this.setAction(3 | this.actionHighByte);
              this.canvas.scene.triggerHitFlags[this.slotIndex] = true;
            } else if (this.health < 2) {
              this.setAction(2 | this.actionHighByte);
            }
            if (!this.collidesWith(this.canvas.player)) break;
            this.canvas.player.onCollide(this);
            break;
          }
          case 2: {
            if (this.health <= 0) {
              this.canvas.startShake(2);
              this.setAction(3 | this.actionHighByte);
              this.canvas.scene.triggerHitFlags[this.slotIndex] = true;
            }
            if (!this.collidesWith(this.canvas.player)) break;
            this.canvas.player.onCollide(this);
            break;
          }
          case 3: {
            if (!this.isAnimationDone()) break;
            this.setAction(4 | this.actionHighByte);
            break;
          }
          case 4: {
            this.layer = 10;
          }
        }
        return;
      }
      case ActorType.FinalBoss: {
        if (this.cP === 0) {
          if (this.collidesWith(this.canvas.player)) {
            if (this.attachedEntity == null) {
              this.attachedEntity = this.canvas.scene.spawnActor(ActorType.GrappleMarker, -1);
              this.attachedEntity!.setAction(5);
              this.attachedEntity!.posX = this.posX;
              this.attachedEntity!.posY = this.posY + ((this.boxTop - 10) << 10);
            }
            this.canvas.player.actionLocked = true;
            if (this.canvas.heldAction !== 16) break;
            this.health = 0;
            this.canvas.player.levelCleared = true;
            return;
          }
          this.canvas.player.actionLocked = false;
          if (this.attachedEntity == null) break;
          this.attachedEntity.kill();
          this.attachedEntity = null;
          return;
        }
        if (this.knockedBack) {
          if (this.posX === this.cN) {
            this.posX += 1024;
          } else {
            this.posX = this.cN;
            this.knockedBack = false;
          }
        }
        if (this.health > 0) break;
        this.killAndMarkSpawned();
        return;
      }
      case ActorType.HelicopterBoss: {
        let n: number;
        let n10: number;
        if (this.dormant) {
          return;
        }
        if (this.frameGroupIndex === 0) {
          let bl = false;
          switch (this.phaseIndex) {
            case 0: {
              if (this.patrolCountdown-- >= 0) break;
              this.canvas.scene.spawnWave();
              this.setAction(this.frameGroupIndex | (this.actionHighByte ^= MIRROR_FLAG));
              this.axisOrPhase ^= 1;
              this.phaseIndex = 1;
              break;
            }
            case 1: {
              if (this.canvas.scene.waveSpawnCount > 0) break;
              this.cP = 32;
              bl = true;
              this.cO = 6;
              this.phaseIndex = 2;
              break;
            }
            case 2: {
              if (this.cP === 26) {
                if (this.cO-- >= 0) break;
                bl = true;
                this.cN = 0;
                this.phaseIndex = 3;
                break;
              }
              bl = true;
              break;
            }
            case 3: {
              let k4: ProjectileActor | null;
              if (this.cN % 4 < 2 && (this.cP > 7 || this.cP < 3) && (k4 = ProjectileActor.spawnProjectile(ActorType.DirectBullet, 12, this.posX, this.posY, 1, null)) != null) {
                k4.targetVelX = 0;
                k4.targetVelY = 8192;
                k4.accelY = 1024;
                k4.maxVelY = 10240;
              }
              if (this.posY < this.canvas.cameraY - 5120) {
                this.posX = this.axisOrPhase > 0 ? this.canvas.cameraX - 30720 : this.canvas.cameraX + this.canvas.viewportWidth + 30720;
                this.patrolCountdown = 20;
                this.phaseIndex = 0;
              } else {
                bl = true;
              }
              ++this.cN;
              this.cN %= 4;
            }
          }
          if (bl) {
            this.targetVelX = this.axisOrPhase > 0 ? -6144 : 6144;
            this.targetVelY = (this.cP - 16) * 512;
            --this.cP;
          } else {
            this.targetVelX = 0;
            this.targetVelY = 0;
          }
          if (!this.knockedBack) break;
          this.targetVelY = 0;
          this.targetVelX = 0;
          this.dormant = true;
          LevelScene.cutsceneState[1] = 4;
          LevelScene.cutsceneState[2] = 1;
          this.canvas.scene.setSubState(LevelSubState.BossScript);
          return;
        }
        this.pendingFire = false;
        if (this.knockedBack) {
          if (this.frameGroupIndex !== 5) {
            this.setAction(5 | this.actionHighByte);
          }
          if (this.isAnimationDone()) {
            this.canvas.scene.cameraTargetCacheX = this.canvas.cameraX;
            this.canvas.scene.cameraTargetCacheY = this.canvas.cameraY;
            LevelScene.cutsceneState[1] = 1;
            LevelScene.cutsceneState[2] = 1;
            this.canvas.scene.setSubState(LevelSubState.BossScript);
            this.killAndMarkSpawned();
          } else {
            n10 = this.posY - ((2 + GameMIDlet.randomBelow(Math.abs(this.boxTop))) << 10);
            n = 0;
            while (n < 2) {
              const n11 = this.posX + ((this.boxRight - GameMIDlet.randomBelow(this.boxRight * 2)) << 10);
              ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, n11, n10, 0, null);
              ++n;
            }
          }
          this.targetVelX = 0;
          if (this.cN === 1) {
            this.pendingFire = true;
          }
          ++this.cN;
        } else {
          if (this.isAnimationDone()) {
            this.setAction(1 | this.actionHighByte);
          }
          if (this.cP-- < 0) {
            this.pendingFire = true;
          }
          if (this.posX < this.rangeMin) {
            this.targetVelX = 0;
            this.posX = this.rangeMin;
          } else if (this.posX > this.rangeMax) {
            this.targetVelX = 0;
            this.posX = this.rangeMax;
          }
          if (this.randomMoveTimer++ > 5) {
            this.randomMoveTimer = 0;
            const n12 = (this.targetVelX = GameMIDlet.randomBelow(2) > 0 ? 4096 : -4096);
            void n12;
          }
        }
        if (!this.pendingFire) break;
        const nArray: number[] = [-12, -28, -42];
        n10 = this.posX + (nArray[this.phaseIndex] << 10);
        n = this.posY - 35840;
        this.targetVelX = 0;
        this.setAction((2 + this.phaseIndex) | this.actionHighByte);
        const k5 = ProjectileActor.spawnProjectile(ActorType.GuidedGrenade, 0, n10, n, 1, null);
        if (this.knockedBack) {
          k5!.isSpecialGrenade = true;
        }
        ++this.phaseIndex;
        this.phaseIndex %= 3;
        if (this.phaseIndex === 0) {
          this.cP = this.cO * 4;
          return;
        }
        this.cP = this.cO;
      }
    }
  }

  /**
   * 请求开火（由外部驱动机关，如普通敌人 {@link EnemyActor} 的 type2 联动炮台）：
   * 若已请求（`pendingFire`）或当前不可开火（`!fireable`）则拒绝返回 false；
   * 否则置 `pendingFire=true`，待下一次 {@link update} 消费并真正发射子弹，返回 true。
   * 对应 CFR c.java:408-414。
   */
  // c() → c_
  requestFire(): boolean {
    if (this.pendingFire || !this.fireable) {
      return false;
    }
    this.pendingFire = true;
    return true;
  }

  /**
   * 被击中判定：仅接受带碰撞分组位 8（玩家子弹）且通过新接触判定 {@link ActorBase.isNewContact} 的来源，
   * 且来源为 type10/type12 子弹。命中后按 `typeId` 扣血 `health -= h2.getDamage()`：
   * 血量归零则生成多簇 type12 爆炸碎片并抖屏（type11/21），未归零则置 `knockedBack=true` 触发击退归位。
   * type11 在玩家高度过高或离相机过远时仅消弹不扣血；type21 在通关锁定态（`cP===0`）仅消弹；
   * type13 仅在帧组 1-3 且子弹带分组位 2 时扣血；type19 仅在特定区域内允许进入击退死亡。
   * @param h2 命中来源 Actor（玩家子弹）
   * @returns 是否消耗/响应了此次命中（true 表示子弹应被吸收）
   * 对应 CFR c.java:416-473。
   */
  // a(tjge.h) → a_Th
  onHitBy(h2: ActorBase): boolean {
    if (!h2.hasCollisionFlag(8) || !this.isNewContact(h2)) {
      return false;
    }
    if (h2.typeId === ActorType.DirectBullet || h2.typeId === ActorType.ExplosionDebris) {
      switch (this.typeId) {
        case ActorType.MobileGunEmplacement: {
          if (h2.posY >= this.posY - 20480 || Math.abs(this.posX - this.canvas.cameraX) > 153600) {
            return true;
          }
        }
        case ActorType.FinalBoss: {
          if (this.typeId === ActorType.FinalBoss && this.cP === 0) {
            return true;
          }
          this.health -= h2.getDamage();
          if (this.health <= 0) {
            let n = 0;
            while (n < 6) {
              let n2 = 30 - GameMIDlet.randomBelow(60);
              let n3 = 16 + GameMIDlet.randomBelow(32);
              ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX + (n2 <<= 10), this.posY - (n3 <<= 10), 2, null);
              ++n;
            }
            this.canvas.startShake(4);
          } else {
            this.knockedBack = true;
          }
          return true;
        }
        case ActorType.PatrolLauncher: {
          this.health -= h2.getDamage();
          if (this.health <= 0) {
            ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX, this.posY, 0, null);
          } else {
            this.knockedBack = true;
          }
          return true;
        }
        case ActorType.DestructibleConsole: {
          if (this.frameGroupIndex <= 0 || this.frameGroupIndex >= 4) break;
          if (h2.hasCollisionFlag(2)) {
            this.health -= h2.getDamage();
          }
          return true;
        }
        case ActorType.HelicopterBoss: {
          this.health -= h2.getDamage();
          if (this.health <= 0 && this.axisOrPhase === 0 && this.posX > this.canvas.cameraX && this.posX < this.canvas.cameraX + this.canvas.viewportWidth - 20480) {
            this.knockedBack = true;
          }
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 存活查询：type21（通关触发器）返回 `health > 0`，其余类型恒返回 true。
   * 供剧情/触发逻辑判断该机关是否仍然有效。
   * 对应 CFR c.java:474-479。
   */
  // d() → d_
  isAlive(): boolean {
    if (this.typeId === ActorType.FinalBoss) {
      return this.health > 0;
    }
    return true;
  }

  /**
   * 为投射物解算抛物线初速：据自身朝向 `actionHighByte` 与到玩家的水平距离，
   * 计算子弹的水平/垂直初速 `targetVelX/targetVelY`、垂直加速度 `accelY` 与最大下落速度 `maxVelY`，
   * 使弹道落向玩家。近距离（`<40960`）走固定弱抛参数，远距离按距离迭代求解抛物初速（上限 15360）。
   * 由 type11 Boss 发射首发子弹时调用（见 {@link update}）。
   * @param k2 待赋初速的子弹，为 null 时直接返回
   * 对应 CFR c.java:481-510。
   */
  // a(tjge.k) → a_Tk
  aimProjectile(k2: ProjectileActor | null): void {
    if (k2 == null) {
      return;
    }
    let n = 0;
    let n2 = 1;
    let n3 = Math.abs(this.canvas.player.posX - k2.posX);
    if (n3 < 40960) {
      k2.targetVelX = this.actionHighByte === 0 ? -2048 : 2048;
      k2.targetVelY = -5120;
      k2.accelY = 2048;
      k2.maxVelY = 10240;
      return;
    }
    const n4 = (n3 / 5120) | 0;
    const n5 = n4 >>> 1;
    let n6 = 0;
    while (n6 < n5) {
      n2 += n6;
      ++n6;
    }
    n3 = (n3 >>> 2) * 3;
    n2 = ((n3 >>> 1) / n2) | 0;
    n = (n5 - 1) * n2;
    n = Math.min(15360, n);
    k2.targetVelX = this.actionHighByte === 0 ? -5120 : 5120;
    k2.targetVelY = -n + 2048;
    k2.accelY = n2;
    k2.maxVelY = n;
  }
}
