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

  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.screen = a2;
  }

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
        this.attackRangeUpper = 40960;
        this.attackRangeLower = -40960;
        break;
      }
      case 1: {
        this.attackRangeUpper = 81920;
        this.attackRangeLower = -40960;
        break;
      }
      case 2: {
        this.attackRangeUpper = 40960;
        this.attackRangeLower = -81920;
        break;
      }
      case 3: {
        this.attackRangeUpper = 81920;
        this.attackRangeLower = -81920;
      }
    }
    switch (this.typeId) {
      case 1:
      case 2: {
        this.isPatroller = true;
        this.drawParam = this.hitPoints = byArray[2];
        this.rhythmThreshold = 3;
        break;
      }
      case 18: {
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
      this.facingFlag = -2147483648; // Integer.MIN_VALUE
      this.setFrame(n | -2147483648); // Integer.MIN_VALUE
    }
    return true;
  }

  // a() → a_
  update(): void {
    if (this.screen.state === 21) {
      return;
    }
    this.facingFlag = this.frameIndex & 0xff000000;
    this.actionLow24 = this.frameIndex & 0xffffff;
    if (this.target.actionId === 19 && this.aiState !== 4 && this.intersectsActor(this.target)) {
      this.target.frameTimer = 0;
      this.target.targetVelX = 0;
      this.target.movingFlag = 0;
      this.knockedBack = true;
      this.target.posX = this.target.posX + (this.target.facingLeft ? 8192 : -8192);
      this.target.setFrame(0x14 | this.target.facingFlag);
      return;
    }
    if (this.knockedBack) {
      if (this.target.actionId === 21 && this.aiState !== 4 && Math.abs(this.posX - this.target.posX) < 40960) {
        this.targetVelX = 0;
        this.lives = 0;
        this.aiState = 9;
        this.knockedBack = false;
        if (this.typeId === 18) {
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
      case 1:
      case 2: {
        if (this.isPatroller) {
          this.patrolUpdate();
          return;
        }
        this.airUpdate();
        return;
      }
      case 18: {
        this.bossUpdate();
      }
    }
  }

  // f() → f_
  patrolUpdate(): void {
    if (this.screen.scriptFlagL && this.timerA-- > 0) {
      return;
    }
    if (this.intersectsActor(this.target) && this.aiState !== 7 && (this.aiState !== 5 && this.aiState !== 9 && this.aiState !== 4 || this.aiState === 5 && this.timerB < this.rhythmThreshold) && (this.facingFlag !== 0 && this.target.posX < this.posX || this.facingFlag === 0 && this.posX < this.target.posX)) {
      this.facingFlag ^= -2147483648; // Integer.MIN_VALUE
      this.setFrame(this.actionLow24 | this.facingFlag);
      this.timerB = 0;
    }
    if (this.aiState === 0 || this.aiState === 3 || this.aiState === 1) {
      if ((this.facingFlag === 0 && this.posX > this.target.posX && this.posX - this.target.posX < 30720 || this.facingFlag !== 0 && this.target.posX > this.posX && this.target.posX - this.posX < 30720) && Math.abs(this.target.posY - this.posY) < 10240 && this.target.actionId !== 23 && this.target.actionId !== 15 && this.target.actionId !== 16 && this.target.actionId !== 20 && this.target.actionId !== 21 && this.target.actionId !== 19) {
        this.attackMode = 1;
        this.targetVelX = 0;
        this.timerB = 0;
        this.aiState = 5;
        this.aiming = false;
        this.setFrame(4 | this.facingFlag);
        return;
      }
      if (this.target.posY < this.posY + this.attackRangeUpper && this.target.posY > this.posY + this.attackRangeLower) {
        const n: number = 143360;
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
            } else if (this.typeId === 2) {
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
            this.targetVelX = this.facingFlag === 0 ? -3072 : 3072;
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
          this.facingFlag = this.facingFlag === 0 ? -2147483648 : 0; // Integer.MIN_VALUE
          this.setFrame(this.actionLow24 | this.facingFlag);
          return;
        }
        if (this.timerB < 20) break;
        this.timerB = 0;
        this.aiState = 3;
        this.targetVelX = this.facingFlag === 0 ? -3072 : 3072;
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
        if (this.typeId === 2) {
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
              case 2: {
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
              case 1: {
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
                  l2.targetVelX = l2.targetVelX + (this.facingFlag === 0 ? -12288 : 12288);
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
              this.target.posX = this.target.posX + (this.posX >= this.target.posX ? -8192 : 8192);
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
        this.facingFlag = this.posX < this.target.posX ? -2147483648 : 0; // Integer.MIN_VALUE
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
        this.targetVelX = this.patrolDir === 0 ? -4096 : 4096;
      }
    }
  }

  // g() → g_
  airUpdate(): void {
    if (this.trailEffect !== null && this.trailEffect.active) {
      this.trailEffect.posX = this.posX;
      this.trailEffect.posY = this.posY - 30720;
    }
    if (this.aiState === 0) {
      if (this.facingFlag === 0 && this.posX < this.target.posX) {
        this.facingFlag = -2147483648; // Integer.MIN_VALUE
        this.setFrame(this.actionLow24 | -2147483648); // Integer.MIN_VALUE
      } else if (this.facingFlag !== 0 && this.posX > this.target.posX) {
        this.facingFlag = 0;
        this.setFrame(this.actionLow24 | 0);
      }
      if (this.posY < this.target.posY && this.targetVelY > 0) {
        if (this.timerA++ % 60 === 0 && this.posX > this.screen.cameraX + 61440 && this.posX < this.screen.cameraX + GameScreen.viewWidthFx - 61440) {
          const n: number = (this.targetVelX = GameMIDlet.nextRandomMod(1) === 1 ? 9216 : 7168);
        }
        if (this.posX < this.screen.cameraX + 40960) {
          this.targetVelX = 9216;
        } else if (this.posX > this.screen.cameraX + GameScreen.viewWidthFx - 40960) {
          this.targetVelX = 7168;
        }
      }
      if ((this.typeId === 2 && this.posY > this.screen.cameraY + 40960 || this.typeId === 1 && this.posY >= this.target.posY - 30720) && Math.abs(this.posX - this.target.posX) > 40960 && this.timerB++ > this.rhythmThreshold) {
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
    if (this.posY >= this.target.posY + 25600 && this.targetVelY > 0) {
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
      this.targetVelY = 10240;
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
          case 2: {
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
          case 1: {
            const l2: ProjectileActor | null = this.fireProjectile(28);
            if (l2 === null) break;
            this.aiState = 0;
            l2.targetVelX = l2.targetVelX + (this.facingFlag === 0 ? -12288 : 12288);
            this.setFrame(3 | this.facingFlag);
            this.rhythmThreshold = 12;
          }
        }
        return;
      }
      case 9: {
        this.killTrailEffect();
        if (this.targetVelY <= 0 || this.targetVelY >= 12288) break;
        this.targetVelY = 12288;
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
    const l2: ProjectileActor | null = this.screen.spawnProjectile(20, 0, 0, this.posX, this.posY - 30720, 1);
    if (l2 !== null) {
      this.timerB = 0;
      l2.launchArc(this.facingFlag !== 0 ? 1 : 0);
      this.setFrame(2 | this.facingFlag);
      this.rhythmThreshold = this.hitPoints > 0 ? 12 : 15;
    }
  }

  // b(int) → b_I
  private fireProjectile(n: number): ProjectileActor | null {
    let n2: number = 29696;
    if (this.facingFlag === 0) {
      n2 = -29696;
    }
    return this.screen.spawnProjectile(21, 0 | (this.facingFlag === 0 ? -2147483648 : 0), 0, this.posX + n2, this.posY - (n << 10), 1); // Integer.MIN_VALUE
  }

  // j() → j_
  private killTrailEffect(): void {
    if (this.trailEffect !== null) {
      this.trailEffect.deactivate();
    }
  }

  // h() → h_
  bossUpdate(): void {
    if ((this.aiState === 0 || this.aiState === 1 || this.aiState === 3) && Math.abs(this.posX - this.target.posX) < 131072) {
      if (this.target.posY < this.posY + 61440 && this.target.posY > this.posY - 10240 && Math.abs(this.posX - this.target.posX) < 81920) {
        this.targetVelX = 4096;
        this.aiState = 6;
        this.facingFlag = -2147483648; // Integer.MIN_VALUE
        this.setFrame(1 | -2147483648); // Integer.MIN_VALUE
      } else if (this.screen.scriptFlagL && this.screen.enemyAliveCount <= 0 && this.posX < this.screen.cameraX + GameScreen.viewWidthFx - 40960) {
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
        this.facingFlag = this.facingFlag === 0 ? -2147483648 : 0; // Integer.MIN_VALUE
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
        const n: number = 327680;
        this.screen.spawnEnemyWave(1, 3, this.screen.cameraX + GameScreen.viewWidthFx, n, 1, 1);
        return;
      }
      case 6: {
        if (this.posX <= this.screen.cameraX + GameScreen.viewWidthFx + 20480) break;
        this.targetVelX = 0;
        this.facingFlag = 0;
        this.aiState = 10;
        this.setFrame(0 | this.facingFlag);
        return;
      }
      case 10: {
        if (this.target.posY - this.posY <= 71680) break;
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
          this.screen.state = 19;
          return;
        }
        if (this.actionLow24 !== 4 || this.hurtBlinkTimer !== 0) break;
        this.deactivate();
      }
    }
  }

  // a(tjge.l) → a_Tl
  onProjectileHit(l2: ProjectileActor): void {
    if (l2.mode === 1 || this.aiState === 4 || this.aiState === 9 || this.aiState === 10) {
      return;
    }
    let bl: boolean = false;
    switch (l2.typeId) {
      case 21: {
        if ((l2.frameIndex & 0xffffff) !== 0) break;
        l2.deactivate();
        --this.lives;
        bl = true;
        break;
      }
      case 10:
      case 16: {
        this.lives = 0;
        bl = true;
        break;
      }
      case 15:
      case 20: {
        const n: number = l2.targetVelX > 0 ? 8192 : -8192;
        this.screen.spawnProjectile(16, 0, 0, l2.posX + n, l2.posY + 8192, 0);
        l2.deactivate();
        GameScreen.playSound(5, 1, 220);
      }
    }
    if (bl) {
      this.timerB = 0;
      this.targetVelX = 0;
      this.aiState = 9;
      if (this.typeId === 18) {
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

  // a(Graphics,int,int) → a_GII
  paint(graphics: Graphics, n: number, n2: number): void {
    if (this.hurtBlinkTimer === 0 || --this.hurtBlinkTimer > 0 && (this.hurtBlinkTimer & 1) !== 0) {
      super.paint(graphics, n, n2);
    }
  }
}
