/**
 * 游戏2《红魔特种兵2-深海战舰》Actor 基类 tjge.h。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/h.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 职责：所有游戏实体的基类——封装定点坐标/速度（<<10）、动画帧推进、AABB 碰撞、
 *   与地图瓦片的左右/落地碰撞检测、以及碰撞回调框架。被 g/f/e/k/c 继承。
 *
 * 字段别名（混淆名沿用原版）：
 *   g=存活标志；h=类型ID；i=动画/精灵数据 tjge.d；j=动画是否循环；
 *   k=完整动作码(含朝向/翻转位)；l=动作码低24位(帧组索引)；m=本组动画是否已播完；
 *   n=当前帧序；o=本组帧数(short)；p/q=碰撞盒左/右(相对, 像素)；r/s=碰撞盒上/下(相对, 像素)；
 *   t=实体槽位索引；u/v=定点坐标 X/Y(<<10)；w/x=当前帧位移速度 X/Y；
 *   y/z=目标速度 X/Y；A/B=加速度 X/Y；C/D=速度上限 X/Y；E=绘制透明度/特效参数；
 *   F=绘制调色板/颜色组；G=保留；H=动作码高字节(0xFF000000 掩码部分)；I=层级(来自 j.h)；
 *   J=受击闪烁计时；K=碰撞类型掩码；L=所属主控 tjge.a；M=本帧是否绘制(隔帧)；
 *   N=静态实体 ID 计数器；O=本实体唯一 ID(动作变更时自增)；P=上次记录的碰撞对象 ID。
 *
 * 跨类方法名按契约表：
 *   d(tjge.d).a_()→取本组帧数; d.a_I(n)→取指定动作组帧数; d.a_GIIIIII(...)→绘制精灵帧；
 *   GameMIDlet.a_AYII(byte[],off,len)→小端读 int；
 *   j(tjge.j) 静态字段 e/f/g/h 与 j.a(tjge.b).b_II(x,y)→瓦片碰撞查询。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用（绘制委托给 d.a_GIIIIII，像素细节在 d 内处理）。
 */
import { Graphics } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameCanvas } from "./GameCanvas.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { jref } from "./jref.ts"; // 延迟绑定 j，打破 h→j→子类 的 ESM 循环依赖

export class ActorBase {
  alive: boolean = false;
  public typeId: number = 0;
  public spriteDef!: SpriteDef;
  public animLoop: boolean = false;
  public actionCode: number = 0;
  public frameGroupIndex: number = 0;
  public animDone: boolean = false;
  public frameIndex: number = 0;
  public frameCount: number = 0; // short
  public boxLeft: number = 0;
  public boxRight: number = 0;
  public boxTop: number = 0;
  public boxBottom: number = 0;
  slotIndex: number = 0;
  posX: number = 0;
  posY: number = 0;
  velX: number = 0;
  velY: number = 0;
  targetVelX: number = 0;
  targetVelY: number = 0;
  accelX: number = 0;
  accelY: number = 0;
  maxVelX: number = 0;
  maxVelY: number = 0;
  drawAlpha: number = 0;
  palette: number = 0;
  reserved: number = 0;
  actionHighByte: number = 0;
  layer: number = 0;
  public hitFlashTimer: number = 0;
  public collisionTypeMask: number = 0;
  public canvas!: GameCanvas;
  private static idCounter: number = 0;
  private uniqueId: number = 0;
  private lastContactId: number = 0;
  drawThisFrame: boolean = true;

  // public h(int, tjge.d) → constructor
  constructor(n: number, d2: SpriteDef) {
    this.typeId = n;
    this.spriteDef = d2;
    this.alive = false;
    this.animLoop = true;
    this.canvas = GameCanvas.instance;
    this.uniqueId = ActorBase.idCounter;
    ActorBase.idCounter += 1000000;
  }

  // public boolean a(byte[]) → a_AY
  spawnFromBytes(byArray: Int8Array): boolean {
    let bl = false;
    if (this.slotIndex < this.canvas.scene.residentActorSlots && this.canvas.scene.triggerHitFlags[this.slotIndex]) {
      if (this.typeId === 13) {
        bl = true;
      } else {
        return false;
      }
    }
    const n = bl ? 4 : byArray[5] & 0x7f;
    const n2 = (byArray[5] & 0x80) << 24;
    const n3 = (byArray[5] & 0x40) << 24;
    this.setAction(n | n2 | n3);
    const n4 = GameMIDlet.readIntLE(byArray, 1, 2);
    const n5 = GameMIDlet.readIntLE(byArray, 3, 2);
    this.posX = n4 << 10;
    this.posY = n5 << 10;
    this.palette = byArray[6];
    this.drawAlpha = 0;
    this.velY = 0;
    this.velX = 0;
    this.targetVelY = 0;
    this.targetVelX = 0;
    this.accelX = 0;
    this.accelY = 0;
    this.maxVelX = 15360;
    this.maxVelY = 15360;
    this.hitFlashTimer = 0;
    this.animLoop = true;
    this.layer = jref().actorDrawLayer[this.typeId];
    return true;
  }

  // public final void e() → e_
  kill(): void {
    this.alive = false;
    jref().activeActors[this.slotIndex] = null;
  }

  // public final void f() → f_
  killAndMarkSpawned(): void {
    this.kill();
    if (this.slotIndex < this.canvas.scene.residentActorSlots) {
      this.canvas.scene.triggerHitFlags[this.slotIndex] = true;
    }
  }

  // public final void a(int) → a_I
  setAction(n: number): void {
    this.actionCode = n;
    this.actionHighByte = n & 0xff000000;
    this.frameGroupIndex = n &= 0xffffff;
    if (n < 0 || n > this.spriteDef.getActionCount()) {
      return;
    }
    if ((this.actionCode & -2147483648) === 0) { // Integer.MIN_VALUE
      this.boxLeft = this.spriteDef.actionParamA[n];
      this.boxRight = this.spriteDef.actionParamB[n];
    } else {
      this.boxLeft = -this.spriteDef.actionParamB[n];
      this.boxRight = -this.spriteDef.actionParamA[n];
    }
    if ((this.actionCode & 0x40000000) === 0) {
      this.boxTop = this.spriteDef.actionParamC[n];
      this.boxBottom = this.spriteDef.actionParamD[n];
    } else {
      this.boxTop = -this.spriteDef.actionParamD[n];
      this.boxBottom = -this.spriteDef.actionParamC[n];
    }
    this.frameCount = this.spriteDef.getFrameCount(n);
    this.frameIndex = 0;
    this.animDone = false;
    ++this.uniqueId;
  }

  // public final void g() → g_
  advanceFrame(): void {
    ++this.frameIndex;
    if (this.frameIndex >= this.frameCount) {
      this.frameIndex = this.animLoop ? 0 : --this.frameIndex;
      this.animDone = true;
    }
  }

  // public final boolean h() → h_
  isAnimationDone(): boolean {
    return this.animDone;
  }

  // public void i() → i_
  step(): void {
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
    this.posX += this.velX;
    this.posY += this.velY;
  }

  // public void b() → b_
  update(): void {
  }

  // public void a(Graphics, int, int) → a_GII
  paint(graphics: Graphics, n: number, n2: number): void {
    if (!this.drawThisFrame) {
      this.drawThisFrame = true;
      return;
    }
    if (this.hitFlashTimer === 0 || (--this.hitFlashTimer > 0 && (this.hitFlashTimer & 1) !== 0)) {
      let s: number; // short
      let s2: number; // short
      let s3: number; // short
      let s4: number; // short
      const n3 = (this.posX >> 10) - n;
      const n4 = (this.posY >> 10) - n2;
      const n5 = this.actionCode & -2147483648; // Integer.MIN_VALUE
      const n6 = this.actionCode & 0x40000000;
      if (n5 !== 0) {
        s4 = ((-this.spriteDef.paramK) << 16) >> 16; // (short)(-k)：Java short 取负带 i2s 截断
        s3 = ((-this.spriteDef.paramJ) << 16) >> 16;
      } else {
        s4 = this.spriteDef.paramJ;
        s3 = this.spriteDef.paramK;
      }
      if (n3 + s3 < 0 || n3 + s4 > 176) {
        return;
      }
      if (n6 !== 0) {
        s2 = ((-this.spriteDef.paramM) << 16) >> 16; // (short)(-m)
        s = ((-this.spriteDef.paramL) << 16) >> 16;
      } else {
        s2 = this.spriteDef.paramL;
        s = this.spriteDef.paramM;
      }
      if (n4 + s < 0 || n4 + s2 > 172) {
        return;
      }
      this.spriteDef.drawFrame(graphics, n3, n4, this.actionCode, this.frameIndex, this.palette, this.drawAlpha);
    }
  }

  // public final boolean a(int, int, int, int) → a_IIII
  intersectsRect(n: number, n2: number, n3: number, n4: number): boolean {
    const n5 = (this.posX >> 10) + this.boxLeft;
    const n6 = (this.posX >> 10) + this.boxRight;
    const n7 = (this.posY >> 10) + this.boxTop;
    const n8 = (this.posY >> 10) + this.boxBottom;
    return n6 >= n && n5 <= n3 && n8 >= n2 && n7 <= n4;
  }

  // public final boolean b(tjge.h) → b_Th
  collidesWith(h2: ActorBase): boolean {
    if (this.boxLeft === this.boxRight || this.boxTop === this.boxBottom || h2.boxLeft === h2.boxRight || h2.boxTop === h2.boxBottom) {
      return false;
    }
    const n = (h2.posX >> 10) + h2.boxLeft;
    const n2 = (h2.posX >> 10) + h2.boxRight;
    const n3 = (h2.posY >> 10) + h2.boxTop;
    const n4 = (h2.posY >> 10) + h2.boxBottom;
    return this.intersectsRect(n, n3, n2, n4);
  }

  // public boolean j() → j_
  collideLeft(): boolean {
    if (this.velX > 0) {
      return false;
    }
    const n = ((this.posX + this.velX >> 10) + this.boxLeft) >> 3;
    const n2 = ((this.posX >> 10) + this.boxLeft) >> 3;
    const n3 = ((this.posY + this.velY >> 10) + this.boxTop + 1) >> 3;
    const n4 = ((this.posY + this.velY >> 10) + this.boxBottom - 1) >> 3;
    let n5 = n3;
    while (n5 <= n4) {
      let n6 = n2;
      while (n6 >= n) {
        const n7 = this.tileAt(n6, n5);
        if (n7 === 1) {
          this.targetVelX = 0;
          this.posX &= 0xfffffc00 | 0;
          this.velX = (((n6 << 3) + 9 << 10) - (this.posX + (this.boxLeft << 10))) | 0;
          return true;
        }
        --n6;
      }
      ++n5;
    }
    return false;
  }

  // public boolean k() → k_
  collideRight(): boolean {
    if (this.velX < 0) {
      return false;
    }
    const n = ((this.posX >> 10) + this.boxRight) >> 3;
    const n2 = ((this.posX + this.velX >> 10) + this.boxRight) >> 3;
    const n3 = ((this.posY + this.velY >> 10) + this.boxTop + 1) >> 3;
    const n4 = ((this.posY + this.velY >> 10) + this.boxBottom - 1) >> 3;
    let n5 = n3;
    while (n5 <= n4) {
      let n6 = n;
      while (n6 <= n2) {
        const n7 = this.tileAt(n6, n5);
        if (n7 === 1) {
          this.targetVelX = 0;
          this.posX &= 0xfffffc00 | 0;
          this.velX = (((n6 << 3) - 1 << 10) - (this.posX + (this.boxRight << 10))) | 0;
          return true;
        }
        ++n6;
      }
      ++n5;
    }
    return false;
  }

  // public boolean l() → l_
  collideDown(): boolean {
    if (this.velY > 0) {
      return false;
    }
    const n = ((this.posY >> 10) + this.boxTop) >> 3;
    const n2 = ((this.posY + this.velY >> 10) + this.boxTop) >> 3;
    const n3 = ((this.posX + this.velX >> 10) + this.boxLeft + 1) >> 3;
    const n4 = ((this.posX + this.velX >> 10) + this.boxRight - 1) >> 3;
    let n5 = n3;
    while (n5 <= n4) {
      let n6 = n;
      while (n6 >= n2) {
        const n7 = this.tileAt(n5, n6);
        if (n7 === 1) {
          this.targetVelY = 0;
          this.velY = (((n6 << 3) + 9 << 10) - (this.posY + (this.boxTop << 10))) | 0;
          return true;
        }
        --n6;
      }
      ++n5;
    }
    return false;
  }

  // protected final boolean b(int) → b_I
  public hasCollisionFlag(n: number): boolean {
    return (this.collisionTypeMask & n) !== 0;
  }

  // protected int m() → m_
  public getDamage(): number {
    return 0;
  }

  // protected boolean a(tjge.h) → a_Th
  public onHitBy(h2: ActorBase): boolean {
    return false;
  }

  // protected void c(tjge.h) → c_Th
  public onCollide(h2: ActorBase): void {
  }

  // protected boolean d() → d_
  public isAlive(): boolean {
    return true;
  }

  // protected final void n() → n_
  public checkCollisions(): void {
    if (this.collisionTypeMask === 0) {
      return;
    }
    let n = 0;
    while (n < jref().drawCount) {
      const h2 = jref().drawList[n];
      if (h2 != null && h2 !== this && h2.alive && this.collidesWith(h2) && h2.onHitBy(this)) {
        this.onCollide(h2);
      }
      ++n;
    }
  }

  // protected final boolean d(tjge.h) → d_Th
  public isNewContact(h2: ActorBase): boolean {
    if (h2.uniqueId !== this.lastContactId) {
      this.lastContactId = h2.uniqueId;
      return true;
    }
    return false;
  }

  // protected final int a(int, int) → a_II
  public tileAt(n: number, n2: number): number {
    return jref().camera.sampleCollision(n << 3, n2 << 3);
  }
}
