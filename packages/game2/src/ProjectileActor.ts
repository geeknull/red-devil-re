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
import { ActorType, px } from "./constants.ts";

export class ProjectileActor extends ActorBase {
  static collisionMaskTable: Int32Array = Int32Array.from([1, 1, 1, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0]);
  timer: number = 0;
  private frameTicks: number = 0;
  collisionMask: number = 0;
  private exploded: boolean = false;
  hitWall: boolean = false;
  private expired: boolean = false;
  isSpecialGrenade: boolean = false;

  /**
   * 构造投射物 Actor。仅透传给基类 h 构造 (typeId, 动作定义)。
   * 实际的速度/坐标/标志初始化由工厂 {@link ProjectileActor.spawnProjectile} 完成，
   * 不在此构造（对应 CFR k.java public k(int, tjge.d)）。
   * @param n actor 类型 ID（投射物为 9/10/12/16）
   * @param d2 该类型的动作定义（精灵/碰撞盒/帧表）
   */
  // public k(int, tjge.d) → constructor
  constructor(n: number, d2: SpriteDef) {
    super(n, d2);
  }

  /**
   * 投射物物理主循环（每帧一次），按 typeId 分派四种投射物的行为。
   * 对应 CFR k.java public final void b()（玩法解码见 docs/game2-深海战舰/玩法与数值.md §4.2）。
   *  - typeId 10 直射弹/榴弹主体：累计存活帧、方向性地形探针、命中/撞墙/出界后切爆炸特效或溅射；
   *    含「动作 11 落水生成 type20」「撞机关推回 2 像素切动作 8」等分支。
   *  - typeId 16 敌方抛物炮弹：撞地形或命中玩家→生成 type12 爆炸并标记下帧销毁。
   *  - typeId 12 爆炸/碎片特效：播完动画自销毁，否则持续做实体伤害判定。
   *  - typeId 9 抛投榴弹：第 8 帧瞄准玩家解算弹道；命中→生成两团爆炸；出界销毁。
   * 改写实例字段（速度/坐标/动作/exploded/hitWall/expired）并可能调用 kill() 回收。
   */
  // public final void b() → b_
  update(): void {
    switch (this.typeId) {
      case ActorType.DirectBullet: {
        switch (this.frameGroupIndex) {
          case 9: {
            if (Math.abs(this.targetVelY) <= px(2)) {
              this.setAction(0xa | this.actionHighByte);
            }
          }
          // fall through
          case 10: {
            if (this.targetVelY > px(3)) {
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
            if ((this.typeId as number) === ActorType.NavalOfficerNpc && !this.hasCollisionFlag(1)) {
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
              } else if (this.posX > this.canvas.cameraX + this.canvas.viewportWidth + px(8)) {
                this.expired = true;
              }
            } else if (this.targetVelX < 0) {
              if (this.collideLeft()) {
                this.hitWall = true;
              } else if (this.posX < this.canvas.cameraX - px(8)) {
                this.expired = true;
              }
            }
            if (this.targetVelY < 0) {
              if (this.collideDown()) {
                this.hitWall = true;
              } else if (this.posY < this.canvas.cameraY - px(8)) {
                this.expired = true;
              }
            } else if (this.targetVelY > 0) {
              if (this.checkFloorCollision()) {
                this.hitWall = true;
              } else if (this.posY > this.canvas.cameraY + this.canvas.viewportHeight + px(8)) {
                this.expired = true;
              }
            }
            if ((this.exploded || this.hitWall) && (this.frameGroupIndex === 6 || this.frameGroupIndex === 9 || this.frameGroupIndex === 10 || this.frameGroupIndex === 11 || this.frameGroupIndex === 12)) {
              ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX, this.posY, this.collisionTypeMask, null);
              this.kill();
              break;
            }
            if (this.frameGroupIndex === 11 && this.isSpecialGrenade && this.posY > px(146)) {
              const e2: ItemActor = this.canvas.scene.spawnActor(ActorType.SplashEffect, -1) as ItemActor;
              (this.canvas.scene.spawnActor(ActorType.SplashEffect, -1) as ItemActor).posX = this.posX;
              e2.posY = this.posY + px(10);
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
                this.posX += px(2);
              } else if (this.targetVelX < 0) {
                this.posX -= px(2);
              } else if (this.targetVelY < 0) {
                this.posY -= px(2);
              } else if (this.targetVelY > 0) {
                this.posY += px(2);
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
      case ActorType.ArcCannonShell: {
        if (this.exploded) {
          this.kill();
          return;
        }
        if (!((this.targetVelX < 0 && this.collideLeft()) || (this.targetVelX > 0 && this.collideRight()) || !this.checkFloorCollision()) && !this.collidesWith(this.canvas.player)) break;
        ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX, this.posY, 255, null);
        this.exploded = true;
        return;
      }
      case ActorType.ExplosionDebris: {
        if (this.isAnimationDone()) {
          this.kill();
          return;
        }
        this.checkCollisions();
        return;
      }
      case ActorType.GuidedGrenade: {
        ++this.timer;
        if (this.timer === 8) {
          const n: number = this.canvas.player.posX - this.posX;
          const n2: number = Math.abs(this.posY - this.canvas.player.posY);
          const n3: number = Math.abs(n);
          if (n3 > ((((n2 * 4) | 0) / 3) | 0)) {
            this.targetVelX = this.posX > this.canvas.player.posX ? px(-8) : px(8);
            this.targetVelY = -((n2 / ((n3 / px(8)) | 0)) | 0);
          } else {
            this.targetVelY = px(-10);
            this.targetVelX = (n / ((n2 / px(10)) | 0)) | 0;
          }
          this.accelY = 0;
          if (this.targetVelX < px(-4)) {
            this.setAction(1);
          } else if (this.targetVelX > px(4)) {
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
          ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX, this.posY, 0, null);
          ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.posX + px(2), this.posY - px(4), 0, null);
          this.kill();
          return;
        }
        if (this.posX >= this.canvas.cameraX - px(10) && this.posY >= this.canvas.cameraY - px(10) && this.posX <= this.canvas.cameraX + this.canvas.viewportWidth + px(10)) break;
        this.kill();
      }
    }
  }

  /**
   * 投射物↔实体碰撞回调，由碰撞系统在命中另一 Actor 时调用。
   * 对应 CFR k.java protected final void c(tjge.h)（解码见 docs/game2-深海战舰/玩法与数值.md §4.4）。
   * 仅置标志，实际扣血在被击实体侧（取自 {@link ProjectileActor.getDamage}）：
   *  - typeId 10：命中机关/Boss 类（11/13/17/19/21）按「撞硬物」置 hitWall=true（触发地形特效）；
   *    命中其他（玩家/敌兵）置 exploded=true（实体击中特效）。
   *  - typeId 9：任意命中置 exploded=true。
   * @param h2 被命中的目标 Actor
   */
  // protected final void c(tjge.h) → c_Th
  onCollide(h2: ActorBase): void {
    switch (this.typeId) {
      case ActorType.DirectBullet: {
        if (h2.typeId === ActorType.MobileGunEmplacement || h2.typeId === ActorType.PatrolLauncher || h2.typeId === ActorType.FinalBoss || h2.typeId === ActorType.DestructibleConsole || h2.typeId === ActorType.HelicopterBoss) {
          this.hitWall = true;
          return;
        }
        this.exploded = true;
        return;
      }
      case ActorType.GuidedGrenade: {
        this.exploded = true;
      }
    }
  }

  /**
   * 投射物工厂：从场景对象池取得（或复用）一个投射物实例并完成初始化。
   * 二次开发若需发射子弹/手雷/生成爆炸，统一走此入口（玩家武器、敌方炮台、爆炸碎片均调用之）。
   * 对应 CFR k.java public static final tjge.k a(int,int,int,int,int,int[])（解码见 docs/game2-深海战舰/玩法与数值.md §4.3）。
   * 复位所有运动与状态字段（清速度/加速度、maxVelY=15360、collisionMask=3 等），按类型再做特化：
   *  - typeId 10：动作非 9/6 时 collisionMask=1（仅撞纯实体墙）；生成即横向扫描地形带，贴墙则立即置 hitWall 并跑一帧 update()（贴墙生成→立即命中）。
   *  - typeId 12：animLoop=false（爆炸特效播完即止）。
   *  - typeId 9：初速 targetVelY=-2048（微上抛）、timer=0、动作 0。
   * @param n 投射物类型 ID（9/10/12/16）
   * @param n2 初始动作 ID（传给 setAction）
   * @param n3 生成 X 坐标（定点 <<10）
   * @param n4 生成 Y 坐标（定点 <<10）
   * @param n5 碰撞类型掩码（写入 collisionTypeMask，决定可命中的阵营）
   * @param nArray 备用参数（沿用原版签名，本类未使用）
   * @returns 取得的投射物实例（池满时可能为 null）
   */
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
      k2.maxVelY = px(15);
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
        case ActorType.DirectBullet: {
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
        case ActorType.ExplosionDebris: {
          k2.animLoop = false;
          break;
        }
        case ActorType.GuidedGrenade: {
          k2.targetVelX = 0;
          k2.targetVelY = px(-2);
          k2.timer = 0;
          k2.setAction(0);
        }
      }
    }
    return k2;
  }

  /**
   * 返回该投射物本帧的伤害值，由被击实体侧扣血时读取。
   * 对应 CFR k.java protected final int m()（数值表见 docs/game2-深海战舰/玩法与数值.md §4.5）。
   *  - typeId 10 直射弹：查 {@link ProjectileActor.collisionMaskTable}[当前动作]（动作 0-2→1、3-5→3、其余→0）；
   *  - typeId 12 爆炸/碎片：固定 3；typeId 9 抛投榴弹：固定 2；其余 0。
   * @returns 伤害点数
   */
  // protected final int m() → m_
  getDamage(): number {
    switch (this.typeId) {
      case ActorType.DirectBullet: {
        return ProjectileActor.collisionMaskTable[this.frameGroupIndex];
      }
      case ActorType.ExplosionDebris: {
        return 3;
      }
      case ActorType.GuidedGrenade: {
        return 2;
      }
    }
    return 0;
  }

  /**
   * 落地/向下地形碰撞探测：仅在向下运动（velY >= 0）时生效。
   * 对应 CFR k.java public final void a()（本类覆写基类 h 的 a_）。
   * 扫描下沿包围盒覆盖的瓦片格，命中 collisionMask 匹配的瓦片时停住垂直速度、
   * 把 velY 钳到贴地距离并返回 true（命中地面）；否则返回 false。
   * @returns 是否撞到下方地形
   */
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
