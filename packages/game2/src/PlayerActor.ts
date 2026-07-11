/**
 * 游戏2《红魔特种兵2-深海战舰》玩家 Player Actor 类（继承自 Actor 基类 tjge.h）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/g.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 注意：game2 的 Actor 基类是 h（不是 g）。本类 g 是玩家（最大的 Actor，1181 行）：
 *   移动/跳跃/重力/翻越判定 t_()/武器/输入处理 c_I(键)/动作状态机 r_()。
 *
 * 字段别名（沿用原混淆名）：
 *   静态：a/b=跳跃水平/垂直初速表，c=弹药初值表，d=弹药上限表，e=当前弹药，f=备用弹药，
 *     Q=投掷物冷却队列(4×3)，ak/al/am=武器/手雷发射偏移与动作表。
 *   实例：R=被击退计时，S=动作子计时，T=血量，U=当前武器索引，V=投掷计数，
 *     W=翻越类型，X/Y=翻越目标坐标(定点)，Z=翻越锁定，aa=可跳跃，ab=触发开关待释放，
 *     ac=天花板顶住，ad=空中跳跃中，ae=已完成，af=锁死中，an=私有死亡标志，
 *     ag/ah/ai=公共状态标志，aj=伴随特效(e)。
 *   基类 h 字段：H=朝向(0/Integer.MIN_VALUE)，G=动作位标志，K=阵营位，L=主控 a，
 *     l=动作低 24 位，n=帧索引，o=帧总数，m=播放完毕，j=循环，
 *     p/q=帧水平包围盒，r/s=帧垂直包围盒，u/v=定点坐标，w/x=本帧位移，
 *     y/z=水平/垂直速度，A/B=加速度，C/D=速度上限。
 *
 * 跨类方法名按契约表：
 *   h 基类：g_/a_I(动作)/h_/n_/a_II(查瓦片)/a_AY；
 *   this.L(a)：a_Z(切场景)，字段 c/n/m/q/r，this.L.z(j)：c_II(取实体)/a_I(死亡/胜利)，
 *     字段 w/J/c/n/s/r；tjge.j.a(b).a_()，tjge.j.i 静态 int[]；
 *   tjge.k.a_IIIIIAI 静态生成投掷物；this.aj(e)：c_I/a_I(继承自 h)。
 *
 * 必要偏差：本类原版无资源/音频/像素管线直接调用；System.gc() 原版无；
 *   Integer.MIN_VALUE 以字面量 -2147483648 表示。
 */
import { ActorBase } from "./ActorBase.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ItemActor } from "./ItemActor.ts";
import { LevelScene } from "./LevelScene.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { ActorType, LevelSubState, MIRROR_FLAG, px } from "./constants.ts";

/**
 * 玩家 Actor（游戏2《深海战舰》主角，对应 CFR 基准 reverse/game2/2-decompiled-cfr/tjge/g.java，继承自 Actor 基类 h=ActorBase）。
 *
 * 角色：全游戏体量最大的 Actor，集中实现主角的全部行为——移动/跳跃/重力、墙壁与地面碰撞、
 * 攀爬翻越判定、三种武器与弹药管理、玩家输入解析以及 35+ 动作的状态机迁移。
 * 由 GameCanvas.createActor(0,…) 工厂创建，并被 GameCanvas 持有为玩家单例（原 a.y）。
 *
 * 主循环协作：GameCanvas 每帧依次调用本类的 {@link update}（逻辑帧，跑状态机+处理输入）与
 * {@link step}（物理帧，重力/碰撞/位移），由 LevelScene 调度。
 *
 * 关键字段（详见文件顶部别名表 / reverse/game2/3-readable/SYMBOLS.md）：
 *   静态：弹药表 ammoInitTable/reserveInitTable、当前/备用弹药 ammoCurrent/ammoReserve、
 *     投掷冷却队列 throwCooldownQueue、发射偏移与动作表 bulletSpawnOffsets/grenadeSpawnOffsets/fireActionTable。
 *   实例：health 血量、currentWeaponIndex 当前武器、vaultType/vaultTargetX/vaultTargetY/vaultLocked 翻越状态、
 *     canJump/airborneJumping 跳跃标志、publicFlagA/B/C 对外状态位、companionEffect 入场伴随特效。
 *
 * 协作者：ProjectileActor（发射子弹/手雷）、ItemActor（伴随特效与拾取物）、LevelScene（场景/相位/相机/开关）。
 */
export class PlayerActor extends ActorBase {
  public static readonly jumpVelocityX: Int32Array = Int32Array.from([px(8), px(4), px(8), px(8), px(8), px(8)]);
  public static readonly jumpVelocityY: Int32Array = Int32Array.from([px(-10), px(-10), px(-15), px(-17), px(-15), px(-10)]);
  public static readonly ammoInitTable: Int32Array = Int32Array.from([10, 1, 3]);
  public static readonly reserveInitTable: Int32Array = Int32Array.from([99, 6, 3]);
  public static ammoCurrent: Int32Array = new Int32Array(3);
  public static ammoReserve: Int32Array = new Int32Array(3);
  public static throwCooldownQueue: Int32Array[] = new Array<Int32Array>(4);
  private static bulletSpawnOffsets: number[][];
  private static grenadeSpawnOffsets: number[][];
  private static fireActionTable: number[][][];
  knockbackTimer: number = 0;
  actionSubTimer: number = 0;
  health: number = 0;
  currentWeaponIndex: number = 0;
  inputCounter: number = 0;
  vaultType: number = 0;
  vaultTargetX: number = 0;
  vaultTargetY: number = 0;
  vaultLocked: boolean = false;
  canJump: boolean = false;
  switchPending: boolean = false;
  ceilingBlocked: boolean = false;
  airborneJumping: boolean = false;
  levelCleared: boolean = false;
  actionLocked: boolean = false;
  private dead: boolean = false;
  public publicFlagA: boolean = false;
  public publicFlagB: boolean = false;
  public publicFlagC: boolean = false;
  companionEffect: ItemActor | null = null;

  /**
   * 构造玩家 Actor：调用父类构造（类型 id n + 精灵定义 d2），并将阵营/碰撞掩码位设为 2。
   * @param n 类型 id（玩家为 0）
   * @param d2 动作/动画定义（SpriteDef，来自 a.bin）
   */
  public constructor(n: number, d2: SpriteDef) {
    super(n, d2);
    this.collisionTypeMask = 2;
  }

  /**
   * 从场景字节定义初始化玩家（生命周期入口）：重置翻越状态与各对外标志、武器索引归零、
   * 三种武器弹匣恢复初值、投掷冷却队列清空、血量置 10；再按 byteArray[7] 是否>0 决定
   * 附加入场伴随特效（{@link spawnEntryEffect}）还是直接进入站立态（reserved=1）。
   */
  // a(byte[]) → a_AY
  public spawnFromBytes(byArray: Int8Array): boolean {
    super.spawnFromBytes(byArray);
    this.resetVaultState();
    this.publicFlagA = false;
    this.levelCleared = false;
    this.actionLocked = false;
    this.switchPending = false;
    this.publicFlagB = false;
    this.publicFlagC = false;
    this.currentWeaponIndex = 0;
    PlayerActor.ammoCurrent[0] = PlayerActor.ammoInitTable[0];
    PlayerActor.ammoCurrent[1] = PlayerActor.ammoInitTable[1];
    PlayerActor.ammoCurrent[2] = PlayerActor.ammoInitTable[2];
    PlayerActor.throwCooldownQueue[0][0] = -1;
    PlayerActor.throwCooldownQueue[1][0] = -1;
    PlayerActor.throwCooldownQueue[2][0] = -1;
    PlayerActor.throwCooldownQueue[3][0] = -1;
    this.health = 10;
    if (this.companionEffect != null) {
      this.companionEffect.alive = false;
      this.companionEffect = null;
    }
    if (byArray[7] > 0) {
      this.spawnEntryEffect();
    } else {
      this.companionEffect = null;
      this.reserved = 1;
    }
    return true;
  }

  /**
   * 请求场景生成 18 号伴随特效实体（ItemActor）作为入场特效，令其播放入场动画，
   * 同时把玩家切到入场动作（0x19），并将 reserved 标志置 4（入场相位）。
   */
  // a() → a_
  public spawnEntryEffect(): void {
    this.companionEffect = this.canvas.scene.spawnActor(ActorType.PlayerAttachedEffect, -1) as ItemActor;
    this.companionEffect.applyCommand(0);
    this.companionEffect.setAction(0 | this.actionHighByte);
    this.companionEffect.animLoop = false;
    this.setAction(0x19 | this.actionHighByte);
    this.reserved = 4;
  }

  /**
   * 物理帧（覆写基类 step，主循环每帧调用）：推进动画帧，应用速度/加速度并按上限夹取；
   * 再依 reserved 相位分支处理——攀爬态(bit2)做天花板/地面探测、入场或竖版态(bit4)做相机夹取、
   * 普通态做左右撞墙、落地复位与重力下落 + 翻越驱动({@link updateVaultMotion})；最后在
   * 普通/战斗波相位把玩家水平位置夹在相机视口内，写回 posX/posY，并同步伴随特效。
   */
  // i() → i_
  public step(): void {
    let n: number;
    let n2: number;
    let n3: number;
    this.advanceFrame();
    this.velX = this.targetVelX;
    this.velY = this.targetVelY;
    this.targetVelX += this.accelX;
    if (this.accelX > 0 && this.targetVelX > this.maxVelX) {
      this.targetVelX = this.maxVelX;
    }
    if (this.accelX < 0 && this.targetVelX < -this.maxVelX) {
      this.targetVelX = -this.maxVelX;
    }
    this.targetVelY += this.accelY;
    if (this.accelY > 0 && this.targetVelY > this.maxVelY) {
      this.targetVelY = this.maxVelY;
    }
    if (this.accelY < 0 && this.targetVelY < -this.maxVelY) {
      this.targetVelY = -this.maxVelY;
    }
    if ((this.reserved & 2) != 0) {
      n3 = this.posX >> 13;
      if (this.targetVelY < 0) {
        n2 = (this.posY + this.velY >> 10) - 30 >> 3;
        n = this.tileAt(n3, n2);
        if ((n & 3) != 0) {
          this.velY = (n2 << 13) + px(8) - this.posY;
          this.setAction(0x16 | this.actionHighByte);
          this.ceilingBlocked = true;
        }
      } else if (this.targetVelY > 0 && ((n = this.tileAt(n3, n2 = (this.posY + this.velY >> 10) + 4 >> 3)) & 4) == 0) {
        this.velY = (n2 << 13) - this.posY;
        this.reserved &= 0xFFFFFFFD;
        this.canvas.inputAction = 0;
      }
      this.targetVelY = 0;
    } else if ((this.reserved & 4) != 0) {
      if (this.canvas.scene.isVerticalScrollLevel && !this.publicFlagB) {
        n3 = this.posY + (this.boxTop << 10) + this.velY;
        n2 = this.posY + (this.boxBottom << 10) + this.velY;
        if (n3 < this.canvas.cameraY) {
          this.velY = this.canvas.cameraY - (this.posY + (this.boxTop << 10));
        } else if (n2 > this.canvas.cameraY + (this.canvas.viewportHeight >> 1)) {
          this.velY = this.canvas.cameraY + (this.canvas.viewportHeight >> 1) - (this.posY + (this.boxBottom << 10));
        }
      }
    } else {
      if (this.collideRight() && this.frameGroupIndex == 25) {
        this.setAction(0x10 | this.actionHighByte);
      }
      if (this.collideLeft() && this.frameGroupIndex == 25) {
        this.setAction(0x10 | this.actionHighByte);
      }
      if (this.checkFloorCollision()) {
        this.resetVaultState();
        if ((this.reserved & 1) == 0) {
          this.reserved = 1;
          if (this.frameGroupIndex != 5 && this.frameGroupIndex != 6 && this.frameGroupIndex != 25) {
            this.targetVelX = 0;
            this.setAction(0x10 | this.actionHighByte);
          }
        }
      } else if (!this.collideDown()) {
        if ((this.reserved & 1) != 0) {
          this.knockbackTimer = 1;
          this.velX = this.actionHighByte == 0 ? px(10) : px(-10);
          this.velY = px(6);
          this.targetVelY = px(10);
          this.reserved &= 0xFFFFFFFE;
          this.airborneJumping = false;
          if (this.frameGroupIndex != 5 && this.frameGroupIndex != 6) {
            this.setAction(0x10 | this.actionHighByte);
          }
        } else if (this.frameGroupIndex == 18 || this.frameGroupIndex == 19 || this.frameGroupIndex == 20 || this.frameGroupIndex == 21) {
          this.targetVelY = px(12);
          this.airborneJumping = false;
          this.setAction(0x10 | this.actionHighByte);
        }
        this.accelY = px(4);
        this.updateVaultMotion();
      }
    }
    if (this.canvas.scene.subState == LevelSubState.Normal || this.canvas.scene.subState == LevelSubState.BattleWave) {
      n3 = this.posX + (this.boxLeft << 10) + this.velX;
      n2 = this.posX + (this.boxRight << 10) + this.velX;
      n = this.canvas.cameraX + px(4);
      const n4: number = this.canvas.cameraX + this.canvas.viewportWidth - px(4);
      if (n3 < n) {
        this.velX = n - (this.posX + (this.boxLeft << 10));
      } else if (n2 > n4) {
        this.velX = n4 - (this.posX + (this.boxRight << 10));
      }
    }
    this.posX += this.velX;
    this.posY += this.velY;
    if (this.companionEffect != null) {
      this.companionEffect.applyCommand(0);
      if (!this.companionEffect.alive) {
        this.reserved &= 0xFFFFFFFB;
        this.companionEffect = null;
      }
    }
  }

  /**
   * 推进伴随特效到其下一帧（对 companionEffect 调用 applyCommand(1)）。
   */
  // c() → c_
  public advanceEffectFrame(): void {
    this.companionEffect!.applyCommand(1);
  }

  /**
   * 返回私有死亡标志 dead（供场景/外部查询玩家是否处于 Boss 脚本相位的死亡态）。
   */
  // o() → o_
  public isDead(): boolean {
    return this.dead;
  }

  /**
   * 逻辑帧（覆写基类 update，主循环每帧调用）：先跑动作状态机({@link runActionStateMachine})；
   * 再按关卡子相位分支——BossScript 处理胜利/死亡定身、Normal/BattleWave 在可输入时调
   * {@link handleInput} 解析当前输入并消费 switchPending；非 Boss 相位清除死亡标志；
   * 血量≤0 且非受击/死亡/竖版关时切入死亡动作。
   */
  // b() → b_
  public update(): void {
    this.runActionStateMachine();
    switch (this.canvas.scene.subState) {
      case LevelSubState.BossScript: {
        if ((this.reserved & 4) != 0) {
          this.targetVelX = 0;
          this.targetVelY = 0;
          this.dead = true;
          this.setAction(0x19 | this.actionHighByte);
          break;
        }
        if ((this.reserved & 1) == 0) break;
        this.targetVelX = 0;
        this.dead = true;
        if (this.levelCleared) {
          this.setAction(0x21 | this.actionHighByte);
          break;
        }
        this.setAction(0 | this.actionHighByte);
        break;
      }
      case LevelSubState.Normal:
      case LevelSubState.BattleWave: {
        if (this.canAcceptInput()) {
          this.handleInput(this.canvas.inputAction);
        }
        if (!this.switchPending) break;
        this.switchPending = false;
      }
    }
    if (this.canvas.scene.subState != LevelSubState.BossScript) {
      this.dead = false;
    }
    if (this.health <= 0 && this.frameGroupIndex != 5 && this.frameGroupIndex != 6 && this.frameGroupIndex != 3 && this.frameGroupIndex != 4 && !this.canvas.scene.isVerticalScrollLevel) {
      this.setAction(5 | this.actionHighByte);
    }
  }

  /**
   * 动作状态机核心：按当前动作组 frameGroupIndex 分支，在该动作播放完毕（或到达关键帧）时
   * 迁移到下一动作并维持移动速度——涵盖射击收尾、投雷生成手雷(case 12/13)、跳跃/翻越各阶段、
   * 攀爬上沿、翻滚、受击恢复、死亡及通关结算(case 4 → showResult) 等 35+ 动作。
   */
  // r() → r_
  private runActionStateMachine(): void {
    const n: number = this.actionHighByte == 0 ? 1 : -1;
    switch (this.frameGroupIndex) {
      case 24: {
        if (this.frameIndex > 3) {
          this.checkCollisions();
        }
      }
      case 8:
      case 10:
      case 27:
      case 29:
      case 30:
      case 32: {
        if (!this.isAnimationDone()) break;
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case 7: {
        if (!this.isAnimationDone()) break;
        this.setAction(0x20 | this.actionHighByte);
        return;
      }
      case 12:
      case 13: {
        let n2: number;
        if (this.isAnimationDone()) {
          if (this.frameGroupIndex == 13) {
            this.setAction(2 | this.actionHighByte);
            return;
          }
          this.setAction(0 | this.actionHighByte);
          return;
        }
        if (this.frameIndex != 2) break;
        const n3: number = this.frameGroupIndex == 12 ? 0 : 1;
        const bl: boolean = false;
        const n4: number = 6 | this.actionHighByte;
        const n5: number = this.computeSpawnCoord(PlayerActor.grenadeSpawnOffsets, n3, 0);
        const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(ActorType.DirectBullet, n4, n5, n2 = this.computeSpawnCoord(PlayerActor.grenadeSpawnOffsets, n3, 1), 26, null);
        if (k2 == null) break;
        PlayerActor.ammoCurrent[2] = PlayerActor.ammoCurrent[2] - 1;
        k2.targetVelX = this.actionHighByte == 0 ? px(8) : px(-8);
        k2.targetVelY = -6656;
        k2.accelY = 1128;
        k2.maxVelY = px(15);
        return;
      }
      case 9:
      case 11:
      case 28:
      case 31: {
        if (!this.isAnimationDone()) break;
        this.setAction(2 | this.actionHighByte);
        return;
      }
      case 25: {
        if ((this.reserved & 1) != 0) {
          this.actionSubTimer = 0;
          this.targetVelX = px(8) * n;
          this.setAction(0x17 | this.actionHighByte);
          return;
        }
        if ((this.reserved & 4) != 0) break;
        this.targetVelX = px(8) * n;
        return;
      }
      case 26: {
        if ((this.reserved & 4) == 0) {
          this.targetVelX = px(8) * n;
        }
        if (!this.isAnimationDone()) break;
        this.setAction(0x19 | this.actionHighByte);
        return;
      }
      case 22: {
        if (!this.isAnimationDone()) break;
        if (this.ceilingBlocked) {
          this.posY -= px(8);
          this.reserved &= 0xFFFFFFFD;
          this.setAction(0 | this.actionHighByte);
          this.canvas.inputAction = 0;
          return;
        }
        this.posY += px(24);
        this.setAction(0x12 | this.actionHighByte);
        return;
      }
      case 14:
      case 15:
      case 16: {
        if (this.vaultLocked) {
          this.vaultLocked = false;
          this.canJump = false;
          this.setAction(0x11 | this.actionHighByte);
          return;
        }
        if (this.airborneJumping) {
          this.targetVelX = (this.canJump ? PlayerActor.jumpVelocityX[this.vaultType] : px(5)) * n;
        } else if (--this.knockbackTimer < 0) {
          this.targetVelX = 0;
        }
        if ((this.reserved & 1) != 0) {
          this.targetVelX = 0;
          this.setAction(0 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex == 15 && this.targetVelY > 3120) {
          this.setAction(0x10 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex != 14 || this.targetVelY < 0) break;
        this.setAction(0xF | this.actionHighByte);
        return;
      }
      case 17: {
        if (this.vaultType < 2 || this.vaultType > 3) {
          this.posY += px(-12);
          this.targetVelY = px(-15);
          this.actionSubTimer = 0;
        }
        this.setAction(0x23 | this.actionHighByte);
        return;
      }
      case 35: {
        if (this.actionSubTimer++ > 2) {
          this.setAction(0x10 | this.actionHighByte);
        }
        this.targetVelX = (this.canJump ? px(8) : px(5)) * n;
        return;
      }
      case 23: {
        if (this.actionSubTimer++ <= 4) break;
        if (this.isFootOnGround()) {
          this.setAction(0 | this.actionHighByte);
        } else {
          this.setAction(2 | this.actionHighByte);
        }
        this.targetVelX = 0;
        return;
      }
      case 5:
      case 6: {
        if ((this.reserved & 1) == 0 || !this.isAnimationDone()) break;
        if (this.health <= 0) {
          this.setAction(3 | this.actionHighByte);
          return;
        }
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case 3: {
        if (!this.isAnimationDone()) break;
        this.setAction(4 | this.actionHighByte);
        return;
      }
      case 4: {
        if (!this.isAnimationDone()) break;
        this.canvas.showResult(false);
      }
    }
  }

  /**
   * 推进投掷物冷却队列 throwCooldownQueue（每槽 {指令码, 倒计时, 重复次数}）：找到激活槽位，
   * 倒计时未到则重发该指令、到期则递减重复次数并发空指令，重复用尽时清空该槽并返回其索引；
   * 无槽完成返回 -1。
   */
  // p() → p_
  public stepThrowQueue(): number {
    let n: number = 0;
    while (n < PlayerActor.throwCooldownQueue.length) {
      if (PlayerActor.throwCooldownQueue[n][0] > 0) {
        const nArray: Int32Array = PlayerActor.throwCooldownQueue[n];
        const n2: number = nArray[1];
        nArray[1] = n2 - 1;
        if (n2 > 0) {
          this.handleInput(PlayerActor.throwCooldownQueue[n][0]);
          break;
        }
        const nArray2: Int32Array = PlayerActor.throwCooldownQueue[n];
        nArray2[2] = nArray2[2] - 1;
        if (nArray2[2] < 0) {
          PlayerActor.throwCooldownQueue[n][0] = 0;
          return n;
        }
        this.handleInput(0);
        break;
      }
      ++n;
    }
    return -1;
  }

  /**
   * 输入指令分发：按指令位 n（1=左/2=右/64|128=跳跃翻越/8=下/32=上或开关/16=开火/
   * 1024=手雷/2048=换弹/4096=切武器/其他=松开）结合当前 reserved 相位与动作组，驱动
   * 朝向翻转、移动速度、跳跃翻越({@link probeVault})、攀爬吸附({@link snapToLedge})、
   * 发射子弹/手雷({@link computeSpawnCoord}+ProjectileActor.spawnProjectile)、换弹与切武器等。
   * @param n 输入动作位标志（GameCanvas.inputAction）
   */
  // c(int) → c_I
  private handleInput(n: number): void {
    ++this.inputCounter;
    const n2: number = this.actionHighByte == 0 ? 1 : -1;
    switch (n) {
      case 1: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) {
            if (this.actionHighByte != 0) {
              if (this.frameGroupIndex == 2 && !this.isFootOnGround()) break;
              this.targetVelX = px(-8);
              this.setAction(-2147483647);
              return;
            }
            this.setAction(this.frameGroupIndex | MIRROR_FLAG);
            return;
          }
          if (this.frameGroupIndex != 1) break;
          if (this.actionHighByte == 0) {
            this.targetVelX = 0;
            this.setAction(MIRROR_FLAG);
            return;
          }
          if (this.targetVelX != 0) break;
          this.targetVelX = px(-8);
          return;
        }
        if ((this.reserved & 4) != 0) {
          this.targetVelX = px(-10);
          this.targetVelY = 0;
          return;
        }
        if ((this.reserved & 2) == 0) break;
        if (this.actionHighByte == 0) {
          this.setAction(this.frameGroupIndex | MIRROR_FLAG);
          this.canvas.inputAction = 0;
          return;
        }
        if (this.collideLeft()) break;
        this.airborneJumping = false;
        this.reserved &= 0xFFFFFFFD;
        this.posX -= px(8);
        this.posY += px(8);
        this.targetVelX = px(-8);
        this.targetVelY = px(12);
        this.accelY = px(4);
        this.setAction(-2147483632);
        return;
      }
      case 2: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) {
            if (this.actionHighByte == 0) {
              if (this.frameGroupIndex == 2 && !this.isFootOnGround()) break;
              this.targetVelX = px(8);
              this.setAction(1);
              return;
            }
            this.setAction(this.frameGroupIndex);
            return;
          }
          if (this.frameGroupIndex != 1) break;
          if (this.actionHighByte != 0) {
            this.targetVelX = 0;
            this.setAction(0);
            return;
          }
          if (this.targetVelX != 0) break;
          this.targetVelX = px(8);
          return;
        }
        if ((this.reserved & 4) != 0) {
          this.targetVelX = px(10);
          this.targetVelY = 0;
          return;
        }
        if ((this.reserved & 2) == 0) break;
        if (this.actionHighByte != 0) {
          this.setAction(this.frameGroupIndex);
          this.canvas.inputAction = 0;
          return;
        }
        if (this.collideRight()) break;
        this.airborneJumping = false;
        this.reserved &= 0xFFFFFFFD;
        this.posX += px(8);
        this.posY += px(8);
        this.targetVelX = px(8);
        this.targetVelY = px(12);
        this.accelY = px(4);
        this.setAction(16);
        return;
      }
      case 64:
      case 128: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 2) {
            if (!this.isFootOnGround()) break;
            this.setAction(0 | this.actionHighByte);
            return;
          }
          if (this.actionHighByte == 0 && this.canvas.inputAction == 64) {
            this.setAction(this.frameGroupIndex | MIRROR_FLAG);
            return;
          }
          if (this.actionHighByte != 0 && this.canvas.inputAction == 128) {
            this.setAction(this.frameGroupIndex);
            return;
          }
          this.vaultType = this.probeVault();
          if (this.vaultType == 2 || this.vaultType == 3) {
            this.canJump = false;
            this.posX = this.vaultTargetX;
            this.setAction(0x11 | this.actionHighByte);
          } else {
            if (this.vaultType == 5) {
              this.canJump = false;
            }
            this.posY -= px(5);
            this.setAction(0xE | this.actionHighByte);
          }
          this.targetVelX = PlayerActor.jumpVelocityX[this.vaultType] * n2;
          this.targetVelY = PlayerActor.jumpVelocityY[this.vaultType];
          this.airborneJumping = true;
          this.accelY = px(4);
          this.canvas.inputAction = 0;
          this.reserved &= 0xFFFFFFFE;
          return;
        }
        if ((this.reserved & 4) != 0) {
          this.targetVelY = px(-6);
          return;
        }
        if (this.frameGroupIndex != 14 && this.frameGroupIndex != 15 || !this.canJump || this.vaultTargetX >= 0 || this.vaultTargetY >= 0) break;
        this.posY -= px(20);
        this.targetVelY = px(-5);
        this.canJump = false;
        this.setAction(0x19 | this.actionHighByte);
        return;
      }
      case 8: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 2) {
            this.actionSubTimer = 0;
            this.targetVelX = px(8) * n2;
            this.setAction(0x17 | this.actionHighByte);
            return;
          }
          if (this.snapToLedge(1)) {
            this.reserved = 2;
            this.accelY = 0;
            this.posY += px(24);
            this.ceilingBlocked = false;
            this.setAction(0x16 | this.actionHighByte);
            return;
          }
          this.targetVelX = 0;
          this.setAction(2 | this.actionHighByte);
          this.canvas.inputAction = 0;
          return;
        }
        if ((this.reserved & 2) != 0) {
          this.targetVelY = px(4);
          this.setAction(21 - (21 - this.frameGroupIndex + 1) % 4 | this.actionHighByte);
          return;
        }
        if ((this.reserved & 4) == 0) break;
        this.targetVelY = px(6);
        return;
      }
      case 32: {
        if ((this.reserved & 4) != 0) {
          this.targetVelY = px(-6);
          return;
        }
        if ((this.reserved & 2) != 0) {
          this.targetVelY = px(-4);
          this.setAction(18 + (this.frameGroupIndex - 18 + 1) % 4 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex == 2) {
          if (this.isFootOnGround()) {
            this.setAction(0 | this.actionHighByte);
          }
          return;
        }
        if (this.triggerSwitch(false)) {
          return;
        }
        if (this.snapToLedge(0)) {
          this.reserved = 2;
          this.targetVelY = px(-8);
          this.accelY = 0;
          this.setAction(0x12 | this.actionHighByte);
          return;
        }
      }
      case 16: {
        let n3: number;
        let n4: number;
        if (this.actionLocked) {
          return;
        }
        if (this.canvas.inputAction == 32 && (this.reserved & 1) != 0) {
          this.targetVelX = 0;
          n4 = 0;
        } else if (this.frameGroupIndex == 0) {
          this.targetVelX = 0;
          n4 = 1;
        } else if (this.frameGroupIndex == 2) {
          this.targetVelX = 0;
          n4 = 2;
        } else if (this.frameGroupIndex == 25) {
          n4 = 3;
        } else {
          return;
        }
        if (this.canvas.scene.isVerticalScrollLevel) {
          if (this.inputCounter < 5) {
            return;
          }
          this.currentWeaponIndex = 0;
          n3 = -2147483637;
          this.inputCounter = 0;
        } else {
          if (PlayerActor.ammoCurrent[this.currentWeaponIndex] <= 0) {
            this.setAction(PlayerActor.fireActionTable[this.currentWeaponIndex][n4][2] | this.actionHighByte);
            return;
          }
          n3 = PlayerActor.fireActionTable[this.currentWeaponIndex][n4][0] | this.actionHighByte;
        }
        const bl: boolean = false;
        const n5: number = this.computeSpawnCoord(PlayerActor.bulletSpawnOffsets, n4, 0);
        const n6: number = this.computeSpawnCoord(PlayerActor.bulletSpawnOffsets, n4, 1);
        const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(ActorType.DirectBullet, n3, n5, n6, 26, null);
        if (k2 == null) break;
        if (!k2.hitWall) {
          switch (n4) {
            case 0: {
              k2.targetVelY = px(-12);
              break;
            }
            case 1:
            case 2: {
              k2.targetVelX = px(12) * n2;
              break;
            }
            case 3: {
              k2.targetVelX = px(12) * n2;
              k2.targetVelY = px(12);
            }
          }
        }
        this.setAction(PlayerActor.fireActionTable[this.currentWeaponIndex][n4][1] | this.actionHighByte);
        if (this.canvas.scene.isVerticalScrollLevel) {
          k2.targetVelX = px(4);
          k2.targetVelY = px(6);
          k2.accelY = px(2);
          k2.isSpecialGrenade = true;
        } else {
          const n7: number = this.currentWeaponIndex;
          PlayerActor.ammoCurrent[n7] = PlayerActor.ammoCurrent[n7] - 1;
        }
        this.canvas.inputAction = 0;
        return;
      }
      case 1024: {
        if ((this.reserved & 1) == 0 || PlayerActor.ammoCurrent[2] <= 0) break;
        if (this.frameGroupIndex == 0) {
          this.setAction(0xC | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex != 2) break;
        this.setAction(0xD | this.actionHighByte);
        return;
      }
      case 2048: {
        if ((this.reserved & 1) == 0 || this.frameGroupIndex != 0 && this.frameGroupIndex != 2 || !this.reloadCurrentWeapon()) break;
        if (this.frameGroupIndex == 0) {
          this.setAction(0x1E | this.actionHighByte);
        } else {
          this.setAction(0x1F | this.actionHighByte);
        }
        this.targetVelX = 0;
        return;
      }
      case 4096: {
        let n8: number;
        if ((this.reserved & 1) != 0 && (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) && PlayerActor.ammoCurrent[n8 = (this.currentWeaponIndex + 1) % 2] + PlayerActor.ammoReserve[n8] > 0) {
          this.currentWeaponIndex = n8;
          this.reloadCurrentWeapon();
          this.setAction((this.frameGroupIndex == 0 ? 30 : 31) | this.actionHighByte);
        }
        this.canvas.inputAction = 0;
        return;
      }
      default: {
        if (this.frameGroupIndex == 1) {
          this.targetVelX = 0;
          this.setAction(0 | this.actionHighByte);
          return;
        }
        if ((this.reserved & 4) == 0) break;
        this.targetVelX = 0;
        this.targetVelY = 0;
      }
    }
  }

  // s() → s_
  private reloadCurrentWeapon(): boolean {
    if (PlayerActor.ammoCurrent[this.currentWeaponIndex] < PlayerActor.ammoInitTable[this.currentWeaponIndex] && PlayerActor.ammoReserve[this.currentWeaponIndex] > 0) {
      const n: number = PlayerActor.ammoInitTable[this.currentWeaponIndex] - PlayerActor.ammoCurrent[this.currentWeaponIndex];
      if (PlayerActor.ammoReserve[this.currentWeaponIndex] >= n) {
        if (this.currentWeaponIndex != 0) {
          const n2: number = this.currentWeaponIndex;
          PlayerActor.ammoReserve[n2] = PlayerActor.ammoReserve[n2] - n;
        }
        const n3: number = this.currentWeaponIndex;
        PlayerActor.ammoCurrent[n3] = PlayerActor.ammoCurrent[n3] + n;
      } else {
        const n4: number = this.currentWeaponIndex;
        PlayerActor.ammoCurrent[n4] = PlayerActor.ammoCurrent[n4] + PlayerActor.ammoReserve[this.currentWeaponIndex];
        PlayerActor.ammoReserve[this.currentWeaponIndex] = 0;
      }
      return true;
    }
    return false;
  }

  /**
   * 被另一 Actor 命中的碰撞回调：校验对方带攻击位、自身非翻滚态且为新接触后，按对方类型 id
   * 判定伤害——敌人子弹/手雷直接 {@link takeDamage}；近战敌人(7号动作)先把玩家顶开再扣血；
   * 4 号造成固定 3 点伤害。返回是否消耗本次命中。
   */
  // a(tjge.h) → a_Th
  public onHitBy(h2: ActorBase): boolean {
    if (!h2.hasCollisionFlag(1) || this.frameGroupIndex == 23 || !this.isNewContact(h2)) {
      return false;
    }
    switch (h2.typeId) {
      case ActorType.GuidedGrenade:
      case ActorType.DirectBullet:
      case ActorType.ExplosionDebris: {
        this.takeDamage(h2.getDamage(), h2.actionHighByte);
        return true;
      }
      case ActorType.RiflemanGrunt:
      case ActorType.GrenadierGrunt: {
        if (h2.frameGroupIndex != 7) break;
        this.velX = 0;
        if (h2.actionHighByte == 0) {
          if (!this.collideRight()) {
            this.posX += px(8);
          }
        } else if (!this.collideLeft()) {
          this.posX -= px(8);
        }
        this.takeDamage(h2.getDamage(), h2.actionHighByte);
        break;
      }
      case ActorType.SentryGrunt: {
        this.takeDamage(3, h2.actionHighByte);
      }
    }
    return false;
  }

  /**
   * 与另一 Actor 接触的碰撞回调：对 1-5 号实体在翻滚落地态触发格挡反击动作；对 11/13 号
   * （同朝向的实体障碍）把玩家位置贴靠对齐到对方包围盒边缘。
   */
  // c(tjge.h) → c_Th
  public onCollide(h2: ActorBase): void {
    switch (h2.typeId) {
      case ActorType.RiflemanGrunt:
      case ActorType.VehicleGunner:
      case ActorType.GrenadierGrunt:
      case ActorType.SentryGrunt:
      case ActorType.TurretEmplacement: {
        if (this.frameGroupIndex != 23 || (this.reserved & 1) == 0 || !this.isFootOnGround()) break;
        this.targetVelX = 0;
        this.setAction(0x18 | this.actionHighByte);
        return;
      }
      case ActorType.MobileGunEmplacement:
      case ActorType.DestructibleConsole: {
        const n: number = h2.actionHighByte == 0 ? h2.posX + (h2.boxLeft << 10) : h2.posX + (h2.boxRight << 10);
        if (this.actionHighByte != h2.actionHighByte) break;
        if (this.actionHighByte == 0) {
          this.posX = n - (this.boxRight << 10);
          return;
        }
        this.posX = n - (this.boxLeft << 10);
      }
    }
  }

  /**
   * 扣血并触发受击反应：仅在 Normal/BattleWave 相位生效，按当前态（站立/攀爬/空中/入场）
   * 切换受击、格挡或死亡动作并施加击退；Boss 战相位坠落致死则置 publicFlagC 并切过场相位。
   * @param n 伤害值
   * @param n2 攻击来源朝向（与自身朝向比较以决定正/背面受击动作）
   */
  // c(int,int) → c_II
  private takeDamage(n: number, n2: number): void {
    if (this.health <= 0 || n <= 0) {
      return;
    }
    if (this.canvas.scene.subState != LevelSubState.Normal && this.canvas.scene.subState != LevelSubState.BattleWave) {
      return;
    }
    this.health -= n;
    this.targetVelX = 0;
    if ((this.reserved & 1) != 0) {
      if (this.isFootOnGround()) {
        if (n2 == this.actionHighByte) {
          this.setAction(6 | this.actionHighByte);
        } else {
          this.setAction(5 | this.actionHighByte);
        }
      } else if (this.health <= 0) {
        this.setAction(3 | this.actionHighByte);
      }
    } else if ((this.reserved & 2) != 0) {
      this.reserved &= 0xFFFFFFFD;
      this.setAction(5 | this.actionHighByte);
    } else {
      if ((this.reserved & 4) != 0) {
        this.targetVelY = 0;
        if (this.health <= 0) {
          this.publicFlagC = true;
          LevelScene.cutsceneState[1] = 2;
          this.canvas.scene.setSubState(LevelSubState.Cutscene);
        }
        return;
      }
      this.targetVelY = px(6);
      this.accelY = px(4);
      this.setAction(5 | this.actionHighByte);
    }
    this.canJump = false;
    this.vaultLocked = false;
    this.airborneJumping = false;
    this.vaultTargetX = -1;
    this.vaultTargetY = -1;
  }

  /**
   * 前方可攀爬/翻越面探测（CFR 已恢复，对应 g.java:857-920）：据朝向 actionHighByte 取身前一列
   * 网格，自碰撞箱顶端向下扫一段行，按首个实心瓦片的相对高度分类返回翻越类别码
   * （0=无 / 1=贴墙攀爬 / 2,3,4=不同翻越动作 / 5=过高挡住）；可翻越时写入落点 vaultTargetX/Y。
   * 返回值由 {@link runActionStateMachine} 与 {@link updateVaultMotion} 消费、并索引跳跃速度表。
   */
  // t() → t_
  private probeVault(): number {
    let stepDir: number;
    let farOffset: number;
    let nearOffset: number;
    if (this.actionHighByte == 0) {
      nearOffset = this.boxRight;
      farOffset = this.boxRight + 10;
      stepDir = 1;
    } else {
      nearOffset = this.boxLeft;
      farOffset = this.boxLeft - 10;
      stepDir = -1;
    }
    const colStart: number = (this.posX >> 10) + nearOffset >> 3;
    const colEnd: number = (this.posX + this.velX >> 10) + farOffset >> 3;
    const rowBottom: number = (this.posY + this.velY >> 10) - 2 >> 3;
    const rowTop: number = rowBottom - 7;
    let col: number = colStart;
    while (col != colEnd + stepDir) {
      let row: number = rowTop;
      while (row <= rowBottom) {
        const tile: number = this.tileAt(col, row);
        if ((tile & 3) != 0) {
          const hitHeight: number = row - rowTop;
          switch (hitHeight) {
            case 0: {
              return 5;
            }
            case 1:
            case 2: {
              if ((this.reserved & 1) == 0) {
                return 5;
              }
            }
            case 3:
            case 4: {
              const behindTile: number = this.tileAt(col - stepDir, row);
              const aboveTile: number = this.tileAt(col, row - 1);
              if (behindTile == 0 && aboveTile == 0) {
                this.vaultTargetX = stepDir > 0 ? col << 13 : (col << 3) + 8 << 10;
                this.vaultTargetX += this.actionHighByte == 0 ? px(-10) : px(10);
                this.vaultTargetY = (row << 13) + px(40);
                if (hitHeight < 3) {
                  return 4;
                }
                if (hitHeight < 4) {
                  return 3;
                }
                return 2;
              }
              return 4;
            }
            case 5:
            case 6: {
              return 1;
            }
          }
        }
        ++row;
      }
      col += stepDir;
    }
    return 0;
  }

  /**
   * 自动翻越/攀爬执行（CFR g.java:922-951）：需处于已贴面且按住（canJump && airborneJumping）；
   * 先 {@link snapToLedge} 检测正上方可站立面则直接转爬态，否则在无目标点时调 {@link probeVault} 求点，
   * 一旦目标点有效即把本帧位移朝 vaultTargetX/Y 插值靠拢并置 vaultLocked 锁定。
   */
  // u() → u_
  private updateVaultMotion(): void {
    if (!this.canJump || !this.airborneJumping) {
      return;
    }
    if (this.snapToLedge(0)) {
      this.targetVelY = 0;
      this.accelY = 0;
      this.reserved = 2;
      this.setAction(0x12 | this.actionHighByte);
      return;
    }
    if (this.vaultTargetX < 0 && this.vaultTargetY < 0) {
      this.probeVault();
    }
    if (this.vaultTargetX >= 0 && this.vaultTargetY >= 0) {
      if (Math.abs(this.posY - this.vaultTargetY) <= Math.abs(this.velY)) {
        if (!this.isVaultBlocked()) {
          this.velX = this.vaultTargetX - this.posX;
          this.velY = this.vaultTargetY - this.posY;
          this.targetVelX = 0;
          this.targetVelY = 0;
          this.vaultLocked = true;
          return;
        }
      } else if (Math.abs(this.posX - this.vaultTargetX) <= Math.abs(this.velX)) {
        this.targetVelX = 0;
        this.velX = 0;
      }
    }
  }

  // d(int) → d_I
  private snapToLedge(mode: number): boolean {
    let col: number = this.posX + this.velX >> 13;
    const probeTop: number = mode == 0 ? this.boxTop : 10;
    const row: number = (this.posY >> 10) + probeTop >> 3;
    if (this.tileAt(col, row) == 4) {
      while (this.tileAt(--col, row) == 4) {
      }
      this.posX = (col << 3) + 16 << 10;
      this.targetVelX = 0;
      this.velX = 0;
      return true;
    }
    return false;
  }

  /**
   * 向下（上行）碰撞检测（覆写基类）：仅当垂直速度 ≤0 时沿碰撞箱顶向上扫瓦片，命中实心则
   * 清零垂直速度、夹取位置并返回 true；否则置重力加速度并返回 false。
   */
  // l() → l_
  public collideDown(): boolean {
    if (this.velY > 0) {
      return false;
    }
    const topRow: number = (this.posY >> 10) + this.boxTop >> 3;
    const nextTopRow: number = (this.posY + this.velY >> 10) + this.boxTop >> 3;
    const col: number = this.posX + this.velX >> 13;
    let row: number = topRow;
    while (row >= nextTopRow) {
      const tile: number = this.tileAt(col, row);
      if ((tile & 3) != 0) {
        this.targetVelY = 0;
        this.velY = ((row << 3) + 9 << 10) - (this.posY + (this.boxTop << 10));
        return true;
      }
      --row;
    }
    this.accelY = px(4);
    return false;
  }

  /**
   * 地面探测（PlayerActor 自有方法，区别于基类 collideDown）：仅当垂直速度 ≥0 时沿碰撞箱底
   * 向下扫瓦片，命中实心地面则清零垂直速度、夹取落地位置返回 true；否则置重力返回 false。
   */
  // q() → q_
  public checkFloorCollision(): boolean {
    if (this.velY < 0) {
      return false;
    }
    const bottomRow: number = (this.posY >> 10) + this.boxBottom >> 3;
    const nextBottomRow: number = (this.posY + this.velY >> 10) + this.boxBottom >> 3;
    let row: number = bottomRow;
    while (row <= nextBottomRow) {
      const leftCol: number = (this.posX + this.velX >> 10) - 3 >> 3;
      const centerCol: number = this.posX + this.velX >> 10 >> 3;
      const rightCol: number = (this.posX + this.velX >> 10) + 3 >> 3;
      let tile: number = this.tileAt(centerCol, row);
      if ((tile & 3) != 0) {
        tile = this.tileAt(leftCol, row);
        const rightTile: number = this.tileAt(rightCol, row);
        if ((tile & 3) != 0 && (rightTile & 3) != 0) {
          this.targetVelY = 0;
          this.velY = (row << 13) - (this.posY + (this.boxBottom << 10));
          return true;
        }
      }
      ++row;
    }
    this.accelY = px(4);
    return false;
  }

  /**
   * 向左碰撞检测（覆写基类）：仅当水平速度 ≤0 时沿碰撞箱左缘扫瓦片，撞实心墙则清零水平速度、
   * 夹取位置返回 true，否则返回 false。
   */
  // j() → j_
  public collideLeft(): boolean {
    if (this.velX > 0) {
      return false;
    }
    const destCol: number = (this.posX + this.velX >> 10) + this.boxLeft >> 3;
    const startCol: number = (this.posX >> 10) + this.boxLeft >> 3;
    const topRow: number = (this.posY >> 10) + this.boxTop + 2 >> 3;
    const bottomRow: number = (this.posY >> 10) + this.boxBottom - 4 >> 3;
    let row: number = topRow;
    while (row <= bottomRow) {
      let col: number = startCol;
      while (col >= destCol) {
        const tile: number = this.tileAt(col, row);
        if ((tile & 3) != 0) {
          this.targetVelX = 0;
          this.posX &= 0xFFFFFC00;
          this.velX = ((col << 3) + 8 << 10) - (this.posX + (this.boxLeft << 10));
          return true;
        }
        --col;
      }
      ++row;
    }
    return false;
  }

  /**
   * 向右碰撞检测（覆写基类）：仅当水平速度 ≥0 时沿碰撞箱右缘扫瓦片，撞实心墙则清零水平速度、
   * 夹取位置返回 true，否则返回 false。
   */
  // k() → k_
  public collideRight(): boolean {
    if (this.velX < 0) {
      return false;
    }
    const startCol: number = (this.posX >> 10) + this.boxRight >> 3;
    const destCol: number = (this.posX + this.velX >> 10) + this.boxRight >> 3;
    const topRow: number = (this.posY >> 10) + this.boxTop + 2 >> 3;
    const bottomRow: number = (this.posY >> 10) + this.boxBottom - 4 >> 3;
    let row: number = topRow;
    while (row <= bottomRow) {
      let col: number = startCol;
      while (col <= destCol) {
        const tile: number = this.tileAt(col, row);
        if ((tile & 3) != 0) {
          this.targetVelX = 0;
          this.posX &= 0xFFFFFC00;
          this.velX = ((col << 3) - 1 << 10) - (this.posX + (this.boxRight << 10));
          return true;
        }
        ++col;
      }
      ++row;
    }
    return false;
  }

  // v() → v_
  private canAcceptInput(): boolean {
    return this.health > 0 && !this.levelCleared && (this.frameGroupIndex == 0 || this.frameGroupIndex == 1 || this.frameGroupIndex == 2 || this.frameGroupIndex == 30 || this.frameGroupIndex == 31 || this.frameGroupIndex == 18 || this.frameGroupIndex == 19 || this.frameGroupIndex == 20 || this.frameGroupIndex == 21 || this.frameGroupIndex == 25 || this.frameGroupIndex == 14 || this.frameGroupIndex == 15 || this.frameGroupIndex == 32);
  }

  // a(int[][],int,int) → a_AAIII
  private computeSpawnCoord(offsetTable: number[][], slot: number, axis: number): number {
    let dir: number = 1;
    if (this.actionHighByte != 0) {
      dir = -1;
    }
    let coord: number = 0;
    if (axis == 0) {
      coord = (offsetTable[slot][axis] << 10) * dir;
      coord += this.posX;
    } else {
      coord = offsetTable[slot][axis] << 10;
      coord += this.posY;
    }
    return coord;
  }

  /**
   * 返回当前动作造成的近战伤害值（动作组 24 的翻滚撞击为 10，其余为 0）。
   */
  // m() → m_
  public getDamage(): number {
    switch (this.frameGroupIndex) {
      case 24: {
        return 10;
      }
    }
    return 0;
  }

  // w() → w_
  private isFootOnGround(): boolean {
    const col: number = this.posX >> 13;
    const topRow: number = (this.posY >> 10) + this.boxTop >> 3;
    let offset: number = 2;
    while (offset >= 0) {
      const tile: number = this.tileAt(col, topRow - offset);
      if ((tile & 3) != 0) break;
      --offset;
    }
    return offset < 0;
  }

  // x() → x_
  private isVaultBlocked(): boolean {
    const col: number = this.posX >> 13;
    const bottomRow: number = (this.posY + this.velY >> 10) + this.boxBottom >> 3;
    let offset: number = 0;
    while (offset < 2) {
      const tile: number = this.tileAt(col, bottomRow + offset);
      if ((tile & 3) != 0) break;
      ++offset;
    }
    return offset < 2;
  }

  /**
   * 关卡终点开关交互：传 true 仅标记 switchPending 待触发；传 false 时若已待触发且玩家站立，
   * 则切入通关动作并通知场景进入过场出场相位（TransitionOut），返回是否完成触发。
   */
  // a(boolean) → a_Z
  public triggerSwitch(bl: boolean): boolean {
    if (bl) {
      this.switchPending = true;
    } else if (this.switchPending && (this.reserved & 1) != 0) {
      this.targetVelX = 0;
      this.setAction(0x21 | this.actionHighByte);
      this.canvas.scene.setSubState(LevelSubState.TransitionOut);
      return true;
    }
    return false;
  }

  /**
   * 按瓦片坐标 (n,n2) 设置玩家定点世界位置（<<14），切回站立动作并重置相机已绘边界。
   */
  // b(int,int) → b_II
  public setTilePosition(n: number, n2: number): void {
    this.posX = n << 14;
    this.posY = n2 << 14;
    this.setAction(0 | this.actionHighByte);
    LevelScene.camera.resetDrawnBounds();
  }

  // y() → y_
  private resetVaultState(): void {
    this.vaultTargetX = -1;
    this.vaultTargetY = -1;
    this.airborneJumping = false;
    this.vaultLocked = false;
    this.canJump = true;
    this.vaultType = 0;
  }

  /**
   * 应用拾取物效果：按道具 ItemActor 的动作组（0=备用子弹 / 1=手雷 / 2=回血）增加对应资源
   * 并夹取上限（备用弹药≤99、手雷≤3、血量≤10）。
   */
  // a(tjge.e) → a_Te
  public applyPickup(e2: ItemActor): void {
    switch (e2.frameGroupIndex) {
      case 0: {
        PlayerActor.ammoReserve[1] = PlayerActor.ammoReserve[1] + e2.counter;
        PlayerActor.ammoReserve[1] = Math.min(99, PlayerActor.ammoReserve[1]);
        return;
      }
      case 1: {
        PlayerActor.ammoCurrent[2] = PlayerActor.ammoCurrent[2] + e2.counter;
        PlayerActor.ammoCurrent[2] = Math.min(3, PlayerActor.ammoCurrent[2]);
        return;
      }
      case 2: {
        this.health += e2.counter;
        this.health = Math.min(10, this.health);
      }
    }
  }

  // static {}
  static {
    PlayerActor.throwCooldownQueue[0] = new Int32Array(3);
    PlayerActor.throwCooldownQueue[1] = new Int32Array(3);
    PlayerActor.throwCooldownQueue[2] = new Int32Array(3);
    PlayerActor.throwCooldownQueue[3] = new Int32Array(3);
    PlayerActor.ammoReserve[0] = PlayerActor.reserveInitTable[0];
    PlayerActor.ammoReserve[1] = PlayerActor.reserveInitTable[1];
    PlayerActor.ammoReserve[2] = PlayerActor.reserveInitTable[2];
    PlayerActor.bulletSpawnOffsets = [[-2, -56], [28, -26], [28, -16], [30, 11]];
    PlayerActor.grenadeSpawnOffsets = [[0, -32], [0, -24]];
    PlayerActor.fireActionTable = [
      [[0, 7, 29], [1, 8, 27], [1, 9, 28], [2, 26, 25]],
      [[3, 7, 29], [4, 10, 27], [4, 11, 28], [5, 26, 25]],
    ];
  }
}
