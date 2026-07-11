/**
 * PickupActor —— 道具 / 关卡门（原类 tjge.k，"PickupGate"）。
 *
 * 游戏角色：横版关卡里散布的可拾取物件与"关卡门"，继承自 ActorBase（基类 tjge.g）。
 * 由关卡布置器（tjge.j / LevelLoader）按 s.bin 中的物件数据创建，不自行加载 .bin。
 * 通过 typeId（继承字段 q）区分三种行为，命中玩家 screen.player 后产生对应效果：
 *   - typeId 3  武器/弹药补给：按 subType 给对应储备加弹
 *       subType 0/3 → player.ammoReserveB += 6（武器1 储备）
 *       subType 2/5 → player.ammoReserveC += 3（武器2 储备）
 *       subType 1/4 → player.grenadeCount = 3（手雷补满到 3）
 *   - typeId 11 血包：玩家存活时 player.health += riseEffectTile，上限 10
 *   - typeId 13 关卡门：玩家落地触碰后将 screen.state 置 LevelScroll（卷动入场下一关）、
 *       解锁相机、把玩家切回站立帧，推进过关流程
 * 拾取/触发后进入 10 帧闪烁冷却（pickupFlashTimer=10），期间隔帧绘制本体并向上飘出
 * 增益图标数值（typeId 3/11），冷却归零后 deactivate 回收。
 *
 * 协作者：screen（GameScreen，提供 player / cameraX,Y / levelLoader / 状态机）、
 * 基类 ActorBase（碰撞 intersectsActor、物理与 paint）。
 *
 * CFR 基准：reverse/game1/2-decompiled-cfr/tjge/k.java（124 行，逐行移植权威源）。
 * 语义参见 docs/game1-红魔特种兵/类清单与职责.md §12、玩法与数值.md §7。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/k.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 字段别名：
 *   a=所属主Canvas(tjge.a), b=道具子类型(case3 读自 byArray[0]),
 *   c=拾取后闪烁倒计时, d=升空特效贴图索引/数值, e=已被拾取标志
 *
 * 方法映射（契约表）：
 *   a(int,int,int,byte[],boolean) -> a_IIIAYZ
 *   a()                           -> a_
 *   a(Graphics,int,int)           -> a_GII
 * 继承自 g 的调用：
 *   a(int) -> a_I, b() -> b_, a(Graphics,int,int) -> a_GII, a(tjge.g) -> a_Tg
 * 跨类调用：
 *   tjge.a.a(int,int,int)                     -> a.a_III (静态)
 *   tjge.a.a(Graphics,int,int,int,boolean,boolean) -> a.a_GIIIZZ
 *   tjge.f 继承 g 的 a(int)                    -> a_I
 */
import { Graphics } from "@red-devil/j2me-shim";
import { ActorBase } from "./ActorBase.ts";
import { GameScreen } from "./GameScreen.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ActorType, GameState, px } from "./constants.ts";

export class PickupActor extends ActorBase {
  screen: GameScreen;
  subType: number = 0;
  pickupFlashTimer: number = 0;
  riseEffectTile: number = 0;
  pickedUp: boolean = false;

  /**
   * 构造道具实例（对应 k(int,d,a)，CFR k.java:22）。
   * @param n      精灵帧定义关联的图元 ID（透传基类，决定动画源）
   * @param d2     精灵帧定义 SpriteDef
   * @param a2     所属主屏 GameScreen，存入 this.screen 供后续交互/绘制
   */
  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.screen = a2;
  }

  /**
   * 物件进屏初始化（对应 a(int,int,int,byte[],boolean)，CFR k.java:27）。
   * 重置闪烁/拾取标志，并按 typeId 解析布置参数 byArray：
   *   - typeId 3：subType = byArray[0]，按其设动画帧，绘制图元 riseEffectTile = subType===0 ? 6 : 3
   *   - typeId 11：riseEffectTile = byArray[0]（同时是加血量与上浮图元）
   * @param bl true 时直接返回 false 不创建（与基类一致的剔除路径）
   * @returns 是否成功放置
   */
  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    this.pickupFlashTimer = 0;
    this.pickedUp = false;
    switch (this.typeId) {
      case ActorType.AmmoSupplyPickup: {
        this.subType = byArray[0];
        this.setFrame(this.subType);
        this.riseEffectTile = this.subType === 0 ? 6 : 3;
        break;
      }
      case ActorType.HealthPickup: {
        this.riseEffectTile = byArray[0];
        this.setFrame(this.subType);
      }
    }
    return true;
  }

  /**
   * 每帧更新与玩家交互（对应 a()，CFR k.java:49）。
   * 处于拾取闪烁冷却时仅清零垂直速度并返回；已拾取则下一帧 deactivate 回收。
   * 否则按 typeId 检测与 screen.player 的碰撞并施加效果：
   *   - 3 武器/弹药补给（按 subType 加对应储备）
   *   - 11 血包（加血并钳到 10）
   *   - 13 关卡门（落地触碰后切 screen.state 为 LevelScroll，推进过关）
   * 触发后置 pickupFlashTimer=10、pickedUp=true，并在 levelLoader.actorSpawned[extra] 标记该屏块已取，播音效 (1,1,255)。
   */
  update(): void {
    if (this.pickupFlashTimer > 0) {
      this.targetVelY = 0;
      return;
    }
    if (this.pickedUp) {
      this.deactivate();
      return;
    }
    switch (this.typeId) {
      case ActorType.AmmoSupplyPickup: {
        if (!this.intersectsActor(this.screen.player)) break;
        GameScreen.playSound(1, 1, 255);
        switch (this.subType) {
          case 0:
          case 3: {
            this.screen.player.ammoReserveB += 6;
            break;
          }
          case 2:
          case 5: {
            this.screen.player.ammoReserveC += 3;
            break;
          }
          case 1:
          case 4: {
            this.screen.player.grenadeCount = 3;
          }
        }
        this.markPickedUp();
        return;
      }
      case ActorType.HealthPickup: {
        if (!this.intersectsActor(this.screen.player) || this.screen.player.health <= 0) break;
        GameScreen.playSound(1, 1, 255);
        this.screen.player.health += this.riseEffectTile;
        if (this.screen.player.health > 10) {
          this.screen.player.health = 10;
        }
        this.markPickedUp();
        return;
      }
      case ActorType.LevelExitGate: {
        if (this.intersectsActor(this.screen.player)) {
          this.screen.flagE = true;
        }
        if (!this.screen.flagE || this.pickedUp || (this.screen.player.stateFlags & 1) === 0) break;
        this.markPickedUp();
        this.screen.player.targetVelX = 0;
        this.screen.cameraVelX = 0;
        this.screen.state = GameState.LevelScroll;
        this.screen.scriptFlagL = false;
        this.screen.player.setFrame(0 | this.screen.player.facingFlag);
        GameScreen.playSound(1, 1, 255);
      }
    }
  }

  /**
   * 标记本道具已被拾取/触发——三处拾取分支（typeId 3/11/13）的共用尾三连：
   * 进入 10 帧闪烁冷却（pickupFlashTimer=10）、置已拾取标志（pickedUp=true）、
   * 并在 levelLoader.actorSpawned[extra] 标记该屏块物件已消费（extra=屏块→actor 索引，
   * 供换屏刷怪去重）。CFR k.java case3(78-80)/case11(90-92)/case13(100-102) 的重复三连。
   * 注：case13 原版前两句为 `e=true; c=10`（与 case3/11 的 `c=10; e=true` 顺序相反）——
   * 二者是对无别名的独立标量字段赋值、其间无观测，重排为统一顺序行为等价（不改任何结果）。
   */
  private markPickedUp(): void {
    this.pickupFlashTimer = 10;
    this.pickedUp = true;
    this.screen.levelLoader.actorSpawned[this.extra] = true;
  }

  /**
   * 绘制道具本体与拾取上浮特效（对应 a(Graphics,int,int)，CFR k.java:113）。
   * 闪烁可见性：未拾取（pickupFlashTimer===0）时正常画本体；拾取后每帧先 --pickupFlashTimer，
   * 仅在 >0 且为奇数帧时画本体，形成 10 帧隔帧闪烁后消失。
   * 上浮特效：拾取期间（pickupFlashTimer>0 且 typeId 为 3 或 11）在道具上方调 screen.drawNumber
   * 绘制增益图标 riseEffectTile，纵向偏移随计时由 0 增到 27px 形成飘升动画。
   * @param cameraX  绘制基准 X（透传，与基类签名一致）
   * @param cameraY 绘制基准 Y（透传，与基类签名一致）
   */
  paint(graphics: Graphics, cameraX: number, cameraY: number): void {
    if (this.pickupFlashTimer === 0 || (--this.pickupFlashTimer > 0 && (this.pickupFlashTimer & 1) !== 0)) {
      super.paint(graphics, cameraX, cameraY);
    }
    if (this.pickupFlashTimer > 0 && (this.typeId === ActorType.AmmoSupplyPickup || this.typeId === ActorType.HealthPickup)) {
      const numberX = (this.posX - this.screen.cameraX) >> 10;
      const numberY = (this.posY - this.screen.cameraY - px(20)) >> 10;
      this.screen.drawNumber(graphics, this.riseEffectTile, numberX, numberY - (30 - 3 * this.pickupFlashTimer), false, true);
    }
  }
}
