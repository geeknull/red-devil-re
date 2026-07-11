/**
 * 游戏2《红魔特种兵2-深海战舰》道具/特殊单位 Actor 类（继承自基类 h）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/e.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 注意：game2 的 Actor 基类是 h（h 构造为 h(int,d)，两参，与 game1 的三参不同）。
 *
 * 字段（混淆名沿用原版，均为 int）：a/b=水平巡逻边界(定点)；c/d=垂直巡逻边界(定点)；
 *   e=计时/计数（case 7 时为道具/弹药数量，case 15 时为转向倒计时）。
 * 继承自 h 的字段（见 h.java）：h=类型ID, u/v=定点坐标(<<10), H=朝向标志位(0/Integer.MIN_VALUE),
 *   y/z=水平/垂直速度, l=动作低 24 位, J=受击/激活计时, L=所属主控 tjge.a, r=动作上偏移,
 *   m/n=（经 L 访问的是 a.m/a.n 屏幕滚动基准）。
 *
 * 跨类方法名按契约表：
 *   super.a_AY(byte[])；this.a_I(int)=设置动作；this.e_()=移除；this.h_()=动画结束判定；
 *   this.f_()=回收并标记；this.b_Th(h)=碰撞判定；this.L.y.a_Te(this)=g 关联本特效；
 *   GameMIDlet.a_I(int)=随机数；super.a_GII(Graphics,int,int)；j.a_GIIIZZ(...)=静态数字绘制。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用。
 */
import { Graphics } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { ActorBase } from "./ActorBase.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { LevelScene } from "./LevelScene.ts";
import { MIRROR_FLAG, ActorType, px } from "./constants.ts";

export class ItemActor extends ActorBase {
  patrolMinX: number = 0;
  patrolMaxX: number = 0;
  patrolMinY: number = 0;
  patrolMaxY: number = 0;
  counter: number = 0;

  /**
   * 构造道具/特殊单位 Actor。
   * @param n 类型ID（写入基类 h；工厂分派类型 6/7/14/15/18/20/22）。
   * @param d2 精灵定义（动作/帧数据，由 d 注入；本类自身无 .bin 加载）。
   * 仅转调父类 ActorBase(=h)(int,d)，巡逻边界/计数等字段保持默认 0。
   * 对应 CFR：reverse/game2/2-decompiled-cfr/tjge/e.java 构造函数（e.java:13-15）。
   */
  constructor(n: number, d2: SpriteDef) {
    super(n, d2);
  }

  /**
   * 从关卡字节流生成本单位（覆写基类）。
   * 先调 super.spawnFromBytes 读取通用头（坐标/朝向/动作等），失败即返回 false；
   * 再按类型ID 做附加初始化：
   *   - case 15（巡逻飞行小怪）：读 byArray[7] 作巡逻距离 n，按朝向 actionHighByte 算出
   *     水平巡逻边界 patrolMinX/patrolMaxX（向右巡逻则 +(n<<10)，向左则 -(n<<10)），
   *     垂直边界固定为 posY±10240，转向倒计时 counter 置 10。
   *   - case 7（可拾取道具）：读 byArray[7] 作道具/弹药数量存入 counter。
   * 对应 CFR e.java:17-43（友好名 spawnFromBytes）。
   * @param byArray 关卡 actor 实例字节段（字节 7+ 为子类附加参数）。
   * @returns 是否成功生成（沿用 super 结果）。
   */
  // a(byte[]) → a_AY
  spawnFromBytes(byArray: Int8Array): boolean {
    if (!super.spawnFromBytes(byArray)) {
      return false;
    }
    switch (this.typeId) {
      case ActorType.PatrolFlyer: {
        const spanX: number = byArray[7] & 0xff;
        this.patrolMinX = this.patrolMaxX = this.posX;
        if (this.actionHighByte === 0) {
          this.patrolMaxX = this.posX + (spanX << 10);
        } else {
          this.patrolMinX = this.posX - (spanX << 10);
        }
        this.patrolMinY = this.posY - px(10);
        this.patrolMaxY = this.posY + px(10);
        this.counter = 10;
        break;
      }
      case ActorType.ItemPickup: {
        this.counter = byArray[7];
      }
    }
    return true;
  }

  /**
   * 每帧 AI/行为更新，按类型ID 分派（覆写基类生命周期）。
   *   - case 15：巡逻飞行小怪——水平来回摆动（撞到 patrolMin/MaxX 即清速、翻转朝向 MIRROR_FLAG
   *     并重设动作），垂直方向被钳在 patrolMin/MaxY 内，counter 倒计时到点后随机翻转纵向速度。
   *   - case 18：玩家挥刀/动作特效——frameGroupIndex==1 且动画播完即 kill 自移除。
   *   - case 7：可拾取道具——hitFlashTimer 走完即 killAndMarkSpawned；否则玩家存活且与之相交时
   *     置 hitFlashTimer=10 并调 player.applyPickup(this) 加资源。
   *   - case 20：爆炸碎片——动画播完即 kill。
   *   - case 14：随激流飘动的杂物（Boss 竖版关）——持续左漂，越过相机左侧后回卷到屏右循环。
   *   - case 6：转向触发牌——按玩家相对位置追面朝向（设动作 0 或 MIRROR_FLAG）。
   * 对应 CFR e.java:45-110（友好名 update）。
   */
  // b() → b_
  update(): void {
    switch (this.typeId) {
      case ActorType.PatrolFlyer: {
        const dir: number = this.actionHighByte === 0 ? 1 : -1;
        this.targetVelX = px(1) * dir;
        if ((dir > 0 && this.posX > this.patrolMaxX) || (dir < 0 && this.posX < this.patrolMinX)) {
          this.targetVelX = 0;
          this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
          this.setAction(0 | this.actionHighByte);
        }
        if (this.posY > this.patrolMaxY) {
          this.targetVelY = px(-1);
        } else if (this.posY < this.patrolMinY) {
          this.targetVelY = px(1);
        }
        if (this.counter-- >= 0) break;
        const flip: number = GameMIDlet.randomBelow(2);
        this.counter = 1 + flip;
        this.targetVelY = flip > 0 ? px(-1) : px(1);
        return;
      }
      case ActorType.PlayerAttachedEffect: {
        if (this.frameGroupIndex !== 1 || !this.isAnimationDone()) break;
        this.kill();
        return;
      }
      case ActorType.ItemPickup: {
        if (this.hitFlashTimer > 0) {
          if (this.hitFlashTimer !== 1) break;
          this.killAndMarkSpawned();
          return;
        }
        if (this.canvas.player.health <= 0 || !this.collidesWith(this.canvas.player)) break;
        this.hitFlashTimer = 10;
        this.canvas.player.applyPickup(this);
        return;
      }
      case ActorType.SplashEffect: {
        if (!this.isAnimationDone()) break;
        this.kill();
        return;
      }
      case ActorType.DriftingFlotsam: {
        if (!this.canvas.scene.isVerticalScrollLevel) break;
        this.targetVelX = px(-6);
        if (this.posX >= this.canvas.cameraX - px(40)) break;
        this.posX = this.canvas.cameraX + this.canvas.viewportWidth + px(40);
        return;
      }
      case ActorType.NavalOfficerNpc: {
        if (this.canvas.player.posX > this.posX && this.actionHighByte === 0) {
          this.setAction(MIRROR_FLAG); // Integer.MIN_VALUE
          return;
        }
        if (this.canvas.player.posX >= this.posX || this.actionHighByte === 0) break;
        this.setAction(0);
      }
    }
  }

  /**
   * 外部命令钩子（主要供类型 18 的玩家随动特效使用）。
   *   - n==0：吸附到玩家坐标正上方（posX=玩家 X，posY=玩家 Y-12288）。
   *   - n==1：按当前朝向 actionHighByte 触发动作 1。
   * 对应 CFR e.java:112-119（友好名 applyCommand）。
   * @param command 命令码（0=吸附定位 / 1=触发动作）。
   */
  // c(int) → c_I
  applyCommand(command: number): void {
    if (command === 0) {
      this.posX = this.canvas.player.posX;
      this.posY = this.canvas.player.posY - px(12);
      return;
    }
    if (command === 1) {
      this.setAction(1 | this.actionHighByte);
    }
  }

  /**
   * 绘制本单位（覆写基类绘制）。
   * 先调 super.paint 绘出精灵本体；当类型为 7（可拾取道具）且处于拾取计时 hitFlashTimer>0 时，
   * 在道具头顶用 LevelScene.drawNumber 弹出拾取数量 counter（高度随 hitFlashTimer 上浮）。
   * 对应 CFR e.java:121-128（友好名 paint）。
   * @param graphics 目标画布。
   * @param screenX  绘制基准 X（屏幕坐标，由场景传入）。
   * @param screenY 绘制基准 Y（屏幕坐标，由场景传入）。
   */
  // a(Graphics,int,int) → a_GII
  paint(graphics: Graphics, screenX: number, screenY: number): void {
    super.paint(graphics, screenX, screenY);
    if (this.hitFlashTimer > 0 && this.typeId === ActorType.ItemPickup) {
      const numberX: number = (this.posX - this.canvas.cameraX) >> 10;
      const numberY: number = ((this.posY - this.canvas.cameraY) >> 10) + this.boxTop;
      LevelScene.drawNumber(graphics, numberX, numberY - (40 - 4 * this.hitFlashTimer), this.counter, true, false);
    }
  }
}
