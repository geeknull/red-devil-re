/**
 * 游戏2《红魔特种兵2-深海战舰》玩家 Player Actor 类（继承自 Actor 基类 tjge.h）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/g.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 注意：game2 的 Actor 基类是 h（不是 g）。本类 g 是玩家（最大的 Actor，1181 行）：
 *   移动/跳跃/重力/翻越判定 t_()/武器/输入处理 c_I(键)/动作状态机 r_()。
 *
 * 字段别名（沿用原混淆名）：
 *   静态：a/b=跳跃水平/垂直初速表，c=弹药初值表，d=弹药上限表，e=当前弹药，f=备用弹药，
 *     Q=投掷物冷却队列(4×3)，ak/al/am=武器/手雷发射偏移与动作表。
 *   实例：R=被击退计时，S=动作子计时，T=血量，U=当前武器索引，V=投掷计数，
 *     W=翻越类型，X/Y=翻越目标坐标(定点)，Z=翻越锁定，aa=可跳跃，ab=触发开关待释放，
 *     ac=天花板顶住，ad=空中跳跃中，ae=已完成，af=锁死中，an=私有死亡标志，
 *     ag/ah/ai=公共状态标志，aj=伴随特效(e)。
 *   基类 h 字段：H=朝向(0/Integer.MIN_VALUE)，G=动作位标志，K=阵营位，L=主控 a，
 *     l=动作低 24 位，n=帧索引，o=帧总数，m=播放完毕，j=循环，
 *     p/q=帧水平包围盒，r/s=帧垂直包围盒，u/v=定点坐标，w/x=本帧位移，
 *     y/z=水平/垂直速度，A/B=加速度，C/D=速度上限。
 *
 * 跨类方法名按契约表：
 *   h 基类：g_/a_I(动作)/h_/n_/a_II(查瓦片)/a_AY；
 *   this.L(a)：a_Z(切场景)，字段 c/n/m/q/r，this.L.z(j)：c_II(取实体)/a_I(死亡/胜利)，
 *     字段 w/J/c/n/s/r；tjge.j.a(b).a_()，tjge.j.i 静态 int[]；
 *   tjge.k.a_IIIIIAI 静态生成投掷物；this.aj(e)：c_I/a_I(继承自 h)。
 *
 * 必要偏差：本类原版无资源/音频/像素管线直接调用；System.gc() 原版无；
 *   Integer.MIN_VALUE 以字面量 -2147483648 表示。
 */
import { ActorBase } from "./ActorBase.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ItemActor } from "./ItemActor.ts";
import { LevelScene } from "./LevelScene.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { LevelSubState, MIRROR_FLAG } from "./constants.ts";

export class PlayerActor extends ActorBase {
  public static readonly jumpVelocityX: Int32Array = Int32Array.from([8192, 4096, 8192, 8192, 8192, 8192]);
  public static readonly jumpVelocityY: Int32Array = Int32Array.from([-10240, -10240, -15360, -17408, -15360, -10240]);
  public static readonly ammoInitTable: Int32Array = Int32Array.from([10, 1, 3]);
  public static readonly reserveInitTable: Int32Array = Int32Array.from([99, 6, 3]);
  public static ammoCurrent: Int32Array = new Int32Array(3);
  public static ammoReserve: Int32Array = new Int32Array(3);
  public static throwCooldownQueue: Int32Array[] = new Array<Int32Array>(4);
  private static bulletSpawnOffsets: number[][];
  private static grenadeSpawnOffsets: number[][];
  private static fireActionTable: number[][][];
  knockbackTimer: number = 0;
  actionSubTimer: number = 0;
  health: number = 0;
  currentWeaponIndex: number = 0;
  inputCounter: number = 0;
  vaultType: number = 0;
  vaultTargetX: number = 0;
  vaultTargetY: number = 0;
  vaultLocked: boolean = false;
  canJump: boolean = false;
  switchPending: boolean = false;
  ceilingBlocked: boolean = false;
  airborneJumping: boolean = false;
  levelCleared: boolean = false;
  actionLocked: boolean = false;
  private dead: boolean = false;
  public publicFlagA: boolean = false;
  public publicFlagB: boolean = false;
  public publicFlagC: boolean = false;
  companionEffect: ItemActor | null = null;

  public constructor(n: number, d2: SpriteDef) {
    super(n, d2);
    this.collisionTypeMask = 2;
  }

  // a(byte[]) → a_AY
  public spawnFromBytes(byArray: Int8Array): boolean {
    super.spawnFromBytes(byArray);
    this.resetVaultState();
    this.publicFlagA = false;
    this.levelCleared = false;
    this.actionLocked = false;
    this.switchPending = false;
    this.publicFlagB = false;
    this.publicFlagC = false;
    this.currentWeaponIndex = 0;
    PlayerActor.ammoCurrent[0] = PlayerActor.ammoInitTable[0];
    PlayerActor.ammoCurrent[1] = PlayerActor.ammoInitTable[1];
    PlayerActor.ammoCurrent[2] = PlayerActor.ammoInitTable[2];
    PlayerActor.throwCooldownQueue[0][0] = -1;
    PlayerActor.throwCooldownQueue[1][0] = -1;
    PlayerActor.throwCooldownQueue[2][0] = -1;
    PlayerActor.throwCooldownQueue[3][0] = -1;
    this.health = 10;
    if (this.companionEffect != null) {
      this.companionEffect.alive = false;
      this.companionEffect = null;
    }
    if (byArray[7] > 0) {
      this.spawnEntryEffect();
    } else {
      this.companionEffect = null;
      this.reserved = 1;
    }
    return true;
  }

  // a() → a_
  public spawnEntryEffect(): void {
    this.companionEffect = this.canvas.scene.spawnActor(18, -1) as ItemActor;
    this.companionEffect.applyCommand(0);
    this.companionEffect.setAction(0 | this.actionHighByte);
    this.companionEffect.animLoop = false;
    this.setAction(0x19 | this.actionHighByte);
    this.reserved = 4;
  }

  // i() → i_
  public step(): void {
    let n: number;
    let n2: number;
    let n3: number;
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
    if ((this.reserved & 2) != 0) {
      n3 = this.posX >> 13;
      if (this.targetVelY < 0) {
        n2 = (this.posY + this.velY >> 10) - 30 >> 3;
        n = this.tileAt(n3, n2);
        if ((n & 3) != 0) {
          this.velY = (n2 << 13) + 8192 - this.posY;
          this.setAction(0x16 | this.actionHighByte);
          this.ceilingBlocked = true;
        }
      } else if (this.targetVelY > 0 && ((n = this.tileAt(n3, n2 = (this.posY + this.velY >> 10) + 4 >> 3)) & 4) == 0) {
        this.velY = (n2 << 13) - this.posY;
        this.reserved &= 0xFFFFFFFD;
        this.canvas.inputAction = 0;
      }
      this.targetVelY = 0;
    } else if ((this.reserved & 4) != 0) {
      if (this.canvas.scene.isVerticalScrollLevel && !this.publicFlagB) {
        n3 = this.posY + (this.boxTop << 10) + this.velY;
        n2 = this.posY + (this.boxBottom << 10) + this.velY;
        if (n3 < this.canvas.cameraY) {
          this.velY = this.canvas.cameraY - (this.posY + (this.boxTop << 10));
        } else if (n2 > this.canvas.cameraY + (this.canvas.viewportHeight >> 1)) {
          this.velY = this.canvas.cameraY + (this.canvas.viewportHeight >> 1) - (this.posY + (this.boxBottom << 10));
        }
      }
    } else {
      if (this.collideRight() && this.frameGroupIndex == 25) {
        this.setAction(0x10 | this.actionHighByte);
      }
      if (this.collideLeft() && this.frameGroupIndex == 25) {
        this.setAction(0x10 | this.actionHighByte);
      }
      if (this.checkFloorCollision()) {
        this.resetVaultState();
        if ((this.reserved & 1) == 0) {
          this.reserved = 1;
          if (this.frameGroupIndex != 5 && this.frameGroupIndex != 6 && this.frameGroupIndex != 25) {
            this.targetVelX = 0;
            this.setAction(0x10 | this.actionHighByte);
          }
        }
      } else if (!this.collideDown()) {
        if ((this.reserved & 1) != 0) {
          this.knockbackTimer = 1;
          this.velX = this.actionHighByte == 0 ? 10240 : -10240;
          this.velY = 6144;
          this.targetVelY = 10240;
          this.reserved &= 0xFFFFFFFE;
          this.airborneJumping = false;
          if (this.frameGroupIndex != 5 && this.frameGroupIndex != 6) {
            this.setAction(0x10 | this.actionHighByte);
          }
        } else if (this.frameGroupIndex == 18 || this.frameGroupIndex == 19 || this.frameGroupIndex == 20 || this.frameGroupIndex == 21) {
          this.targetVelY = 12288;
          this.airborneJumping = false;
          this.setAction(0x10 | this.actionHighByte);
        }
        this.accelY = 4096;
        this.updateVaultMotion();
      }
    }
    if (this.canvas.scene.subState == LevelSubState.Normal || this.canvas.scene.subState == LevelSubState.BattleWave) {
      n3 = this.posX + (this.boxLeft << 10) + this.velX;
      n2 = this.posX + (this.boxRight << 10) + this.velX;
      n = this.canvas.cameraX + 4096;
      const n4: number = this.canvas.cameraX + this.canvas.viewportWidth - 4096;
      if (n3 < n) {
        this.velX = n - (this.posX + (this.boxLeft << 10));
      } else if (n2 > n4) {
        this.velX = n4 - (this.posX + (this.boxRight << 10));
      }
    }
    this.posX += this.velX;
    this.posY += this.velY;
    if (this.companionEffect != null) {
      this.companionEffect.applyCommand(0);
      if (!this.companionEffect.alive) {
        this.reserved &= 0xFFFFFFFB;
        this.companionEffect = null;
      }
    }
  }

  // c() → c_
  public advanceEffectFrame(): void {
    this.companionEffect!.applyCommand(1);
  }

  // o() → o_
  public isDead(): boolean {
    return this.dead;
  }

  // b() → b_
  public update(): void {
    this.runActionStateMachine();
    switch (this.canvas.scene.subState) {
      case LevelSubState.BossScript: {
        if ((this.reserved & 4) != 0) {
          this.targetVelX = 0;
          this.targetVelY = 0;
          this.dead = true;
          this.setAction(0x19 | this.actionHighByte);
          break;
        }
        if ((this.reserved & 1) == 0) break;
        this.targetVelX = 0;
        this.dead = true;
        if (this.levelCleared) {
          this.setAction(0x21 | this.actionHighByte);
          break;
        }
        this.setAction(0 | this.actionHighByte);
        break;
      }
      case LevelSubState.Normal:
      case LevelSubState.BattleWave: {
        if (this.canAcceptInput()) {
          this.handleInput(this.canvas.inputAction);
        }
        if (!this.switchPending) break;
        this.switchPending = false;
      }
    }
    if (this.canvas.scene.subState != LevelSubState.BossScript) {
      this.dead = false;
    }
    if (this.health <= 0 && this.frameGroupIndex != 5 && this.frameGroupIndex != 6 && this.frameGroupIndex != 3 && this.frameGroupIndex != 4 && !this.canvas.scene.isVerticalScrollLevel) {
      this.setAction(5 | this.actionHighByte);
    }
  }

  // r() → r_
  private runActionStateMachine(): void {
    const n: number = this.actionHighByte == 0 ? 1 : -1;
    switch (this.frameGroupIndex) {
      case 24: {
        if (this.frameIndex > 3) {
          this.checkCollisions();
        }
      }
      case 8:
      case 10:
      case 27:
      case 29:
      case 30:
      case 32: {
        if (!this.isAnimationDone()) break;
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case 7: {
        if (!this.isAnimationDone()) break;
        this.setAction(0x20 | this.actionHighByte);
        return;
      }
      case 12:
      case 13: {
        let n2: number;
        if (this.isAnimationDone()) {
          if (this.frameGroupIndex == 13) {
            this.setAction(2 | this.actionHighByte);
            return;
          }
          this.setAction(0 | this.actionHighByte);
          return;
        }
        if (this.frameIndex != 2) break;
        const n3: number = this.frameGroupIndex == 12 ? 0 : 1;
        const bl: boolean = false;
        const n4: number = 6 | this.actionHighByte;
        const n5: number = this.computeSpawnCoord(PlayerActor.grenadeSpawnOffsets, n3, 0);
        const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(10, n4, n5, n2 = this.computeSpawnCoord(PlayerActor.grenadeSpawnOffsets, n3, 1), 26, null);
        if (k2 == null) break;
        PlayerActor.ammoCurrent[2] = PlayerActor.ammoCurrent[2] - 1;
        k2.targetVelX = this.actionHighByte == 0 ? 8192 : -8192;
        k2.targetVelY = -6656;
        k2.accelY = 1128;
        k2.maxVelY = 15360;
        return;
      }
      case 9:
      case 11:
      case 28:
      case 31: {
        if (!this.isAnimationDone()) break;
        this.setAction(2 | this.actionHighByte);
        return;
      }
      case 25: {
        if ((this.reserved & 1) != 0) {
          this.actionSubTimer = 0;
          this.targetVelX = 8192 * n;
          this.setAction(0x17 | this.actionHighByte);
          return;
        }
        if ((this.reserved & 4) != 0) break;
        this.targetVelX = 8192 * n;
        return;
      }
      case 26: {
        if ((this.reserved & 4) == 0) {
          this.targetVelX = 8192 * n;
        }
        if (!this.isAnimationDone()) break;
        this.setAction(0x19 | this.actionHighByte);
        return;
      }
      case 22: {
        if (!this.isAnimationDone()) break;
        if (this.ceilingBlocked) {
          this.posY -= 8192;
          this.reserved &= 0xFFFFFFFD;
          this.setAction(0 | this.actionHighByte);
          this.canvas.inputAction = 0;
          return;
        }
        this.posY += 24576;
        this.setAction(0x12 | this.actionHighByte);
        return;
      }
      case 14:
      case 15:
      case 16: {
        if (this.vaultLocked) {
          this.vaultLocked = false;
          this.canJump = false;
          this.setAction(0x11 | this.actionHighByte);
          return;
        }
        if (this.airborneJumping) {
          this.targetVelX = (this.canJump ? PlayerActor.jumpVelocityX[this.vaultType] : 5120) * n;
        } else if (--this.knockbackTimer < 0) {
          this.targetVelX = 0;
        }
        if ((this.reserved & 1) != 0) {
          this.targetVelX = 0;
          this.setAction(0 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex == 15 && this.targetVelY > 3120) {
          this.setAction(0x10 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex != 14 || this.targetVelY < 0) break;
        this.setAction(0xF | this.actionHighByte);
        return;
      }
      case 17: {
        if (this.vaultType < 2 || this.vaultType > 3) {
          this.posY += -12288;
          this.targetVelY = -15360;
          this.actionSubTimer = 0;
        }
        this.setAction(0x23 | this.actionHighByte);
        return;
      }
      case 35: {
        if (this.actionSubTimer++ > 2) {
          this.setAction(0x10 | this.actionHighByte);
        }
        this.targetVelX = (this.canJump ? 8192 : 5120) * n;
        return;
      }
      case 23: {
        if (this.actionSubTimer++ <= 4) break;
        if (this.isFootOnGround()) {
          this.setAction(0 | this.actionHighByte);
        } else {
          this.setAction(2 | this.actionHighByte);
        }
        this.targetVelX = 0;
        return;
      }
      case 5:
      case 6: {
        if ((this.reserved & 1) == 0 || !this.isAnimationDone()) break;
        if (this.health <= 0) {
          this.setAction(3 | this.actionHighByte);
          return;
        }
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case 3: {
        if (!this.isAnimationDone()) break;
        this.setAction(4 | this.actionHighByte);
        return;
      }
      case 4: {
        if (!this.isAnimationDone()) break;
        this.canvas.showResult(false);
      }
    }
  }

  // p() → p_
  public stepThrowQueue(): number {
    let n: number = 0;
    while (n < PlayerActor.throwCooldownQueue.length) {
      if (PlayerActor.throwCooldownQueue[n][0] > 0) {
        const nArray: Int32Array = PlayerActor.throwCooldownQueue[n];
        const n2: number = nArray[1];
        nArray[1] = n2 - 1;
        if (n2 > 0) {
          this.handleInput(PlayerActor.throwCooldownQueue[n][0]);
          break;
        }
        const nArray2: Int32Array = PlayerActor.throwCooldownQueue[n];
        nArray2[2] = nArray2[2] - 1;
        if (nArray2[2] < 0) {
          PlayerActor.throwCooldownQueue[n][0] = 0;
          return n;
        }
        this.handleInput(0);
        break;
      }
      ++n;
    }
    return -1;
  }

  // c(int) → c_I
  private handleInput(n: number): void {
    ++this.inputCounter;
    const n2: number = this.actionHighByte == 0 ? 1 : -1;
    switch (n) {
      case 1: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) {
            if (this.actionHighByte != 0) {
              if (this.frameGroupIndex == 2 && !this.isFootOnGround()) break;
              this.targetVelX = -8192;
              this.setAction(-2147483647);
              return;
            }
            this.setAction(this.frameGroupIndex | MIRROR_FLAG);
            return;
          }
          if (this.frameGroupIndex != 1) break;
          if (this.actionHighByte == 0) {
            this.targetVelX = 0;
            this.setAction(MIRROR_FLAG);
            return;
          }
          if (this.targetVelX != 0) break;
          this.targetVelX = -8192;
          return;
        }
        if ((this.reserved & 4) != 0) {
          this.targetVelX = -10240;
          this.targetVelY = 0;
          return;
        }
        if ((this.reserved & 2) == 0) break;
        if (this.actionHighByte == 0) {
          this.setAction(this.frameGroupIndex | MIRROR_FLAG);
          this.canvas.inputAction = 0;
          return;
        }
        if (this.collideLeft()) break;
        this.airborneJumping = false;
        this.reserved &= 0xFFFFFFFD;
        this.posX -= 8192;
        this.posY += 8192;
        this.targetVelX = -8192;
        this.targetVelY = 12288;
        this.accelY = 4096;
        this.setAction(-2147483632);
        return;
      }
      case 2: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) {
            if (this.actionHighByte == 0) {
              if (this.frameGroupIndex == 2 && !this.isFootOnGround()) break;
              this.targetVelX = 8192;
              this.setAction(1);
              return;
            }
            this.setAction(this.frameGroupIndex);
            return;
          }
          if (this.frameGroupIndex != 1) break;
          if (this.actionHighByte != 0) {
            this.targetVelX = 0;
            this.setAction(0);
            return;
          }
          if (this.targetVelX != 0) break;
          this.targetVelX = 8192;
          return;
        }
        if ((this.reserved & 4) != 0) {
          this.targetVelX = 10240;
          this.targetVelY = 0;
          return;
        }
        if ((this.reserved & 2) == 0) break;
        if (this.actionHighByte != 0) {
          this.setAction(this.frameGroupIndex);
          this.canvas.inputAction = 0;
          return;
        }
        if (this.collideRight()) break;
        this.airborneJumping = false;
        this.reserved &= 0xFFFFFFFD;
        this.posX += 8192;
        this.posY += 8192;
        this.targetVelX = 8192;
        this.targetVelY = 12288;
        this.accelY = 4096;
        this.setAction(16);
        return;
      }
      case 64:
      case 128: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 2) {
            if (!this.isFootOnGround()) break;
            this.setAction(0 | this.actionHighByte);
            return;
          }
          if (this.actionHighByte == 0 && this.canvas.inputAction == 64) {
            this.setAction(this.frameGroupIndex | MIRROR_FLAG);
            return;
          }
          if (this.actionHighByte != 0 && this.canvas.inputAction == 128) {
            this.setAction(this.frameGroupIndex);
            return;
          }
          this.vaultType = this.probeVault();
          if (this.vaultType == 2 || this.vaultType == 3) {
            this.canJump = false;
            this.posX = this.vaultTargetX;
            this.setAction(0x11 | this.actionHighByte);
          } else {
            if (this.vaultType == 5) {
              this.canJump = false;
            }
            this.posY -= 5120;
            this.setAction(0xE | this.actionHighByte);
          }
          this.targetVelX = PlayerActor.jumpVelocityX[this.vaultType] * n2;
          this.targetVelY = PlayerActor.jumpVelocityY[this.vaultType];
          this.airborneJumping = true;
          this.accelY = 4096;
          this.canvas.inputAction = 0;
          this.reserved &= 0xFFFFFFFE;
          return;
        }
        if ((this.reserved & 4) != 0) {
          this.targetVelY = -6144;
          return;
        }
        if (this.frameGroupIndex != 14 && this.frameGroupIndex != 15 || !this.canJump || this.vaultTargetX >= 0 || this.vaultTargetY >= 0) break;
        this.posY -= 20480;
        this.targetVelY = -5120;
        this.canJump = false;
        this.setAction(0x19 | this.actionHighByte);
        return;
      }
      case 8: {
        if ((this.reserved & 1) != 0) {
          if (this.frameGroupIndex == 2) {
            this.actionSubTimer = 0;
            this.targetVelX = 8192 * n2;
            this.setAction(0x17 | this.actionHighByte);
            return;
          }
          if (this.snapToLedge(1)) {
            this.reserved = 2;
            this.accelY = 0;
            this.posY += 24576;
            this.ceilingBlocked = false;
            this.setAction(0x16 | this.actionHighByte);
            return;
          }
          this.targetVelX = 0;
          this.setAction(2 | this.actionHighByte);
          this.canvas.inputAction = 0;
          return;
        }
        if ((this.reserved & 2) != 0) {
          this.targetVelY = 4096;
          this.setAction(21 - (21 - this.frameGroupIndex + 1) % 4 | this.actionHighByte);
          return;
        }
        if ((this.reserved & 4) == 0) break;
        this.targetVelY = 6144;
        return;
      }
      case 32: {
        if ((this.reserved & 4) != 0) {
          this.targetVelY = -6144;
          return;
        }
        if ((this.reserved & 2) != 0) {
          this.targetVelY = -4096;
          this.setAction(18 + (this.frameGroupIndex - 18 + 1) % 4 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex == 2) {
          if (this.isFootOnGround()) {
            this.setAction(0 | this.actionHighByte);
          }
          return;
        }
        if (this.triggerSwitch(false)) {
          return;
        }
        if (this.snapToLedge(0)) {
          this.reserved = 2;
          this.targetVelY = -8192;
          this.accelY = 0;
          this.setAction(0x12 | this.actionHighByte);
          return;
        }
      }
      case 16: {
        let n3: number;
        let n4: number;
        if (this.actionLocked) {
          return;
        }
        if (this.canvas.inputAction == 32 && (this.reserved & 1) != 0) {
          this.targetVelX = 0;
          n4 = 0;
        } else if (this.frameGroupIndex == 0) {
          this.targetVelX = 0;
          n4 = 1;
        } else if (this.frameGroupIndex == 2) {
          this.targetVelX = 0;
          n4 = 2;
        } else if (this.frameGroupIndex == 25) {
          n4 = 3;
        } else {
          return;
        }
        if (this.canvas.scene.isVerticalScrollLevel) {
          if (this.inputCounter < 5) {
            return;
          }
          this.currentWeaponIndex = 0;
          n3 = -2147483637;
          this.inputCounter = 0;
        } else {
          if (PlayerActor.ammoCurrent[this.currentWeaponIndex] <= 0) {
            this.setAction(PlayerActor.fireActionTable[this.currentWeaponIndex][n4][2] | this.actionHighByte);
            return;
          }
          n3 = PlayerActor.fireActionTable[this.currentWeaponIndex][n4][0] | this.actionHighByte;
        }
        const bl: boolean = false;
        const n5: number = this.computeSpawnCoord(PlayerActor.bulletSpawnOffsets, n4, 0);
        const n6: number = this.computeSpawnCoord(PlayerActor.bulletSpawnOffsets, n4, 1);
        const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(10, n3, n5, n6, 26, null);
        if (k2 == null) break;
        if (!k2.hitWall) {
          switch (n4) {
            case 0: {
              k2.targetVelY = -12288;
              break;
            }
            case 1:
            case 2: {
              k2.targetVelX = 12288 * n2;
              break;
            }
            case 3: {
              k2.targetVelX = 12288 * n2;
              k2.targetVelY = 12288;
            }
          }
        }
        this.setAction(PlayerActor.fireActionTable[this.currentWeaponIndex][n4][1] | this.actionHighByte);
        if (this.canvas.scene.isVerticalScrollLevel) {
          k2.targetVelX = 4096;
          k2.targetVelY = 6144;
          k2.accelY = 2048;
          k2.isSpecialGrenade = true;
        } else {
          const n7: number = this.currentWeaponIndex;
          PlayerActor.ammoCurrent[n7] = PlayerActor.ammoCurrent[n7] - 1;
        }
        this.canvas.inputAction = 0;
        return;
      }
      case 1024: {
        if ((this.reserved & 1) == 0 || PlayerActor.ammoCurrent[2] <= 0) break;
        if (this.frameGroupIndex == 0) {
          this.setAction(0xC | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex != 2) break;
        this.setAction(0xD | this.actionHighByte);
        return;
      }
      case 2048: {
        if ((this.reserved & 1) == 0 || this.frameGroupIndex != 0 && this.frameGroupIndex != 2 || !this.reloadCurrentWeapon()) break;
        if (this.frameGroupIndex == 0) {
          this.setAction(0x1E | this.actionHighByte);
        } else {
          this.setAction(0x1F | this.actionHighByte);
        }
        this.targetVelX = 0;
        return;
      }
      case 4096: {
        let n8: number;
        if ((this.reserved & 1) != 0 && (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) && PlayerActor.ammoCurrent[n8 = (this.currentWeaponIndex + 1) % 2] + PlayerActor.ammoReserve[n8] > 0) {
          this.currentWeaponIndex = n8;
          this.reloadCurrentWeapon();
          this.setAction((this.frameGroupIndex == 0 ? 30 : 31) | this.actionHighByte);
        }
        this.canvas.inputAction = 0;
        return;
      }
      default: {
        if (this.frameGroupIndex == 1) {
          this.targetVelX = 0;
          this.setAction(0 | this.actionHighByte);
          return;
        }
        if ((this.reserved & 4) == 0) break;
        this.targetVelX = 0;
        this.targetVelY = 0;
      }
    }
  }

  // s() → s_
  private reloadCurrentWeapon(): boolean {
    if (PlayerActor.ammoCurrent[this.currentWeaponIndex] < PlayerActor.ammoInitTable[this.currentWeaponIndex] && PlayerActor.ammoReserve[this.currentWeaponIndex] > 0) {
      const n: number = PlayerActor.ammoInitTable[this.currentWeaponIndex] - PlayerActor.ammoCurrent[this.currentWeaponIndex];
      if (PlayerActor.ammoReserve[this.currentWeaponIndex] >= n) {
        if (this.currentWeaponIndex != 0) {
          const n2: number = this.currentWeaponIndex;
          PlayerActor.ammoReserve[n2] = PlayerActor.ammoReserve[n2] - n;
        }
        const n3: number = this.currentWeaponIndex;
        PlayerActor.ammoCurrent[n3] = PlayerActor.ammoCurrent[n3] + n;
      } else {
        const n4: number = this.currentWeaponIndex;
        PlayerActor.ammoCurrent[n4] = PlayerActor.ammoCurrent[n4] + PlayerActor.ammoReserve[this.currentWeaponIndex];
        PlayerActor.ammoReserve[this.currentWeaponIndex] = 0;
      }
      return true;
    }
    return false;
  }

  // a(tjge.h) → a_Th
  public onHitBy(h2: ActorBase): boolean {
    if (!h2.hasCollisionFlag(1) || this.frameGroupIndex == 23 || !this.isNewContact(h2)) {
      return false;
    }
    switch (h2.typeId) {
      case 9:
      case 10:
      case 12: {
        this.takeDamage(h2.getDamage(), h2.actionHighByte);
        return true;
      }
      case 1:
      case 3: {
        if (h2.frameGroupIndex != 7) break;
        this.velX = 0;
        if (h2.actionHighByte == 0) {
          if (!this.collideRight()) {
            this.posX += 8192;
          }
        } else if (!this.collideLeft()) {
          this.posX -= 8192;
        }
        this.takeDamage(h2.getDamage(), h2.actionHighByte);
        break;
      }
      case 4: {
        this.takeDamage(3, h2.actionHighByte);
      }
    }
    return false;
  }

  // c(tjge.h) → c_Th
  public onCollide(h2: ActorBase): void {
    switch (h2.typeId) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5: {
        if (this.frameGroupIndex != 23 || (this.reserved & 1) == 0 || !this.isFootOnGround()) break;
        this.targetVelX = 0;
        this.setAction(0x18 | this.actionHighByte);
        return;
      }
      case 11:
      case 13: {
        const n: number = h2.actionHighByte == 0 ? h2.posX + (h2.boxLeft << 10) : h2.posX + (h2.boxRight << 10);
        if (this.actionHighByte != h2.actionHighByte) break;
        if (this.actionHighByte == 0) {
          this.posX = n - (this.boxRight << 10);
          return;
        }
        this.posX = n - (this.boxLeft << 10);
      }
    }
  }

  // c(int,int) → c_II
  private takeDamage(n: number, n2: number): void {
    if (this.health <= 0 || n <= 0) {
      return;
    }
    if (this.canvas.scene.subState != LevelSubState.Normal && this.canvas.scene.subState != LevelSubState.BattleWave) {
      return;
    }
    this.health -= n;
    this.targetVelX = 0;
    if ((this.reserved & 1) != 0) {
      if (this.isFootOnGround()) {
        if (n2 == this.actionHighByte) {
          this.setAction(6 | this.actionHighByte);
        } else {
          this.setAction(5 | this.actionHighByte);
        }
      } else if (this.health <= 0) {
        this.setAction(3 | this.actionHighByte);
      }
    } else if ((this.reserved & 2) != 0) {
      this.reserved &= 0xFFFFFFFD;
      this.setAction(5 | this.actionHighByte);
    } else {
      if ((this.reserved & 4) != 0) {
        this.targetVelY = 0;
        if (this.health <= 0) {
          this.publicFlagC = true;
          LevelScene.cutsceneState[1] = 2;
          this.canvas.scene.setSubState(LevelSubState.Cutscene);
        }
        return;
      }
      this.targetVelY = 6144;
      this.accelY = 4096;
      this.setAction(5 | this.actionHighByte);
    }
    this.canJump = false;
    this.vaultLocked = false;
    this.airborneJumping = false;
    this.vaultTargetX = -1;
    this.vaultTargetY = -1;
  }

  // t() → t_
  private probeVault(): number {
    let n: number;
    let n2: number;
    let n3: number;
    if (this.actionHighByte == 0) {
      n3 = this.boxRight;
      n2 = this.boxRight + 10;
      n = 1;
    } else {
      n3 = this.boxLeft;
      n2 = this.boxLeft - 10;
      n = -1;
    }
    const n4: number = (this.posX >> 10) + n3 >> 3;
    const n5: number = (this.posX + this.velX >> 10) + n2 >> 3;
    const n6: number = (this.posY + this.velY >> 10) - 2 >> 3;
    const n7: number = n6 - 7;
    let n8: number = n4;
    while (n8 != n5 + n) {
      let n9: number = n7;
      while (n9 <= n6) {
        const n10: number = this.tileAt(n8, n9);
        if ((n10 & 3) != 0) {
          const n11: number = n9 - n7;
          switch (n11) {
            case 0: {
              return 5;
            }
            case 1:
            case 2: {
              if ((this.reserved & 1) == 0) {
                return 5;
              }
            }
            case 3:
            case 4: {
              const n12: number = this.tileAt(n8 - n, n9);
              const n13: number = this.tileAt(n8, n9 - 1);
              if (n12 == 0 && n13 == 0) {
                this.vaultTargetX = n > 0 ? n8 << 13 : (n8 << 3) + 8 << 10;
                this.vaultTargetX += this.actionHighByte == 0 ? -10240 : 10240;
                this.vaultTargetY = (n9 << 13) + 40960;
                if (n11 < 3) {
                  return 4;
                }
                if (n11 < 4) {
                  return 3;
                }
                return 2;
              }
              return 4;
            }
            case 5:
            case 6: {
              return 1;
            }
          }
        }
        ++n9;
      }
      n8 += n;
    }
    return 0;
  }

  // u() → u_
  private updateVaultMotion(): void {
    if (!this.canJump || !this.airborneJumping) {
      return;
    }
    if (this.snapToLedge(0)) {
      this.targetVelY = 0;
      this.accelY = 0;
      this.reserved = 2;
      this.setAction(0x12 | this.actionHighByte);
      return;
    }
    if (this.vaultTargetX < 0 && this.vaultTargetY < 0) {
      this.probeVault();
    }
    if (this.vaultTargetX >= 0 && this.vaultTargetY >= 0) {
      if (Math.abs(this.posY - this.vaultTargetY) <= Math.abs(this.velY)) {
        if (!this.isVaultBlocked()) {
          this.velX = this.vaultTargetX - this.posX;
          this.velY = this.vaultTargetY - this.posY;
          this.targetVelX = 0;
          this.targetVelY = 0;
          this.vaultLocked = true;
          return;
        }
      } else if (Math.abs(this.posX - this.vaultTargetX) <= Math.abs(this.velX)) {
        this.targetVelX = 0;
        this.velX = 0;
      }
    }
  }

  // d(int) → d_I
  private snapToLedge(n: number): boolean {
    let n2: number = this.posX + this.velX >> 13;
    const n3: number = n == 0 ? this.boxTop : 10;
    const n4: number = (this.posY >> 10) + n3 >> 3;
    if (this.tileAt(n2, n4) == 4) {
      while (this.tileAt(--n2, n4) == 4) {
      }
      this.posX = (n2 << 3) + 16 << 10;
      this.targetVelX = 0;
      this.velX = 0;
      return true;
    }
    return false;
  }

  // l() → l_
  public collideDown(): boolean {
    if (this.velY > 0) {
      return false;
    }
    const n: number = (this.posY >> 10) + this.boxTop >> 3;
    const n2: number = (this.posY + this.velY >> 10) + this.boxTop >> 3;
    const n3: number = this.posX + this.velX >> 13;
    let n4: number = n;
    while (n4 >= n2) {
      const n5: number = this.tileAt(n3, n4);
      if ((n5 & 3) != 0) {
        this.targetVelY = 0;
        this.velY = ((n4 << 3) + 9 << 10) - (this.posY + (this.boxTop << 10));
        return true;
      }
      --n4;
    }
    this.accelY = 4096;
    return false;
  }

  // q() → q_
  public checkFloorCollision(): boolean {
    if (this.velY < 0) {
      return false;
    }
    const n: number = (this.posY >> 10) + this.boxBottom >> 3;
    const n2: number = (this.posY + this.velY >> 10) + this.boxBottom >> 3;
    let n3: number = n;
    while (n3 <= n2) {
      const n4: number = (this.posX + this.velX >> 10) - 3 >> 3;
      const n5: number = this.posX + this.velX >> 10 >> 3;
      const n6: number = (this.posX + this.velX >> 10) + 3 >> 3;
      let n7: number = this.tileAt(n5, n3);
      if ((n7 & 3) != 0) {
        n7 = this.tileAt(n4, n3);
        const n8: number = this.tileAt(n6, n3);
        if ((n7 & 3) != 0 && (n8 & 3) != 0) {
          this.targetVelY = 0;
          this.velY = (n3 << 13) - (this.posY + (this.boxBottom << 10));
          return true;
        }
      }
      ++n3;
    }
    this.accelY = 4096;
    return false;
  }

  // j() → j_
  public collideLeft(): boolean {
    if (this.velX > 0) {
      return false;
    }
    const n: number = (this.posX + this.velX >> 10) + this.boxLeft >> 3;
    const n2: number = (this.posX >> 10) + this.boxLeft >> 3;
    const n3: number = (this.posY >> 10) + this.boxTop + 2 >> 3;
    const n4: number = (this.posY >> 10) + this.boxBottom - 4 >> 3;
    let n5: number = n3;
    while (n5 <= n4) {
      let n6: number = n2;
      while (n6 >= n) {
        const n7: number = this.tileAt(n6, n5);
        if ((n7 & 3) != 0) {
          this.targetVelX = 0;
          this.posX &= 0xFFFFFC00;
          this.velX = ((n6 << 3) + 8 << 10) - (this.posX + (this.boxLeft << 10));
          return true;
        }
        --n6;
      }
      ++n5;
    }
    return false;
  }

  // k() → k_
  public collideRight(): boolean {
    if (this.velX < 0) {
      return false;
    }
    const n: number = (this.posX >> 10) + this.boxRight >> 3;
    const n2: number = (this.posX + this.velX >> 10) + this.boxRight >> 3;
    const n3: number = (this.posY >> 10) + this.boxTop + 2 >> 3;
    const n4: number = (this.posY >> 10) + this.boxBottom - 4 >> 3;
    let n5: number = n3;
    while (n5 <= n4) {
      let n6: number = n;
      while (n6 <= n2) {
        const n7: number = this.tileAt(n6, n5);
        if ((n7 & 3) != 0) {
          this.targetVelX = 0;
          this.posX &= 0xFFFFFC00;
          this.velX = ((n6 << 3) - 1 << 10) - (this.posX + (this.boxRight << 10));
          return true;
        }
        ++n6;
      }
      ++n5;
    }
    return false;
  }

  // v() → v_
  private canAcceptInput(): boolean {
    return this.health > 0 && !this.levelCleared && (this.frameGroupIndex == 0 || this.frameGroupIndex == 1 || this.frameGroupIndex == 2 || this.frameGroupIndex == 30 || this.frameGroupIndex == 31 || this.frameGroupIndex == 18 || this.frameGroupIndex == 19 || this.frameGroupIndex == 20 || this.frameGroupIndex == 21 || this.frameGroupIndex == 25 || this.frameGroupIndex == 14 || this.frameGroupIndex == 15 || this.frameGroupIndex == 32);
  }

  // a(int[][],int,int) → a_AAIII
  private computeSpawnCoord(nArray: number[][], n: number, n2: number): number {
    let n3: number = 1;
    if (this.actionHighByte != 0) {
      n3 = -1;
    }
    let n4: number = 0;
    if (n2 == 0) {
      n4 = (nArray[n][n2] << 10) * n3;
      n4 += this.posX;
    } else {
      n4 = nArray[n][n2] << 10;
      n4 += this.posY;
    }
    return n4;
  }

  // m() → m_
  public getDamage(): number {
    switch (this.frameGroupIndex) {
      case 24: {
        return 10;
      }
    }
    return 0;
  }

  // w() → w_
  private isFootOnGround(): boolean {
    const n: number = this.posX >> 13;
    const n2: number = (this.posY >> 10) + this.boxTop >> 3;
    let n3: number = 2;
    while (n3 >= 0) {
      const n4: number = this.tileAt(n, n2 - n3);
      if ((n4 & 3) != 0) break;
      --n3;
    }
    return n3 < 0;
  }

  // x() → x_
  private isVaultBlocked(): boolean {
    const n: number = this.posX >> 13;
    const n2: number = (this.posY + this.velY >> 10) + this.boxBottom >> 3;
    let n3: number = 0;
    while (n3 < 2) {
      const n4: number = this.tileAt(n, n2 + n3);
      if ((n4 & 3) != 0) break;
      ++n3;
    }
    return n3 < 2;
  }

  // a(boolean) → a_Z
  public triggerSwitch(bl: boolean): boolean {
    if (bl) {
      this.switchPending = true;
    } else if (this.switchPending && (this.reserved & 1) != 0) {
      this.targetVelX = 0;
      this.setAction(0x21 | this.actionHighByte);
      this.canvas.scene.setSubState(LevelSubState.TransitionOut);
      return true;
    }
    return false;
  }

  // b(int,int) → b_II
  public setTilePosition(n: number, n2: number): void {
    this.posX = n << 14;
    this.posY = n2 << 14;
    this.setAction(0 | this.actionHighByte);
    LevelScene.camera.resetDrawnBounds();
  }

  // y() → y_
  private resetVaultState(): void {
    this.vaultTargetX = -1;
    this.vaultTargetY = -1;
    this.airborneJumping = false;
    this.vaultLocked = false;
    this.canJump = true;
    this.vaultType = 0;
  }

  // a(tjge.e) → a_Te
  public applyPickup(e2: ItemActor): void {
    switch (e2.frameGroupIndex) {
      case 0: {
        PlayerActor.ammoReserve[1] = PlayerActor.ammoReserve[1] + e2.counter;
        PlayerActor.ammoReserve[1] = Math.min(99, PlayerActor.ammoReserve[1]);
        return;
      }
      case 1: {
        PlayerActor.ammoCurrent[2] = PlayerActor.ammoCurrent[2] + e2.counter;
        PlayerActor.ammoCurrent[2] = Math.min(3, PlayerActor.ammoCurrent[2]);
        return;
      }
      case 2: {
        this.health += e2.counter;
        this.health = Math.min(10, this.health);
      }
    }
  }

  // static {}
  static {
    PlayerActor.throwCooldownQueue[0] = new Int32Array(3);
    PlayerActor.throwCooldownQueue[1] = new Int32Array(3);
    PlayerActor.throwCooldownQueue[2] = new Int32Array(3);
    PlayerActor.throwCooldownQueue[3] = new Int32Array(3);
    PlayerActor.ammoReserve[0] = PlayerActor.reserveInitTable[0];
    PlayerActor.ammoReserve[1] = PlayerActor.reserveInitTable[1];
    PlayerActor.ammoReserve[2] = PlayerActor.reserveInitTable[2];
    PlayerActor.bulletSpawnOffsets = [[-2, -56], [28, -26], [28, -16], [30, 11]];
    PlayerActor.grenadeSpawnOffsets = [[0, -32], [0, -24]];
    PlayerActor.fireActionTable = [
      [[0, 7, 29], [1, 8, 27], [1, 9, 28], [2, 26, 25]],
      [[3, 7, 29], [4, 10, 27], [4, 11, 28], [5, 26, 25]],
    ];
  }
}
