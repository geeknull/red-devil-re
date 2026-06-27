/**
 * 游戏1《红魔特种兵》敌人 Actor 类（继承自 Actor 基类 g）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/h.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 字段别名（混淆名沿用原版）：
 *   W=所属主控 tjge.a；V=玩家/目标 tjge.f；X=关联的 tjge.e（伴随特效）；
 *   a/b=计时计数；c=巡逻基准 x；d/e=巡逻范围与方向；f/g=可攻击的垂直区间（上/下界, 定点）；
 *   h=血量/连击数；i/j=巡逻左右边界(定点)；k=朝向标志位(0 / Integer.MIN_VALUE)；
 *   l=节奏阈值；m=剩余命数；n=动作低 24 位；o=AI 子状态；O=攻击模式；P=受击闪烁计时；
 *   Q/R/S/T/U=布尔标志（Q=连击切换, R=被击退中, S=已进入瞄准, T=巡逻模式, U=刷怪点产生）。
 *   基类 g 字段：q=类型ID, s=循环动画, t=动作位标志, B=索引,
 *   C/D=定点坐标(<<10), G/H=水平/垂直速度, N=绘制旋转参数, M=镜像角度。
 *
 * 跨类方法名按契约表：
 *   a.a_IIIIII(...)→生成 tjge.l 并返回；a.b_IIIIII(...)→生成实体；a.a_III(...)→静态音效；
 *   f(tjge.f).a_I/e_I/a_TbI/b_TbI；l.a_Z/l.a_I/l.b_I；e(tjge.e).b_；
 *   g 基类 a_Tg/a_Tb/a_I/b_/d_；GameMIDlet.a_I 为随机数。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用；tjge.a.a_III 为静态音效播放
 * （音频后续接入，调用保留）。
 */
import { Graphics } from "@red-devil/j2me-shim";
import { ActorType, GameState, MIRROR_FLAG, SEQUENCE_MASK, FACING_MASK, px } from "./constants.ts";
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameScreen } from "./GameScreen.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { EffectActor } from "./EffectActor.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { ProjectileActor } from "./ProjectileActor.ts";

export class EnemyActor extends ActorBase {
  timerA: number = 0;
  timerB: number = 0;
  patrolBaseX: number = 0;
  patrolRange: number = 0;
  patrolDir: number = 0;
  attackRangeUpper: number = 0;
  attackRangeLower: number = 0;
  hitPoints: number = 0;
  patrolLeftBound: number = 0;
  patrolRightBound: number = 0;
  facingFlag: number = 0;
  rhythmThreshold: number = 0;
  lives: number = 0;
  actionLow24: number = 0;
  aiState: number = 0;
  attackMode: number = 0;
  hurtBlinkTimer: number = 0;
  comboToggle: boolean = false;
  knockedBack: boolean = false;
  aiming: boolean = false;
  isPatroller: boolean = false;
  fromSpawner: boolean = false;
  target!: PlayerActor;
  screen: GameScreen;
  trailEffect: EffectActor | null = null;

  /**
   * 构造敌人实例（CFR h.java:46 `h(int,d,a)`）。
   * 由关卡加载器 LevelLoader（CFR tjge.j）从 s.bin 布置数据创建并填入实例池。
   * @param n      类型 ID（透传给基类 ActorBase；1/2=地面敌、18=Boss）
   * @param d2     精灵帧定义（SpriteDef，对应 tjge.d）
   * @param a2     所属关卡屏 GameScreen，存入 {@link screen}
   */
  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.screen = a2;
  }

  /**
   * 投放/初始化敌人到关卡（CFR h.java:51 `a(int,int,int,byte[],boolean)`）。
   * 重置全部计时/标志，绑定目标玩家，按 `byArray[3]` 配置纵向攻击区间
   * {@link attackRangeUpper}/{@link attackRangeLower}，按 {@link typeId} 配置血量/节奏，
   * 并据 `byArray[0]`(朝向) 与 `byArray[1]`(巡逻范围) 计算左右边界与初始朝向位。
   * @param n        初始动画 ID（与朝向位 OR 后设给首帧）
   * @param byArray  s.bin 布置参数：[0]=朝向(0右/1左) [1]=巡逻范围 [2]=血量 [3]=攻击区间模式(0~3)
   * @param bl       为 true 时直接拒绝投放并返回 false
   * @returns        成功投放返回 true，否则 false
   */
  // a(int,int,int,byte[],boolean) → a_IIIAYZ
  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    this.loopAnimation = true;
    this.patrolBaseX = this.posX;
    this.comboToggle = false;
    this.knockedBack = false;
    this.aiming = false;
    this.timerB = 0;
    this.timerA = 0;
    this.hurtBlinkTimer = 0;
    this.target = this.screen.player!;
    this.fromSpawner = false;
    this.trailEffect = null;
    switch (byArray[3]) {
      case 0: {
        this.attackRangeUpper = px(40);
        this.attackRangeLower = px(-40);
        break;
      }
      case 1: {
        this.attackRangeUpper = px(80);
        this.attackRangeLower = px(-40);
        break;
      }
      case 2: {
        this.attackRangeUpper = px(40);
        this.attackRangeLower = px(-80);
        break;
      }
      case 3: {
        this.attackRangeUpper = px(80);
        this.attackRangeLower = px(-80);
      }
    }
    switch (this.typeId) {
      case ActorType.ReconScoutEnemy:
      case ActorType.MeleeBomberEnemy: {
        this.isPatroller = true;
        this.drawParam = this.hitPoints = byArray[2];
        this.rhythmThreshold = 3;
        break;
      }
      case ActorType.ScrollChaserHeavy: {
        this.hitPoints = 0;
      }
    }
    this.patrolDir = byArray[0];
    this.patrolRange = byArray[1];
    this.lives = this.hitPoints + 1;
    this.aiState = 0;
    if (this.patrolDir === 0) {
      this.patrolLeftBound = this.patrolBaseX - (this.patrolRange << 10);
      this.patrolRightBound = this.patrolBaseX;
      this.facingFlag = 0;
      this.setFrame(n | 0);
    } else {
      this.patrolLeftBound = this.patrolBaseX;
      this.patrolRightBound = this.patrolBaseX + (this.patrolRange << 10);
      this.facingFlag = MIRROR_FLAG; // Integer.MIN_VALUE
      this.setFrame(n | MIRROR_FLAG); // Integer.MIN_VALUE
    }
    return true;
  }

  /**
   * 每帧主更新入口（CFR h.java:118 `a()`）。
   * 关卡卷动态（LevelScroll）直接跳过。先从动画状态恢复朝向位 {@link facingFlag}
   * 与动画低 24 位 {@link actionLow24}；再处理被玩家踩中(actionId 19)/被打飞(actionId 21)
   * 的反应（{@link knockedBack}）；最后按 {@link typeId} 分派 AI：
   * 1/2 且 {@link isPatroller} 走 {@link patrolUpdate}，否则走 {@link airUpdate}；18 走 {@link bossUpdate}。
   */
  // a() → a_
  update(): void {
    if (this.screen.state === GameState.LevelScroll) {
      return;
    }
    this.facingFlag = this.frameIndex & FACING_MASK;
    this.actionLow24 = this.frameIndex & SEQUENCE_MASK;
    if (this.target.actionId === 19 && this.aiState !== 4 && this.intersectsActor(this.target)) {
      this.target.frameTimer = 0;
      this.target.targetVelX = 0;
      this.target.movingFlag = 0;
      this.knockedBack = true;
      this.target.posX = this.target.posX + (this.target.facingLeft ? px(8) : px(-8));
      this.target.setFrame(0x14 | this.target.facingFlag);
      return;
    }
    if (this.knockedBack) {
      if (this.target.actionId === 21 && this.aiState !== 4 && Math.abs(this.posX - this.target.posX) < px(40)) {
        this.targetVelX = 0;
        this.lives = 0;
        this.aiState = 9;
        this.knockedBack = false;
        if (this.typeId === ActorType.ScrollChaserHeavy) {
          this.loopAnimation = false;
          this.setFrame(3 | this.facingFlag);
        } else {
          this.setFrame(7 | this.facingFlag);
        }
        GameScreen.playSound(4, 1, 200);
      } else if (this.target.actionId !== 20) {
        this.knockedBack = false;
      }
    }
    switch (this.typeId) {
      case ActorType.ReconScoutEnemy:
      case ActorType.MeleeBomberEnemy: {
        if (this.isPatroller) {
          this.patrolUpdate();
          return;
        }
        this.airUpdate();
        return;
      }
      case ActorType.ScrollChaserHeavy: {
        this.bossUpdate();
      }
    }
  }

  /**
   * 1/2 型地面敌「初始态」完整警戒/攻击 AI 状态机（CFR h.java:166 `f()`）。
   * 当 {@link isPatroller}（即 T==true）时由 {@link update} 调用。按 {@link aiState} 推进：
   * 0=待机扫描(着地后按巡逻范围进 3)、1=转身、3=巡逻行走(撞边界折返进 1)、
   * 5/8=攻击(按 {@link attackMode} 子态；type2 近战 {@link spawnMeleeHitbox}，type1 远程 {@link fireProjectile})、
   * 9=受击硬直(命数 {@link lives} 归零转死亡 4)、4=死亡动画(计 killCount、通知刷怪槽)、
   * 7=冲撞、11=攻击后摇。同时含发现玩家进攻击态、起手警戒({@link aiming}/{@link comboToggle})的逻辑。
   */
  // f() → f_
  patrolUpdate(): void {
    if (this.screen.scriptFlagL && this.timerA-- > 0) {
      return;
    }
    if (this.intersectsActor(this.target) && this.aiState !== 7 && (this.aiState !== 5 && this.aiState !== 9 && this.aiState !== 4 || this.aiState === 5 && this.timerB < this.rhythmThreshold) && (this.facingFlag !== 0 && this.target.posX < this.posX || this.facingFlag === 0 && this.posX < this.target.posX)) {
      this.facingFlag ^= MIRROR_FLAG; // Integer.MIN_VALUE
      this.setFrame(this.actionLow24 | this.facingFlag);
      this.timerB = 0;
    }
    if (this.aiState === 0 || this.aiState === 3 || this.aiState === 1) {
      if ((this.facingFlag === 0 && this.posX > this.target.posX && this.posX - this.target.posX < px(30) || this.facingFlag !== 0 && this.target.posX > this.posX && this.target.posX - this.posX < px(30)) && Math.abs(this.target.posY - this.posY) < px(10) && this.target.actionId !== 23 && this.target.actionId !== 15 && this.target.actionId !== 16 && this.target.actionId !== 20 && this.target.actionId !== 21 && this.target.actionId !== 19) {
        this.attackMode = 1;
        this.targetVelX = 0;
        this.timerB = 0;
        this.aiState = 5;
        this.aiming = false;
        this.setFrame(4 | this.facingFlag);
        return;
      }
      if (this.target.posY < this.posY + this.attackRangeUpper && this.target.posY > this.posY + this.attackRangeLower) {
        const n: number = px(140);
        if (this.facingFlag === 0 && this.posX > this.target.posX && this.posX - this.target.posX < n || this.facingFlag !== 0 && this.posX < this.target.posX && this.target.posX - this.posX < n) {
          if (this.aiming && this.timerB++ > this.rhythmThreshold) {
            this.aiState = this.hitPoints > 0 && this.comboToggle ? 8 : 5;
            this.attackMode = 0;
            this.timerB = 0;
            this.targetVelX = 0;
            this.aiming = false;
            this.comboToggle = !this.comboToggle;
          } else if (!this.aiming) {
            this.timerB = 0;
            this.targetVelX = 0;
            this.aiState = 0;
            this.aiming = true;
            if (this.hitPoints > 0 && this.comboToggle) {
              this.setFrame(8 | this.facingFlag);
            } else if (this.typeId === ActorType.MeleeBomberEnemy) {
              this.setFrame(0 | this.facingFlag);
            } else {
              this.setFrame(2 | this.facingFlag);
            }
          }
        } else {
          this.aiming = false;
        }
      } else {
        this.aiming = false;
      }
    }
    switch (this.aiState) {
      case 0: {
        if (this.aiming) break;
        this.timerB = 0;
        if (!this.isAnimationDone()) break;
        if (this.patrolRange > 0) {
          if (this.facingFlag === 0 && this.posX > this.patrolLeftBound || this.facingFlag !== 0 && this.posX < this.patrolRightBound) {
            this.targetVelX = this.facingFlag === 0 ? px(-3) : px(3);
            this.setFrame(1 | this.facingFlag);
          } else {
            this.targetVelX = 0;
            this.setFrame(0 | this.facingFlag);
          }
          this.aiState = 3;
          return;
        }
        this.setFrame(0 | this.facingFlag);
        return;
      }
      case 1: {
        if (++this.timerB === 10) {
          this.facingFlag = this.facingFlag === 0 ? MIRROR_FLAG : 0; // Integer.MIN_VALUE
          this.setFrame(this.actionLow24 | this.facingFlag);
          return;
        }
        if (this.timerB < 20) break;
        this.timerB = 0;
        this.aiState = 3;
        this.targetVelX = this.facingFlag === 0 ? px(-3) : px(3);
        this.setFrame(1 | this.facingFlag);
        return;
      }
      case 11: {
        if (this.isAnimationDone()) {
          if (this.actionLow24 === 3) {
            this.setFrame(2 | this.facingFlag);
          } else if (this.actionLow24 === 9) {
            this.setFrame(8 | this.facingFlag);
          }
        }
        if (this.timerB++ <= 4) break;
        this.timerB = 0;
        this.aiState = 0;
        return;
      }
      case 3: {
        if ((this.facingFlag !== 0 || this.posX >= this.patrolLeftBound) && (this.facingFlag === 0 || this.posX <= this.patrolRightBound)) break;
        this.targetVelX = 0;
        this.timerB = 0;
        this.aiState = 1;
        if (this.typeId === ActorType.MeleeBomberEnemy) {
          this.setFrame(0 | this.facingFlag);
          return;
        }
        this.setFrame(2 | this.facingFlag);
        return;
      }
      case 5:
      case 8: {
        switch (this.attackMode) {
          case 0: {
            switch (this.typeId) {
              case ActorType.MeleeBomberEnemy: {
                if (this.aiState === 8) {
                  this.setFrame(8 | this.facingFlag);
                  if (this.timerB++ > 10) {
                    this.timerB = 0;
                    this.aiState = 0;
                  }
                  return;
                }
                if (this.actionLow24 === 2) {
                  if (this.isAnimationDone()) {
                    this.setFrame(3 | this.facingFlag);
                  }
                  return;
                }
                if (this.actionLow24 === 3) {
                  this.aiState = 0;
                  this.setFrame(0 | this.facingFlag);
                  return;
                }
                this.spawnMeleeHitbox();
                break;
              }
              case ActorType.ReconScoutEnemy: {
                if (this.aiState === 8 && this.hitPoints === 1) {
                  if (this.timerB++ > 10) {
                    this.timerB = 0;
                    this.aiState = 0;
                  }
                  return;
                }
                const l2: ProjectileActor | null = this.fireProjectile(this.aiState === 5 ? 32 : 14);
                if (l2 === null) break;
                if (this.aiState === 5) {
                  this.setFrame(3 | this.facingFlag);
                } else {
                  this.setFrame(9 | this.facingFlag);
                }
                if (l2.advanceAndCollide(this.facingFlag === 0)) {
                  l2.setFrame(1);
                } else {
                  l2.targetVelX = l2.targetVelX + (this.facingFlag === 0 ? px(-12) : px(12));
                }
                this.aiState = 11;
                this.rhythmThreshold = this.hitPoints > 0 ? 12 : 15;
              }
            }
            break;
          }
          case 1: {
            if (!this.isAnimationDone()) break;
            this.target.takeDamage(1);
            if (this.posX <= this.target.posX && !this.target.checkWallRight(this.screen.tileMap!, 100) || this.posX >= this.target.posX && !this.target.checkWallLeft(this.screen.tileMap!, 100)) {
              this.target.posX = this.target.posX + (this.posX >= this.target.posX ? px(-8) : px(8));
            }
            this.aiState = 0;
            this.setFrame(0 | this.facingFlag);
          }
        }
        return;
      }
      case 9: {
        if (this.timerB++ <= 1) break;
        this.timerB = 0;
        if (this.lives <= 0) {
          this.aiState = 4;
          this.loopAnimation = false;
          if (!this.fromSpawner) {
            this.screen.levelLoader!.actorSpawned[this.extra] = true;
          }
          this.setFrame(5 | this.facingFlag);
          return;
        }
        this.aiState = 0;
        this.aiming = false;
        this.facingFlag = this.posX < this.target.posX ? MIRROR_FLAG : 0; // Integer.MIN_VALUE
        this.setFrame(0 | this.facingFlag);
        return;
      }
      case 4: {
        if (this.actionLow24 === 5) {
          if (this.timerB++ <= 1) break;
          this.hurtBlinkTimer = 15;
          this.setFrame(6 | this.facingFlag);
          return;
        }
        if (this.actionLow24 !== 6 || this.hurtBlinkTimer !== 0) break;
        this.deactivate();
        ++this.screen.killCount;
        if (!this.fromSpawner) break;
        --this.screen.enemyAliveCount;
        return;
      }
      case 7: {
        if (this.patrolDir === 0 && this.posX <= this.patrolRightBound || this.patrolDir !== 0 && this.posX >= this.patrolLeftBound) {
          this.targetVelX = 0;
          this.aiState = 0;
          return;
        }
        this.targetVelX = this.patrolDir === 0 ? px(-4) : px(4);
      }
    }
  }

  /**
   * 1/2 型敌「非初始态」简化飞行 AI（CFR h.java:381 `g()`）。
   * {@link isPatroller} 为 false 时由 {@link update} 调用，用于空中追踪/俯冲型行为：
   * 同步伴随特效 {@link trailEffect} 坐标、按相机边界与玩家位置调整横向速度并择机进攻击态、
   * 出相机即销毁并计数、落到玩家上方区间则停下、撞到玩家关联 Boss 进受击态 9。
   * 末尾按 {@link aiState} 处理 0=待机 / 5=攻击(type2 近战、type1 发弹) / 9=坠落 / 4=死亡。
   */
  // g() → g_
  airUpdate(): void {
    if (this.trailEffect !== null && this.trailEffect.active) {
      this.trailEffect.posX = this.posX;
      this.trailEffect.posY = this.posY - px(30);
    }
    if (this.aiState === 0) {
      if (this.facingFlag === 0 && this.posX < this.target.posX) {
        this.facingFlag = MIRROR_FLAG; // Integer.MIN_VALUE
        this.setFrame(this.actionLow24 | MIRROR_FLAG); // Integer.MIN_VALUE
      } else if (this.facingFlag !== 0 && this.posX > this.target.posX) {
        this.facingFlag = 0;
        this.setFrame(this.actionLow24 | 0);
      }
      if (this.posY < this.target.posY && this.targetVelY > 0) {
        if (this.timerA++ % 60 === 0 && this.posX > this.screen.cameraX + px(60) && this.posX < this.screen.cameraX + GameScreen.viewWidthFx - px(60)) {
          const n: number = (this.targetVelX = GameMIDlet.nextRandomMod(1) === 1 ? px(9) : px(7));
        }
        if (this.posX < this.screen.cameraX + px(40)) {
          this.targetVelX = px(9);
        } else if (this.posX > this.screen.cameraX + GameScreen.viewWidthFx - px(40)) {
          this.targetVelX = px(7);
        }
      }
      if ((this.typeId === ActorType.MeleeBomberEnemy && this.posY > this.screen.cameraY + px(40) || this.typeId === ActorType.ReconScoutEnemy && this.posY >= this.target.posY - px(30)) && Math.abs(this.posX - this.target.posX) > px(40) && this.timerB++ > this.rhythmThreshold) {
        this.timerB = 0;
        this.aiState = 5;
      }
    }
    if (this.posX < this.screen.cameraX || this.posX > this.screen.cameraX + GameScreen.viewWidthFx) {
      this.deactivate();
      this.killTrailEffect();
      ++this.screen.killCount;
      --this.screen.enemyAliveCount;
      return;
    }
    if (this.posY >= this.target.posY + px(25) && this.targetVelY > 0) {
      this.targetVelY = 0;
      this.targetVelX = 0;
      this.killTrailEffect();
      if (this.aiState === 9) {
        this.setFrame(5 | this.facingFlag);
        this.aiState = 4;
        return;
      }
      this.setFrame(0 | this.facingFlag);
      return;
    }
    if (this.aiState !== 4 && this.aiState !== 9 && this.intersectsActor(this.target.linkedBoss!)) {
      this.aiState = 9;
      this.targetVelX = 0;
      this.timerB = 0;
      this.targetVelY = px(10);
      this.lives = 0;
      this.setFrame(7 | this.facingFlag);
    }
    switch (this.aiState) {
      case 0: {
        if (!this.isAnimationDone()) break;
        this.setFrame(0 | this.facingFlag);
        return;
      }
      case 5: {
        switch (this.typeId) {
          case ActorType.MeleeBomberEnemy: {
            if (this.actionLow24 === 2) {
              if (this.isAnimationDone()) {
                this.setFrame(3 | this.facingFlag);
              }
              return;
            }
            if (this.actionLow24 === 3) {
              this.aiState = 0;
              this.setFrame(0 | this.facingFlag);
              return;
            }
            this.spawnMeleeHitbox();
            break;
          }
          case ActorType.ReconScoutEnemy: {
            const l2: ProjectileActor | null = this.fireProjectile(28);
            if (l2 === null) break;
            this.aiState = 0;
            l2.targetVelX = l2.targetVelX + (this.facingFlag === 0 ? px(-12) : px(12));
            this.setFrame(3 | this.facingFlag);
            this.rhythmThreshold = 12;
          }
        }
        return;
      }
      case 9: {
        this.killTrailEffect();
        if (this.targetVelY <= 0 || this.targetVelY >= px(12)) break;
        this.targetVelY = px(12);
        return;
      }
      case 4: {
        if (this.actionLow24 !== 5 || this.timerB++ <= 1) break;
        this.setFrame(6 | this.facingFlag);
      }
    }
  }

  // i() → i_
  private spawnMeleeHitbox(): void {
    const l2: ProjectileActor | null = this.screen.spawnProjectile(ActorType.FallingBombProjectile, 0, 0, this.posX, this.posY - px(30), 1);
    if (l2 !== null) {
      this.timerB = 0;
      l2.launchArc(this.facingFlag !== 0 ? 1 : 0);
      this.setFrame(2 | this.facingFlag);
      this.rhythmThreshold = this.hitPoints > 0 ? 12 : 15;
    }
  }

  // b(int) → b_I
  private fireProjectile(n: number): ProjectileActor | null {
    let n2: number = px(29);
    if (this.facingFlag === 0) {
      n2 = px(-29);
    }
    return this.screen.spawnProjectile(ActorType.GuidedMissileProjectile, 0 | (this.facingFlag === 0 ? MIRROR_FLAG : 0), 0, this.posX + n2, this.posY - (n << 10), 1); // Integer.MIN_VALUE
  }

  // j() → j_
  private killTrailEffect(): void {
    if (this.trailEffect !== null) {
      this.trailEffect.deactivate();
    }
  }

  /**
   * 18 型 Boss AI 状态机（CFR h.java:507 `h()`，关卡4专用）。
   * 当 {@link typeId}===18 时由 {@link update} 调用。距玩家足够近时按纵向位置选择
   * 冲撞(进 6)或召唤增援(进 5)；状态分支：0=待机踱步、1/3=巡逻折返、5=放完动画后
   * 经 {@link GameScreen.spawnEnemyWave} 刷一波小怪、6=冲出屏幕、10=等待玩家靠近、
   * 4/9=受击后判定玩家攻击命中→切过场 GoalCutscene 或销毁。
   */
  // h() → h_
  bossUpdate(): void {
    if ((this.aiState === 0 || this.aiState === 1 || this.aiState === 3) && Math.abs(this.posX - this.target.posX) < px(128)) {
      if (this.target.posY < this.posY + px(60) && this.target.posY > this.posY - px(10) && Math.abs(this.posX - this.target.posX) < px(80)) {
        this.targetVelX = px(4);
        this.aiState = 6;
        this.facingFlag = MIRROR_FLAG; // Integer.MIN_VALUE
        this.setFrame(1 | MIRROR_FLAG); // Integer.MIN_VALUE
      } else if (this.screen.scriptFlagL && this.screen.enemyAliveCount <= 0 && this.posX < this.screen.cameraX + GameScreen.viewWidthFx - px(40)) {
        this.targetVelX = 0;
        this.aiState = 5;
        this.facingFlag = 0;
        this.setFrame(2);
      }
    }
    switch (this.aiState) {
      case 0: {
        if (this.isAnimationDone()) {
          this.setFrame(0 | this.facingFlag);
        }
        if (this.timerB++ <= 10) break;
        this.timerB = 0;
        this.aiState = 3;
        this.targetVelX = this.facingFlag === 0 ? -2560 : 2560;
        this.setFrame(1 | this.facingFlag);
        return;
      }
      case 1: {
        if (this.timerB++ <= 20) break;
        this.timerB = 0;
        this.aiState = 3;
        this.facingFlag = this.facingFlag === 0 ? MIRROR_FLAG : 0; // Integer.MIN_VALUE
        this.targetVelX = this.facingFlag === 0 ? -2560 : 2560;
        this.setFrame(1 | this.facingFlag);
        return;
      }
      case 3: {
        if ((this.facingFlag !== 0 || this.posX >= this.patrolLeftBound) && (this.facingFlag === 0 || this.posX <= this.patrolRightBound)) break;
        this.targetVelX = 0;
        this.aiState = 1;
        this.setFrame(0 | this.facingFlag);
        return;
      }
      case 5: {
        if (!this.isAnimationDone()) break;
        this.aiState = 0;
        const n: number = px(320);
        this.screen.spawnEnemyWave(1, 3, this.screen.cameraX + GameScreen.viewWidthFx, n, 1, 1);
        return;
      }
      case 6: {
        if (this.posX <= this.screen.cameraX + GameScreen.viewWidthFx + px(20)) break;
        this.targetVelX = 0;
        this.facingFlag = 0;
        this.aiState = 10;
        this.setFrame(0 | this.facingFlag);
        return;
      }
      case 10: {
        if (this.target.posY - this.posY <= px(70)) break;
        this.aiState = 0;
        this.timerB = 11;
        return;
      }
      case 4:
      case 9: {
        if (this.actionLow24 === 3 && this.timerB++ > 2) {
          if ((this.target.stateFlags & 1) === 0) break;
          this.hurtBlinkTimer = 10;
          this.setFrame(4 | this.facingFlag);
          this.screen.state = GameState.GoalCutscene;
          return;
        }
        if (this.actionLow24 !== 4 || this.hurtBlinkTimer !== 0) break;
        this.deactivate();
      }
    }
  }

  /**
   * 被子弹/攻击命中的回调（CFR h.java:585 `a(tjge.l)`）。
   * 已处于死亡/硬直/特殊态(aiState 4/9/10)或对方为 mode===1 的弹时忽略。按弹型 {@link ProjectileActor.typeId}
   * 结算：type21 扣 1 命中计数 {@link lives}、type10/16 即死、type15/20 生成 type16 爆炸并播音效。
   * 触发受击则转硬直态 9 并切动作(type18→3、其余→7)；{@link lives}<=0 时播死亡音效。
   * @param l2 命中本敌人的弹体 ProjectileActor（对应 tjge.l）
   */
  // a(tjge.l) → a_Tl
  onProjectileHit(l2: ProjectileActor): void {
    if (l2.mode === 1 || this.aiState === 4 || this.aiState === 9 || this.aiState === 10) {
      return;
    }
    let bl: boolean = false;
    switch (l2.typeId) {
      case ActorType.GuidedMissileProjectile: {
        if ((l2.frameIndex & SEQUENCE_MASK) !== 0) break;
        l2.deactivate();
        --this.lives;
        bl = true;
        break;
      }
      case ActorType.PlayerBounceShot:
      case ActorType.ExplosionEffect: {
        this.lives = 0;
        bl = true;
        break;
      }
      case ActorType.GrenadeProjectile:
      case ActorType.FallingBombProjectile: {
        const n: number = l2.targetVelX > 0 ? px(8) : px(-8);
        this.screen.spawnProjectile(ActorType.ExplosionEffect, 0, 0, l2.posX + n, l2.posY + px(8), 0);
        l2.deactivate();
        GameScreen.playSound(5, 1, 220);
      }
    }
    if (bl) {
      this.timerB = 0;
      this.targetVelX = 0;
      this.aiState = 9;
      if (this.typeId === ActorType.ScrollChaserHeavy) {
        this.loopAnimation = false;
        this.setFrame(3 | this.facingFlag);
      } else {
        this.setFrame(7 | this.facingFlag);
      }
    }
    if (this.lives <= 0) {
      GameScreen.playSound(4, 1, 200);
    }
  }

  /**
   * 绘制（CFR h.java:628 `a(Graphics,int,int)`），含受击闪烁。
   * {@link hurtBlinkTimer}===0（无闪烁）时正常绘；否则倒计该计时并仅在奇数帧绘制，
   * 形成受击一闪一闪的效果。
   * @param graphics 画布 Graphics
   * @param n        绘制基准 X（相机偏移后）
   * @param n2       绘制基准 Y（相机偏移后）
   */
  // a(Graphics,int,int) → a_GII
  paint(graphics: Graphics, n: number, n2: number): void {
    if (this.hurtBlinkTimer === 0 || --this.hurtBlinkTimer > 0 && (this.hurtBlinkTimer & 1) !== 0) {
      super.paint(graphics, n, n2);
    }
  }
}
