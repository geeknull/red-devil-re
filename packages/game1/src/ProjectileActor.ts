/**
 * 游戏1《红魔特种兵》子弹/抛射物实体类 l，继承 g。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/l.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 职责：弹道推进、与敌人/地形/玩家的碰撞检测、命中伤害与特效触发。
 * 父类 g 提供：字段 p/q/t/C/D/E/G/H/z/A/J/L/M 等；
 *   方法 b()=b_、a(int)=a_I、d()=d_、a(g)=a_Tg、a(b)=a_Tb、b(b)=b_Tb、c(b)=c_Tb、a(Graphics,int,int)=a_GII。
 * 关联类：a（主 Canvas/世界，字段 v/k/x/f/r/t/j、静态 c、静态方法 a(int,int,int)=a_III），
 *   b（地图/碰撞，a(int,int,boolean)=a_IIZ），e（敌人，a(l)=a_Tl），f（玩家，e(int)=e_I、字段 d 及继承 C/D）。
 */
import { Graphics } from "@red-devil/j2me-shim";
import { GameScreen } from "./GameScreen.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { EffectActor } from "./EffectActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { MIRROR_FLAG } from "./constants.ts";

export class ProjectileActor extends ActorBase {
  world: GameScreen;
  frameCounter: number = 0;
  launchOriginX: number = 0;
  mode: number = 0;
  lifeTimer: number = 0;
  armingDelay: number = 0;
  loopFrames: number = 0;
  subType: number = 0;

  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.world = a2;
  }

  update(): void {
    let n = 0;
    while (n < this.world.drawQueueCount) {
      if (this.intersectsActor(this.world.drawQueue[n]!)) {
        this.world.drawQueue[n]!.onProjectileHit(this);
      }
      ++n;
    }
    if (!this.active) {
      return;
    }
    const n2 = this.frameIndex & 0xffffff;
    const f2 = this.world.player;
    switch (this.typeId) {
      case 15:
      case 21: {
        switch (n2) {
          case 0: {
            if (this.world.levelIndex !== 4) {
              if (this.collideLeftWall(this.world.tileMap) || this.collideRightWall(this.world.tileMap)) {
                if (this.typeId === 21) {
                  this.posX += this.velX;
                  this.setFrame(1);
                } else {
                  this.world.spawnProjectile(16, 0, 0, this.posX, this.posY, this.mode); // 原 a(int×6) 子弹/特效工厂(契约 a_IIIIII)
                  this.deactivate();
                  GameScreen.playSound(5, 1, 220);
                }
              } else if ((this.targetVelX > 0 && this.posX - this.launchOriginX > 204800) || (this.targetVelX < 0 && this.launchOriginX - this.posX > 204800)) {
                this.deactivate();
              }
            }
            if (this.posX >= this.world.cameraX && this.posX <= this.world.cameraX + GameScreen.viewWidthFx) break;
            this.deactivate();
            break;
          }
          case 1: {
            if (!this.isAnimationDone()) break;
            this.deactivate();
          }
        }
        return;
      }
      case 10: {
        if (this.mode === 2) {
          if (this.armingDelay-- > 0) {
            return;
          }
          if (this.intersectsActor(this.world.player)) {
            this.world.player.takeDamage(2);
          }
        }
        switch (n2) {
          case 1: {
            if (this.frameCounter-- >= 0) break;
            if (this.subType === 1) {
              this.setFrame(MIRROR_FLAG); // Integer.MIN_VALUE
              break;
            }
            this.setFrame(0);
            break;
          }
          case 0: {
            if (!this.isAnimationDone()) break;
            if (this.mode === 2) {
              this.frameCounter = this.loopFrames;
              this.setFrame(1);
              break;
            }
            this.deactivate();
          }
        }
        return;
      }
      case 20: {
        if (this.mode === 1 && --this.lifeTimer < 0) {
          const n3 = (this.targetVelX = this.world.levelIndex === 4 ? this.world.cameraVelX : 0); // n3 为反编译产生的死值，保留赋值链
          void n3;
        }
        if (
          (this.world.levelIndex !== 4 && (this.collideGround(this.world.tileMap) || this.collideLeftWall(this.world.tileMap) || this.collideRightWall(this.world.tileMap))) ||
          (this.world.levelIndex === 4 && this.posY >= f2.posY + 30720)
        ) {
          this.world.spawnProjectile(16, 0, 0, this.posX, this.posY, this.mode); // 原 a(int×6) 子弹/特效工厂(契约 a_IIIIII)
          this.deactivate();
          GameScreen.playSound(5, 1, 220);
          return;
        }
        ++this.frameCounter;
        return;
      }
      case 16: {
        if (!this.isAnimationDone()) break;
        this.deactivate();
      }
    }
  }

  paint(graphics: Graphics, n: number, n2: number): void {
    if (this.typeId === 20 && this.frameCounter < 2) {
      return;
    }
    super.paint(graphics, n, n2);
  }

  computeHomingTrajectory(): void {
    let n = 0;
    let n2 = 0;
    let n3 = 0;
    let n4 = 0;
    let n5 = 0;
    while (n5 < this.world.drawQueueCount) {
      if (this.isHomingTarget(this.world.drawQueue[n5]!.typeId) && (n4 > (n2 = Math.abs(this.posY - this.world.drawQueue[n5]!.posY + 15360)) || n4 === 0)) {
        n4 = n2;
        n3 = this.world.drawQueue[n5]!.posY - 20480;
        n = Math.abs(this.posX - this.world.drawQueue[n5]!.posX);
      }
      ++n5;
    }
    this.targetVelX += this.world.player!.facingFlag === 0 ? 12288 : -12288;
    if (n4 === 0 || (this.posY > n3 - 10240 && this.posY < n3 + 10240)) {
      this.targetVelY = 0;
      return;
    }
    n2 = Math.abs(this.targetVelX);
    if ((n = (n / n2) | 0) <= 0) {
      n = 1;
    }
    this.targetVelY = this.posY > n3 ? -n4 : (n4 = (n4 / n) | 0);
  }

  advanceAndCollide(bl: boolean): boolean {
    let e2: EffectActor;
    let n = 0;
    while (n < this.world.drawQueueCount) {
      if (this.isEffectType(this.world.drawQueue[n]!.typeId) && this.intersectsActor((e2 = this.world.drawQueue[n]! as EffectActor))) {
        e2.onProjectileHit(this);
        return true;
      }
      ++n;
    }
    e2 = null as unknown as EffectActor;
    void e2;
    const n2 = this.posX >> 14;
    const n3 = bl ? n2 + 1 : n2 - 1;
    const n4 = this.posY >> 10;
    const n5 = (n4 + this.boundsTop + 1) >> 4;
    const n6 = (n4 + this.boundsBottom - 2) >> 4;
    let n7 = n5;
    while (n7 <= n6) {
      if (this.world.tileMap.queryColumnTileAt(n2, n7, false) === 1 || this.world.tileMap.queryColumnTileAt(n3, n7, false) === 1) {
        return true;
      }
      ++n7;
    }
    return false;
  }

  launchArc(n: number): void {
    let n2 = 0;
    let n3 = Math.abs(this.world.player.posX - this.posX);
    if (n3 < 40960) {
      n3 = 40960;
    }
    const n4 = (n3 / 5120) | 0;
    const n5 = n4 >>> 1;
    let n6 = 0;
    let n7 = 0;
    while (n7 < n5) {
      n6 += n7;
      ++n7;
    }
    n3 = (n3 >>> 2) * 3;
    n6 = ((n3 >>> 1) / n6) | 0;
    n2 = (n5 - 1) * n6;
    this.targetVelX += n === 0 ? -5120 : 5120;
    if (n2 > 15360) {
      n2 = 15360;
    }
    this.targetVelY = -n2;
    this.accelY = n6;
    this.maxVelY = n2;
    this.lifeTimer = n4;
  }

  private isEffectType(n: number): boolean {
    return n === 7 || n === 9;
  }

  private isHomingTarget(n: number): boolean {
    return n === 2 || n === 1;
  }

  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    if (this.typeId === 10) {
      this.armingDelay = byArray[0];
      this.loopFrames = byArray[1];
      this.subType = byArray[2];
      this.frameCounter = -1;
      this.loopAnimation = false;
      this.mode = 2;
      this.orientation = this.subType === 2 ? 270 : 0;
      this.setFrame(1);
    }
    return true;
  }
}
