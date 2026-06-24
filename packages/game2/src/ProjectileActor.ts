/**
 * 游戏2《红魔特种兵2-深海战舰》子弹/投射物/手雷 Actor 类（继承自 Actor 基类 h）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/k.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 注意：game2 的 Actor 基类是 h（非 game1 的 g）；h 构造为 (int, d)，本类构造 super(n, d2)。
 *
 * 字段（混淆名沿用原版）：
 *   静态 a = 子弹索引→m() 返回值表（区分子弹/手雷/无碰撞）。
 *   b = 计数/计时（手雷倒计时、追踪计数）；f = 帧计时；c = 碰撞掩码层；
 *   Q = 命中/爆炸触发；d = 撞墙；R = 出界/超时回收；e = 特殊手雷标志。
 *   基类 h 字段：h=类型ID, l=当前动作低 24 位, H=动作高位标志(朝向/镜像),
 *     j=循环动画, k=动作位, K=碰撞过滤掩码, L=主控 a, n=动画帧, o=帧数,
 *     u/v=定点坐标(<<10), w/x=本帧位移, y/z=水平/垂直速度, A/B=加速度,
 *     C/D=速度上限, E=绘制参数, p/q/r/s=碰撞盒边界。
 *
 * 跨类方法名按契约表：
 *   k.a_IIIIIAI(...)→静态生成投射物并返回；a.a 静态主控；a.z(tjge.j).c_II→取实体；
 *   e(tjge.e).a_I；g(tjge.g) 字段 ag/T、u/v；
 *   基类 h：a_I/a_II/b_I/b_Th/n_/e_/h_/j_/k_/l_/a_(本类覆写)。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用；System.gc() 原版本类亦无。
 */
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameCanvas } from "./GameCanvas.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ItemActor } from "./ItemActor.ts";
import { ActorBase } from "./ActorBase.ts";

export class ProjectileActor extends ActorBase {
  static collisionMaskTable: Int32Array = Int32Array.from([1, 1, 1, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0]);
  timer: number = 0;
  private frameTicks: number = 0;
  collisionMask: number = 0;
  private exploded: boolean = false;
  hitWall: boolean = false;
  private expired: boolean = false;
  isSpecialGrenade: boolean = false;

  // public k(int, tjge.d) → constructor
  constructor(n: number, d2: SpriteDef) {
    super(n, d2);
  }

  // public final void b() → b_
  update(): void {
    switch (this.typeId) {
      case 10: {
        switch (this.frameGroupIndex) {
          case 9: {
            if (Math.abs(this.targetVelY) <= 2048) {
              this.setAction(0xa | this.actionHighByte);
            }
          }
          // fall through
          case 10: {
            if (this.targetVelY > 3072) {
              this.setAction(0xb | this.actionHighByte);
            }
          }
          // fall through
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 11:
          case 12: {
            ++this.frameTicks;
          }
          // fall through
          case 6: {
            if ((this.typeId as number) === 6 && !this.hasCollisionFlag(1)) {
              if (this.timer-- <= 0) {
                this.targetVelX = 0;
              }
            } else if (this.frameTicks > 30) {
              this.expired = true;
            }
            this.checkCollisions();
            const bl: boolean = false;
            if (this.targetVelX > 0) {
              if (this.collideRight()) {
                this.hitWall = true;
              } else if (this.posX > this.canvas.cameraX + this.canvas.viewportWidth + 8192) {
                this.expired = true;
              }
            } else if (this.targetVelX < 0) {
              if (this.collideLeft()) {
                this.hitWall = true;
              } else if (this.posX < this.canvas.cameraX - 8192) {
                this.expired = true;
              }
            }
            if (this.targetVelY < 0) {
              if (this.collideDown()) {
                this.hitWall = true;
              } else if (this.posY < this.canvas.cameraY - 8192) {
                this.expired = true;
              }
            } else if (this.targetVelY > 0) {
              if (this.checkFloorCollision()) {
                this.hitWall = true;
              } else if (this.posY > this.canvas.cameraY + this.canvas.viewportHeight + 8192) {
                this.expired = true;
              }
            }
            if ((this.exploded || this.hitWall) && (this.frameGroupIndex === 6 || this.frameGroupIndex === 9 || this.frameGroupIndex === 10 || this.frameGroupIndex === 11 || this.frameGroupIndex === 12)) {
              ProjectileActor.spawnProjectile(12, 0, this.posX, this.posY, this.collisionTypeMask, null);
              this.kill();
              break;
            }
            if (this.frameGroupIndex === 11 && this.isSpecialGrenade && this.posY > 149504) {
              const e2: ItemActor = this.canvas.scene.spawnActor(20, -1) as ItemActor;
              (this.canvas.scene.spawnActor(20, -1) as ItemActor).posX = this.posX;
              e2.posY = this.posY + 10240;
              e2.targetVelX = 0;
              e2.targetVelY = 0;
              e2.accelY = 0;
              e2.setAction(0);
              e2.drawThisFrame = false;
              this.accelY = 0;
              this.targetVelY = 0;
              this.targetVelX = 0;
              this.kill();
              break;
            }
            if (this.exploded) {
              this.targetVelX = 0;
              this.targetVelY = 0;
              this.accelY = 0;
              this.animLoop = false;
              this.setAction(7 | this.actionHighByte);
              break;
            }
            if (this.hitWall) {
              if (this.targetVelX > 0) {
                this.posX += 2048;
              } else if (this.targetVelX < 0) {
                this.posX -= 2048;
              } else if (this.targetVelY < 0) {
                this.posY -= 2048;
              } else if (this.targetVelY > 0) {
                this.posY += 2048;
              }
              this.targetVelX = 0;
              this.targetVelY = 0;
              this.accelY = 0;
              this.animLoop = false;
              this.setAction(8 | this.actionHighByte);
              break;
            }
            if (!this.expired) break;
            this.kill();
            break;
          }
          case 7:
          case 8: {
            if (!this.isAnimationDone()) break;
            this.kill();
          }
        }
        return;
      }
      case 16: {
        if (this.exploded) {
          this.kill();
          return;
        }
        if (!((this.targetVelX < 0 && this.collideLeft()) || (this.targetVelX > 0 && this.collideRight()) || !this.checkFloorCollision()) && !this.collidesWith(this.canvas.player)) break;
        ProjectileActor.spawnProjectile(12, 0, this.posX, this.posY, 255, null);
        this.exploded = true;
        return;
      }
      case 12: {
        if (this.isAnimationDone()) {
          this.kill();
          return;
        }
        this.checkCollisions();
        return;
      }
      case 9: {
        ++this.timer;
        if (this.timer === 8) {
          const n: number = this.canvas.player.posX - this.posX;
          const n2: number = Math.abs(this.posY - this.canvas.player.posY);
          const n3: number = Math.abs(n);
          if (n3 > ((((n2 * 4) | 0) / 3) | 0)) {
            this.targetVelX = this.posX > this.canvas.player.posX ? -8192 : 8192;
            this.targetVelY = -((n2 / ((n3 / 8192) | 0)) | 0);
          } else {
            this.targetVelY = -10240;
            this.targetVelX = (n / ((n2 / 10240) | 0)) | 0;
          }
          this.accelY = 0;
          if (this.targetVelX < -4096) {
            this.setAction(1);
          } else if (this.targetVelX > 4096) {
            this.setAction(-2147483647);
          }
        }
        if (this.isSpecialGrenade) {
          if (this.collidesWith(this.canvas.player)) {
            this.canvas.player.publicFlagA = true;
            this.canvas.player.health = 0;
            this.exploded = true;
          }
        } else {
          this.checkCollisions();
        }
        if (this.exploded) {
          ProjectileActor.spawnProjectile(12, 0, this.posX, this.posY, 0, null);
          ProjectileActor.spawnProjectile(12, 0, this.posX + 2048, this.posY - 4096, 0, null);
          this.kill();
          return;
        }
        if (this.posX >= this.canvas.cameraX - 10240 && this.posY >= this.canvas.cameraY - 10240 && this.posX <= this.canvas.cameraX + this.canvas.viewportWidth + 10240) break;
        this.kill();
      }
    }
  }

  // protected final void c(tjge.h) → c_Th
  onCollide(h2: ActorBase): void {
    switch (this.typeId) {
      case 10: {
        if (h2.typeId === 11 || h2.typeId === 17 || h2.typeId === 21 || h2.typeId === 13 || h2.typeId === 19) {
          this.hitWall = true;
          return;
        }
        this.exploded = true;
        return;
      }
      case 9: {
        this.exploded = true;
      }
    }
  }

  // public static final tjge.k a(int,int,int,int,int,int[]) → a_IIIIIAI
  static spawnProjectile(n: number, n2: number, n3: number, n4: number, n5: number, nArray: Int32Array | null): ProjectileActor {
    const k2: ProjectileActor = GameCanvas.instance.scene.spawnActor(n, -1) as ProjectileActor;
    if (k2 != null) {
      k2.posX = n3;
      k2.posY = n4;
      k2.targetVelX = 0;
      k2.targetVelY = 0;
      k2.accelX = 0;
      k2.accelY = 0;
      k2.maxVelY = 15360;
      k2.drawAlpha = 0;
      k2.frameTicks = 0;
      k2.exploded = false;
      k2.hitWall = false;
      k2.expired = false;
      k2.animLoop = true;
      k2.isSpecialGrenade = false;
      k2.setAction(n2);
      k2.collisionMask = 3;
      k2.collisionTypeMask = n5;
      switch (n) {
        case 10: {
          if (k2.frameGroupIndex === 9) break;
          if (k2.frameGroupIndex !== 6) {
            k2.collisionMask = 1;
          }
          let n6: number = (k2.posX >> 10) + k2.boxLeft >> 3;
          const n7: number = (k2.posX >> 10) + k2.boxRight >> 3;
          const n8: number = k2.posY >> 10 >> 3;
          while (n6 < n7) {
            if (k2.tileAt(n6, n8) === 1) {
              k2.hitWall = true;
              break;
            }
            ++n6;
          }
          k2.update();
          break;
        }
        case 12: {
          k2.animLoop = false;
          break;
        }
        case 9: {
          k2.targetVelX = 0;
          k2.targetVelY = -2048;
          k2.timer = 0;
          k2.setAction(0);
        }
      }
    }
    return k2;
  }

  // protected final int m() → m_
  getDamage(): number {
    switch (this.typeId) {
      case 10: {
        return ProjectileActor.collisionMaskTable[this.frameGroupIndex];
      }
      case 12: {
        return 3;
      }
      case 9: {
        return 2;
      }
    }
    return 0;
  }

  // public final boolean a() → a_
  checkFloorCollision(): boolean {
    if (this.velY < 0) {
      return false;
    }
    const n: number = (this.posY >> 10) + this.boxBottom >> 3;
    const n2: number = (this.posY + this.velY >> 10) + this.boxBottom >> 3;
    const n3: number = (this.posX + this.velX >> 10) + this.boxLeft + 1 >> 3;
    const n4: number = (this.posX + this.velX >> 10) + this.boxRight - 1 >> 3;
    let n5: number = n3;
    while (n5 <= n4) {
      let n6: number = n;
      while (n6 <= n2) {
        const n7: number = this.tileAt(n5, n6);
        if ((n7 & this.collisionMask) !== 0) {
          this.targetVelY = 0;
          this.velY = (n6 << 13) - (this.posY + (this.boxBottom << 10));
          return true;
        }
        ++n6;
      }
      ++n5;
    }
    return false;
  }
}
