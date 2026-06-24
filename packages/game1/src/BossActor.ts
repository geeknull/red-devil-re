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

  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.screen = a2;
    this.minion = null;
    this.visible = true;
  }

  // a(int,int,int,byte[],boolean) → a_IIIAYZ
  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    this.hitFlashing = false;
    this.visible = true;
    switch (this.typeId) {
      case 14: {
        this.phase = 0;
        this.delayTimer = 15;
        break;
      }
      case 8: {
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
        this.setFrame(-2147483648); // Integer.MIN_VALUE
        break;
      }
      case 17: {
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

  /*
   * Enabled force condition propagation
   * Lifted jumps to return sites
   */
  // a() → a_
  update(): void {
    const f2: PlayerActor = this.screen.player!;
    const n: number = this.frameIndex & 0xffffff;
    switch (this.typeId) {
      case 14: {
        if (this.intersectsActor(f2)) {
          this.phase = 1;
          this.setFrame(1);
          this.screen.levelLoader!.actorSpawned[this.extra] = true;
        }
        if (this.phase !== 1 || this.delayTimer-- >= 0) return;
        this.screen.spawnProjectile(16, 0, 0, this.posX, this.posY, 2);
        this.deactivate();
        GameScreen.playSound(5, 1, 220);
        return;
      }
      case 8: {
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
                    this.screen.state = 19;
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
              const n4: number = (this.posX = this.posX === this.homeX ? this.posX + 2048 : this.homeX);
              if (this.flashCounter++ > 5) {
                this.hitFlashing = false;
                this.flashCounter = 0;
                this.posX = this.homeX;
              }
            }
            switch (this.phase) {
              case 0: {
                this.targetVelX = -2048;
                if (this.posX >= n2 - 20480) break;
                this.phase = 1;
                this.targetVelX = 0;
                this.setFrame(-2147483646);
                return;
              }
              case 1: {
                if (this.subTimer++ > 15) {
                  const n5: number = 35840;
                  if (this.attackMode === 0) {
                    const l2: ProjectileActor | null = this.screen.spawnProjectile(21, -2147483648, 0, this.posX - n5, this.posY - n5, 1);
                    if (l2 === null) break;
                    l2.targetVelX = -12288;
                    this.subTimer = 0;
                    if (this.targetVelX === 0) {
                      this.setFrame(-2147483644);
                      return;
                    }
                    this.setFrame(-2147483645);
                    return;
                  }
                  const l3: ProjectileActor | null = this.screen.spawnProjectile(20, 0, 0, this.posX + 5120, this.posY - n5, 1);
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
                  this.setFrame(-2147483648); // Integer.MIN_VALUE
                }
                if (this.posX <= n2 - 20480) break;
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
                  this.targetVelX = -10240;
                  this.setFrame(-2147483648); // Integer.MIN_VALUE
                  return;
                }
                if (!this.isAnimationDone()) break;
                this.setFrame(-2147483647);
                return;
              }
              case 3: {
                if (!this.collideLeftWall(this.screen.tileMap!)) break;
                this.targetVelX = 4096;
                this.phase = 1;
                this.attackMode = 1;
              }
            }
            return;
          }
          case 4: {
            if (this.disabled) return;
            if (this.minion!.active && this.minion!.lives > 0) {
              this.minion!.posX = this.posX - 23552;
              if ((this.posX >= f2.posX || this.posX <= this.screen.cameraX + 32768) && (this.posX <= f2.posX || this.posX >= this.screen.cameraX + 186368)) return;
              this.targetVelX = this.screen.cameraVelX;
              return;
            }
            if (this.minion!.aiState === 9 && this.minion!.lives <= 0 && this.minion!.targetVelY === 0) {
              this.minion!.targetVelY = 12288;
              this.minion!.targetVelX = 0;
              this.minion!.isPatroller = false;
              this.targetVelX = this.posX > f2.posX ? this.screen.cameraVelX + 8192 : 0;
              return;
            }
            if (this.posX <= this.screen.cameraX + 210944 && this.posX >= this.screen.cameraX - 30720) return;
            this.deactivate();
            return;
          }
        }
        return;
      }
      case 17: {
        if (this.delayTimer-- > 0) {
          return;
        }
        switch (n) {
          case 0: {
            if (!this.isAnimationDone()) return;
            this.setFrame(1);
            this.targetVelY = 12288;
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

  // a(tjge.l) → a_Tl
  onProjectileHit(l2: ProjectileActor): void {
    if (this.delayTimer > 0 || this.typeId !== 8) {
      return;
    }
    switch (l2.typeId) {
      case 21: {
        if ((l2.frameIndex & 0xffffff) !== 0) break;
        l2.setFrame(1);
        l2.targetVelX = 0;
        l2.posY += 5120;
        if (this.targetVelX !== 0) break;
        --this.health;
        break;
      }
      case 10: {
        if (this.targetVelX !== 0) break;
        --this.health;
        break;
      }
      case 15:
      case 20: {
        this.screen.spawnProjectile(16, 0, 0, l2.posX, l2.posY, 0);
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
    this.posX = this.posX === this.homeX ? this.homeX + 2048 : this.homeX;
    let n: number = 0;
    let n2: number = this.posX;
    let n3: number = this.posY + 5120;
    do {
      let n4: number = GameMIDlet.nextRandomMod(36);
      n4 = 18 - n4;
      let n5: number = GameMIDlet.nextRandomMod(20);
      n5 = 20 - n5;
      this.screen.spawnProjectile(16, 0, 0, (n2 += n4 << 10), (n3 -= n5 << 10), 2);
    } while (n++ < 1);
    GameScreen.playSound(5, 1, 220);
  }

  // a(Graphics,int,int) → a_GII
  paint(graphics: Graphics, n: number, n2: number): void {
    if (this.visible) {
      super.paint(graphics, n, n2);
    }
  }
}
