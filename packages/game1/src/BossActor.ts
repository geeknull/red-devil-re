/**
 * 游戏1《红魔特种兵》Boss Actor 类（继承自 Actor 基类 g）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/c.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 字段别名（混淆名沿用原版）：
 *   a=所属主控 tjge.a；o=关联的 tjge.h（小兵/同伴）；
 *   b/c/d/e/f/g/h/i/j=状态计数与子状态机变量；
 *   k/l/m/n=布尔标志位（k=被禁用, l=受击闪烁中, m=已触发某段, n=是否绘制）。
 *   基类 g 字段：q=类型ID, t=动作位标志, s=循环动画, B=索引,
 *   C/D=定点坐标(<<10), G/H=水平/垂直速度, M=镜像角度。
 *
 * 跨类方法名按契约表：
 *   a.a_IIIIII(...)→生成 tjge.l 并返回；a.a_III(...)→静态播放音效；
 *   f(tjge.f).e_I(n)→受击；g 基类 a_Tg/a_Tb/c_Tb/d_/a_I/b_；l.a_I/l.b_I。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用；tjge.a.a_III 为静态音效播放
 * （音频后续接入，调用保留）。GameMIDlet.a_I 为随机数。
 */
import { Graphics } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameScreen } from "./GameScreen.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { EnemyActor } from "./EnemyActor.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { ActorType, GameState, MIRROR_FLAG, SEQUENCE_MASK, px } from "./constants.ts";

/**
 * Boss / 触发器演员（游戏1《红魔特种兵》，原 CFR 类 `tjge.c`，继承 ActorBase）。
 *
 * 一个类承载了三种由 `typeId`（基类字段 q）区分的角色：
 *  - **q=14 触发器/点火物**：与玩家相交后切到第 1 帧并标记已触发，倒计时归零时
 *    生成一发 type16 弹幕、自我停用并播音效——本质是关卡脚本里的一次性触发器；
 *  - **q=8 Boss 本体**：关卡 3/6 的多阶段攻防 Boss（phase 0..3 的追踪→准备→冲刺
 *    子状态机），按 attackMode 选择 type20/type21 弹幕；关卡 4 则作为载具/坐骑，
 *    据关联小兵 minion 的存活与 AI 状态联动驱动自身位移；
 *  - **q=17 俯冲/突进物**：从基准位 (homeX,homeY) 向下俯冲撞击玩家或地面，命中后
 *    归位并按 flashCounter 存的子计时静止一段再循环。
 *
 * 血量模型（与 docs 玩法与数值.md「Boss AI」一致）：`health`(原 f) 为每阶段耐久，
 * 构造关卡进入时置 5；`waveCount`(原 g) 为剩余波次（普通 9 / 关卡6=11），每轮血量
 * 耗尽后 `--waveCount` 推进，归零判定死亡；HUD 进度条按
 * `waveCount<6 ? health : health+(waveCount-6)*5` 计算（update case 8）。
 *
 * 关键协作者：`screen`(GameScreen) 用于访问玩家、关卡状态、生成实体与播音效；
 * `minion`(EnemyActor) 仅关卡4 用；受击由 onProjectileHit 结算并触发 hitFlashing 抖动。
 *
 * 逐行移植自 CFR 基准 reverse/game1/2-decompiled-cfr/tjge/c.java（357 行）；
 * 字段/方法语义见 docs/game1-红魔特种兵/类清单与职责.md §4 与 reverse/game1/3-readable/SYMBOLS.md。
 * 仅新增注释，逻辑/数值与原版逐字节一致。
 */
export class BossActor extends ActorBase {
  screen: GameScreen;
  delayTimer: number = 0;
  phase: number = 0;
  subTimer: number = 0;
  attackMode: number = 0;
  health: number = 0;
  waveCount: number = 0;
  flashCounter: number = 0;
  homeX: number = 0;
  homeY: number = 0;
  disabled: boolean = false;
  hitFlashing: boolean = false;
  phaseTriggered: boolean = false;
  visible: boolean = false;
  minion: EnemyActor | null;

  /**
   * 构造 Boss/触发器演员（CFR c.java:36）。
   * @param n 类型 ID（基类 typeId/q，14=触发器 / 8=Boss / 17=俯冲物）
   * @param d2 精灵帧/动画定义（SpriteDef）
   * @param a2 所属主控游戏屏（GameScreen），存入 `screen`
   * 默认可见（visible=true）、无关联小兵（minion=null）；具体状态机初值由 spawnAt 装配。
   */
  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.screen = a2;
    this.minion = null;
    this.visible = true;
  }

  /**
   * 重置/初始化（覆写基类，CFR c.java:43）。按 `typeId` 装配各角色的状态机初值，
   * 从字节参数 `byArray` 读关卡级配置，并把自己注册到 GameScreen 的相应槽位。
   *  - q=14：phase=0、delayTimer=15（触发器初始倒计时）。
   *  - q=8：disabled=byArray[0]===0；若禁用则只把自己挂到玩家 linkedBoss 上即返回；
   *    否则置 health=5、记录 homeX，按关卡（6=特殊：登记为 screen.boss、waveCount=11、
   *    attackMode=1；否则 waveCount=9、attackMode=0）并切到镜像起始帧。
   *  - q=17：从 byArray 读 delayTimer/flashCounter，记录 homeX/homeY，关闭循环动画并切第 3 帧。
   * @param byArray 关卡传入的字节参数（含义随 typeId 而异，见上）
   * @param bl 抑制标志；为 true 时直接返回 false 不初始化
   * @returns 是否完成初始化（bl 为 true 时为 false）
   */
  // a(int,int,int,byte[],boolean) → a_IIIAYZ
  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    this.hitFlashing = false;
    this.visible = true;
    switch (this.typeId) {
      case ActorType.ScriptedFuseTrigger: {
        this.phase = 0;
        this.delayTimer = 15;
        break;
      }
      case ActorType.AtvVehicleBoss: {
        const bl2: boolean = (this.disabled = byArray[0] === 0);
        if (this.disabled) {
          this.screen.player!.linkedBoss = this;
          break;
        }
        this.health = 5;
        this.phase = 0;
        this.subTimer = 0;
        this.delayTimer = 10;
        this.homeX = this.posX;
        if (this.screen.levelIndex === 6) {
          this.screen.boss = this;
          this.waveCount = 11;
          this.attackMode = 1;
        } else {
          this.waveCount = 9;
          this.attackMode = 0;
        }
        this.setFrame(MIRROR_FLAG); // Integer.MIN_VALUE
        break;
      }
      case ActorType.DivingHazard: {
        this.delayTimer = byArray[0];
        this.flashCounter = byArray[1];
        this.subTimer = -1;
        this.homeX = this.posX;
        this.homeY = this.posY;
        this.loopAnimation = false;
        this.setFrame(3);
      }
    }
    return true;
  }

  /**
   * 每帧 AI 主循环（CFR c.java:95）。按 `typeId` 分派：
   *  - q=14：与玩家相交即触发（切第 1 帧并置 phase=1、登记 actorSpawned）；触发后
   *    delayTimer 倒计时归零时生成一发 type16 弹幕、deactivate 并播音效。
   *  - q=8：再按关卡 levelIndex 分支——
   *      · 关卡 3/6：需 scriptFlagL 开启；驱动 HUD 进度指示，处理接触伤害、
   *        血量耗尽后的波次递减/死亡（waveCount<=0→隐藏并进入通关），并跑 phase 0..3
   *        的追踪(0)→开火(1，按 attackMode 发 type21/type20)→准备冲刺(2)→撞墙回身(3) 子状态机；
   *        受击闪烁 hitFlashing 期间做坐标抖动。
   *      · 关卡 4（载具）：据关联 minion 的存活/aiState/落地状态联动调整自身与 minion 速度，
   *        出相机范围则 deactivate。
   *  - q=17：delayTimer 倒计时后，按当前帧 n 推进 俯冲(0)→下落(1，命中玩家或地面切第 2 帧)
   *    →归位(2，回 homeX/homeY 并按 flashCounter 设静止计时)→等待(3，倒计时后回第 0 帧) 循环。
   */
  /*
   * Enabled force condition propagation
   * Lifted jumps to return sites
   */
  // a() → a_
  update(): void {
    const f2: PlayerActor = this.screen.player!;
    const n: number = this.frameIndex & SEQUENCE_MASK;
    switch (this.typeId) {
      case ActorType.ScriptedFuseTrigger: {
        if (this.intersectsActor(f2)) {
          this.phase = 1;
          this.setFrame(1);
          this.screen.levelLoader!.actorSpawned[this.extra] = true;
        }
        if (this.phase !== 1 || this.delayTimer-- >= 0) return;
        this.screen.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.posX, this.posY, 2);
        this.deactivate();
        GameScreen.playSound(5, 1, 220);
        return;
      }
      case ActorType.AtvVehicleBoss: {
        const n2: number = this.screen.cameraX + GameScreen.viewWidthFx;
        switch (this.screen.levelIndex) {
          case 3:
          case 6: {
            if (!this.screen.scriptFlagL) return;
            if (this.delayTimer-- > 0) {
              return;
            }
            if (this.health < 0) {
              this.health = 0;
            }
            this.screen.showIndicator = true;
            const n3: number = (this.screen.indicatorValue = this.waveCount < 6 ? this.health : this.health + (this.waveCount - 6) * 5);
            if (!this.phaseTriggered && this.intersectsActor(f2) && this.health > 0) {
              f2.takeDamage(3);
              if (this.targetVelX === 0) {
                this.phase = 2;
                this.subTimer = 11;
                this.setFrame(-2147483647);
                this.phaseTriggered = true;
              }
            } else if (this.health === 0) {
              if (--this.waveCount < 6) {
                if (this.waveCount <= 0) {
                  this.visible = false;
                  let bl: boolean = false;
                  this.screen.showIndicator = false;
                  if (this.screen.levelIndex !== 6) {
                    bl = true;
                  } else if ((f2.stateFlags & 1) !== 0 && f2.posY > 500000) {
                    bl = true;
                    this.screen.state = GameState.GoalCutscene;
                  }
                  if (!bl) return;
                  this.deactivate();
                  this.screen.scriptFlagL = false;
                  this.screen.levelLoader!.actorSpawned[this.extra] = true;
                  return;
                }
                this.spawnDeathBurst();
                return;
              }
              this.health = 5;
              this.subTimer = 0;
              this.phase = 2;
            }
            if (this.targetVelX !== 0 && this.hitFlashing) {
              this.hitFlashing = false;
              this.flashCounter = 0;
            } else if (this.hitFlashing) {
              const n4: number = (this.posX = this.posX === this.homeX ? this.posX + px(2) : this.homeX);
              if (this.flashCounter++ > 5) {
                this.hitFlashing = false;
                this.flashCounter = 0;
                this.posX = this.homeX;
              }
            }
            switch (this.phase) {
              case 0: {
                this.targetVelX = px(-2);
                if (this.posX >= n2 - px(20)) break;
                this.phase = 1;
                this.targetVelX = 0;
                this.setFrame(-2147483646);
                return;
              }
              case 1: {
                if (this.subTimer++ > 15) {
                  const n5: number = px(35);
                  if (this.attackMode === 0) {
                    const l2: ProjectileActor | null = this.screen.spawnProjectile(ActorType.GuidedMissileProjectile, MIRROR_FLAG, 0, this.posX - n5, this.posY - n5, 1);
                    if (l2 === null) break;
                    l2.targetVelX = px(-12);
                    this.subTimer = 0;
                    if (this.targetVelX === 0) {
                      this.setFrame(-2147483644);
                      return;
                    }
                    this.setFrame(-2147483645);
                    return;
                  }
                  const l3: ProjectileActor | null = this.screen.spawnProjectile(ActorType.FallingBombProjectile, 0, 0, this.posX + px(5), this.posY - n5, 1);
                  if (l3 === null) break;
                  this.subTimer = 0;
                  l3.launchArc(0);
                  if (this.targetVelX > 0) {
                    this.setFrame(-2147483643);
                    return;
                  }
                  this.setFrame(-2147483642);
                  return;
                }
                if (this.targetVelX === 0 && this.isAnimationDone()) {
                  this.setFrame(-2147483646);
                  return;
                }
                if (this.targetVelX <= 0) break;
                if (this.isAnimationDone()) {
                  this.setFrame(MIRROR_FLAG); // Integer.MIN_VALUE
                }
                if (this.posX <= n2 - px(20)) break;
                this.subTimer = 0;
                this.targetVelX = 0;
                if (this.screen.levelIndex !== 6) {
                  this.attackMode = 0;
                }
                this.phaseTriggered = false;
                return;
              }
              case 2: {
                if (this.subTimer++ > 15) {
                  this.subTimer = 0;
                  this.phase = 3;
                  this.targetVelX = px(-10);
                  this.setFrame(MIRROR_FLAG); // Integer.MIN_VALUE
                  return;
                }
                if (!this.isAnimationDone()) break;
                this.setFrame(-2147483647);
                return;
              }
              case 3: {
                if (!this.collideLeftWall(this.screen.tileMap!)) break;
                this.targetVelX = px(4);
                this.phase = 1;
                this.attackMode = 1;
              }
            }
            return;
          }
          case 4: {
            if (this.disabled) return;
            if (this.minion!.active && this.minion!.lives > 0) {
              this.minion!.posX = this.posX - px(23);
              if ((this.posX >= f2.posX || this.posX <= this.screen.cameraX + px(32)) && (this.posX <= f2.posX || this.posX >= this.screen.cameraX + px(182))) return;
              this.targetVelX = this.screen.cameraVelX;
              return;
            }
            if (this.minion!.aiState === 9 && this.minion!.lives <= 0 && this.minion!.targetVelY === 0) {
              this.minion!.targetVelY = px(12);
              this.minion!.targetVelX = 0;
              this.minion!.isPatroller = false;
              this.targetVelX = this.posX > f2.posX ? this.screen.cameraVelX + px(8) : 0;
              return;
            }
            if (this.posX <= this.screen.cameraX + px(206) && this.posX >= this.screen.cameraX - px(30)) return;
            this.deactivate();
            return;
          }
        }
        return;
      }
      case ActorType.DivingHazard: {
        if (this.delayTimer-- > 0) {
          return;
        }
        switch (n) {
          case 0: {
            if (!this.isAnimationDone()) return;
            this.setFrame(1);
            this.targetVelY = px(12);
            return;
          }
          case 1: {
            if (this.intersectsActor(this.screen.player!)) {
              this.screen.player!.takeDamage(1);
              this.setFrame(2);
              this.targetVelY = 0;
              return;
            }
            if (!this.collideGround(this.screen.tileMap!)) return;
            this.setFrame(2);
            return;
          }
          case 2: {
            if (!this.isAnimationDone()) return;
            this.posX = this.homeX;
            this.posY = this.homeY;
            this.subTimer = this.flashCounter;
            this.setFrame(3);
            return;
          }
          case 3: {
            if (this.subTimer-- >= 0) return;
            this.setFrame(0);
          }
        }
      }
    }
  }

  /**
   * 被弹丸命中时的伤害结算（CFR c.java:303），仅对 q=8 Boss 本体且非延迟期生效。
   * 按弹丸类型分别处理：type21 落地子态切换并在 Boss 静止时 -1 血；type10 静止时 -1 血；
   * type15/20 生成 type16 爆炸并销毁该弹丸、静止时 -3 血。任意命中都会触发受击闪烁
   * （hitFlashing 置真并记录当前 X 为 homeX）。
   * @param l2 命中本 Boss 的弹丸（ProjectileActor）
   */
  // a(tjge.l) → a_Tl
  onProjectileHit(l2: ProjectileActor): void {
    if (this.delayTimer > 0 || this.typeId !== ActorType.AtvVehicleBoss) {
      return;
    }
    switch (l2.typeId) {
      case ActorType.GuidedMissileProjectile: {
        if ((l2.frameIndex & SEQUENCE_MASK) !== 0) break;
        l2.setFrame(1);
        l2.targetVelX = 0;
        l2.posY += px(5);
        if (this.targetVelX !== 0) break;
        --this.health;
        break;
      }
      case ActorType.PlayerBounceShot: {
        if (this.targetVelX !== 0) break;
        --this.health;
        break;
      }
      case ActorType.GrenadeProjectile:
      case ActorType.FallingBombProjectile: {
        this.screen.spawnProjectile(ActorType.ExplosionEffect, 0, 0, l2.posX, l2.posY, 0);
        l2.deactivate();
        if (this.targetVelX !== 0) break;
        this.health -= 3;
      }
    }
    if (!this.hitFlashing) {
      this.hitFlashing = true;
      this.homeX = this.posX;
    }
  }

  // f() → f_
  private spawnDeathBurst(): void {
    this.posX = this.posX === this.homeX ? this.homeX + px(2) : this.homeX;
    let n: number = 0;
    let n2: number = this.posX;
    let n3: number = this.posY + px(5);
    do {
      let n4: number = GameMIDlet.nextRandomMod(36);
      n4 = 18 - n4;
      let n5: number = GameMIDlet.nextRandomMod(20);
      n5 = 20 - n5;
      this.screen.spawnProjectile(ActorType.ExplosionEffect, 0, 0, (n2 += n4 << 10), (n3 -= n5 << 10), 2);
    } while (n++ < 1);
    GameScreen.playSound(5, 1, 220);
  }

  /**
   * 绘制（覆写基类，CFR c.java:351）。仅当可见标志 `visible` 为真时调用父类绘制，
   * 死亡淡出/隐藏期（visible=false）跳过，从而让 Boss 不再出现在画面上。
   * @param n 相机 X 偏移（屏幕坐标换算用）
   * @param n2 相机 Y 偏移
   */
  // a(Graphics,int,int) → a_GII
  paint(graphics: Graphics, n: number, n2: number): void {
    if (this.visible) {
      super.paint(graphics, n, n2);
    }
  }
}
