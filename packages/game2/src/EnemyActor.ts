/**
 * 游戏2《红魔特种兵2-深海战舰》普通敌人/步兵 Actor 类（继承自 Actor 基类 h）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/f.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 与游戏1 差异（game2 专属）：
 *   - Actor 基类是 h（构造 (int, tjge.d) 两参，无 a 引用），状态字段为 a.b（非 a.p）；
 *   - 屏幕 176×204；帧率 80ms；定点坐标/速度 << 10（×1024）原样保留。
 *
 * 字段别名（混淆名沿用原版）：
 *   af/ag/ah=静态攻击/发射偏移参数表；a=血量/命数；b=朝向系数(±1)；c=计时；
 *   d/e/f=出生参数（巡逻范围/类型/连射）；Q=本帧 AI 判定；R=上帧 AI 判定；
 *   S=出生参数；T=初始朝向；U=受击前子状态备份；V=攻击节奏阈值；W=巡逻剩余次数；
 *   X=已开火标记；Y/Z=巡逻左右边界(定点)；aa=反应速度系数；ab=需转向；ac=已进入瞄准；
 *   ad=玩家 tjge.g；ae=关联 tjge.c（载具/炮台）。
 *   基类 h 字段：h=类型ID, l=动作低24位, n=帧索引, t=对象槽位, J=受击闪烁计时,
 *   G=AI 子状态, H=朝向标志位(0/Integer.MIN_VALUE/0x40000000), K=碰撞掩码,
 *   u/v=定点坐标(<<10), y/z=水平/垂直速度, L=主控 tjge.a, m=剩余命数语义无关此处。
 *
 * 跨类方法名按契约表：
 *   super.a_AY(byte[])=h.a(byte[])；this.a_I=h.a(int) 切动作；this.h_=h.h()动画结束；
 *   this.b_I=h.b(int)碰撞掩码判定；this.b_Th=h.b(tjge.h)相交；this.d_Th=h.d(tjge.h)；
 *   this.m_=h.m()；ad.c_Th=g.c(tjge.h)；ad.a_Th=g.a(tjge.h)；ae.c_=c.c()；
 *   k.a_IIIIIAI=tjge.k.a(...) 静态生成子弹；GameMIDlet.a_I=随机数。
 *
 * 必要偏差：本类无资源/音频/像素管线直接调用。
 */
import { GameMIDlet } from "./GameMIDlet.ts";
import { BossActor } from "./BossActor.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { LevelScene } from "./LevelScene.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { MIRROR_FLAG, FLIP_VERTICAL_BIT } from "./constants.ts";

export class EnemyActor extends ActorBase {
  private static readonly fireOffsetTable: number[][] = [
    [-6, -56, 0, -10, 0],
    [28, -26, 10, 0, 1],
    [28, -15, 10, 0, 1],
    [4, 4, 0, 10, FLIP_VERTICAL_BIT],
  ];
  private static readonly throwOffsetTable: number[][] = [
    [0, -32],
    [0, -24],
  ];
  private static readonly turretShotParams: number[] = [16, 0, 0, 8192];
  hp: number = 0;
  facingSign: number = 0;
  timer: number = 0;
  patrolRange: number = 0;
  enemyVariant: number = 0;
  burstCount: number = 0;
  threatCode: number = 0;
  prevThreatCode: number = 0;
  spawnParam: number = 0;
  initialFacing: number = 0;
  preHitSubState: number = 0;
  attackRhythm: number = 0;
  patrolRemaining: number = 0;
  hasFired: boolean = false;
  patrolLeftBound: number = 0;
  patrolRightBound: number = 0;
  reactionFactor: number = 0;
  needTurn: boolean = false;
  isAiming: boolean = false;
  player!: PlayerActor;
  linkedVehicle: BossActor | null = null;

  constructor(n: number, d2: SpriteDef) {
    super(n, d2);
    this.collisionTypeMask = 1;
  }

  // a(byte[]) → a_AY
  spawnFromBytes(byArray: Int8Array): boolean {
    if (!super.spawnFromBytes(byArray)) {
      return false;
    }
    this.timer = 0;
    this.patrolRemaining = 0;
    this.attackRhythm = 4;
    this.patrolLeftBound = this.posX;
    this.patrolRightBound = this.posX;
    this.reserved = 0;
    switch (this.typeId) {
      case 1:
      case 3: {
        this.reactionFactor = 1 + GameMIDlet.randomBelow(3);
        this.patrolRange = byArray[7] & 0xff;
        this.enemyVariant = byArray[8];
        this.burstCount = byArray[9];
        this.patrolRemaining = byArray[10];
        this.hp = this.burstCount + 1;
        if (this.patrolRange <= 0) break;
        if (this.actionHighByte === 0) {
          this.patrolRightBound = this.posX + (this.patrolRange << 10);
        } else {
          this.patrolLeftBound = this.posX - (this.patrolRange << 10);
        }
        if (this.enemyVariant !== 22) break;
        this.reserved = 8;
        break;
      }
      case 4: {
        this.patrolRange = byArray[7] & 0xff;
        this.enemyVariant = byArray.length > 8 ? byArray[8] : 0;
        this.hp = 2;
        if (this.patrolRange <= 0) break;
        if (this.enemyVariant === 22) {
          this.patrolLeftBound = this.canvas.cameraX - (this.boxLeft << 10);
          this.patrolRightBound = this.canvas.cameraX + this.canvas.viewportWidth - (this.boxRight << 10);
          break;
        }
        if (this.actionHighByte === 0) {
          this.patrolRightBound = this.posX + (this.patrolRange << 10);
          break;
        }
        this.patrolLeftBound = this.posX - (this.patrolRange << 10);
        break;
      }
      case 5: {
        this.spawnParam = byArray[7];
        this.hp = 1;
        this.timer = 5;
        break;
      }
      case 2: {
        const by: number = byArray[7];
        this.spawnParam = byArray[8];
        this.patrolRange = byArray[9];
        this.patrolLeftBound = byArray[9];
        if (LevelScene.activeActors[by] == null) break;
        this.linkedVehicle = LevelScene.activeActors[by] as unknown as BossActor; // (c)tjge.j.e[by]：Java 向下转型 h→c
      }
    }
    this.initialFacing = this.actionHighByte;
    this.player = this.canvas.player;
    this.isAiming = false;
    this.hasFired = false;
    return true;
  }

  // b() → b_
  update(): void {
    this.facingSign = this.actionHighByte === 0 ? 1 : -1;
    switch (this.typeId) {
      case 1:
      case 3:
      case 4: {
        this.updateWalkerAi();
        break;
      }
      case 2:
      case 5: {
        this.updateTurretAi();
      }
    }
    if (this.reserved !== 6 && this.reserved !== 7 && this.hp > 0 && this.player.frameGroupIndex === 23 && Math.abs(this.player.posY - this.posY) <= 10240 && Math.abs(this.player.posX - this.posX) <= 25600) {
      this.player.onCollide(this);
    }
  }

  // a() → a_
  private updateWalkerAi(): void {
    this.threatCode = this.evaluateThreat();
    if (this.threatCode !== this.prevThreatCode) {
      this.isAiming = false;
      this.prevThreatCode = this.threatCode;
    }
    if (this.threatCode > 0) {
      this.needTurn = (this.actionHighByte === 0 && this.posX > this.player.posX) || (this.actionHighByte !== 0 && this.posX < this.player.posX);
      if (!this.isAiming) {
        this.targetVelX = 0;
        this.isAiming = true;
        this.timer = this.threatCode === 4 && !this.hasFired ? 0 : this.attackRhythm;
        this.reserved = 0;
      }
    } else {
      this.isAiming = false;
    }
    switch (this.reserved) {
      case 0: {
        if (this.isAiming) {
          if (this.needTurn) {
            this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
          }
          this.aimAndFire();
          break;
        }
        if (this.timer-- < 0 && this.patrolRange > 0) {
          this.reserved = 4;
        }
        if (this.frameGroupIndex === 0) break;
        this.setAction(0 | (this.patrolRange > 0 ? this.actionHighByte : this.initialFacing));
        break;
      }
      case 1: {
        if (this.isAnimationDone()) {
          this.reserved = 0;
          this.timer = 8;
          if (this.typeId === 3) {
            this.timer = 16;
          }
          this.attackRhythm = this.timer;
          this.setAction((this.frameGroupIndex === 8 ? 0 : 4) | this.actionHighByte);
        } else if (this.typeId === 3 && this.frameIndex === 2) {
          const n: number = this.frameGroupIndex === 8 ? 0 : 1;
          const n2: number = 6 | this.actionHighByte;
          const n3: number = this.posX + (EnemyActor.throwOffsetTable[n][0] << 10) * this.facingSign;
          const n4: number = this.posY + (EnemyActor.throwOffsetTable[n][1] << 10);
          this.launchProjectile(ProjectileActor.spawnProjectile(10, n2, n3, n4, 25, null)); // this.a(tjge.k)：传入投射物 → a_Tk
        }
        this.hasFired = false;
        break;
      }
      case 2: {
        if (this.timer-- >= 0) break;
        this.reserved = 4;
        this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
        this.setAction(0 | this.actionHighByte);
        break;
      }
      case 4:
      case 8: {
        this.targetVelX = 4096 * this.facingSign;
        this.hasFired = false;
        if ((this.facingSign > 0 && this.posX > this.patrolRightBound) || (this.facingSign < 0 && this.posX < this.patrolLeftBound)) {
          if (this.reserved === 8) {
            this.patrolLeftBound = this.canvas.cameraX + 20480;
            this.patrolRightBound = this.canvas.cameraX + this.canvas.viewportWidth - 20480;
            this.preHitSubState = 0;
            this.reserved = 4;
          } else {
            this.reserved = 2;
            this.targetVelX = 0;
            this.timer = 15;
          }
          this.setAction(0 | this.actionHighByte);
          break;
        }
        if (this.frameGroupIndex === 3) break;
        this.setAction(3 | this.actionHighByte);
        break;
      }
      case 5: {
        this.attackRhythm = 8;
        if (this.frameGroupIndex === 7) {
          this.hasFired = true;
          if (this.collidesWith(this.player)) {
            this.player.onHitBy(this);
          }
          if (!this.isAnimationDone()) break;
          this.reserved = this.preHitSubState === 8 ? this.preHitSubState : 0;
          this.setAction(0 | this.actionHighByte);
          break;
        }
        if (this.typeId === 1) {
          const n: number = this.frameGroupIndex - 8;
          const n5: number = EnemyActor.fireOffsetTable[n][4] | this.actionHighByte;
          const n6: number = this.posX + (EnemyActor.fireOffsetTable[n][0] << 10) * this.facingSign;
          const n7: number = this.posY + (EnemyActor.fireOffsetTable[n][1] << 10);
          const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(10, n5, n6, n7, 25, null);
          if (k2 == null) break;
          if (!k2.hitWall) {
            k2.targetVelX = (EnemyActor.fireOffsetTable[n][2] << 10) * this.facingSign;
            k2.targetVelY = EnemyActor.fireOffsetTable[n][3] << 10;
          }
          this.reserved = 1;
          this.setAction(this.frameGroupIndex | this.actionHighByte);
          break;
        }
        if (this.typeId !== 3) break;
        this.setAction((this.frameGroupIndex === 0 ? 8 : 9) | this.actionHighByte);
        this.reserved = 1;
        this.attackRhythm = this.timer = 16;
        break;
      }
      case 6: {
        if (!this.isAnimationDone()) break;
        if (this.hp > 0) {
          this.hasFired = false;
          this.reserved = this.preHitSubState === 8 ? this.preHitSubState : 0;
          this.setAction(0 | this.actionHighByte);
          break;
        }
        this.reserved = 7;
        this.setAction(1 | this.actionHighByte);
        this.hitFlashTimer = 10;
        break;
      }
      case 7: {
        if (!this.isAnimationDone()) break;
        if (this.frameGroupIndex === 1) {
          this.setAction(2 | this.actionHighByte);
          break;
        }
        if (this.frameGroupIndex !== 2 || this.hitFlashTimer > 1) break;
        if (this.slotIndex >= this.canvas.scene.residentActorSlots) {
          --this.canvas.scene.waveSpawnCount;
        }
        ++this.canvas.scene.reservedD;
        this.killAndMarkSpawned();
      }
    }
    if (this.typeId === 4 && this.reserved !== 6 && this.reserved !== 7 && this.player.health > 0 && this.collidesWith(this.player)) {
      this.applyDamage(10, 0);
      this.player.onHitBy(this);
    }
  }

  // c() → c_
  private updateTurretAi(): void {
    if (this.typeId === 2 && this.linkedVehicle != null && this.linkedVehicle.health <= 0) {
      this.applyDamage(10, 0);
      this.linkedVehicle = null;
      return;
    }
    switch (this.reserved) {
      case 0: {
        if (this.frameGroupIndex !== 0) {
          this.setAction(0 | this.actionHighByte);
        }
        if (this.evaluateThreat() <= 0) break;
        if (this.typeId === 5) {
          if ((this.actionHighByte === 0 && this.posX > this.player.posX) || (this.actionHighByte !== 0 && this.posX < this.player.posX)) {
            this.actionHighByte ^= MIRROR_FLAG; // Integer.MIN_VALUE
            this.setAction(this.frameGroupIndex | this.actionHighByte);
          }
          if (this.timer-- >= 0) break;
          this.reserved = 5;
          return;
        }
        this.reserved = 5;
        return;
      }
      case 1: {
        if (this.timer-- < 0) {
          this.timer = 5;
          this.reserved = 0;
          return;
        }
        if (!this.isAnimationDone()) break;
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case 5: {
        if (this.typeId === 5) {
          const n: number = EnemyActor.turretShotParams[2] | this.actionHighByte;
          const n2: number = this.posX + (EnemyActor.turretShotParams[0] << 10) * this.facingSign;
          const n3: number = this.posY + (EnemyActor.turretShotParams[1] << 10);
          const k2: ProjectileActor | null = ProjectileActor.spawnProjectile(16, n, n2, n3, 1, null);
          if (k2 == null) break;
          k2.targetVelX = EnemyActor.turretShotParams[3] * this.facingSign;
          this.reserved = 1;
          this.timer = 12;
          this.setAction(3 | this.actionHighByte);
          return;
        }
        if (this.typeId !== 2) break;
        if (this.linkedVehicle != null && this.linkedVehicle.requestFire()) {
          this.setAction(3 | this.actionHighByte);
          --this.patrolLeftBound;
        }
        if (this.patrolLeftBound > 0) break;
        this.patrolLeftBound = this.patrolRange;
        this.timer = this.spawnParam;
        this.reserved = 1;
        return;
      }
      case 6: {
        if (!this.isAnimationDone()) break;
        if (this.hp > 0) {
          this.timer = 5;
          this.reserved = 0;
          this.setAction(0 | this.actionHighByte);
          return;
        }
        this.reserved = 7;
        this.setAction(1 | this.actionHighByte);
        this.hitFlashTimer = 10;
        return;
      }
      case 7: {
        if (!this.isAnimationDone()) break;
        if (this.frameGroupIndex === 1) {
          this.setAction(2 | this.actionHighByte);
          return;
        }
        if (this.frameGroupIndex !== 2 || this.hitFlashTimer > 1) break;
        ++this.canvas.scene.reservedD;
        this.killAndMarkSpawned();
      }
    }
  }

  // o() → o_
  private evaluateThreat(): number {
    if (this.reserved === 6 || this.reserved === 7 || this.reserved === 5 || this.reserved === 1 || this.player.health <= 0) {
      return 0;
    }
    const bl: boolean = false;
    let n: number = 0;
    let n2: number = 0;
    let n3: number = 0;
    let n4: number = 0;
    let n5: number = 2;
    let n6: number = 2;
    const bl2: boolean = false;
    if (this.actionHighByte === 0) {
      n5 = 1;
    } else {
      n6 = 1;
    }
    n = (((this.canvas.viewportWidth * 9) / 10) | 0) / ((2 / n5) | 0) | 0;
    n2 = (((this.canvas.viewportWidth * 9) / 10) | 0) / ((2 / n6) | 0) | 0;
    n3 = 20480;
    n4 = 20480;
    switch (this.typeId) {
      case 1:
      case 3: {
        let n7: number = this.posX - 30720;
        let n8: number = this.posX + 30720;
        let n9: number = this.posY - 20480;
        let n10: number = this.posY + 20480;
        if (this.player.posX > n7 && this.player.posX < n8 && this.player.posY > n9 && this.player.posY < n10 && this.player.frameGroupIndex !== 23 && this.player.frameGroupIndex !== 24) {
          return 4;
        }
        if (this.reserved === 8) {
          return 0;
        }
        if (this.enemyVariant <= 0) break;
        if (this.typeId === 3) {
          n3 = this.canvas.viewportHeight;
          n4 = this.canvas.viewportHeight;
          break;
        }
        n7 = n >> 2;
        n8 = n2 >> 2;
        n9 = this.canvas.viewportHeight;
        n10 = this.canvas.viewportHeight;
        if (this.player.posX < this.posX - ((n7 / this.reactionFactor) | 0) || this.player.posX > this.posX + ((n8 / this.reactionFactor) | 0)) break;
        if (this.player.posY > this.posY - n9 && this.player.posY < this.posY - (n9 >> 2)) {
          return 2;
        }
        if (this.player.posY >= this.posY + n10 || this.player.posY <= this.posY + (n10 >> 2)) break;
        return 3;
      }
    }
    if (this.player.posX < this.posX - n || this.player.posX > this.posX + n2 || this.player.posY < this.posY - n3 || this.player.posY > this.posY + n4) {
      return 0;
    }
    return 1;
  }

  // a(tjge.h) → a_Th
  public onHitBy(h2: ActorBase): boolean {
    if (!h2.hasCollisionFlag(2) || !this.isNewContact(h2) || this.reserved === 7) {
      return false;
    }
    switch (h2.typeId) {
      case 0: {
        if (h2.frameGroupIndex !== 24) break;
        this.applyDamage(h2.getDamage(), h2.actionHighByte);
        break;
      }
      case 10:
      case 12: {
        this.applyDamage(h2.getDamage(), h2.actionHighByte);
        return true;
      }
    }
    return false;
  }

  // b(int,int) → b_II
  private applyDamage(n: number, n2: number): void {
    if (n <= 0) {
      return;
    }
    this.hp -= n;
    this.targetVelX = 0;
    this.preHitSubState = this.reserved;
    switch (this.typeId) {
      case 1:
      case 3: {
        this.reserved = 6;
        if (n2 === this.actionHighByte) {
          this.setAction(6 | this.actionHighByte);
          return;
        }
        this.setAction(5 | this.actionHighByte);
        return;
      }
      case 2: {
        this.reserved = 6;
        this.setAction(4 | this.actionHighByte);
        return;
      }
      case 4: {
        if (this.hp > 0 || this.reserved === 6 || this.reserved === 7) break;
        ProjectileActor.spawnProjectile(12, 0, this.posX - 5120, this.posY - 10240, 0, null);
        ProjectileActor.spawnProjectile(12, 0, this.posX + 5120, this.posY - 20480, 0, null);
        this.reserved = 6;
        this.setAction(0 | this.actionHighByte);
        return;
      }
      case 5: {
        this.reserved = 6;
        this.setAction(1 | this.actionHighByte);
      }
    }
  }

  // a(tjge.k) → a_Tk
  launchProjectile(k2: ProjectileActor | null): void {
    if (k2 == null) {
      return;
    }
    let n: number = 0;
    let n2: number = 0;
    let n3: number = Math.abs(this.player.posX - k2.posX);
    n3 = Math.max(40960, n3);
    const n4: number = (n3 / 5120) | 0;
    const n5: number = n4 >>> 1;
    let n6: number = 0;
    while (n6 < n5) {
      n2 += n6;
      ++n6;
    }
    n3 = (n3 >>> 2) * 3;
    n2 = ((n3 >>> 1) / n2) | 0;
    n = (n5 - 1) * n2;
    n = Math.min(15360, n);
    k2.targetVelX = this.facingSign * 5120;
    k2.targetVelY = -n;
    k2.accelY = n2;
    k2.maxVelY = n;
    k2.timer = n4;
  }

  // p() → p_
  private aimAndFire(): void {
    if (this.threatCode === 4) {
      this.targetVelX = 0;
      if (--this.patrolRemaining < 0 && --this.timer < 0) {
        this.reserved = 5;
        this.setAction(7 | this.actionHighByte);
        return;
      }
      this.setAction(0 | this.actionHighByte);
      return;
    }
    switch (this.typeId) {
      case 1: {
        const nArray: number[] = [9, 10, 8, 11];
        if (this.threatCode === 1) {
          if (this.timer === this.attackRhythm) {
            if (this.burstCount > 0) {
              this.setAction(nArray[GameMIDlet.randomBelow(2)] | this.actionHighByte);
            } else {
              this.setAction(nArray[0] | this.actionHighByte);
            }
          } else {
            this.setAction(this.frameGroupIndex | this.actionHighByte);
          }
        } else {
          this.setAction(nArray[this.threatCode] | this.actionHighByte);
        }
        if (this.player.frameGroupIndex === 24 || this.timer-- >= 0) break;
        if (this.burstCount === 1 && this.frameGroupIndex === nArray[this.burstCount]) {
          this.isAiming = false;
          return;
        }
        if (--this.patrolRemaining >= 0) break;
        this.reserved = 5;
        return;
      }
      case 3: {
        const nArray: number[] = [0, 4];
        if (this.timer === this.attackRhythm && this.burstCount > 0) {
          this.setAction(nArray[GameMIDlet.randomBelow(2)] | this.actionHighByte);
        }
        if (this.player.frameGroupIndex === 24 || this.timer-- >= 0) break;
        if (this.burstCount === 1 && this.frameGroupIndex === nArray[this.burstCount]) {
          this.isAiming = false;
          return;
        }
        if (--this.patrolRemaining >= 0) break;
        this.reserved = 5;
        return;
      }
      case 4: {
        this.reserved = 4;
        this.setAction(3 | this.actionHighByte);
      }
    }
  }

  // m() → m_
  public getDamage(): number {
    if (this.frameGroupIndex === 7) {
      return 1;
    }
    return 0;
  }
}
