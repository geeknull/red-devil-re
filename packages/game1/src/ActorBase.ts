/**
 * tjge.g —— Actor 基类（被 c/e/f/h/k/l 继承）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/g.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 角色：带定点坐标(C/D=x/y<<10)、速度(E/F)、加速度(I/J)、速度上限(K/L)的精灵。
 *   q=类型id, r=精灵定义(d), s=是否循环动画, t=当前帧索引(含翻转标志位),
 *   u=动画播放完毕, v=当前帧, w=帧总数, x/y=帧水平包围盒, z/A=帧垂直包围盒,
 *   B..N=坐标/速度/加速度/上限/方向(M)/绘制旋转参数(N) 等。
 *
 * 可被子类覆写的方法：a_(更新)、a_Tl(与子弹/单位交互)、a_GII(绘制)、e_(物理步进)、c_Tb(落地检测)。
 * 子类覆写须用相同的契约名(同 (名,描述符) 映射)。
 *
 * 跨类调用：
 *   this.r.a_()      = d.a()        取最大可用帧索引上界
 *   this.r.a_I(n)    = d.a(int)     取第 n 个动画的帧数(short)
 *   this.r.a_GIIIIII = d.a(Graphics,int,int,int,int,int,int) 绘制精灵
 *   b2.a_IIZ(x,y,b)  = b.a(int,int,boolean) 查询地图瓦片碰撞值
 *   a.a / a.b        = 类 a 的静态字段(屏幕宽/高)
 */
import { Graphics } from "@red-devil/j2me-shim";
import { GameScreen } from "./GameScreen.ts";
import { TileMap } from "./TileMap.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ProjectileActor } from "./ProjectileActor.ts";

export class ActorBase {
  public active: boolean;
  // 字段对应 Java 包内可见(package-private)，移植为 public 以允许同胞 Actor 跨实例访问
  public typeId: number;
  public spriteDef: SpriteDef;
  public loopAnimation: boolean;
  public frameIndex: number = 0;
  public animationDone: boolean = false;
  public currentFrame: number = 0;
  public frameCount: number = 0; // short
  public boundsLeft: number = 0;
  public boundsRight: number = 0;
  public boundsTop: number = 0;
  public boundsBottom: number = 0;
  public extra: number = 0;
  public posX: number = 0;
  public posY: number = 0;
  public velX: number = 0;
  public velY: number = 0;
  public targetVelX: number = 0;
  public targetVelY: number = 0;
  public accelX: number = 0;
  public accelY: number = 0;
  public maxVelX: number = 0;
  public maxVelY: number = 0;
  public orientation: number = 0;
  public drawParam: number = 0;

  public constructor(n: number, d2: SpriteDef) {
    this.typeId = n;
    this.spriteDef = d2;
    this.active = false;
    this.loopAnimation = true;
  }

  public spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    this.setFrame(n);
    this.posX = n2 << 10;
    this.posY = n3 << 10;
    this.velY = 0;
    this.velX = 0;
    this.targetVelY = 0;
    this.targetVelX = 0;
    this.accelY = 0;
    this.accelX = 0;
    this.maxVelX = 12288;
    this.maxVelY = 12288;
    this.orientation = 0;
    this.drawParam = 0;
    return true;
  }

  public deactivate(): void {
    this.active = false;
  }

  public setFrame(n: number): void {
    this.frameIndex = n;
    if ((n &= 0xffffff) < 0 || n > this.spriteDef.getSequenceCount()) {
      return;
    }
    if ((this.frameIndex & -2147483648) === 0) {
      // Integer.MIN_VALUE == 0x80000000
      this.boundsLeft = this.spriteDef.collisionBoxX[n];
      this.boundsRight = this.spriteDef.collisionBoxY[n];
    } else {
      this.boundsLeft = -this.spriteDef.collisionBoxY[n];
      this.boundsRight = -this.spriteDef.collisionBoxX[n];
    }
    if ((this.frameIndex & 0x40000000) === 0) {
      this.boundsTop = this.spriteDef.collisionBoxWidth[n];
      this.boundsBottom = this.spriteDef.collisionBoxHeight[n];
    } else {
      this.boundsTop = -this.spriteDef.collisionBoxHeight[n];
      this.boundsBottom = -this.spriteDef.collisionBoxWidth[n];
    }
    if (this.orientation === 270) {
      let n2 = 0;
      // 原版 CFR 中的混淆交换写法：this.z = this.x = this.z; （x 取 z 值，z 不变）
      this.boundsTop = this.boundsLeft = this.boundsTop;
      n2 = this.boundsRight;
      this.boundsRight = this.boundsBottom;
      this.boundsBottom = n2;
    }
    this.frameCount = this.spriteDef.getSequenceFrameCount(n);
    this.currentFrame = 0;
    this.animationDone = false;
  }

  public advanceAnimation(): void {
    ++this.currentFrame;
    if (this.currentFrame >= this.frameCount) {
      this.currentFrame = this.loopAnimation ? 0 : --this.currentFrame;
      this.animationDone = true;
    }
  }

  public isAnimationDone(): boolean {
    return this.animationDone;
  }

  public stepPhysics(): void {
    this.advanceAnimation();
    this.velX = this.targetVelX;
    this.velY = this.targetVelY;
    this.targetVelX += this.accelX;
    if (this.accelX > 0 && this.targetVelX > this.maxVelX) {
      this.targetVelX = this.maxVelX;
    }
    if (this.accelX < 0 && this.targetVelX < this.maxVelX) {
      this.targetVelX = this.maxVelX;
    }
    this.targetVelY += this.accelY;
    if (this.accelY > 0 && this.targetVelY > this.maxVelY) {
      this.targetVelY = this.maxVelY;
    }
    if (this.accelY < 0 && this.targetVelY < this.maxVelY) {
      this.targetVelY = this.maxVelY;
    }
    this.posX += this.velX;
    this.posY += this.velY;
  }

  public update(): void {
  }

  public onProjectileHit(l2: ProjectileActor): void {
  }

  public paint(graphics: Graphics, n: number, n2: number): void {
    let s: number; // short
    let s2: number; // short
    let s3: number; // short
    let s4: number; // short
    const n3 = (this.posX >> 10) - n;
    const n4 = (this.posY >> 10) - n2;
    const n5 = this.frameIndex & -2147483648; // Integer.MIN_VALUE
    const n6 = this.frameIndex & 0x40000000;
    if (n5 !== 0) {
      s4 = ((-this.spriteDef.boundsY) << 16) >> 16; // (short)(-k)：Java short 取负带 i2s 截断
      s3 = ((-this.spriteDef.boundsX) << 16) >> 16;
    } else {
      s4 = this.spriteDef.boundsX;
      s3 = this.spriteDef.boundsY;
    }
    if (n3 + s3 < 0 || n3 + s4 > GameScreen.screenWidth) {
      return;
    }
    if (n6 !== 0) {
      s2 = ((-this.spriteDef.boundsHeight) << 16) >> 16; // (short)(-m)
      s = ((-this.spriteDef.boundsWidth) << 16) >> 16;
    } else {
      s2 = this.spriteDef.boundsWidth;
      s = this.spriteDef.boundsHeight;
    }
    if (n4 + s < 0 || n4 + s2 > GameScreen.playHeight) {
      return;
    }
    this.spriteDef.paintSequenceFrame(graphics, n3, n4, this.frameIndex, this.currentFrame, this.drawParam, this.orientation);
  }

  public intersectsActor(g2: ActorBase): boolean {
    if (this === g2 || this.boundsLeft === this.boundsRight || this.boundsTop === this.boundsBottom || g2.boundsLeft === g2.boundsRight || g2.boundsTop === g2.boundsBottom) {
      return false;
    }
    const n = (this.posX >> 10) + this.boundsLeft;
    const n2 = (this.posX >> 10) + this.boundsRight;
    const n3 = (this.posY >> 10) + this.boundsTop;
    const n4 = (this.posY >> 10) + this.boundsBottom;
    const n5 = (g2.posX >> 10) + g2.boundsLeft;
    const n6 = (g2.posX >> 10) + g2.boundsRight;
    const n7 = (g2.posY >> 10) + g2.boundsTop;
    const n8 = (g2.posY >> 10) + g2.boundsBottom;
    return n2 >= n5 && n <= n6 && n4 >= n7 && n3 <= n8;
  }

  public collideLeftWall(b2: TileMap): boolean {
    if (this.velX >= 0) {
      return false;
    }
    let n = (this.posY + this.velY) >> 10;
    const n2 = (((this.posX + this.velX) >> 10) + this.boundsLeft) >> 4;
    const n3 = (n + this.boundsTop + 1) >> 4;
    const n4 = (n + this.boundsBottom - 2) >> 4;
    let n5 = n3;
    while (n5 <= n4) {
      let n6 = 0;
      while (n6 < 2) {
        n = b2.queryColumnTileAt(n2 + n6, n5, false);
        if (n === 1) {
          this.targetVelX = 0;
          // Java int 字面量 0xFFFFFC00 即 -1024（高位置 1），& 后清除低 10 位定点小数。
          this.posX &= 0xfffffc00;
          this.velX = ((((n2 + n6) << 4) + 15) << 10) - (this.posX + (this.boundsLeft << 10));
          return true;
        }
        ++n6;
      }
      ++n5;
    }
    return false;
  }

  public collideRightWall(b2: TileMap): boolean {
    if (this.velX <= 0) {
      return false;
    }
    let n = (this.posY + this.velY) >> 10;
    const n2 = (((this.posX + this.velX) >> 10) + this.boundsRight) >> 4;
    const n3 = (n + this.boundsTop + 1) >> 4;
    const n4 = (n + this.boundsBottom - 2) >> 4;
    let n5 = n3;
    while (n5 <= n4) {
      let n6 = 0;
      while (n6 < 2) {
        n = b2.queryColumnTileAt(n2 - n6, n5, false);
        if (n === 1) {
          this.targetVelX = 0;
          // Java int 字面量 0xFFFFFC00 即 -1024（高位置 1），& 后清除低 10 位定点小数。
          this.posX &= 0xfffffc00;
          this.velX = ((((n2 - n6) << 4) - 1) << 10) - (this.posX + (this.boundsRight << 10));
          return true;
        }
        ++n6;
      }
      ++n5;
    }
    return false;
  }

  public collideGround(b2: TileMap): boolean {
    if (this.velY < 0) {
      return false;
    }
    const n = (((this.posY + this.velY) >> 10) + this.boundsBottom) >> 4;
    const n2 = (((this.posX + this.velX) >> 10) + this.boundsLeft + 1) >> 4;
    const n3 = (((this.posX + this.velX) >> 10) + this.boundsRight - 1) >> 4;
    let n4 = n2;
    while (n4 <= n3) {
      const n5 = b2.queryColumnTileAt(n4, n, false);
      if (n5 === 1) {
        this.accelY = 0;
        this.targetVelY = 0;
        this.velY = (((n << 4) - this.boundsBottom) << 10) - this.posY;
        this.posY += this.velY;
        this.velY = 0;
        return true;
      }
      ++n4;
    }
    return false;
  }

  public collideCeiling(b2: TileMap): boolean {
    if (this.velY > 0) {
      return false;
    }
    const n = (this.posX + this.velX) >> 14;
    const n2 = (((this.posY + this.velY) >> 10) + this.boundsTop - 4) >> 4;
    if (b2.queryColumnTileAt(n, n2, false) === 1) {
      this.targetVelY = 0;
      this.velY = (((n2 << 4) + 15 - this.boundsTop + 4) << 10) - this.posY;
      this.accelY = 4096;
      return true;
    }
    return false;
  }
}
