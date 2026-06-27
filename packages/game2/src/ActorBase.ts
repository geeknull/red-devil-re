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
import { MIRROR_FLAG, FLIP_VERTICAL_BIT, ActorType, SEQUENCE_MASK, FACING_MASK } from "./constants.ts";

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

  /**
   * 构造 Actor 基类实例（对应 CFR `public h(int, tjge.d)`）。
   * 记录类型 ID 与精灵/动画定义，默认未激活（alive=false）、动画循环（animLoop=true），
   * 绑定全局 GameCanvas 单例，并从静态计数器 idCounter 领取本实例唯一 ID 段
   * （每实例步进 1000000，配合动作变更时的自增，用于同帧防重复碰撞判定）。
   * @param n 类型 ID（决定子类与行为，对应字段 typeId）
   * @param d2 精灵/动画定义（对应字段 spriteDef，CFR tjge.d）
   */
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

  /**
   * 从关卡实例参数字节流初始化本 Actor（对应 CFR `public boolean a(byte[])`）。
   * 读取小端坐标（字节 1-2 → X、3-4 → Y，左移 10 转定点）、初始动作码（字节 5，低 7 位为动作 ID，
   * 0x80/0x40 位经 <<24 还原为朝向/翻转标志位）、调色板组（字节 6）；并置默认重力/速度上限
   * （maxVelX/Y=15360）、清零各速度与受击闪烁、按 typeId 查表设置绘制层级。
   * 若该槽位为常驻实体且已被触发消耗（triggerHitFlags），除 typeId===13 外直接返回 false 不再生成。
   * @param byArray 关卡数据中的本实体参数块
   * @returns 是否成功生成（false=被回收标志拦截，本帧不出现）
   */
  // public boolean a(byte[]) → a_AY
  spawnFromBytes(byArray: Int8Array): boolean {
    let bl = false;
    if (this.slotIndex < this.canvas.scene.residentActorSlots && this.canvas.scene.triggerHitFlags[this.slotIndex]) {
      if (this.typeId === ActorType.DestructibleConsole) {
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

  /**
   * 回收本 Actor（对应 CFR `public final void e()`）：置 alive=false 并从全局活动表
   * activeActors 中清空本槽位，使其可被复用。
   */
  // public final void e() → e_
  kill(): void {
    this.alive = false;
    jref().activeActors[this.slotIndex] = null;
  }

  /**
   * 回收并标记已消耗（对应 CFR `public final void f()`）：在 kill() 基础上，若本槽位属于
   * 常驻实体范围，则置 triggerHitFlags=true，使关卡重入该区域时不再重新生成该实体。
   */
  // public final void f() → f_
  killAndMarkSpawned(): void {
    this.kill();
    if (this.slotIndex < this.canvas.scene.residentActorSlots) {
      this.canvas.scene.triggerHitFlags[this.slotIndex] = true;
    }
  }

  /**
   * 切换当前动作（对应 CFR `public final void a(int)`）。入参为完整动作码：
   * 高字节保存为 actionHighByte，低 24 位作为帧组索引 frameGroupIndex。
   * 按朝向位（MIRROR_FLAG）镜像左右碰撞盒 boxLeft/boxRight、按垂直翻转位（FLIP_VERTICAL_BIT）
   * 翻转上下碰撞盒 boxTop/boxBottom，再取该动作组帧数并复位帧序与 animDone，最后自增 uniqueId
   * （用于 isNewContact 的同帧防重判定）。动作码越界时仅记录不更新盒/帧。
   * @param n 完整动作码（含动作 ID 与朝向/翻转标志位）
   */
  // public final void a(int) → a_I
  setAction(n: number): void {
    this.actionCode = n;
    this.actionHighByte = n & FACING_MASK;
    this.frameGroupIndex = n &= SEQUENCE_MASK;
    if (n < 0 || n > this.spriteDef.getActionCount()) {
      return;
    }
    if ((this.actionCode & MIRROR_FLAG) === 0) { // Integer.MIN_VALUE
      this.boxLeft = this.spriteDef.actionParamA[n];
      this.boxRight = this.spriteDef.actionParamB[n];
    } else {
      this.boxLeft = -this.spriteDef.actionParamB[n];
      this.boxRight = -this.spriteDef.actionParamA[n];
    }
    if ((this.actionCode & FLIP_VERTICAL_BIT) === 0) {
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

  /**
   * 推进一帧动画（对应 CFR `public final void g()`）：帧序前进，到达末帧后——若循环则回到 0，
   * 否则停在末帧——并置 animDone=true 标记本组动画已播完。
   */
  // public final void g() → g_
  advanceFrame(): void {
    ++this.frameIndex;
    if (this.frameIndex >= this.frameCount) {
      this.frameIndex = this.animLoop ? 0 : --this.frameIndex;
      this.animDone = true;
    }
  }

  /**
   * 当前动作组动画是否已播完（对应 CFR `public final boolean h()`），即非循环动画停在末帧。
   */
  // public final boolean h() → h_
  isAnimationDone(): boolean {
    return this.animDone;
  }

  /**
   * 默认物理步进（对应 CFR `public void i()`）：先推进动画，再把目标速度 targetVelX/Y 提交为
   * 本帧速度 velX/Y，按加速度 accelX/Y 累加目标速度并钳制到 ±maxVelX/Y，最后将速度积分进定点坐标
   * posX/posY。子类常在此前后做碰撞修正。
   */
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

  /**
   * 每帧行为更新钩子（对应 CFR `public void b()`）。基类为空实现，由各子类（玩家/敌人/子弹等）
   * 覆写以实现具体 AI/输入/生命周期逻辑。
   */
  // public void b() → b_
  update(): void {
  }

  /**
   * 绘制本 Actor（对应 CFR `public void a(Graphics, int, int)`）。
   * 处理隔帧绘制开关 drawThisFrame；处理受击闪烁 hitFlashTimer（递减并按奇偶帧跳过绘制）；
   * 将定点世界坐标转屏幕坐标（减去摄像机偏移 n/n2），据朝向/翻转位计算精灵包围范围并做视锥剔除
   * （屏外不绘），最后委托 spriteDef.drawFrame 用当前帧/调色板/透明度绘制。
   * @param graphics 目标画布
   * @param n 摄像机 X 偏移（像素）
   * @param n2 摄像机 Y 偏移（像素）
   */
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
      const n5 = this.actionCode & MIRROR_FLAG; // Integer.MIN_VALUE
      const n6 = this.actionCode & FLIP_VERTICAL_BIT;
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

  /**
   * 本 Actor 碰撞盒与给定矩形是否相交（对应 CFR `public final boolean a(int,int,int,int)`）。
   * 用本实体的定点坐标（>>10 转像素）加碰撞盒偏移得到 AABB，与矩形 [n,n2,n3,n4] 做标准重叠测试。
   * @param n 矩形左 @param n2 矩形上 @param n3 矩形右 @param n4 矩形下（均为像素）
   */
  // public final boolean a(int, int, int, int) → a_IIII
  intersectsRect(n: number, n2: number, n3: number, n4: number): boolean {
    const n5 = (this.posX >> 10) + this.boxLeft;
    const n6 = (this.posX >> 10) + this.boxRight;
    const n7 = (this.posY >> 10) + this.boxTop;
    const n8 = (this.posY >> 10) + this.boxBottom;
    return n6 >= n && n5 <= n3 && n8 >= n2 && n7 <= n4;
  }

  /**
   * 两 Actor 间 AABB 碰撞判定（对应 CFR `public final boolean b(tjge.h)`）。
   * 任一方碰撞盒退化（宽或高为 0）则不碰撞；否则取对方 AABB 后委托 intersectsRect。
   * @param h2 待判定的另一 Actor
   */
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

  /**
   * 向左移动时与地形的碰撞检测与修正（对应 CFR `public boolean j()`）。
   * 仅当本帧速度 velX<0（向左）时生效：扫描运动路径覆盖的 8px 网格列，若命中实心瓦片（tileAt===1），
   * 则清零目标横向速度、对齐坐标并修正 velX 使其恰好贴靠墙面，返回 true 表示发生碰撞。
   */
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

  /**
   * 向右移动时与地形的碰撞检测与修正（对应 CFR `public boolean k()`）。
   * 仅当本帧速度 velX>0（向右）时生效：逻辑与 collideLeft 镜像，命中实心瓦片则清零目标横速、
   * 对齐坐标并修正 velX 贴靠墙面，返回 true。
   */
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

  /**
   * 纵向移动（向上）时与地形的碰撞检测与修正（对应 CFR `public boolean l()`）。
   * 仅当本帧速度 velY<0 时生效：扫描运动路径覆盖的 8px 网格行，命中实心瓦片则清零目标纵速并修正 velY
   * 使其恰好贴靠瓦片，返回 true。命名沿用现行 TS 别名，实际按 velY 方向（参见守卫条件）判定。
   */
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

  /**
   * 碰撞分组测试（对应 CFR `protected final boolean b(int)`）：按位与本实体的碰撞类型掩码
   * collisionTypeMask（玩家/敌人/子弹等分组），判断是否属于给定分组。
   * @param n 待测分组位掩码
   */
  // protected final boolean b(int) → b_I
  public hasCollisionFlag(n: number): boolean {
    return (this.collisionTypeMask & n) !== 0;
  }

  /**
   * 本实体造成的伤害值虚方法（对应 CFR `protected int m()`）。基类返回 0，由攻击型子类覆写。
   */
  // protected int m() → m_
  public getDamage(): number {
    return 0;
  }

  /**
   * 被另一 Actor 命中时的响应虚方法（对应 CFR `protected boolean a(tjge.h)`）。
   * 返回 true 表示本次命中有效（将触发命中方的 onCollide）。基类返回 false，由可受击子类覆写。
   * @param h2 命中本实体的来源 Actor
   */
  // protected boolean a(tjge.h) → a_Th
  public onHitBy(h2: ActorBase): boolean {
    return false;
  }

  /**
   * 成功命中另一 Actor 后本实体的回调虚方法（对应 CFR `protected void c(tjge.h)`）。
   * 在 checkCollisions 中当对方 onHitBy 返回 true 后调用。基类为空，由子类覆写（如子弹消失、记分等）。
   * @param h2 被本实体命中的目标 Actor
   */
  // protected void c(tjge.h) → c_Th
  public onCollide(h2: ActorBase): void {
  }

  /**
   * 存活/可参与判定的虚方法（对应 CFR `protected boolean d()`）。基类恒返回 true，子类可覆写。
   */
  // protected boolean d() → d_
  public isAlive(): boolean {
    return true;
  }

  /**
   * 碰撞遍历（对应 CFR `protected final void n()`）：若本实体无碰撞掩码则跳过；否则遍历全局渲染队列
   * drawList 中所有存活的其他 Actor，对每个执行 collidesWith 判定，命中且对方 onHitBy 返回 true 时
   * 触发本实体的 onCollide 回调。子弹/玩家等主动碰撞方在 update 中调用。
   */
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

  /**
   * 同帧防重复碰撞判定（对应 CFR `protected final boolean d(tjge.h)`）：比较对方 uniqueId 与
   * 上次记录的 lastContactId，若不同则更新记录并返回 true（视为新接触），相同则返回 false，
   * 避免同一对实体在一次接触中被反复结算。
   * @param h2 当前接触的 Actor
   */
  // protected final boolean d(tjge.h) → d_Th
  public isNewContact(h2: ActorBase): boolean {
    if (h2.uniqueId !== this.lastContactId) {
      this.lastContactId = h2.uniqueId;
      return true;
    }
    return false;
  }

  /**
   * 地图瓦片属性查询（对应 CFR `protected final int a(int,int)`）：以 8px 网格坐标 (n,n2) 采样
   * 当前摄像机视野下的碰撞层，返回瓦片属性值（1 表示实心，供地形碰撞方法判定阻挡）。
   * @param n 网格列（×8 转像素）
   * @param n2 网格行（×8 转像素）
   */
  // protected final int a(int, int) → a_II
  public tileAt(n: number, n2: number): number {
    return jref().camera.sampleCollision(n << 3, n2 << 3);
  }
}
