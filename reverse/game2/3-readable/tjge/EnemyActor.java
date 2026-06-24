// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/f.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.GameMIDlet;
import tjge.c;          // BossActor
import tjge.d;          // SpriteDef
import tjge.g;          // PlayerActor
import tjge.h;          // ActorBase
import tjge.j;          // LevelScene
import tjge.k;          // ProjectileActor

public final class EnemyActor
extends h /* ActorBase */ {
    // 静态：步兵(h=1)开火偏移/速度参数表[dx,dy,vx,vz,flag]
    private static final int[][] fireOffsetTable = new int[][]{{-6, -56, 0, -10, 0}, {28, -26, 10, 0, 1}, {28, -15, 10, 0, 1}, {4, 4, 0, 10, 0x40000000}};
    // 静态：投掷类(h=3)发射点偏移表[dx,dy]
    private static final int[][] throwOffsetTable = new int[][]{{0, -32}, {0, -24}};
    // 静态：炮台(h=5)发射参数[dx,dy,actionFlag,vx]
    private static final int[] turretShotParams = new int[]{16, 0, 0, 8192};
    int hp;                   // a  当前血量/命数（死亡判定 a<=0）
    int facingSign;           // b  朝向系数：H==0 为 +1，否则 -1
    int timer;                // c  通用倒计时
    int patrolRange;          // d  出生参数：巡逻半径
    int enemyVariant;         // e  出生参数：敌人变体/子类型（22=特殊空降）
    int burstCount;           // f  出生参数：连射/动作变体数
    int threatCode;           // Q  本帧 AI 判定码
    int prevThreatCode;       // R  上帧 AI 判定码
    int spawnParam;           // S  出生参数：发射节奏/冷却
    int initialFacing;        // T  初始朝向标志位备份
    int preHitSubState;       // U  受击前的 AI 子状态(G)备份
    int attackRhythm;         // V  攻击节奏阈值
    int patrolRemaining;      // W  剩余巡逻次数
    boolean hasFired;         // X  本轮已开火标记
    int patrolLeftBound;      // Y  巡逻左边界（炮台类复用为发射计数）
    int patrolRightBound;     // Z  巡逻右边界
    int reactionFactor;       // aa 反应速度系数(1+rand(3))
    boolean needTurn;         // ab 需要转向面对玩家
    boolean isAiming;         // ac 已进入瞄准状态
    g player;                 // ad 玩家 Actor 引用（PlayerActor，取自 L.y）
    c linkedVehicle;          // ae 关联载具/炮台（BossActor，可为 null）

    public EnemyActor(int typeId, d spriteDef) {
        super(typeId, spriteDef);
        this.collisionMask = 1;
    }

    public final boolean init(byte[] byArray) {
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
                this.patrolRange = byArray[7] & 0xFF;
                this.enemyVariant = byArray[8];
                this.burstCount = byArray[9];
                this.patrolRemaining = byArray[10];
                this.hp = this.burstCount + 1;
                if (this.patrolRange <= 0) break;
                if (this.actionHighByte == 0) {
                    this.patrolRightBound = this.posX + (this.patrolRange << 10);
                } else {
                    this.patrolLeftBound = this.posX - (this.patrolRange << 10);
                }
                if (this.enemyVariant != 22) break;
                this.reserved = 8;
                break;
            }
            case 4: {
                this.patrolRange = byArray[7] & 0xFF;
                this.enemyVariant = byArray.length > 8 ? byArray[8] : 0;
                this.hp = 2;
                if (this.patrolRange <= 0) break;
                if (this.enemyVariant == 22) {
                    this.patrolLeftBound = this.canvas.cameraX - (this.boxLeft << 10);
                    this.patrolRightBound = this.canvas.cameraX + this.canvas.viewportWidth - (this.boxRight << 10);
                    break;
                }
                if (this.actionHighByte == 0) {
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
                byte slot = byArray[7];
                this.spawnParam = byArray[8];
                this.patrolRange = byArray[9];
                this.patrolLeftBound = byArray[9];
                if (tjge.j.activeActors[slot] == null) break;
                this.linkedVehicle = (c)tjge.j.activeActors[slot];
            }
        }
        this.initialFacing = this.actionHighByte;
        this.player = this.canvas.player;
        this.isAiming = false;
        this.hasFired = false;
        return true;
    }

    public final void tick() {
        this.facingSign = this.actionHighByte == 0 ? 1 : -1;
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
        if (this.reserved != 6 && this.reserved != 7 && this.hp > 0 && this.player.frameGroupIndex == 23 && Math.abs(this.player.posY - this.posY) <= 10240 && Math.abs(this.player.posX - this.posX) <= 25600) {
            this.player.onTouchActor(this);
        }
    }

    private final void updateWalkerAi() {
        this.threatCode = this.evaluateThreat();
        if (this.threatCode != this.prevThreatCode) {
            this.isAiming = false;
            this.prevThreatCode = this.threatCode;
        }
        if (this.threatCode > 0) {
            this.needTurn = this.actionHighByte == 0 && this.posX > this.player.posX || this.actionHighByte != 0 && this.posX < this.player.posX;
            if (!this.isAiming) {
                this.targetVelX = 0;
                this.isAiming = true;
                this.timer = this.threatCode == 4 && !this.hasFired ? 0 : this.attackRhythm;
                this.reserved = 0;
            }
        } else {
            this.isAiming = false;
        }
        switch (this.reserved) {
            case 0: {
                if (this.isAiming) {
                    if (this.needTurn) {
                        this.actionHighByte ^= Integer.MIN_VALUE;
                    }
                    this.aimAndFire();
                    break;
                }
                if (this.timer-- < 0 && this.patrolRange > 0) {
                    this.reserved = 4;
                }
                if (this.frameGroupIndex == 0) break;
                this.setAction(0 | (this.patrolRange > 0 ? this.actionHighByte : this.initialFacing));
                break;
            }
            case 1: {
                if (this.isAnimationDone()) {
                    this.reserved = 0;
                    this.timer = 8;
                    if (this.typeId == 3) {
                        this.timer = 16;
                    }
                    this.attackRhythm = this.timer;
                    this.setAction((this.frameGroupIndex == 8 ? 0 : 4) | this.actionHighByte);
                } else if (this.typeId == 3 && this.frameIndex == 2) {
                    int frameSel = this.frameGroupIndex == 8 ? 0 : 1;
                    int throwAction = 6 | this.actionHighByte;
                    int throwX = this.posX + (throwOffsetTable[frameSel][0] << 10) * this.facingSign;
                    int throwY = this.posY + (throwOffsetTable[frameSel][1] << 10);
                    this.launchProjectile(tjge.k.spawnProjectile(10, throwAction, throwX, throwY, 25, null));
                }
                this.hasFired = false;
                break;
            }
            case 2: {
                if (this.timer-- >= 0) break;
                this.reserved = 4;
                this.actionHighByte ^= Integer.MIN_VALUE;
                this.setAction(0 | this.actionHighByte);
                break;
            }
            case 4:
            case 8: {
                this.targetVelX = 4096 * this.facingSign;
                this.hasFired = false;
                if (this.facingSign > 0 && this.posX > this.patrolRightBound || this.facingSign < 0 && this.posX < this.patrolLeftBound) {
                    if (this.reserved == 8) {
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
                if (this.frameGroupIndex == 3) break;
                this.setAction(3 | this.actionHighByte);
                break;
            }
            case 5: {
                this.attackRhythm = 8;
                if (this.frameGroupIndex == 7) {
                    this.hasFired = true;
                    if (this.collidesWith(this.player)) {
                        this.player.onHitBy(this);
                    }
                    if (!this.isAnimationDone()) break;
                    this.reserved = this.preHitSubState == 8 ? this.preHitSubState : 0;
                    this.setAction(0 | this.actionHighByte);
                    break;
                }
                if (this.typeId == 1) {
                    int paramRow = this.frameGroupIndex - 8;
                    int bulletAction = fireOffsetTable[paramRow][4] | this.actionHighByte;
                    int bulletX = this.posX + (fireOffsetTable[paramRow][0] << 10) * this.facingSign;
                    int bulletY = this.posY + (fireOffsetTable[paramRow][1] << 10);
                    k spawnedBullet = tjge.k.spawnProjectile(10, bulletAction, bulletX, bulletY, 25, null);
                    if (spawnedBullet == null) break;
                    if (!spawnedBullet.hitWall) {
                        spawnedBullet.targetVelX = (fireOffsetTable[paramRow][2] << 10) * this.facingSign;
                        spawnedBullet.targetVelY = fireOffsetTable[paramRow][3] << 10;
                    }
                    this.reserved = 1;
                    this.setAction(this.frameGroupIndex | this.actionHighByte);
                    break;
                }
                if (this.typeId != 3) break;
                this.setAction((this.frameGroupIndex == 0 ? 8 : 9) | this.actionHighByte);
                this.reserved = 1;
                this.attackRhythm = this.timer = 16;
                break;
            }
            case 6: {
                if (!this.isAnimationDone()) break;
                if (this.hp > 0) {
                    this.hasFired = false;
                    this.reserved = this.preHitSubState == 8 ? this.preHitSubState : 0;
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
                if (this.frameGroupIndex == 1) {
                    this.setAction(2 | this.actionHighByte);
                    break;
                }
                if (this.frameGroupIndex != 2 || this.hitFlashTimer > 1) break;
                if (this.slotIndex >= this.canvas.scene.residentActorSlots) {
                    --this.canvas.scene.waveSpawnCount;
                }
                ++this.canvas.scene.reservedD;
                this.killAndMarkSpawned();
            }
        }
        if (this.typeId == 4 && this.reserved != 6 && this.reserved != 7 && this.player.health > 0 && this.collidesWith(this.player)) {
            this.applyDamage(10, 0);
            this.player.onHitBy(this);
        }
    }

    private void updateTurretAi() {
        if (this.typeId == 2 && this.linkedVehicle != null && this.linkedVehicle.health <= 0) {
            this.applyDamage(10, 0);
            this.linkedVehicle = null;
            return;
        }
        switch (this.reserved) {
            case 0: {
                if (this.frameGroupIndex != 0) {
                    this.setAction(0 | this.actionHighByte);
                }
                if (this.evaluateThreat() <= 0) break;
                if (this.typeId == 5) {
                    if (this.actionHighByte == 0 && this.posX > this.player.posX || this.actionHighByte != 0 && this.posX < this.player.posX) {
                        this.actionHighByte ^= Integer.MIN_VALUE;
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
                if (this.typeId == 5) {
                    int turretAction = turretShotParams[2] | this.actionHighByte;
                    int turretX = this.posX + (turretShotParams[0] << 10) * this.facingSign;
                    int turretY = this.posY + (turretShotParams[1] << 10);
                    k spawnedBullet = tjge.k.spawnProjectile(16, turretAction, turretX, turretY, 1, null);
                    if (spawnedBullet == null) break;
                    spawnedBullet.targetVelX = turretShotParams[3] * this.facingSign;
                    this.reserved = 1;
                    this.timer = 12;
                    this.setAction(3 | this.actionHighByte);
                    return;
                }
                if (this.typeId != 2) break;
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
                if (this.frameGroupIndex == 1) {
                    this.setAction(2 | this.actionHighByte);
                    return;
                }
                if (this.frameGroupIndex != 2 || this.hitFlashTimer > 1) break;
                ++this.canvas.scene.reservedD;
                this.killAndMarkSpawned();
            }
        }
    }

    private final int evaluateThreat() {
        if (this.reserved == 6 || this.reserved == 7 || this.reserved == 5 || this.reserved == 1 || this.player.health <= 0) {
            return 0;
        }
        boolean bl = false;
        int n = 0;
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int n5 = 2;
        int n6 = 2;
        boolean bl2 = false;
        if (this.actionHighByte == 0) {
            n5 = 1;
        } else {
            n6 = 1;
        }
        n = this.canvas.viewportWidth * 9 / 10 / (2 / n5);
        n2 = this.canvas.viewportWidth * 9 / 10 / (2 / n6);
        n3 = 20480;
        n4 = 20480;
        switch (this.typeId) {
            case 1:
            case 3: {
                int n7 = this.posX - 30720;
                int n8 = this.posX + 30720;
                int n9 = this.posY - 20480;
                int n10 = this.posY + 20480;
                if (this.player.posX > n7 && this.player.posX < n8 && this.player.posY > n9 && this.player.posY < n10 && this.player.frameGroupIndex != 23 && this.player.frameGroupIndex != 24) {
                    return 4;
                }
                if (this.reserved == 8) {
                    return 0;
                }
                if (this.enemyVariant <= 0) break;
                if (this.typeId == 3) {
                    n3 = this.canvas.viewportHeight;
                    n4 = this.canvas.viewportHeight;
                    break;
                }
                n7 = n >> 2;
                n8 = n2 >> 2;
                n9 = this.canvas.viewportHeight;
                n10 = this.canvas.viewportHeight;
                if (this.player.posX < this.posX - n7 / this.reactionFactor || this.player.posX > this.posX + n8 / this.reactionFactor) break;
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

    protected final boolean onHitBy(h other) {
        if (!other.hasCollisionFlag(2) || !this.isNewContact(other) || this.reserved == 7) {
            return false;
        }
        switch (other.typeId) {
            case 0: {
                if (other.frameGroupIndex != 24) break;
                this.applyDamage(other.getDamage(), other.actionHighByte);
                break;
            }
            case 10:
            case 12: {
                this.applyDamage(other.getDamage(), other.actionHighByte);
                return true;
            }
        }
        return false;
    }

    private final void applyDamage(int damage, int fromDir) {
        if (damage <= 0) {
            return;
        }
        this.hp -= damage;
        this.targetVelX = 0;
        this.preHitSubState = this.reserved;
        switch (this.typeId) {
            case 1:
            case 3: {
                this.reserved = 6;
                if (fromDir == this.actionHighByte) {
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
                if (this.hp > 0 || this.reserved == 6 || this.reserved == 7) break;
                tjge.k.spawnProjectile(12, 0, this.posX - 5120, this.posY - 10240, 0, null);
                tjge.k.spawnProjectile(12, 0, this.posX + 5120, this.posY - 20480, 0, null);
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

    public final void launchProjectile(k k2) {
        if (k2 == null) {
            return;
        }
        int n = 0;
        int n2 = 0;
        int n3 = Math.abs(this.player.posX - k2.posX);
        n3 = Math.max(40960, n3);
        int n4 = n3 / 5120;
        int n5 = n4 >>> 1;
        int n6 = 0;
        while (n6 < n5) {
            n2 += n6;
            ++n6;
        }
        n3 = (n3 >>> 2) * 3;
        n2 = (n3 >>> 1) / n2;
        n = (n5 - 1) * n2;
        n = Math.min(15360, n);
        k2.targetVelX = this.facingSign * 5120;
        k2.targetVelY = -n;
        k2.accelY = n2;
        k2.maxVelY = n;
        k2.timer = n4;
    }

    private final void aimAndFire() {
        if (this.threatCode == 4) {
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
                int[] nArray = new int[]{9, 10, 8, 11};
                if (this.threatCode == 1) {
                    if (this.timer == this.attackRhythm) {
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
                if (this.player.frameGroupIndex == 24 || this.timer-- >= 0) break;
                if (this.burstCount == 1 && this.frameGroupIndex == nArray[this.burstCount]) {
                    this.isAiming = false;
                    return;
                }
                if (--this.patrolRemaining >= 0) break;
                this.reserved = 5;
                return;
            }
            case 3: {
                int[] nArray = new int[]{0, 4};
                if (this.timer == this.attackRhythm && this.burstCount > 0) {
                    this.setAction(nArray[GameMIDlet.randomBelow(2)] | this.actionHighByte);
                }
                if (this.player.frameGroupIndex == 24 || this.timer-- >= 0) break;
                if (this.burstCount == 1 && this.frameGroupIndex == nArray[this.burstCount]) {
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

    protected final int getDamageOutput() {
        if (this.frameGroupIndex == 7) {
            return 1;
        }
        return 0;
    }
}

