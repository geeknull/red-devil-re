/**
 * 道具类（拾取物），继承自 g。
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
import { GameState } from "./constants.ts";

export class PickupActor extends ActorBase {
  screen: GameScreen;
  subType: number = 0;
  pickupFlashTimer: number = 0;
  riseEffectTile: number = 0;
  pickedUp: boolean = false;

  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.screen = a2;
  }

  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    if (bl) {
      return false;
    }
    super.spawnAt(n, n2, n3, byArray, bl);
    this.pickupFlashTimer = 0;
    this.pickedUp = false;
    switch (this.typeId) {
      case 3: {
        this.subType = byArray[0];
        this.setFrame(this.subType);
        this.riseEffectTile = this.subType === 0 ? 6 : 3;
        break;
      }
      case 11: {
        this.riseEffectTile = byArray[0];
        this.setFrame(this.subType);
      }
    }
    return true;
  }

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
      case 3: {
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
        this.pickupFlashTimer = 10;
        this.pickedUp = true;
        this.screen.levelLoader.actorSpawned[this.extra] = true;
        return;
      }
      case 11: {
        if (!this.intersectsActor(this.screen.player) || this.screen.player.health <= 0) break;
        GameScreen.playSound(1, 1, 255);
        this.screen.player.health += this.riseEffectTile;
        if (this.screen.player.health > 10) {
          this.screen.player.health = 10;
        }
        this.pickupFlashTimer = 10;
        this.pickedUp = true;
        this.screen.levelLoader.actorSpawned[this.extra] = true;
        return;
      }
      case 13: {
        if (this.intersectsActor(this.screen.player)) {
          this.screen.flagE = true;
        }
        if (!this.screen.flagE || this.pickedUp || (this.screen.player.stateFlags & 1) === 0) break;
        this.pickedUp = true;
        this.pickupFlashTimer = 10;
        this.screen.levelLoader.actorSpawned[this.extra] = true;
        this.screen.player.targetVelX = 0;
        this.screen.cameraVelX = 0;
        this.screen.state = GameState.LevelScroll;
        this.screen.scriptFlagL = false;
        this.screen.player.setFrame(0 | this.screen.player.facingFlag);
        GameScreen.playSound(1, 1, 255);
      }
    }
  }

  paint(graphics: Graphics, n: number, n2: number): void {
    if (this.pickupFlashTimer === 0 || (--this.pickupFlashTimer > 0 && (this.pickupFlashTimer & 1) !== 0)) {
      super.paint(graphics, n, n2);
    }
    if (this.pickupFlashTimer > 0 && (this.typeId === 3 || this.typeId === 11)) {
      const n3 = (this.posX - this.screen.cameraX) >> 10;
      const n4 = (this.posY - this.screen.cameraY - 20480) >> 10;
      this.screen.drawNumber(graphics, this.riseEffectTile, n3, n4 - (30 - 3 * this.pickupFlashTimer), false, true);
    }
  }
}
