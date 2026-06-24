// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/c.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.GameMIDlet;
import tjge.d;          // SpriteDef
import tjge.h;          // ActorBase
import tjge.j;          // LevelScene
import tjge.k;          // ProjectileActor

public final class BossActor
extends h /* ActorBase */ {
    // 静态：类型11 Boss 的子弹参数表（偏移x/y、动画、动作、速度x/y）
    public static final int[][] BULLET_PARAMS_T11 = new int[][]{{-12, -50, 9, 1, -10, -10}, {-30, -34, -2147483647, 3, -10, 0}};
    // 静态：类型17 Boss 的子弹参数表（偏移、动画、动作、速度、动作上限列）
    public static final int[][] BULLET_PARAMS_T17 = new int[][]{{-8, -8, 1, 1, -10, 0, 2}, {0, 4, 0x40000000, 4, 0, 10, 5}};
    public int health;                 // c
    private int anchorXOrCounter;      // N
    private int fireIntervalBase;      // O
    private int fireCountdown;         // P
    private int rangeMin;              // Q
    private int rangeMax;              // R
    private int axisOrPhase;           // S
    private int randomMoveTimer;       // T
    private int patrolCountdown;       // U
    private int phaseIndex;            // V
    public boolean knockedBack;        // d
    private boolean pendingFire;       // W
    private boolean fireable;          // X
    public boolean dormant;            // e
    private h attachedEntity;          // Y (ActorBase)
    public static BossActor instance;  // f

    public BossActor(int typeId, d spriteDef) {
        super(typeId, spriteDef);
    }

    public final boolean loadFromBytes(byte[] byArray) {
        if (!super.spawnFromBytes(byArray)) {
            return false;
        }
        switch (this.typeId) {
            case 11: {
                this.health = 10;
                this.anchorXOrCounter = this.posX;
                break;
            }
            case 17: {
                this.fireIntervalBase = byArray[7];
                this.fireCountdown = byArray[7];
                this.axisOrPhase = byArray[8];
                this.health = 3;
                if (this.axisOrPhase == 0) {
                    this.rangeMin = this.posX;
                    this.rangeMax = this.posX + (byArray[9] << 10);
                    this.targetVelX = 2048;
                    break;
                }
                if (this.axisOrPhase != 1) break;
                this.rangeMin = this.posY;
                this.rangeMax = this.posY + (byArray[9] << 10);
                this.targetVelY = 2048;
                break;
            }
            case 13: {
                this.health = 3;
                break;
            }
            case 21: {
                this.health = 10;
                this.anchorXOrCounter = this.posX;
                this.fireCountdown = byArray[7];
                break;
            }
            case 19: {
                this.dormant = true;
                this.axisOrPhase = 0;
                this.health = 200;
                this.anchorXOrCounter = 0;
                this.phaseIndex = 0;
                this.fireCountdown = this.fireIntervalBase = 10;
                this.randomMoveTimer = 0;
                this.rangeMin = this.canvas.cameraX - (this.boxLeft << 10);
                this.rangeMax = this.canvas.cameraX + this.canvas.viewportWidth - (this.boxRight << 10);
                instance = this;
            }
        }
        this.knockedBack = false;
        this.pendingFire = false;
        this.fireable = true;
        this.attachedEntity = null;
        return true;
    }

    public final void resetBoss() {
        this.posX = this.canvas.cameraX + this.canvas.viewportWidth / 2;
        this.posY = this.canvas.cameraY - 20480;
        this.health = 16;
        this.anchorXOrCounter = 0;
        this.fireIntervalBase = 10;
        this.fireCountdown = 16;
        this.rangeMin = this.canvas.cameraX - 819200;
        this.rangeMax = this.canvas.cameraX + this.canvas.viewportWidth + 819200;
        this.axisOrPhase = 1;
        this.knockedBack = false;
        this.pendingFire = false;
        this.fireable = true;
        this.attachedEntity = null;
        this.dormant = true;
        this.setAction(0);
        this.phaseIndex = 3;
    }

    public final void update() {
        switch (this.typeId) {
            case 11: {
                if (this.pendingFire) {
                    int spawnY;
                    int spawnX;
                    int bulletAction;
                    int facingSign;
                    k spawnedBullet;
                    this.pendingFire = false;
                    this.fireable = false;
                    int paramRow = 0;
                    if (this.frameGroupIndex >= 2) {
                        paramRow = 1;
                    }
                    if ((spawnedBullet = tjge.k.spawnProjectile(10, bulletAction = BULLET_PARAMS_T11[paramRow][2], spawnX = this.posX + (BULLET_PARAMS_T11[paramRow][0] << 10) * (facingSign = this.actionHighByte == 0 ? 1 : -1), spawnY = this.posY + (BULLET_PARAMS_T11[paramRow][1] << 10), 1, null)) != null) {
                        if (paramRow == 1) {
                            spawnedBullet.targetVelX = (BULLET_PARAMS_T11[paramRow][4] << 10) * facingSign;
                            spawnedBullet.targetVelY = BULLET_PARAMS_T11[paramRow][5] << 10;
                        } else {
                            this.aimProjectile(spawnedBullet);
                        }
                    }
                    this.setAction(BULLET_PARAMS_T11[paramRow][3] | this.actionHighByte);
                } else if (this.isAnimationDone()) {
                    if (this.frameGroupIndex == 1) {
                        this.setAction(0 | this.actionHighByte);
                    } else if (this.frameGroupIndex == 3) {
                        this.setAction(2 | this.actionHighByte);
                    }
                    this.fireable = true;
                }
                if (this.knockedBack) {
                    if (this.posX == this.anchorXOrCounter) {
                        this.posX += 2048;
                    } else {
                        this.posX = this.anchorXOrCounter;
                        this.knockedBack = false;
                    }
                }
                if (this.health <= 0) {
                    this.killAndMarkSpawned();
                    return;
                }
                if (!this.collidesWith(this.canvas.player)) break;
                this.canvas.player.onTouchActor(this);
                return;
            }
            case 17: {
                int spawnY;
                int spawnX;
                int facingSign;
                int paramRow;
                int bulletAction;
                k spawnedBullet;
                if (this.axisOrPhase == 0) {
                    if (this.posX < this.rangeMin) {
                        this.targetVelX = 2048;
                    } else if (this.posX > this.rangeMax) {
                        this.targetVelX = -2048;
                    }
                } else if (this.axisOrPhase == 1) {
                    if (this.posY < this.rangeMin) {
                        this.targetVelY = 2048;
                    } else if (this.posY > this.rangeMax) {
                        this.targetVelY = -2048;
                    }
                }
                if (this.fireCountdown-- < 0 && (spawnedBullet = tjge.k.spawnProjectile(10, bulletAction = BULLET_PARAMS_T17[paramRow = this.frameGroupIndex / 3][2] | this.actionHighByte ^ Integer.MIN_VALUE, spawnX = this.posX + this.targetVelX + (BULLET_PARAMS_T17[paramRow][0] << 10) * (facingSign = this.actionHighByte == 0 ? 1 : -1), spawnY = this.posY + this.targetVelY + (BULLET_PARAMS_T17[paramRow][1] << 10), 1, null)) != null) {
                    spawnedBullet.targetVelX = (BULLET_PARAMS_T17[paramRow][4] << 10) * facingSign;
                    spawnedBullet.targetVelY = BULLET_PARAMS_T17[paramRow][5] << 10;
                    this.setAction(BULLET_PARAMS_T17[paramRow][3] | this.actionHighByte);
                    this.fireCountdown = this.fireIntervalBase;
                }
                if (this.frameGroupIndex == BULLET_PARAMS_T17[this.frameGroupIndex / 3][6]) {
                    if (this.isAnimationDone()) {
                        this.knockedBack = false;
                        this.setAction(BULLET_PARAMS_T17[this.frameGroupIndex / 3][6] - 2 | this.actionHighByte);
                    }
                } else if (this.knockedBack) {
                    this.setAction(BULLET_PARAMS_T17[this.frameGroupIndex / 3][6] | this.actionHighByte);
                } else if (this.frameGroupIndex == BULLET_PARAMS_T17[this.frameGroupIndex / 3][3] && this.isAnimationDone()) {
                    this.setAction(BULLET_PARAMS_T17[this.frameGroupIndex / 3][3] - 1 | this.actionHighByte);
                }
                if (this.health > 0) break;
                this.killAndMarkSpawned();
                return;
            }
            case 13: {
                switch (this.frameGroupIndex) {
                    case 1: {
                        if (this.health <= 0) {
                            this.canvas.startShake(2);
                            this.setAction(3 | this.actionHighByte);
                            this.canvas.scene.triggerHitFlags[this.slotIndex] = true;
                        } else if (this.health < 2) {
                            this.setAction(2 | this.actionHighByte);
                        }
                        if (!this.collidesWith(this.canvas.player)) break;
                        this.canvas.player.onTouchActor(this);
                        break;
                    }
                    case 2: {
                        if (this.health <= 0) {
                            this.canvas.startShake(2);
                            this.setAction(3 | this.actionHighByte);
                            this.canvas.scene.triggerHitFlags[this.slotIndex] = true;
                        }
                        if (!this.collidesWith(this.canvas.player)) break;
                        this.canvas.player.onTouchActor(this);
                        break;
                    }
                    case 3: {
                        if (!this.isAnimationDone()) break;
                        this.setAction(4 | this.actionHighByte);
                        break;
                    }
                    case 4: {
                        this.layer = 10;
                    }
                }
                return;
            }
            case 21: {
                if (this.fireCountdown == 0) {
                    if (this.collidesWith(this.canvas.player)) {
                        if (this.attachedEntity == null) {
                            this.attachedEntity = this.canvas.scene.spawnActor(22, -1);
                            this.attachedEntity.setAction(5);
                            this.attachedEntity.posX = this.posX;
                            this.attachedEntity.posY = this.posY + (this.boxTop - 10 << 10);
                        }
                        this.canvas.player.actionLocked = true;
                        if (this.canvas.heldAction != 16) break;
                        this.health = 0;
                        this.canvas.player.levelCleared = true;
                        return;
                    }
                    this.canvas.player.actionLocked = false;
                    if (this.attachedEntity == null) break;
                    this.attachedEntity.kill();
                    this.attachedEntity = null;
                    return;
                }
                if (this.knockedBack) {
                    if (this.posX == this.anchorXOrCounter) {
                        this.posX += 1024;
                    } else {
                        this.posX = this.anchorXOrCounter;
                        this.knockedBack = false;
                    }
                }
                if (this.health > 0) break;
                this.killAndMarkSpawned();
                return;
            }
            case 19: {
                int emitX;
                int emitY;
                if (this.dormant) {
                    return;
                }
                if (this.frameGroupIndex == 0) {
                    boolean moving = false;
                    switch (this.phaseIndex) {
                        case 0: {
                            if (this.patrolCountdown-- >= 0) break;
                            this.canvas.scene.spawnWave();
                            this.setAction(this.frameGroupIndex | (this.actionHighByte ^= Integer.MIN_VALUE));
                            this.axisOrPhase ^= 1;
                            this.phaseIndex = 1;
                            break;
                        }
                        case 1: {
                            if (this.canvas.scene.waveSpawnCount > 0) break;
                            this.fireCountdown = 32;
                            moving = true;
                            this.fireIntervalBase = 6;
                            this.phaseIndex = 2;
                            break;
                        }
                        case 2: {
                            if (this.fireCountdown == 26) {
                                if (this.fireIntervalBase-- >= 0) break;
                                moving = true;
                                this.anchorXOrCounter = 0;
                                this.phaseIndex = 3;
                                break;
                            }
                            moving = true;
                            break;
                        }
                        case 3: {
                            k spawnedBullet;
                            if (this.anchorXOrCounter % 4 < 2 && (this.fireCountdown > 7 || this.fireCountdown < 3) && (spawnedBullet = tjge.k.spawnProjectile(10, 12, this.posX, this.posY, 1, null)) != null) {
                                spawnedBullet.targetVelX = 0;
                                spawnedBullet.targetVelY = 8192;
                                spawnedBullet.accelY = 1024;
                                spawnedBullet.maxVelY = 10240;
                            }
                            if (this.posY < this.canvas.cameraY - 5120) {
                                this.posX = this.axisOrPhase > 0 ? this.canvas.cameraX - 30720 : this.canvas.cameraX + this.canvas.viewportWidth + 30720;
                                this.patrolCountdown = 20;
                                this.phaseIndex = 0;
                            } else {
                                moving = true;
                            }
                            ++this.anchorXOrCounter;
                            this.anchorXOrCounter %= 4;
                        }
                    }
                    if (moving) {
                        boolean unused = false;
                        this.targetVelX = this.axisOrPhase > 0 ? -6144 : 6144;
                        this.targetVelY = (this.fireCountdown - 16) * 512;
                        --this.fireCountdown;
                    } else {
                        this.targetVelX = 0;
                        this.targetVelY = 0;
                    }
                    if (!this.knockedBack) break;
                    this.targetVelY = 0;
                    this.targetVelX = 0;
                    this.dormant = true;
                    tjge.j.cutsceneState[1] = 4;
                    tjge.j.cutsceneState[2] = 1;
                    this.canvas.scene.setSubState(6);
                    return;
                }
                this.pendingFire = false;
                if (this.knockedBack) {
                    if (this.frameGroupIndex != 5) {
                        this.setAction(5 | this.actionHighByte);
                    }
                    if (this.isAnimationDone()) {
                        this.canvas.scene.cameraTargetCacheX = this.canvas.cameraX;
                        this.canvas.scene.cameraTargetCacheY = this.canvas.cameraY;
                        tjge.j.cutsceneState[1] = 1;
                        tjge.j.cutsceneState[2] = 1;
                        this.canvas.scene.setSubState(6);
                        this.killAndMarkSpawned();
                    } else {
                        emitY = this.posY - (2 + GameMIDlet.randomBelow(Math.abs(this.boxTop)) << 10);
                        emitX = 0;
                        while (emitX < 2) {
                            int debrisX = this.posX + (this.boxRight - GameMIDlet.randomBelow(this.boxRight * 2) << 10);
                            tjge.k.spawnProjectile(12, 0, debrisX, emitY, 0, null);
                            ++emitX;
                        }
                    }
                    this.targetVelX = 0;
                    if (this.anchorXOrCounter == 1) {
                        this.pendingFire = true;
                    }
                    ++this.anchorXOrCounter;
                } else {
                    if (this.isAnimationDone()) {
                        this.setAction(1 | this.actionHighByte);
                    }
                    if (this.fireCountdown-- < 0) {
                        this.pendingFire = true;
                    }
                    if (this.posX < this.rangeMin) {
                        this.targetVelX = 0;
                        this.posX = this.rangeMin;
                    } else if (this.posX > this.rangeMax) {
                        this.targetVelX = 0;
                        this.posX = this.rangeMax;
                    }
                    if (this.randomMoveTimer++ > 5) {
                        this.randomMoveTimer = 0;
                        int randomVelX = this.targetVelX = GameMIDlet.randomBelow(2) > 0 ? 4096 : -4096;
                    }
                }
                if (!this.pendingFire) break;
                int[] muzzleOffsets = new int[]{-12, -28, -42};
                emitY = this.posX + (muzzleOffsets[this.phaseIndex] << 10);
                emitX = this.posY - 35840;
                this.targetVelX = 0;
                this.setAction(2 + this.phaseIndex | this.actionHighByte);
                k muzzleFlash = tjge.k.spawnProjectile(9, 0, emitY, emitX, 1, null);
                if (this.knockedBack) {
                    muzzleFlash.isSpecialGrenade = true;
                }
                ++this.phaseIndex;
                this.phaseIndex %= 3;
                if (this.phaseIndex == 0) {
                    this.fireCountdown = this.fireIntervalBase * 4;
                    return;
                }
                this.fireCountdown = this.fireIntervalBase;
            }
        }
    }

    public final boolean requestFire() {
        if (this.pendingFire || !this.fireable) {
            return false;
        }
        this.pendingFire = true;
        return true;
    }

    protected final boolean onHitByActor(h other) {
        if (!other.hasCollisionFlag(8) || !this.isNewContact(other)) {
            return false;
        }
        if (other.typeId == 10 || other.typeId == 12) {
            switch (this.typeId) {
                case 11: {
                    if (other.posY >= this.posY - 20480 || Math.abs(this.posX - this.canvas.cameraX) > 153600) {
                        return true;
                    }
                }
                case 21: {
                    if (this.typeId == 21 && this.fireCountdown == 0) {
                        return true;
                    }
                    this.health -= other.getDamage();
                    if (this.health <= 0) {
                        int i = 0;
                        while (i < 6) {
                            int offsetX = 30 - GameMIDlet.randomBelow(60);
                            int offsetY = 16 + GameMIDlet.randomBelow(32);
                            tjge.k.spawnProjectile(12, 0, this.posX + (offsetX <<= 10), this.posY - (offsetY <<= 10), 2, null);
                            ++i;
                        }
                        this.canvas.startShake(4);
                    } else {
                        this.knockedBack = true;
                    }
                    return true;
                }
                case 17: {
                    this.health -= other.getDamage();
                    if (this.health <= 0) {
                        tjge.k.spawnProjectile(12, 0, this.posX, this.posY, 0, null);
                    } else {
                        this.knockedBack = true;
                    }
                    return true;
                }
                case 13: {
                    if (this.frameGroupIndex <= 0 || this.frameGroupIndex >= 4) break;
                    if (other.hasCollisionFlag(2)) {
                        this.health -= other.getDamage();
                    }
                    return true;
                }
                case 19: {
                    this.health -= other.getDamage();
                    if (this.health <= 0 && this.axisOrPhase == 0 && this.posX > this.canvas.cameraX && this.posX < this.canvas.cameraX + this.canvas.viewportWidth - 20480) {
                        this.knockedBack = true;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    protected final boolean isCollidable() {
        if (this.typeId == 21) {
            return this.health > 0;
        }
        return true;
    }

    public final void aimProjectile(k bullet) {
        if (bullet == null) {
            return;
        }
        int launchVelY = 0;
        int gravity = 1;
        int horizDist = Math.abs(this.canvas.player.posX - bullet.posX);
        if (horizDist < 40960) {
            bullet.targetVelX = this.actionHighByte == 0 ? -2048 : 2048;
            bullet.targetVelY = -5120;
            bullet.accelY = 2048;
            bullet.maxVelY = 10240;
            return;
        }
        int steps = horizDist / 5120;
        int halfSteps = steps >>> 1;
        int step = 0;
        while (step < halfSteps) {
            gravity += step;
            ++step;
        }
        horizDist = (horizDist >>> 2) * 3;
        gravity = (horizDist >>> 1) / gravity;
        launchVelY = (halfSteps - 1) * gravity;
        launchVelY = Math.min(15360, launchVelY);
        bullet.targetVelX = this.actionHighByte == 0 ? -5120 : 5120;
        bullet.targetVelY = -launchVelY + 2048;
        bullet.accelY = gravity;
        bullet.maxVelY = launchVelY;
    }
}
