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
import { GameState } from "./constants.ts";
import { GameScreen } from "./GameScreen.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { ProjectileActor } from "./ProjectileActor.ts";

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

  public constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.world = a2;
  }

  public spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    this.shakeTick = 0;
    this.activated = false;
    switch (this.typeId) {
      case 19: {
        this.setFrame(byArray[0]);
        break;
      }
      case 22: {
        this.anchorX = byArray[0];
        this.anchorY = byArray[1];
        break;
      }
      case 5: {
        this.hitPoints = 4;
      }
      case 4: {
        this.destroyedFlag = 0;
        break;
      }
      case 7:
      case 9: {
        this.hitPoints = this.typeId === 7 ? 3 : 9;
        this.anchorX = this.posX;
        this.anchorY = this.posY;
      }
    }
    return true;
  }

  /*
   * Unable to fully structure code（CFR 原注释）。
   * 下面以 if/标号-跳转的等价形式忠实还原 case 9 → case 7 的回退控制流。
   */
  public update(): void {
    const var1_1: PlayerActor = this.world.player;
    this.tintBits = this.frameIndex & -16777216;
    switch (this.typeId) {
      case 22: {
        if (this.intersectsActor(var1_1)) {
          var1_1.actionFlag = true;
          var1_1.linkedEnemy = this;
          var1_1.spareO = this.anchorX << 4;
          var1_1.spareP = this.anchorY << 4;
          return;
        }
        if (var1_1.linkedEnemy !== this) break;
        var1_1.actionFlag = false;
        var1_1.linkedEnemy = null;
        return;
      }
      case 12: {
        if (!this.world.flagE) {
          return;
        }
        if (this.intersectsActor(var1_1)) {
          this.activated = true;
        }
        if (!this.activated || (var1_1.stateFlags & 1) === 0) break;
        this.deactivate();
        this.world.state = GameState.GoalCutscene;
        return;
      }
      case 9: {
        // case 9 落入：先依 d 选择动画帧，再 fall-through 到 case 7
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
        // GOTO lbl32 → 进入 case 7 主体
      }
      // lbl32
      case 7: {
        if (this.hitPoints <= 0) {
          let var2_2 = false;
          if (this.typeId === 9) {
            if (this.world.levelIndex === 7 && this.posX >> 10 > 1720) {
              if ((this.world.player.stateFlags & 1) !== 0) {
                var2_2 = true;
                this.world.stateTimer = 11;
                this.world.state = GameState.GoalCutscene;
              }
            } else {
              var2_2 = true;
            }
          } else {
            var2_2 = true;
          }
          if (var2_2) {
            if (this.typeId === 9) {
              this.world.spawnProjectile(16, 0, 0, this.posX, this.posY - 5120, 2);
              this.world.spawnProjectile(16, 0, 0, this.posX - 10240, this.posY - 20480, 2);
              this.world.spawnProjectile(16, 0, 0, this.posX + 5120, this.posY - 10240, 2);
            } else {
              this.world.spawnProjectile(16, 0, 1, this.posX, this.posY - 5120, 2);
            }
            this.posX = this.anchorX;
            this.posY = this.anchorY;
            let var3_4 = this.posX >> 14;
            const var4_6 = (this.posY - 5120) >> 14;
            while (this.world.tileMap.queryColumnTileAt(--var3_4, var4_6, true) === 1) {
            }
            const var5_7 = this.typeId === 7 ? 2 : 3;
            let var6_8 = 0;
            while (var6_8 < var5_7) {
              this.world.tileMap.clearTileAt(var3_4 + 1, var4_6 - var6_8);
              ++var6_8;
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
          this.posX = this.posX === this.anchorX ? this.posX + 2048 : this.anchorX;
          if (this.shakeTick++ <= 5) break;
          this.activated = false;
          this.shakeTick = 0;
          this.posX = this.anchorX;
          return;
        }
        if (this.typeId !== 9 || this.regenTimer++ <= 40) break;
        if (this.hitPoints < 4 && this.hitPoints > 0) {
          this.hitPoints = 6;
        } else if (this.hitPoints < 7) {
          this.hitPoints = 9;
        }
        this.regenTimer = 0;
        return;
      }
      case 4: {
        if (this.intersectsActor(var1_1)) {
          this.activated = true;
        }
        if (!this.activated || (var1_1.stateFlags & 1) === 0) break;
        this.world.state = GameState.GoalCutscene;
        return;
      }
      case 5: {
        if (this.destroyedFlag === 1) {
          this.setFrame(1 | this.tintBits);
          var1_1.health = 0;
          this.world.state = GameState.CaptureCutscene;
          return;
        }
        if (this.activated) {
          if ((var1_1.stateFlags & 1) === 0 || var1_1.posY <= 490000) break;
          this.world.state = GameState.GoalCutscene;
          return;
        }
        if (this.world.scriptFlagL && this.world.reinforceBudget <= 0 && this.world.enemyAliveCount <= 0) {
          this.activated = true;
          return;
        }
        const var2_3 = this.frameIndex & 0xffffff;
        const var3_5 = this.frameIndex & -16777216;
        if (var2_3 !== 1 || !this.isAnimationDone()) break;
        this.setFrame(0 | var3_5);
      }
    }
  }

  public paint(graphics: Graphics, n: number, n2: number): void {
    if (this.typeId === 12 && !this.world.flagE) {
      return;
    }
    super.paint(graphics, n, n2);
  }

  public onProjectileHit(l2: ProjectileActor): void {
    block18: {
      switch (this.typeId) {
        case 7:
        case 9: {
          switch (l2.typeId) {
            case 21: {
              if ((l2.frameIndex & 0xffffff) !== 0) break;
              this.activated = true;
              this.shakeTick = 0;
              --this.hitPoints;
              if (l2.targetVelX > 0) {
                l2.posX += 8192;
              } else if (l2.targetVelX < 0) {
                l2.posX -= 8192;
              }
              l2.targetVelX = 0;
              l2.setFrame(1);
              break;
            }
            case 10: {
              this.activated = true;
              this.shakeTick = 0;
              --this.hitPoints;
              break;
            }
            case 15:
            case 20: {
              this.activated = true;
              this.shakeTick = 0;
              this.world.spawnProjectile(16, 0, 0, l2.posX, l2.posY, 2);
              l2.deactivate();
              this.hitPoints -= 3;
              GameScreen.playSound(5, 1, 220);
            }
          }
          return;
        }
        case 5: {
          switch (l2.typeId) {
            case 21: {
              if ((l2.frameIndex & 0xffffff) === 0) {
                l2.deactivate();
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
            case 15:
            case 20: {
              this.world.spawnProjectile(16, 0, 0, l2.posX, l2.posY + 8192, 2);
              l2.deactivate();
              this.destroyedFlag = 1;
              GameScreen.playSound(5, 1, 220);
            }
          }
        }
      }
    }
  }
}
