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
import { MIRROR_FLAG } from "./constants.ts";

export class ItemActor extends ActorBase {
  patrolMinX: number = 0;
  patrolMaxX: number = 0;
  patrolMinY: number = 0;
  patrolMaxY: number = 0;
  counter: number = 0;

  constructor(n: number, d2: SpriteDef) {
    super(n, d2);
  }

  // a(byte[]) → a_AY
  spawnFromBytes(byArray: Int8Array): boolean {
    if (!super.spawnFromBytes(byArray)) {
      return false;
    }
    switch (this.typeId) {
      case 15: {
        const n: number = byArray[7] & 0xff;
        this.patrolMinX = this.patrolMaxX = this.posX;
        if (this.actionHighByte === 0) {
          this.patrolMaxX = this.posX + (n << 10);
        } else {
          this.patrolMinX = this.posX - (n << 10);
        }
        this.patrolMinY = this.posY - 10240;
        this.patrolMaxY = this.posY + 10240;
        this.counter = 10;
        break;
      }
      case 7: {
        this.counter = byArray[7];
      }
    }
    return true;
  }

  // b() → b_
  update(): void {
    switch (this.typeId) {
      case 15: {
        const n: number = this.actionHighByte === 0 ? 1 : -1;
        this.targetVelX = 1024 * n;
        if ((n > 0 && this.posX > this.patrolMaxX) || (n < 0 && this.posX < this.patrolMinX)) {
          this.targetVelX = 0;
          this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
          this.setAction(0 | this.actionHighByte);
        }
        if (this.posY > this.patrolMaxY) {
          this.targetVelY = -1024;
        } else if (this.posY < this.patrolMinY) {
          this.targetVelY = 1024;
        }
        if (this.counter-- >= 0) break;
        const n2: number = GameMIDlet.randomBelow(2);
        this.counter = 1 + n2;
        this.targetVelY = n2 > 0 ? -1024 : 1024;
        return;
      }
      case 18: {
        if (this.frameGroupIndex !== 1 || !this.isAnimationDone()) break;
        this.kill();
        return;
      }
      case 7: {
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
      case 20: {
        if (!this.isAnimationDone()) break;
        this.kill();
        return;
      }
      case 14: {
        if (!this.canvas.scene.isVerticalScrollLevel) break;
        this.targetVelX = -6144;
        if (this.posX >= this.canvas.cameraX - 40960) break;
        this.posX = this.canvas.cameraX + this.canvas.viewportWidth + 40960;
        return;
      }
      case 6: {
        if (this.canvas.player.posX > this.posX && this.actionHighByte === 0) {
          this.setAction(MIRROR_FLAG); // Integer.MIN_VALUE
          return;
        }
        if (this.canvas.player.posX >= this.posX || this.actionHighByte === 0) break;
        this.setAction(0);
      }
    }
  }

  // c(int) → c_I
  applyCommand(n: number): void {
    if (n === 0) {
      this.posX = this.canvas.player.posX;
      this.posY = this.canvas.player.posY - 12288;
      return;
    }
    if (n === 1) {
      this.setAction(1 | this.actionHighByte);
    }
  }

  // a(Graphics,int,int) → a_GII
  paint(graphics: Graphics, n: number, n2: number): void {
    super.paint(graphics, n, n2);
    if (this.hitFlashTimer > 0 && this.typeId === 7) {
      const n3: number = (this.posX - this.canvas.cameraX) >> 10;
      const n4: number = ((this.posY - this.canvas.cameraY) >> 10) + this.boxTop;
      LevelScene.drawNumber(graphics, n3, n4 - (40 - 4 * this.hitFlashTimer), this.counter, true, false);
    }
  }
}
