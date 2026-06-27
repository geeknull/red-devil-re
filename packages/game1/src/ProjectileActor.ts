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
import { MIRROR_FLAG, ActorType, SEQUENCE_MASK } from "./constants.ts";

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
    const n2 = this.frameIndex & SEQUENCE_MASK;
    const f2 = this.world.player;
    switch (this.typeId) {
      case ActorType.GrenadeProjectile:
      case ActorType.GuidedMissileProjectile: {
        switch (n2) {
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
      case ActorType.PlayerBounceShot: {
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
      case ActorType.FallingBombProjectile: {
        if (this.mode === 1 && --this.lifeTimer < 0) {
          const n3 = (this.targetVelX = this.world.levelIndex === 4 ? this.world.cameraVelX : 0); // n3 为反编译产生的死值，保留赋值链
          void n3;
        }
        if (
          (this.world.levelIndex !== 4 && (this.collideGround(this.world.tileMap) || this.collideLeftWall(this.world.tileMap) || this.collideRightWall(this.world.tileMap))) ||
          (this.world.levelIndex === 4 && this.posY >= f2.posY + 30720)
        ) {
          this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.posX, this.posY, this.mode); // 原 a(int×6) 子弹/特效工厂(契约 a_IIIIII)
          this.deactivate();
          GameScreen.playSound(5, 1, 220);
          return;
        }
        ++this.frameCounter;
        return;
      }
      case ActorType.ExplosionEffect: {
        if (!this.isAnimationDone()) break;
        this.deactivate();
      }
    }
  }

  /**
   * 框架绘制方法（生命周期渲染）：对应 CFR l.java a(Graphics,int,int)（契约 a_GII）。
   * 定时/抛物弹(typeId==20)在前两帧(frameCounter<2)处于上膛阶段不可见，直接跳过；
   * 其余情形委托父类 ActorBase.paint 按当前帧绘制。
   * @param graphics 目标画布
   * @param n 屏幕绘制 X（相机相对像素坐标）
   * @param n2 屏幕绘制 Y
   */
  paint(graphics: Graphics, n: number, n2: number): void {
    if (this.typeId === ActorType.FallingBombProjectile && this.frameCounter < 2) {
      return;
    }
    super.paint(graphics, n, n2);
  }

  /**
   * 计算朝最近目标的追踪/抛物弹道：对应 CFR l.java f()（契约 f_）。
   * 扫描绘制队列选出竖直方向最近的有效目标（isHomingTarget 判定 typeId 2/1），
   * 据玩家朝向调整水平目标速度 targetVelX，再由水平距离与速度推出竖直速度分量 targetVelY；
   * 目标处于同高区间或无目标时令 targetVelY 归零。
   */
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

  /**
   * 沿给定水平方向推进一步并做碰撞检测：对应 CFR l.java a(boolean)（契约 a_Z）。
   * 先检测与可命中特效类敌人(isEffectType 判定 typeId 7/9)的相交（命中回调 onProjectileHit 并返回 true）；
   * 再检查当前列及相邻列(bl 决定 +1 还是 -1)对应高度区间的地形格是否为实心(瓦片值==1)。
   * @param bl 推进方向：true 取右侧相邻列、false 取左侧相邻列做地形碰撞
   * @returns 命中敌人或地形则返回 true，否则 false
   */
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

  /**
   * 初始化抛物轨迹参数：对应 CFR l.java b(int)（契约 b_I）。
   * 依据与玩家的水平距离推算抛物所需初速、重力加速度与生命计时，
   * 设置 targetVelX/targetVelY（初速，向上为负）、accelY（重力）、maxVelY（终速上限）、lifeTimer（飞行帧数）。
   * @param n 水平朝向：0 表示向左(-5120)，非 0 表示向右(+5120)
   */
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
    return n === ActorType.ExplosiveBarrel || n === ActorType.RegeneratingBarrier;
  }

  private isHomingTarget(n: number): boolean {
    return n === ActorType.MeleeBomberEnemy || n === ActorType.ReconScoutEnemy;
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
