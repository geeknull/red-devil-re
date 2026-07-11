/**
 * tjge.e —— 特效/通用 Actor（继承 g）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/e.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 角色：依 q（类型 id）扮演不同特效/可交互单位（炸弹/手雷/触发器/感应器/可破坏物等）。
 *   a..g=逻辑用整型状态字段, h=激活标志, i=所属游戏世界(类 a)。
 *
 * 覆写自 g 的方法：
 *   a_IIIAYZ = a(int,int,int,byte[],boolean) 初始化
 *   a_       = a()                            每帧更新
 *   a_GII    = a(Graphics,int,int)            绘制
 *   a_Tl     = a(tjge.l)                      与子弹/单位 l 交互
 *
 * 跨类调用（契约名）：
 *   this.i.j               = a.j           （类型 f，玩家/世界焦点单位）
 *   this.i.a_IIIIII(...)   = a.a(int×6)    生成特效单位 l
 *   tjge.a.a_III(...)      = a.a(int,int,int) 静态：播放音效（暂静音）
 *   this.i.f.a_IIZ(...)    = b.a(int,int,boolean) 查询地图瓦片
 *   this.i.f.c_II(...)     = b.c(int,int)        标记地图瓦片
 *   this.i.g.k[...]        = j.k[]          关卡完成标志数组
 *   this.a_Tg(g2)          = g.a(tjge.g)    包围盒相交（这里以 f 作参）
 *   l2.b_()/l2.a_I(n)      = g.b()/g.a(int) （l 继承自 g）
 */
import { Graphics } from "@red-devil/j2me-shim";
import { ActorType, GameState, SEQUENCE_MASK, FACING_MASK, px } from "./constants.ts";
import { GameScreen } from "./GameScreen.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { ProjectileActor } from "./ProjectileActor.ts";

/**
 * EffectActor —— 特效/通用交互演员（继承 {@link ActorBase}）。
 * CFR 基准：reverse/game1/2-decompiled-cfr/tjge/e.java；语义见
 * docs/game1-红魔特种兵/类清单与职责.md 与 reverse/game1/3-readable/SYMBOLS.md。
 *
 * 角色：按 {@link ActorBase.typeId}（CFR 的 q）扮演多种特效/可交互单位，
 * 由 GameScreen.createActor 在精灵类型 4..22 时实例化。已知类型：
 *   - 4  ：感应/触发器（玩家进入感应区且按住动作位 → 切 GoalCutscene）。
 *   - 5  ：关键目标/感应器（可被弹丸打爆推进 CaptureCutscene/GoalCutscene）。
 *   - 7/9：可破坏物（油桶/掩体类，typeId 9 含再生与多帧损坏表现）。
 *   - 12 ：解谜门控特效（受世界事件标志 flagE 门控其逻辑与绘制）。
 *   - 19 ：静态装饰帧（spawnAt 直接按 byArray[0] 定帧）。
 *   - 22 ：交互锚点/触发区（玩家进入时联动主角 actionFlag/linkedEnemy）。
 *
 * 关键字段（友好名 ← CFR 单字母，详见 SYMBOLS.md）：
 *   destroyedFlag←a、anchorX←b、anchorY←c、hitPoints←d、shakeTick←e、
 *   tintBits←f、regenTimer←g、activated←h、world←i。
 *
 * 协作者：{@link world}（GameScreen）经由它访问玩家焦点单位 player、瓦片地图
 * tileMap、关卡数据/加载器，以及生成投射物特效（spawnProjectile）与播放音效
 * （GameScreen.playSound）。
 */
export class EffectActor extends ActorBase {
  destroyedFlag: number = 0;
  anchorX: number = 0;
  anchorY: number = 0;
  hitPoints: number = 0;
  shakeTick: number = 0;
  tintBits: number = 0;
  regenTimer: number = 0;
  activated: boolean = false;
  world: GameScreen;

  /**
   * 构造特效/可交互演员。
   * @param n  精灵类型 id（赋给基类 typeId，决定本演员扮演的角色，见类注释）。
   * @param d2 精灵帧定义 {@link SpriteDef}（透传给基类做帧动画）。
   * @param a2 所属游戏世界 {@link GameScreen}，存入 {@link world} 供后续访问玩家/地图/关卡。
   */
  public constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.world = a2;
  }

  /**
   * 覆写基类初始化（CFR e.a(int,int,int,byte[],boolean)）：先调 super.spawnAt，再按
   * {@link ActorBase.typeId} 设置各类型的初始状态字段——
   * 19 定帧；22 存交互锚点格(anchorX/anchorY)；5 置 hitPoints=4 并落入 4 复位 destroyedFlag；
   * 7/9 置耐久(3 或 9)并记录重生锚点(anchorX/anchorY=当前坐标)。
   * @param byArray 关卡布置参数（部分类型读取其前两字节作锚点/帧）。
   * @param bl 复用/快速跳过标志：为 true 时直接返回 false 表示不在此处创建。
   * @returns 是否完成初始化（true=已激活创建）。
   */
  public spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    this.shakeTick = 0;
    this.activated = false;
    switch (this.typeId) {
      case ActorType.TreasureChestProp: {
        this.setFrame(byArray[0]);
        break;
      }
      case ActorType.GrabAnchorZone: {
        this.anchorX = byArray[0];
        this.anchorY = byArray[1];
        break;
      }
      case ActorType.CaptureTrigger: {
        this.hitPoints = 4;
      }
      case ActorType.RescueTargetNpc: {
        this.destroyedFlag = 0;
        break;
      }
      case ActorType.ExplosiveBarrel:
      case ActorType.RegeneratingBarrier: {
        this.hitPoints = this.typeId === ActorType.ExplosiveBarrel ? 3 : 9;
        this.anchorX = this.posX;
        this.anchorY = this.posY;
      }
    }
    return true;
  }

  /**
   * 每帧行为更新（CFR e.a()），由 GameScreen.updateWorld 逐个 actor 调用。
   * 按 {@link ActorBase.typeId} 分派各类型逻辑：
   *   - 22：与玩家包围盒相交时联动主角（actionFlag/linkedEnemy/spareO/spareP）。
   *   - 12：受世界事件标志 flagE 门控；玩家进入且按住动作位 → 切 GoalCutscene。
   *   - 9 →7：可破坏物主体（9 先按耐久选损坏帧再回退进 7 主体）：耐久耗尽时
   *           生成爆炸投射物、清理上方瓦片并销毁；激活后做横向晃动；type 9 还按
   *           regenTimer 再生耐久。
   *   - 4：感应触发器，命中且按动作位 → GoalCutscene。
   *   - 5：关键目标，被打爆(destroyedFlag)或满足清场条件 → 切 Capture/GoalCutscene。
   * 每帧首行用 frameIndex 高位刷新 {@link tintBits} 以在改帧时保留染色。
   */
  /*
   * Unable to fully structure code（CFR 原注释）。
   * 下面以 if/标号-跳转的等价形式忠实还原 case 9 → case 7 的回退控制流。
   */
  public update(): void {
    const player: PlayerActor = this.world.player;
    this.tintBits = this.frameIndex & FACING_MASK;
    // 按 typeId 分派 update<Type> helper（switch 是方法末块，顶层 break→helper return）。
    // ⚠️ RegeneratingBarrier(9) 原本 fall-through 到 ExplosiveBarrel(7)：由 updateRegeneratingBarrier
    //    末尾调用 updateExplosiveBarrel() 复现（两者共享 type7 主体，靠 typeId 判据区分）。
    switch (this.typeId) {
      case ActorType.GrabAnchorZone:
        this.updateGrabAnchorZone(player);
        break;
      case ActorType.GatedTrigger:
        this.updateGatedTrigger(player);
        break;
      case ActorType.RegeneratingBarrier:
        this.updateRegeneratingBarrier();
        break;
      case ActorType.ExplosiveBarrel:
        this.updateExplosiveBarrel();
        break;
      case ActorType.RescueTargetNpc:
        this.updateRescueTargetNpc(player);
        break;
      case ActorType.CaptureTrigger:
        this.updateCaptureTrigger(player);
        break;
    }
  }

  // update case type22（GrabAnchorZone，抓取锚点区）：玩家进入即联动主角抓取标志/锚点坐标，离开则解除。
  private updateGrabAnchorZone(player: PlayerActor): void {
    if (this.intersectsActor(player)) {
      player.actionFlag = true;
      player.linkedEnemy = this;
      player.spareO = this.anchorX << 4;
      player.spareP = this.anchorY << 4;
      return;
    }
    if (player.linkedEnemy !== this) return;
    player.actionFlag = false;
    player.linkedEnemy = null;
  }

  // update case type12（GatedTrigger，事件门控触发器）：flagE 开启后玩家进入且按住动作位 → 切 GoalCutscene。
  private updateGatedTrigger(player: PlayerActor): void {
    if (!this.world.flagE) {
      return;
    }
    if (this.intersectsActor(player)) {
      this.activated = true;
    }
    if (!this.activated || (player.stateFlags & 1) === 0) return;
    this.deactivate();
    this.world.state = GameState.GoalCutscene;
  }

  // update case type9（RegeneratingBarrier，可再生屏障）：先按 hitPoints 选损坏帧，
  // 再 fall-through 到 type7 主体（原 GOTO lbl32，用调用 updateExplosiveBarrel 复现）。
  private updateRegeneratingBarrier(): void {
    if (this.hitPoints >= 4) {
      // lbl28
      if (this.hitPoints < 7) {
        this.setFrame(1);
      } else {
        this.setFrame(0);
      }
    } else {
      this.setFrame(2);
    }
    // GOTO lbl32 → 进入 case 7 主体（原 fall-through，用调用复现；共享体靠 this.typeId 区分 9/7）
    this.updateExplosiveBarrel();
  }

  // update case type7（ExplosiveBarrel，爆炸桶；亦为 type9 落穿共享主体）：耐久耗尽则爆炸+清上方瓦片+销毁；
  // 激活时横向晃动；type9 还按 regenTimer 再生耐久。内部靠 this.typeId 区分 7/9 行为。
  private updateExplosiveBarrel(): void {
    if (this.hitPoints <= 0) {
      let canExplode = false;
      if (this.typeId === ActorType.RegeneratingBarrier) {
        if (this.world.levelIndex === 7 && this.posX >> 10 > 1720) {
          if ((this.world.player.stateFlags & 1) !== 0) {
            canExplode = true;
            this.world.stateTimer = 11;
            this.world.state = GameState.GoalCutscene;
          }
        } else {
          canExplode = true;
        }
      } else {
        canExplode = true;
      }
      if (canExplode) {
        if (this.typeId === ActorType.RegeneratingBarrier) {
          this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.posX, this.posY - px(5), 2);
          this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.posX - px(10), this.posY - px(20), 2);
          this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.posX + px(5), this.posY - px(10), 2);
        } else {
          this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 1, this.posX, this.posY - px(5), 2);
        }
        this.posX = this.anchorX;
        this.posY = this.anchorY;
        let col = this.posX >> 14;
        const row = (this.posY - px(5)) >> 14;
        while (this.world.tileMap.queryColumnTileAt(--col, row, true) === 1) {
        }
        const clearCount = this.typeId === ActorType.ExplosiveBarrel ? 2 : 3;
        let i = 0;
        while (i < clearCount) {
          this.world.tileMap.clearTileAt(col + 1, row - i);
          ++i;
        }
        this.deactivate();
        this.world.scriptFlagL = false;
        this.world.levelLoader.actorSpawned[this.extra] = true;
        GameScreen.playSound(5, 1, 220);
      }
      return;
    }
    if (this.activated) {
      this.regenTimer = 0;
      // v0 = this.C = (this.C == this.b ? this.C + 2048 : this.b)
      this.posX = this.posX === this.anchorX ? this.posX + px(2) : this.anchorX;
      if (this.shakeTick++ <= 5) return;
      this.activated = false;
      this.shakeTick = 0;
      this.posX = this.anchorX;
      return;
    }
    if (this.typeId !== ActorType.RegeneratingBarrier || this.regenTimer++ <= 40) return;
    if (this.hitPoints < 4 && this.hitPoints > 0) {
      this.hitPoints = 6;
    } else if (this.hitPoints < 7) {
      this.hitPoints = 9;
    }
    this.regenTimer = 0;
  }

  // update case type4（RescueTargetNpc，感应触发器）：玩家进入且按住动作位 → 切 GoalCutscene。
  private updateRescueTargetNpc(player: PlayerActor): void {
    if (this.intersectsActor(player)) {
      this.activated = true;
    }
    if (!this.activated || (player.stateFlags & 1) === 0) return;
    this.world.state = GameState.GoalCutscene;
  }

  // update case type5（CaptureTrigger，关键目标/被捕触发）：被打爆→CaptureCutscene；激活且满足条件→GoalCutscene；
  // 清场后激活；否则按帧推进动画。
  private updateCaptureTrigger(player: PlayerActor): void {
    if (this.destroyedFlag === 1) {
      this.setFrame(1 | this.tintBits);
      player.health = 0;
      this.world.state = GameState.CaptureCutscene;
      return;
    }
    if (this.activated) {
      if ((player.stateFlags & 1) === 0 || player.posY <= 490000) return;
      this.world.state = GameState.GoalCutscene;
      return;
    }
    if (this.world.scriptFlagL && this.world.reinforceBudget <= 0 && this.world.enemyAliveCount <= 0) {
      this.activated = true;
      return;
    }
    const actionId = this.frameIndex & SEQUENCE_MASK;
    const tint = this.frameIndex & FACING_MASK;
    if (actionId !== 1 || !this.isAnimationDone()) return;
    this.setFrame(0 | tint);
  }

  /**
   * 覆写基类绘制（CFR e.a(Graphics,int,int)）：当 typeId===12 且世界事件标志
   * {@link GameScreen.flagE} 尚未置位时跳过绘制（该解谜门控特效隐藏），
   * 否则委托父类 {@link ActorBase.paint} 正常渲染。
   * @param cameraX 屏幕绘制偏移 X（相机偏移）。
   * @param cameraY 屏幕绘制偏移 Y（相机偏移）。
   */
  public paint(graphics: Graphics, cameraX: number, cameraY: number): void {
    if (this.typeId === ActorType.GatedTrigger && !this.world.flagE) {
      return;
    }
    super.paint(graphics, cameraX, cameraY);
  }

  /**
   * 被弹丸/单位命中回调（CFR e.a(tjge.l)），由 {@link ProjectileActor} 的碰撞检测调用。
   * 依本体 {@link ActorBase.typeId} 与来袭弹丸 projectile 的类型分派结算：
   *   - 7/9 可破坏物：近战(21)/普通弹(10) 激活并扣 1 点耐久（21 还击退并改帧）；
   *     火箭/重弹(15/20) 生成爆炸特效、销毁弹丸、扣 3 点并放音效。
   *   - 5 关键目标：近战(21) 销毁弹丸并扣耐久，归零则置 destroyedFlag 并放音效；
   *     火箭/重弹(15/20) 生成爆炸、销毁弹丸并直接置 destroyedFlag。
   * 命中时清 {@link shakeTick} 以触发受击晃动。
   * @param projectile 命中本体的投射物。
   */
  public onProjectileHit(projectile: ProjectileActor): void {
    block18: {
      switch (this.typeId) {
        case ActorType.ExplosiveBarrel:
        case ActorType.RegeneratingBarrier: {
          switch (projectile.typeId) {
            case ActorType.GuidedMissileProjectile: {
              if ((projectile.frameIndex & SEQUENCE_MASK) !== 0) break;
              this.activated = true;
              this.shakeTick = 0;
              --this.hitPoints;
              if (projectile.targetVelX > 0) {
                projectile.posX += px(8);
              } else if (projectile.targetVelX < 0) {
                projectile.posX -= px(8);
              }
              projectile.targetVelX = 0;
              projectile.setFrame(1);
              break;
            }
            case ActorType.PlayerBounceShot: {
              this.activated = true;
              this.shakeTick = 0;
              --this.hitPoints;
              break;
            }
            case ActorType.GrenadeProjectile:
            case ActorType.FallingBombProjectile: {
              this.activated = true;
              this.shakeTick = 0;
              this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, projectile.posX, projectile.posY, 2);
              projectile.deactivate();
              this.hitPoints -= 3;
              GameScreen.playSound(5, 1, 220);
            }
          }
          return;
        }
        case ActorType.CaptureTrigger: {
          switch (projectile.typeId) {
            case ActorType.GuidedMissileProjectile: {
              if ((projectile.frameIndex & SEQUENCE_MASK) === 0) {
                projectile.deactivate();
                if (--this.hitPoints <= 0) {
                  this.destroyedFlag = 1;
                  GameScreen.playSound(4, 1, 200);
                  return;
                }
                this.setFrame(1 | this.tintBits);
                return;
              }
              break block18;
            }
            case ActorType.GrenadeProjectile:
            case ActorType.FallingBombProjectile: {
              this.world.spawnProjectile(ActorType.ExplosionEffect, 0, 0, projectile.posX, projectile.posY + px(8), 2);
              projectile.deactivate();
              this.destroyedFlag = 1;
              GameScreen.playSound(5, 1, 220);
            }
          }
        }
      }
    }
  }
}
