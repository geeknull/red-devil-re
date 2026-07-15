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
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { MIRROR_FLAG, ActorType, SEQUENCE_MASK, px } from "./constants.ts";

export class ProjectileActor extends ActorBase {
  world: GameScreen;
  frameCounter: number = 0;
  launchOriginX: number = 0;
  mode: number = 0;
  lifeTimer: number = 0;
  armingDelay: number = 0;
  loopFrames: number = 0;
  subType: number = 0;

  /**
   * 构造抛射物：以类型 id 与精灵定义构造实体，并绑定所属 GameScreen 世界。
   * 对应 CFR l.java 构造函数 l(int,d,a)（契约 l_IdTa）。
   * @param n 抛射物类型 id（写入 typeId，决定 update 中的弹道分支：15/21/10/20/16）
   * @param d2 精灵帧/动画定义（SpriteDef，传给父类设置碰撞箱与渲染）
   * @param a2 所属 GameScreen 世界，后续经 world 访问敌人队列/玩家/地图/相机/计时等
   */
  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.world = a2;
  }

  /**
   * 每帧逻辑推进（主生命周期）：对应 CFR l.java a()（契约 b_）。
   * 先遍历世界绘制队列做相互碰撞（命中者回调 onProjectileHit），随后按 typeId 分派弹道行为：
   * 15/21=直射子弹（撞墙/出最大射程/出镜头则销毁，撞墙生成命中特效 16）；
   * 10=投掷/地雷类（mode==2 起爆延迟与对玩家伤害，按动画阶段切帧/循环）；
   * 20=抛物/定时弹（落地或触地生成命中特效 16 并播音效，否则累加 frameCounter）；
   * 16=命中特效弹（动画播完即销毁）。inactive（!active）时提前返回。
   */
  update(): void {
    let i = 0;
    while (i < this.world.drawQueueCount) {
      if (this.intersectsActor(this.world.drawQueue[i]!)) {
        this.world.drawQueue[i]!.onProjectileHit(this);
      }
      ++i;
    }
    if (!this.active) {
      return;
    }
    const actionId = this.frameIndex & SEQUENCE_MASK;
    const player = this.world.player;
    // 按 typeId 分派 update<Type> helper（switch 是方法末块，顶层 break→return；内层 switch(actionId) break 保留）。
    switch (this.typeId) {
      case ActorType.GrenadeProjectile:
      case ActorType.GuidedMissileProjectile:
        this.updateGrenadeOrMissile(actionId);
        break;
      case ActorType.PlayerBounceShot:
        this.updateBounceShot(actionId);
        break;
      case ActorType.FallingBombProjectile:
        this.updateFallingBomb(player);
        break;
      case ActorType.ExplosionEffect:
        this.updateExplosion();
        break;
    }
  }

  // update case type15/21（GrenadeProjectile/GuidedMissileProjectile 共享，靠 this.typeId 区分）：
  // 帧0 撞墙则导弹推进改帧、榴弹爆炸销毁，或超射程/出屏销毁；帧1 动画播完销毁。
  private updateGrenadeOrMissile(actionId: number): void {
    switch (actionId) {
      case 0: {
        if (this.world.levelIndex !== 4) {
          if (this.collideLeftWall(this.world.tileMap) || this.collideRightWall(this.world.tileMap)) {
            if (this.typeId === ActorType.GuidedMissileProjectile) {
              this.posX += this.velX;
              this.setFrame(1);
            } else {
              this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.posX, this.posY, this.mode); // 原 a(int×6) 子弹/特效工厂(契约 a_IIIIII)
              this.deactivate();
              GameScreen.playSound(5, 1, 220);
            }
          } else if ((this.targetVelX > 0 && this.posX - this.launchOriginX > px(200)) || (this.targetVelX < 0 && this.launchOriginX - this.posX > px(200))) {
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
  }

  // update case type10（PlayerBounceShot，弹反/地雷弹）：mode2 起爆延迟+接触伤害；帧1 循环计时改帧、帧0 播完循环或销毁。
  private updateBounceShot(actionId: number): void {
    if (this.mode === 2) {
      if (this.armingDelay-- > 0) {
        return;
      }
      if (this.intersectsActor(this.world.player)) {
        this.world.player.takeDamage(2);
      }
    }
    switch (actionId) {
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
  }

  // update case type20（FallingBombProjectile，落弹）：mode1 生命耗尽设水平速度；撞地/墙或到玩家高度则爆炸销毁，否则计帧。
  private updateFallingBomb(player: PlayerActor): void {
    if (this.mode === 1 && --this.lifeTimer < 0) {
      const n3 = (this.targetVelX = this.world.levelIndex === 4 ? this.world.cameraVelX : 0); // n3 为反编译产生的死值，保留赋值链
      void n3;
    }
    if (
      (this.world.levelIndex !== 4 && (this.collideGround(this.world.tileMap) || this.collideLeftWall(this.world.tileMap) || this.collideRightWall(this.world.tileMap))) ||
      (this.world.levelIndex === 4 && this.posY >= player.posY + px(30))
    ) {
      this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.posX, this.posY, this.mode); // 原 a(int×6) 子弹/特效工厂(契约 a_IIIIII)
      this.deactivate();
      GameScreen.playSound(5, 1, 220);
      return;
    }
    ++this.frameCounter;
  }

  // update case type16（ExplosionEffect，爆炸特效）：动画播完即销毁。
  private updateExplosion(): void {
    if (!this.isAnimationDone()) return;
    this.deactivate();
  }

  /**
   * 框架绘制方法（生命周期渲染）：对应 CFR l.java a(Graphics,int,int)（契约 a_GII）。
   * 定时/抛物弹(typeId==20)在前两帧(frameCounter<2)处于上膛阶段不可见，直接跳过；
   * 其余情形委托父类 ActorBase.paint 按当前帧绘制。
   * @param graphics 目标画布
   * @param cameraX 屏幕绘制 X（相机相对像素坐标）
   * @param cameraY 屏幕绘制 Y
   */
  paint(graphics: Graphics, cameraX: number, cameraY: number): void {
    if (this.typeId === ActorType.FallingBombProjectile && this.frameCounter < 2) {
      return;
    }
    super.paint(graphics, cameraX, cameraY);
  }

  /**
   * 计算朝最近目标的追踪/抛物弹道：对应 CFR l.java f()（契约 f_）。
   * 扫描绘制队列选出竖直方向最近的有效目标（isHomingTarget 判定 typeId 2/1），
   * 据玩家朝向调整水平目标速度 targetVelX，再由水平距离与速度推出竖直速度分量 targetVelY；
   * 目标处于同高区间或无目标时令 targetVelY 归零。
   */
  computeHomingTrajectory(): void {
    let horizDist = 0;
    let vertDist = 0;
    let targetTop = 0;
    let bestDist = 0;
    let i = 0;
    while (i < this.world.drawQueueCount) {
      if (this.isHomingTarget(this.world.drawQueue[i]!.typeId) && (bestDist > (vertDist = Math.abs(this.posY - this.world.drawQueue[i]!.posY + px(15))) || bestDist === 0)) {
        bestDist = vertDist;
        targetTop = this.world.drawQueue[i]!.posY - px(20);
        horizDist = Math.abs(this.posX - this.world.drawQueue[i]!.posX);
      }
      ++i;
    }
    this.targetVelX += this.world.player!.facingFlag === 0 ? px(12) : px(-12);
    if (bestDist === 0 || (this.posY > targetTop - px(10) && this.posY < targetTop + px(10))) {
      this.targetVelY = 0;
      return;
    }
    vertDist = Math.abs(this.targetVelX);
    if ((horizDist = (horizDist / vertDist) | 0) <= 0) {
      horizDist = 1;
    }
    // ⚠️ CFR 在此处**反编译有误**，勿照抄。CFR 产出：
    //     this.H = this.D > n3 ? -n4 : (n4 /= n);        // 把除法沉进了 false 分支
    // 而真字节码（javap tjge.l.f() 尾部 214-237）是：
    //     214: iload 4 / 216: iload_1 / 217: idiv / 218: istore 4   ← n4 /= n **无条件**，在分支之前
    //     226: if_icmple 235 / 229: iload 4; ineg / 235: iload 4     ← 两支加载的都是**已除过**的 n4
    //   即： n4 /= n;  this.H = this.D > n3 ? -n4 : n4;
    // 实证（jvm-oracle 差分模糊测试 seed=110/111）：手雷 bestDist=29696、horizDist=26 →
    //   真机 targetVelY = -(29696/26) = -1142（近乎平飞）；照抄 CFR 则 = -29696（每帧窜高 29px、
    //   三帧飞出屏幕消失）。详见 docs/jvm-oracle-保真审计.md。
    bestDist = (bestDist / horizDist) | 0;
    this.targetVelY = this.posY > targetTop ? -bestDist : bestDist;
  }

  /**
   * 沿给定水平方向推进一步并做碰撞检测：对应 CFR l.java a(boolean)（契约 a_Z）。
   * 先检测与可命中特效类敌人(isEffectType 判定 typeId 7/9)的相交（命中回调 onProjectileHit 并返回 true）；
   * 再检查当前列及相邻列(bl 决定 +1 还是 -1)对应高度区间的地形格是否为实心(瓦片值==1)。
   * @param toRight 推进方向：true 取右侧相邻列、false 取左侧相邻列做地形碰撞
   * @returns 命中敌人或地形则返回 true，否则 false
   */
  advanceAndCollide(toRight: boolean): boolean {
    let effect: EffectActor;
    let i = 0;
    while (i < this.world.drawQueueCount) {
      if (this.isEffectType(this.world.drawQueue[i]!.typeId) && this.intersectsActor((effect = this.world.drawQueue[i]! as EffectActor))) {
        effect.onProjectileHit(this);
        return true;
      }
      ++i;
    }
    effect = null as unknown as EffectActor;
    void effect;
    const col = this.posX >> 14;
    const adjCol = toRight ? col + 1 : col - 1;
    const pixelY = this.posY >> 10;
    const topRow = (pixelY + this.boundsTop + 1) >> 4;
    const bottomRow = (pixelY + this.boundsBottom - 2) >> 4;
    let row = topRow;
    while (row <= bottomRow) {
      if (this.world.tileMap.queryColumnTileAt(col, row, false) === 1 || this.world.tileMap.queryColumnTileAt(adjCol, row, false) === 1) {
        return true;
      }
      ++row;
    }
    return false;
  }

  /**
   * 初始化抛物轨迹参数：对应 CFR l.java b(int)（契约 b_I）。
   * 依据与玩家的水平距离推算抛物所需初速、重力加速度与生命计时，
   * 设置 targetVelX/targetVelY（初速，向上为负）、accelY（重力）、maxVelY（终速上限）、lifeTimer（飞行帧数）。
   * @param facingDir 水平朝向：0 表示向左(-5120)，非 0 表示向右(+5120)
   */
  launchArc(facingDir: number): void {
    let vy = 0;
    let dist = Math.abs(this.world.player.posX - this.posX);
    if (dist < px(40)) {
      dist = px(40);
    }
    const frames = (dist / px(5)) | 0;
    const halfFrames = frames >>> 1;
    let accel = 0;
    let i = 0;
    while (i < halfFrames) {
      accel += i;
      ++i;
    }
    dist = (dist >>> 2) * 3;
    accel = ((dist >>> 1) / accel) | 0;
    vy = (halfFrames - 1) * accel;
    this.targetVelX += facingDir === 0 ? px(-5) : px(5);
    if (vy > px(15)) {
      vy = px(15);
    }
    this.targetVelY = -vy;
    this.accelY = accel;
    this.maxVelY = vy;
    this.lifeTimer = frames;
  }

  private isEffectType(typeId: number): boolean {
    return typeId === ActorType.ExplosiveBarrel || typeId === ActorType.RegeneratingBarrier;
  }

  private isHomingTarget(typeId: number): boolean {
    return typeId === ActorType.MeleeBomberEnemy || typeId === ActorType.ReconScoutEnemy;
  }

  /**
   * 从对象池重置/激活抛射物：对应 CFR l.java a(int,int,int,byte[],boolean)（契约 a_IIITbZ）。
   * bl 为真时直接拒绝（返回 false 表示该槽不可用）；否则委托父类 spawnAt 完成基础放置，
   * 对投掷/地雷类(typeId==10)再从 byArray 读取 armingDelay(起爆延迟)/loopFrames(循环帧)/subType(子类型)，
   * 并初始化计数器、关闭循环动画、置 mode=2、按 subType 设定旋转角并切到第 1 帧。
   * @param n 放置 X（定点坐标）
   * @param n2 放置 Y
   * @param n3 朝向/方向参数（透传父类）
   * @param byArray 投掷类附加参数字节：[0]=起爆延迟 [1]=循环帧 [2]=子类型
   * @param bl 为 true 时拒绝激活（占位/无效槽）
   * @returns 成功激活返回 true，被拒返回 false
   */
  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    if (this.typeId === ActorType.PlayerBounceShot) {
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
