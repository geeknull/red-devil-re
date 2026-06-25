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
import { MIRROR_FLAG, FLIP_VERTICAL_BIT } from "./constants.ts";

/**
 * 演员基类（原 `tjge.g`，CFR 基准 reverse/game1/2-decompiled-cfr/tjge/g.java，278 行）。
 *
 * 游戏中的角色：所有可见可动实体的共同父类，被
 * {@link PlayerActor}(f)/{@link EnemyActor}(h)/BossActor(c)/EffectActor(e)/
 * PickupActor(k)/{@link ProjectileActor}(l) 继承（见 docs/game1-红魔特种兵/类清单与职责.md §8）。
 * 它本身只提供一套通用骨架：**定点坐标/速度/加速度/上限的物理积分**、**帧动画推进**、
 * **AABB 精灵碰撞**与**四向地图瓦片碰撞**；而具体行为/受击/绘制由子类覆写。
 *
 * 协作者：
 * - {@link SpriteDef}（原 d，字段 {@link spriteDef}）——帧/碰撞箱/绘制数据源。
 * - {@link TileMap}（原 b）——四个 collide* 方法据其 {@link TileMap.queryColumnTileAt} 判定实心瓦片。
 * - {@link GameScreen}（原 a）——提供静态屏幕宽高 {@link GameScreen.screenWidth}/{@link GameScreen.playHeight} 供绘制视锥剔除。
 *
 * 坐标系：{@link posX}/{@link posY} 为 **<<10 定点**（1024 = 1 像素），速度/加速度同单位；
 * 屏幕坐标 = `(posX>>10) - 相机`。{@link frameIndex} 高位 bit31(0x80000000)/bit30(0x40000000)
 * 分别为水平/垂直翻转标志，低 24 位才是动画 ID。
 *
 * 主循环约定（见 docs/.../主循环与渲染.md §3）：每帧对绘制队列先**全员** {@link stepPhysics}（物理位移）、
 * 再**全员** {@link update}（行为/AI），两遍分离保证同帧确定性，复刻须保持。
 *
 * 子类覆写约定：覆写须用相同契约名（同 (名,描述符) 映射）。基类中可被覆写的有
 * {@link update}(a())、{@link onProjectileHit}(a(l))、{@link paint}(a(Graphics,int,int))、
 * {@link stepPhysics}(e())、{@link collideGround}(c(b))。
 */
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

  /**
   * 构造演员：记下类型 id 与精灵定义，初始标记为未激活（active=false）、动画循环（loopAnimation=true）。
   * 对应 CFR g(int, d)。子类构造函数会以 `super(n, d2)` 调用本方法。
   * @param n  类型 id（{@link typeId}，决定子类行为，工厂据此选池）
   * @param d2 精灵帧定义（{@link spriteDef}）
   */
  public constructor(n: number, d2: SpriteDef) {
    this.typeId = n;
    this.spriteDef = d2;
    this.active = false;
    this.loopAnimation = true;
  }

  /**
   * 生成/初始化演员到关卡（对应 CFR a(int,int,int,byte[],boolean)）。
   * 设置初始动画帧，按瓦片坐标 (n2,n3) 落到定点世界坐标（<<10），清零速度/加速度，
   * 并设默认速度上限 12288、朝向 0。基类恒返回 true；子类覆写常据 byArray 读初始参数、
   * 或在 bl 为真时拒绝生成。
   * @param n      初始动画帧索引（含翻转标志位）
   * @param n2     瓦片 X（像素，内部 <<10）
   * @param n3     瓦片 Y（像素，内部 <<10）
   * @param byArray 该演员的额外参数字节载荷（基类未用，供子类）
   * @param bl     已生成标志（基类未用，供子类判重）
   */
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

  /** 使演员失活：清 {@link active} 标志（=false），此后不更新不绘制。对应 CFR b()。 */
  public deactivate(): void {
    this.active = false;
  }

  /**
   * 设置当前动画动作（对应 CFR a(int)）。从 {@link spriteDef} 读该帧碰撞箱到
   * boundsLeft/Right/Top/Bottom，并按 {@link frameIndex} 的水平/垂直翻转标志位取负、
   * 据 {@link orientation}===270 做轴交换；最后重置帧计数器并清动画完成标志。
   * @param n 动画动作索引（高位保留翻转标志，内部用 `n & 0xffffff` 去标志后查表）
   */
  public setFrame(n: number): void {
    this.frameIndex = n;
    if ((n &= 0xffffff) < 0 || n > this.spriteDef.getSequenceCount()) {
      return;
    }
    if ((this.frameIndex & MIRROR_FLAG) === 0) {
      // Integer.MIN_VALUE == 0x80000000
      this.boundsLeft = this.spriteDef.collisionBoxX[n];
      this.boundsRight = this.spriteDef.collisionBoxY[n];
    } else {
      this.boundsLeft = -this.spriteDef.collisionBoxY[n];
      this.boundsRight = -this.spriteDef.collisionBoxX[n];
    }
    if ((this.frameIndex & FLIP_VERTICAL_BIT) === 0) {
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

  /**
   * 推进动画一帧（对应 CFR c()）。到达末帧时：循环动画回到 0，否则停在末帧，并置
   * {@link animationDone}=true。由 {@link stepPhysics} 每帧调用。
   */
  public advanceAnimation(): void {
    ++this.currentFrame;
    if (this.currentFrame >= this.frameCount) {
      this.currentFrame = this.loopAnimation ? 0 : --this.currentFrame;
      this.animationDone = true;
    }
  }

  /** 返回当前动画是否已播完（{@link animationDone} 标志）。对应 CFR d()。 */
  public isAnimationDone(): boolean {
    return this.animationDone;
  }

  /**
   * 每帧物理步进（对应 CFR e()，主循环第一遍对全员调用）。流程：
   * 推进动画 → 将上帧 targetVel 快照为当前 {@link velX}/{@link velY} → 对 targetVel 施加
   * 加速度并钳到速度上限 → 用当前速度积分位置。可被子类覆写（如玩家/敌人自定义物理）。
   */
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

  /**
   * 每帧行为/AI 更新钩子（对应 CFR a()，主循环第二遍对全员调用）。
   * 基类为空，由子类覆写实现各自逻辑（玩家输入、敌人 AI、子弹弹道等）。
   */
  public update(): void {
  }

  /**
   * 被子弹/投射物命中时的交互钩子（对应 CFR a(l)）。
   * 基类为空，子类（敌人/Boss/可破坏物等）覆写以扣血/触发受击。
   * @param l2 命中本演员的投射物
   */
  public onProjectileHit(l2: ProjectileActor): void {
  }

  /**
   * 绘制演员（对应 CFR a(Graphics,int,int)）。先把世界坐标减相机得屏幕坐标，
   * 据帧绘制范围 + 翻转位做视锥剔除（出屏直接 return），命中则委托
   * {@link SpriteDef.paintSequenceFrame} 实际绘制。可被子类覆写（如闪烁/不可见帧）。
   * @param graphics 绘制上下文
   * @param n  相机 X（像素）
   * @param n2 相机 Y（像素）
   */
  public paint(graphics: Graphics, n: number, n2: number): void {
    let s: number; // short
    let s2: number; // short
    let s3: number; // short
    let s4: number; // short
    const n3 = (this.posX >> 10) - n;
    const n4 = (this.posY >> 10) - n2;
    const n5 = this.frameIndex & MIRROR_FLAG; // Integer.MIN_VALUE
    const n6 = this.frameIndex & FLIP_VERTICAL_BIT;
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

  /**
   * 与另一演员做 AABB（轴对齐包围盒）碰撞检测（对应 CFR a(g)）。
   * 各自用「世界坐标(>>10) + 当前帧碰撞箱偏移」构成矩形求重叠；自身比较或任一退化
   * 包围盒（左右/上下相等）直接返回 false。
   * @param g2 另一演员
   * @returns 两包围盒是否重叠
   */
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

  /**
   * 向左（负 X）撞墙检测与解算（对应 CFR a(b)）。velX>=0 时直接返回 false。
   * 扫描左缘所在瓦片列，命中实心瓦片（值 1）则清零横向 targetVelX、把 X 吸附到墙面，返回 true。
   * @param b2 地图瓦片层
   */
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

  /**
   * 向右（正 X）撞墙检测与解算（对应 CFR b(b)）。velX<=0 时直接返回 false。
   * 扫描右缘所在瓦片列，命中实心瓦片（值 1）则清零横向 targetVelX、把 X 吸附到墙面，返回 true。
   * @param b2 地图瓦片层
   */
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

  /**
   * 向下/落地碰撞检测与解算（对应 CFR c(b)）。velY<0（上升中）时直接返回 false。
   * 扫描脚下瓦片行，命中实心瓦片（值 1）则清零纵向加速度与速度、把演员吸附到瓦片顶面，返回 true。
   * 可被子类覆写。
   * @param b2 地图瓦片层
   */
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

  /**
   * 向上/触顶碰撞检测与解算（对应 CFR d(b)）。velY>0（下落中）时直接返回 false。
   * 检测头顶瓦片，命中实心瓦片（值 1）则清零上升 targetVelY、吸附到瓦片下方，
   * 并把纵向加速度重置为重力 4096（恢复下落），返回 true。
   * @param b2 地图瓦片层
   */
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
