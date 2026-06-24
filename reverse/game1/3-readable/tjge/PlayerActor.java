// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/f.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.GameScreen;     // a
import tjge.TileMap;        // b
import tjge.BossActor;      // c
import tjge.SpriteDef;      // d
import tjge.EffectActor;    // e
import tjge.ActorBase;      // g
import tjge.ProjectileActor;// l

public final class PlayerActor
extends ActorBase {
    int stateFlags;        // a
    int movingFlag;        // b
    int actionId;          // c
    int facingFlag;        // d
    int health;            // e
    int lastInputDir;      // f
    int inputHoldCount;    // g
    int ammoReserveB;      // h
    int ammoReserveC;      // i
    int grenadeCount;      // j
    int weaponIndex;       // k
    int magazineAmmo;      // l
    int frameTimer;        // m
    int climbResult;       // n
    int subState;          // o
    int spareO;            // O
    int spareP;            // P
    int climbAnimState;    // Q
    int invulnTimer;       // R
    int climbTargetX;      // S
    int climbTargetY;      // T
    boolean facingLeft;    // U
    boolean actionFlag;    // V
    boolean canClimb;      // W
    boolean climbAdvance;  // X
    boolean ledgeGrabFlag; // Y
    EffectActor linkedEnemy; // Z
    BossActor linkedBoss;    // aa
    GameScreen screen;       // ab

    public PlayerActor(int n, SpriteDef d2, GameScreen a2) {
        super(n, d2);
        this.screen = a2;
    }

    public final boolean checkGroundCollision(TileMap b2) {
        if (this.velY < 0) {
            return false;
        }
        boolean bl = false;
        boolean bl2 = false;
        int n = this.posY + this.velY >> 14;
        int n2 = (this.posX + this.velX >> 10) + -5 >> 4;
        int n3 = (this.posX + this.velX >> 10) + 5 >> 4;
        boolean bl3 = false;
        boolean bl4 = false;
        if (b2.queryColumnTileAt(n2, n, true) == 1) {
            bl3 = true;
        }
        if (b2.queryColumnTileAt(n3, n, true) == 1) {
            bl4 = true;
        }
        if (bl3 && bl4) {
            this.targetVelY = 0;
            this.posY &= 0xFFFFFC00;
            this.velY = (n << 14) - this.posY;
            return true;
        }
        if (this.facingFlag != 0 && (bl3 || bl4)) {
            if (bl3 && !bl4) {
                int n4 = (n2 << 4) + 16 - ((this.posX + this.velX >> 10) + -5);
                this.targetVelX = 0;
                if (n4 > 6 || n4 >= 4 && (this.actionId == 4 || this.actionId == 3)) {
                    this.targetVelY = 0;
                    this.velX = ((n2 << 4) + 7 << 10) - this.posX;
                    this.velY = (n << 14) - this.posY;
                    return true;
                }
                this.velX = ((n2 << 4) + 25 << 10) - this.posX;
            } else if (!bl3 && bl4 && (this.stateFlags & 1) == 0) {
                int n5 = (n3 << 4) - ((this.posX + this.velX >> 10) + -5);
                this.targetVelX = 0;
                if (n5 < 7) {
                    this.targetVelY = 0;
                    this.velX = ((n3 << 4) + 7 << 10) - this.posX;
                    this.velY = (n << 14) - this.posY;
                    return true;
                }
                this.velX = ((n3 << 4) - 9 << 10) - this.posX;
            } else if (!bl3 && bl4) {
                this.velY = 2048;
            }
        } else if (this.facingFlag == 0 && (bl4 || bl3)) {
            if (bl4 && !bl3) {
                int n6 = (this.posX + this.velX >> 10) + 5 - (n3 << 4);
                this.targetVelX = 0;
                if (n6 > 6 || n6 >= 4 && (this.actionId == 4 || this.actionId == 3)) {
                    this.targetVelY = 0;
                    this.velX = ((n3 << 4) + 7 << 10) - this.posX;
                    this.velY = (n << 14) - this.posY;
                    return true;
                }
                this.velX = ((n3 << 4) - 9 << 10) - this.posX;
            } else if (!bl4 && bl3 && (this.stateFlags & 1) == 0) {
                int n7 = (this.posX + this.velX >> 10) + 5 - (n3 << 4);
                this.targetVelX = 0;
                if (n7 < 7) {
                    this.targetVelY = 0;
                    this.velX = ((n2 << 4) + 9 << 10) - this.posX;
                    this.velY = (n << 14) - this.posY;
                    return true;
                }
                this.velX = ((n2 << 4) + 25 << 10) - this.posX;
            } else if (!bl4 && bl3) {
                this.velY = 2048;
            }
        }
        this.accelY = 4096;
        return false;
    }

    public final boolean checkLedgeTop(TileMap b2) {
        if (this.velY < 0) {
            return false;
        }
        int n = this.posX + this.velX >> 14;
        int n2 = this.posY - 10240 >> 14;
        int n3 = 0;
        while (n3 < 3) {
            if (b2.queryColumnTileAt(n, n2 + n3, true) == 1) {
                return true;
            }
            ++n3;
        }
        return false;
    }

    public final boolean checkWallAhead(TileMap b2) {
        int n = this.facingLeft ? this.posX - 2048 : this.posX + 2048;
        int n2 = (this.posY >> 10) - 34 >> 4;
        return b2.queryColumnTileAt(n >>= 14, n2, true) == 1;
    }

    public final boolean checkWallLeft(TileMap b2, boolean bl) {
        int n = bl ? this.posY - 30720 >> 14 : ((this.stateFlags & 0x2000) != 0 ? this.posY + this.velY >> 14 : this.posY + this.velY + 20480 >> 14);
        int n2 = (this.posX >> 10) - 3 >> 4;
        int n3 = (this.posX >> 10) + 3 >> 4;
        int n4 = n2;
        while (n4 <= n3) {
            int n5 = b2.queryColumnTileAt(n4, n, true);
            if (n5 == 2) {
                this.posX = (n4 << 4) + 8 << 10;
                this.velX = 0;
                this.targetVelX = 0;
                return true;
            }
            ++n4;
        }
        if ((this.stateFlags & 0x2000) != 0) {
            if (bl) {
                ++n;
                this.posY = (n <<= 14) + 10240;
            } else {
                this.posY = n <<= 14;
            }
            this.targetVelY = 0;
        }
        return false;
    }

    public final boolean init(int n, int n2, int n3, byte[] byArray, boolean bl) {
        super.spawnAt(n, n2, n3, byArray, bl);
        this.health = 10;
        this.movingFlag = 0;
        this.linkedEnemy = null;
        this.linkedBoss = null;
        this.accelY = 4096;
        this.stateFlags = 1;
        return true;
    }

    public final void resetForLevel() {
        this.stateFlags = this.screen.levelIndex == 4 ? (this.stateFlags &= 0xFFFFFFFE) : 1;
        this.health = 10;
        this.subState = 0;
        this.canClimb = true;
        this.actionFlag = false;
        this.climbAnimState = 18;
        this.linkedEnemy = null;
        this.frameTimer = 0;
        this.movingFlag = 0;
        this.accelY = 0;
        this.targetVelY = 0;
    }

    public final void step() {
        this.actionId = this.frameIndex & 0xFFFFFF;
        this.facingFlag = this.frameIndex & 0xFF000000;
        --this.invulnTimer;
        this.advanceAnimation();
        this.velX = this.targetVelX;
        this.velY = this.targetVelY;
        this.targetVelX += this.accelX;
        if (this.accelX > 0 && this.targetVelX > this.maxVelX) {
            this.targetVelX = this.maxVelX;
        }
        if (this.accelX < 0 && this.targetVelX < this.maxVelX) {
            this.targetVelX = this.maxVelX;
        }
        this.targetVelY += this.accelY;
        if (this.accelY > 0 && this.targetVelY > this.maxVelY) {
            this.targetVelY = this.maxVelY;
        }
        if (this.accelY < 0 && this.targetVelY < this.maxVelY) {
            this.targetVelY = this.maxVelY;
        }
        switch (this.screen.state) {
            case 14:
            case 19: {
                this.posX += this.velX;
                this.posY += this.velY;
                return;
            }
            case 10: {
                int n;
                int n2 = tjge.GameScreen.viewWidthFx;
                if (this.screen.levelIndex == 4) {
                    if (this.screen.reinforceBudget-- > 25) {
                        this.targetVelX = 0;
                    } else if (this.screen.reinforceBudget > 12) {
                        this.targetVelX = 10240;
                    } else if (this.screen.reinforceBudget <= 12) {
                        this.screen.cameraVelX = 8192;
                    }
                    if (this.screen.boss.active && this.linkedBoss.intersectsActor(this.screen.boss) && (this.linkedBoss.posX < this.screen.boss.posX && this.targetVelX > this.screen.cameraVelX || this.linkedBoss.posX > this.screen.boss.posX && this.targetVelX < this.screen.cameraVelX)) {
                        this.targetVelX = this.screen.cameraVelX;
                        this.velX = this.screen.cameraVelX;
                    }
                    this.posX += this.velX;
                    if (this.screen.cameraVelX <= 0) break;
                    if (this.posX < this.screen.cameraX + 20480) {
                        this.posX = this.screen.cameraX + 20480;
                        return;
                    }
                    if (this.posX - this.screen.cameraX <= n2 - 20480) break;
                    this.posX = this.screen.cameraX + n2 - 20480;
                    return;
                }
                if ((this.stateFlags & 0x2000) == 0) {
                    if (this.collideCeiling(this.screen.tileMap)) {
                        if (!this.checkGroundCollision(this.screen.tileMap)) {
                            this.targetVelY = 5120;
                            this.beginFall();
                        } else {
                            this.setFrame(5 | this.facingFlag);
                        }
                    } else {
                        if (this.facingFlag != 0) {
                            n = this.checkWallLeft(this.screen.tileMap, 0);
                            if (n != 0 && (this.stateFlags & 1) != 0 && this.actionId != 19 && this.actionId != 0 && this.actionId != 5) {
                                this.setFrame(0 | this.facingFlag);
                            }
                        } else {
                            n = this.checkWallRight(this.screen.tileMap, 0);
                            if (n != 0 && (this.stateFlags & 1) != 0 && this.actionId != 19 && this.actionId != 0 && this.actionId != 5) {
                                this.setFrame(0);
                            }
                        }
                        if (this.checkGroundCollision(this.screen.tileMap)) {
                            this.land();
                        } else {
                            this.beginFall();
                        }
                    }
                    if ((this.actionId == 3 || this.actionId == 4 || this.actionId == 17) && (this.stateFlags & 1) == 0 && this.subState != 5 && this.checkWallLeft(this.screen.tileMap, true)) {
                        this.actionId = 18;
                        this.stateFlags |= 0x2000;
                        this.movingFlag = 0;
                        this.targetVelX = 0;
                        this.targetVelY = 0;
                        this.setFrame(0x12 | this.facingFlag);
                    }
                }
                this.posX += this.velX;
                this.posY += this.velY;
                if ((this.stateFlags & 1) != 0 && (this.actionId == 2 || this.actionId == 0) && (n = this.posX % 8192) > 2048 && n < 6144) {
                    if (n > 4096) {
                        n = 8192 - n;
                        this.posX += n;
                    } else {
                        this.posX -= n;
                    }
                }
                if (this.screen.scriptFlagL && this.screen.levelIndex != 7 && this.screen.levelIndex != 2) {
                    if (this.posX < this.screen.cameraX + 10240) {
                        this.posX = this.screen.cameraX + 10240;
                        this.targetVelX = 0;
                        return;
                    }
                    if (this.posX <= this.screen.cameraX + n2 - 10240) break;
                    this.posX = this.screen.cameraX + n2 - 10240;
                    this.targetVelX = 0;
                    return;
                }
                this.screen.cameraVelX = this.facingFlag == 0 ? (this.posX > tjge.GameScreen.screenWidth / 5 << 10 ? this.targetVelX + 14336 : 0) : (this.posX < this.screen.tileMap.getPixelWidth() - tjge.GameScreen.screenWidth / 5 << 10 ? this.targetVelX + -14336 : 0);
                this.screen.cameraVelY = -4096;
            }
        }
    }

    public final void update() {
        this.facingLeft = (this.frameIndex & 0xFF000000) != 0;
        this.runActionStateMachine();
        this.actionId = this.frameIndex & 0xFFFFFF;
        this.handleInput();
        if (this.health <= 0 && this.actionId != 23 && this.actionId != 15 && this.actionId != 16) {
            this.setFrame(0x17 | this.facingFlag);
        }
    }

    public final void runActionStateMachine() {
        switch (this.actionId) {
            case 3: {
                switch (this.subState) {
                    case 0: {
                        this.checkClimbable(this.screen.tileMap);
                        if (this.climbResult == 2 && this.canClimb) {
                            this.posX = this.facingLeft ? this.climbTargetX + 10240 : this.climbTargetX - 10240;
                            this.posY = this.climbTargetY + 36864;
                            this.subState = 3;
                            this.setFrame(0x16 | this.facingFlag);
                            return;
                        }
                        if (this.targetVelY <= -3120) break;
                        this.setFrame(4 | this.facingFlag);
                        break;
                    }
                    case 1: {
                        if ((this.stateFlags & 1) == 0) break;
                        this.accelY = 0;
                        this.targetVelX = 0;
                        this.setFrame(0 | this.facingFlag);
                        break;
                    }
                    case 3: {
                        this.checkClimbable(this.screen.tileMap);
                        if (this.climbResult != 2 || !this.canClimb) break;
                        this.posX = this.facingLeft ? this.climbTargetX + 10240 : this.climbTargetX - 10240;
                        this.posY = this.climbTargetY + 36864;
                        this.setFrame(0x16 | this.facingFlag);
                        break;
                    }
                    case 4: {
                        if (this.targetVelY <= 3120) break;
                        this.setFrame(0x11 | this.facingFlag);
                    }
                }
                return;
            }
            case 4: {
                switch (this.subState) {
                    case 0: {
                        if (this.targetVelY <= 3120) break;
                        this.setFrame(0x11 | this.facingFlag);
                        break;
                    }
                    case 2:
                    case 3: {
                        if (this.posY >= this.climbTargetY) break;
                        this.targetVelX = this.subState == 3 ? (this.facingLeft ? -8192 : 8192) : (this.facingLeft ? -4096 : 4096);
                        this.setFrame(0x11 | this.facingFlag);
                    }
                }
                return;
            }
            case 17: {
                switch (this.subState) {
                    case 0: {
                        this.checkClimbable(this.screen.tileMap);
                        if (this.climbResult == 2 && !this.checkLedgeTop(this.screen.tileMap) && this.canClimb) {
                            this.subState = 6;
                            return;
                        }
                    }
                    case 2:
                    case 3:
                    case 4: {
                        if ((this.stateFlags & 1) == 0) break;
                        this.targetVelX = 0;
                        this.setFrame(0 | this.facingFlag);
                        break;
                    }
                    case 5: {
                        if (this.frameTimer++ <= 0) break;
                        this.frameTimer = 0;
                        this.targetVelX = 0;
                        this.subState = 0;
                        break;
                    }
                    case 6: {
                        this.posX = this.facingLeft ? this.climbTargetX + 10240 : this.climbTargetX - 10240;
                        this.posY = this.climbTargetY + 36864;
                        this.targetVelY = -4096;
                        this.subState = 3;
                        this.setFrame(0x16 | this.facingFlag);
                    }
                }
                return;
            }
            case 22: {
                if (this.subState != 2 && this.subState != 3) break;
                this.canClimb = false;
                this.accelY = 4096;
                int n = this.targetVelX = this.facingLeft ? -4096 : 4096;
                if (this.subState == 3) {
                    this.targetVelY = -15360;
                }
                this.setFrame(4 | this.facingFlag);
                return;
            }
            case 1:
            case 28: {
                if (!this.isAnimationDone()) break;
                this.reloadFromReserve();
                if (this.actionId == 1) {
                    this.setFrame(0 | this.facingFlag);
                    return;
                }
                this.setFrame(5 | this.facingFlag);
                return;
            }
            case 6:
            case 8:
            case 29: {
                if (!this.isAnimationDone()) break;
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 7: {
                if (!this.isAnimationDone()) break;
                this.setFrame(8 | this.facingFlag);
                return;
            }
            case 9:
            case 11:
            case 30: {
                if (!this.isAnimationDone()) break;
                this.setFrame(5 | this.facingFlag);
                return;
            }
            case 10: {
                if (!this.isAnimationDone()) break;
                this.setFrame(0xB | this.facingFlag);
                return;
            }
            case 20: {
                if (this.frameTimer++ <= 1) break;
                this.frameTimer = 0;
                this.setFrame(0x15 | this.facingFlag);
                return;
            }
            case 21: {
                if (this.frameTimer++ <= 1) break;
                this.frameTimer = 0;
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 13: {
                this.screen.state = 20;
                return;
            }
            case 19: {
                if (this.frameTimer++ <= 5) break;
                if (this.checkWallAhead(this.screen.tileMap)) {
                    this.setFrame(5 | this.facingFlag);
                } else {
                    this.setFrame(0 | this.facingFlag);
                }
                this.movingFlag = 0;
                this.frameTimer = 0;
                this.targetVelX = 0;
                this.lastInputDir = 0;
                this.inputHoldCount = 0;
                return;
            }
            case 18:
            case 24:
            case 25:
            case 26: {
                if (!this.climbAdvance) {
                    return;
                }
                switch (this.climbAnimState) {
                    case 18: {
                        this.climbAnimState = 24;
                        break;
                    }
                    case 24: {
                        this.climbAnimState = 25;
                        break;
                    }
                    case 25: {
                        this.climbAnimState = 26;
                        break;
                    }
                    case 26: {
                        this.climbAnimState = 18;
                    }
                }
                this.climbAdvance = false;
                if ((this.frameIndex & 0xFFFFFF) == 23) break;
                this.setFrame(this.climbAnimState | this.facingFlag);
                return;
            }
            case 27: {
                if (!this.ledgeGrabFlag) {
                    this.climbAnimState = 24;
                    this.setFrame(this.climbAnimState | this.facingFlag);
                } else {
                    this.accelY = 4096;
                    this.posY -= 25600;
                    this.stateFlags &= 0xFFFFDFFF;
                    this.setFrame(0 | this.facingFlag);
                }
                this.climbAdvance = false;
                return;
            }
            case 23: {
                if (this.screen.levelIndex != 4 && (this.stateFlags & 1) == 0) break;
                if (this.health <= 0) {
                    this.setFrame(0xF | this.facingFlag);
                    tjge.GameScreen.playSound(4, 1, 200);
                    return;
                }
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 15: {
                if (this.frameTimer++ <= 2) break;
                this.setFrame(0x10 | this.facingFlag);
                return;
            }
            case 16: {
                if (this.frameTimer++ <= 4) break;
                this.frameTimer = 0;
                this.screen.state = 20;
            }
        }
    }

    /*
     * Unable to fully structure code
     */
    public final void handleInput() {
        block92: {
            block95: {
                block93: {
                    block94: {
                        block88: {
                            block91: {
                                block89: {
                                    block90: {
                                        if (this.screen.state != 10) {
                                            return;
                                        }
                                        if (this.actionId == 23 || this.actionId != 0 && this.actionId != 5 && this.actionId != 2 && this.actionId != 1 && this.actionId != 28 && (this.stateFlags & 8192) == 0) {
                                            return;
                                        }
                                        if (this.screen.levelIndex == 4) {
                                            this.handleVehicleInput();
                                            return;
                                        }
                                        if ((this.stateFlags & 8192) != 0) {
                                            this.targetVelY = 0;
                                            this.accelY = 0;
                                        }
                                        if (this.screen.heldKeyAction == 4 && this.actionId != 5 && !this.actionFlag && (this.stateFlags & 8192) == 0 && !this.checkWallLeft(this.screen.tileMap, true)) {
                                            this.screen.heldKeyAction &= -5;
                                            if (this.inputHoldCount > 0) {
                                                this.screen.heldKeyAction = this.facingLeft != false ? 64 : 128;
                                            }
                                        }
                                        if (this.screen.heldKeyAction == 1) {
                                            if ((this.stateFlags & 1) != 0) {
                                                if (this.actionId != 2) {
                                                    if (this.facingLeft) {
                                                        if (this.actionId == 5 && this.checkWallAhead(this.screen.tileMap)) {
                                                            return;
                                                        }
                                                        if (!this.checkWallLeft(this.screen.tileMap, 2)) {
                                                            this.walkLeft();
                                                        }
                                                    } else {
                                                        this.setFrame(this.actionId | -2147483648);
                                                    }
                                                }
                                            } else if ((this.stateFlags & 8192) != 0 && !this.checkWallLeft(this.screen.tileMap, 14)) {
                                                if (this.checkWallLeft(this.screen.tileMap, false)) {
                                                    this.frameTimer = 0;
                                                    this.movingFlag = 1;
                                                    this.targetVelY = 10240;
                                                    this.targetVelX = -8192;
                                                    this.subState = 5;
                                                    this.setFrame(-2147483631);
                                                } else {
                                                    this.velY = 4096;
                                                    this.setFrame(-2147483648);
                                                }
                                                this.stateFlags &= -8193;
                                            }
                                            this.lastInputDir = 1;
                                            return;
                                        }
                                        if (this.screen.heldKeyAction == 2) {
                                            if ((this.stateFlags & 1) != 0) {
                                                if (this.actionId != 2) {
                                                    if (!this.facingLeft) {
                                                        if (this.actionId == 5 && this.checkWallAhead(this.screen.tileMap)) {
                                                            return;
                                                        }
                                                        if (!this.checkWallRight(this.screen.tileMap, 2)) {
                                                            this.walkRight();
                                                        }
                                                    } else {
                                                        this.setFrame(this.actionId);
                                                    }
                                                }
                                            } else if ((this.stateFlags & 8192) != 0 && !this.checkWallRight(this.screen.tileMap, 14)) {
                                                if (this.checkWallLeft(this.screen.tileMap, false)) {
                                                    this.frameTimer = 0;
                                                    this.movingFlag = 1;
                                                    this.targetVelY = 10240;
                                                    this.targetVelX = 8192;
                                                    this.subState = 5;
                                                    this.setFrame(17);
                                                } else {
                                                    this.velY = 4096;
                                                    this.setFrame(0);
                                                }
                                                this.stateFlags &= -8193;
                                            }
                                            this.lastInputDir = 2;
                                            return;
                                        }
                                        if (this.screen.heldKeyAction == 4) {
                                            if (this.actionFlag && (this.stateFlags & 1) != 0) {
                                                if (this.linkedEnemy != null) {
                                                    this.setFrame(13 | this.facingFlag);
                                                }
                                            } else if (this.actionId == 5) {
                                                if (!this.checkWallAhead(this.screen.tileMap)) {
                                                    this.setFrame(0 | this.facingFlag);
                                                }
                                            } else if (this.checkWallLeft(this.screen.tileMap, true)) {
                                                this.climbAdvance = true;
                                                this.stateFlags &= -2;
                                                this.stateFlags |= 8192;
                                                this.targetVelY = -5120;
                                                this.movingFlag = 0;
                                                this.setFrame(this.climbAnimState | this.facingFlag);
                                            } else if ((this.stateFlags & 8192) != 0) {
                                                this.ledgeGrabFlag = true;
                                                this.setFrame(27 | this.facingFlag);
                                            }
                                            this.lastInputDir = 4;
                                            this.inputHoldCount = 0;
                                            return;
                                        }
                                        if (this.screen.heldKeyAction == 8) {
                                            this.targetVelX = 0;
                                            if (this.checkWallLeft(this.screen.tileMap, false)) {
                                                if ((this.stateFlags & 8192) == 0) {
                                                    this.stateFlags &= -2;
                                                    this.stateFlags |= 8192;
                                                    this.movingFlag = 0;
                                                    this.ledgeGrabFlag = false;
                                                    this.posY += 30720;
                                                    this.setFrame(27 | this.facingFlag);
                                                } else {
                                                    this.setFrame(this.climbAnimState | this.facingFlag);
                                                }
                                                this.targetVelY = 5120;
                                                this.climbAdvance = true;
                                            } else if ((this.stateFlags & 8192) != 0) {
                                                this.stateFlags &= -8193;
                                                this.velY = 4096;
                                                this.setFrame(0 | this.facingFlag);
                                            } else if ((this.stateFlags & 1) != 0 && (this.inputHoldCount > 0 && this.inputHoldCount < 3 && this.lastInputDir == 8 || this.actionId == 5 && this.inputHoldCount > 0)) {
                                                this.movingFlag = 1;
                                                this.targetVelX = this.facingLeft == false ? 8192 : -8192;
                                                this.setFrame(19 | this.facingFlag);
                                            } else if ((this.stateFlags & 1) != 0 && this.inputHoldCount > 0) {
                                                this.setFrame(5 | this.facingFlag);
                                            }
                                            this.lastInputDir = 8;
                                            this.inputHoldCount = 0;
                                            return;
                                        }
                                        if (this.screen.heldKeyAction != 64) break block88;
                                        if ((this.stateFlags & 1) == 0) break block89;
                                        if (this.actionId == 5 && this.checkWallAhead(this.screen.tileMap)) {
                                            return;
                                        }
                                        if (!this.facingLeft) {
                                            this.setFrame(this.actionId | -2147483648);
                                            return;
                                        }
                                        this.velY = 0;
                                        this.velX = 0;
                                        if (!this.checkClimbable(this.screen.tileMap)) break block90;
                                        this.subState = this.climbResult;
                                        switch (this.subState) {
                                            case 1:
                                            case 4: {
                                                if (this.subState != 4) ** GOTO lbl136
                                                if (!this.checkWallLeft(this.screen.tileMap, 2)) {
                                                    this.subState = 0;
                                                    this.targetVelX = -8192;
                                                }
                                                ** GOTO lbl138
lbl136:
                                                // 1 sources

                                                if (this.subState == 1) {
                                                    this.targetVelX = -4096;
                                                }
                                            }
lbl138:
                                            // 5 sources

                                            case 3: {
                                                this.startLeapLeft(-10240);
                                                break;
                                            }
                                            case 2: {
                                                this.startLeapLeft(-15360);
                                            }
                                        }
                                        break block91;
                                    }
                                    this.subState = 0;
                                    this.startLeapLeft(-10240);
                                    this.targetVelX = -8192;
                                    break block91;
                                }
                                if ((this.stateFlags & 8192) != 0) {
                                    this.accelY = 0;
                                    this.targetVelY = 0;
                                }
                            }
                            this.lastInputDir = 64;
                            this.screen.heldKeyAction = 0;
                            return;
                        }
                        if (this.screen.heldKeyAction != 128) break block92;
                        if ((this.stateFlags & 1) == 0) break block93;
                        if (this.actionId == 5 && this.checkWallAhead(this.screen.tileMap)) {
                            return;
                        }
                        if (this.facingLeft) {
                            this.setFrame(this.actionId);
                            return;
                        }
                        this.velY = 0;
                        this.velX = 0;
                        if (!this.checkClimbable(this.screen.tileMap)) break block94;
                        this.subState = this.climbResult;
                        switch (this.subState) {
                            case 1:
                            case 4: {
                                if (this.subState != 4) ** GOTO lbl176
                                if (!this.checkWallRight(this.screen.tileMap, 2)) {
                                    this.subState = 0;
                                    this.targetVelX = 8192;
                                }
                                ** GOTO lbl178
lbl176:
                                // 1 sources

                                if (this.subState == 1) {
                                    this.targetVelX = 4096;
                                }
                            }
lbl178:
                            // 5 sources

                            case 3: {
                                this.startLeapRight(-10240);
                                break;
                            }
                            case 2: {
                                this.startLeapRight(-15360);
                            }
                        }
                        break block95;
                    }
                    this.subState = 0;
                    this.startLeapRight(-10240);
                    this.targetVelX = 8192;
                    break block95;
                }
                if ((this.stateFlags & 8192) != 0) {
                    this.accelY = 0;
                    this.targetVelY = 0;
                }
            }
            this.lastInputDir = 128;
            this.screen.heldKeyAction = 0;
            return;
        }
        if (this.screen.heldKeyAction == 16) {
            if ((this.stateFlags & 8192) != 0) {
                return;
            }
            if (this.inputHoldCount == 0) {
                ++this.inputHoldCount;
                return;
            }
            switch (this.weaponIndex) {
                case 0:
                case 1: {
                    this.fireWeapon(21);
                    break;
                }
                case 2: {
                    this.fireWeapon(15);
                }
            }
            this.inputHoldCount = 0;
            this.targetVelX = 0;
            this.screen.heldKeyAction &= -17;
            return;
        }
        if (this.screen.heldKeyAction == 32) {
            if ((this.stateFlags & 8192) == 0 && this.inputHoldCount > 1) {
                switch (this.weaponIndex) {
                    case 0: {
                        if (this.ammoReserveB != 0 || this.ammoReserveC != 0) break;
                        return;
                    }
                    case 1: {
                        this.ammoReserveB += this.magazineAmmo;
                        break;
                    }
                    case 2: {
                        this.ammoReserveC += this.magazineAmmo;
                    }
                }
                this.inputHoldCount = 0;
                this.magazineAmmo = 0;
                ++this.weaponIndex;
                this.switchOrReloadWeapon(32);
            }
            this.targetVelX = 0;
            this.screen.heldKeyAction &= -33;
            return;
        }
        if (this.screen.heldKeyAction == 2048) {
            if (this.actionId != 1 && this.actionId != 28 && (this.stateFlags & 8192) == 0 && this.inputHoldCount > 1) {
                this.switchOrReloadWeapon(2048);
                this.inputHoldCount = 0;
            }
            this.targetVelX = 0;
            this.screen.heldKeyAction &= -2049;
            return;
        }
        if (this.screen.heldKeyAction == 1024) {
            if ((this.stateFlags & 8192) != 0 || this.inputHoldCount == 0) {
                return;
            }
            this.fireWeapon(20);
            this.inputHoldCount = 0;
            this.targetVelX = 0;
            this.screen.heldKeyAction &= -1025;
            return;
        }
        ++this.inputHoldCount;
        if (this.movingFlag == 0) {
            this.targetVelX = 0;
        }
        if (this.actionId == 2 && (this.stateFlags & 1) != 0) {
            this.setFrame(0 | this.facingFlag);
        }
    }

    public final void startLeapLeft(int n) {
        if (this.subState == 2) {
            this.posX = this.climbTargetX + 12288;
            this.setFrame(-2147483626);
        } else if (this.subState == 5) {
            this.setFrame(-2147483631);
        } else {
            this.setFrame(-2147483645);
        }
        this.targetVelY = n;
        this.accelY = 4096;
        this.stateFlags &= 0xFFFFFFFE;
        this.movingFlag = 1;
    }

    public final void startLeapRight(int n) {
        if (this.subState == 2) {
            this.posX = this.climbTargetX - 12288;
            this.setFrame(22);
        } else if (this.subState == 5) {
            this.setFrame(17);
        } else {
            this.setFrame(3);
        }
        this.targetVelY = n;
        this.accelY = 4096;
        this.stateFlags &= 0xFFFFFFFE;
        this.movingFlag = 1;
    }

    public final void land() {
        if ((this.stateFlags & 1) == 0) {
            this.targetVelX = 0;
            this.accelY = 0;
            this.movingFlag = 0;
            this.canClimb = true;
            this.stateFlags |= 1;
            if (this.actionId != 23) {
                this.setFrame(0 | this.facingFlag);
            }
        }
    }

    public final void beginFall() {
        if (this.screen.levelIndex == 4 || this.actionId == 15 || this.actionId == 16 || this.actionId == 3 || this.actionId == 4 || this.actionId == 17 || this.actionId == 22) {
            return;
        }
        this.stateFlags &= 0xFFFFFFFE;
        if (this.actionId == 23 || this.velY > 0) {
            this.targetVelY = 10240;
            this.accelY = 4096;
            this.maxVelY = 12288;
            this.frameTimer = 0;
            this.movingFlag = 1;
            if (this.actionId == 23) {
                this.targetVelX = 0;
                return;
            }
            this.subState = 5;
            this.targetVelX = this.facingLeft ? -8192 : 8192;
            this.setFrame(0x11 | this.facingFlag);
        }
    }

    public final void walkLeft() {
        this.targetVelX = -8192;
        this.movingFlag = 0;
        this.setFrame(-2147483646);
    }

    public final void walkRight() {
        this.targetVelX = 8192;
        this.movingFlag = 0;
        this.setFrame(2);
    }

    public final void fireWeapon(int n) {
        ProjectileActor l2;
        switch (n) {
            case 10:
            case 21: {
                if (this.magazineAmmo <= 0) {
                    if (this.actionId == 5) {
                        this.setFrame(0x1E | this.facingFlag);
                        return;
                    }
                    this.setFrame(0x1D | this.facingFlag);
                    return;
                }
                if (this.weaponIndex == 0) {
                    int n2 = !this.facingLeft ? 25 : -25;
                    n2 = n2 << 10;
                    l2 = this.screen.spawnProjectile(21, 0 | this.facingFlag, 0, this.posX + n2, this.posY - 20480, 0);
                } else {
                    int n3 = !this.facingLeft ? 35 : -35;
                    n3 = n3 << 10;
                    l2 = this.screen.spawnProjectile(10, 0 | (this.facingFlag == 0 ? Integer.MIN_VALUE : 0), 1, this.posX + n3, this.posY - 23552, 0);
                }
                if (l2 != null) {
                    if (this.actionId == 5) {
                        l2.posY += 5120;
                        this.setFrame(9 | this.facingFlag);
                    } else {
                        this.setFrame(6 | this.facingFlag);
                    }
                    if (this.screen.levelIndex != 4 && this.weaponIndex == 0 && l2.advanceAndCollide(this.facingLeft)) {
                        l2.setFrame(1);
                    } else if (this.weaponIndex == 0) {
                        l2.targetVelX = l2.targetVelX + (!this.facingLeft ? 12288 : -12288);
                    }
                    --this.magazineAmmo;
                }
                tjge.GameScreen.playSound(3, 1, 100);
                break;
            }
            case 20: {
                if (this.grenadeCount == 0 && this.screen.levelIndex != 4) {
                    return;
                }
                l2 = this.screen.spawnProjectile(20, 0, 0, this.posX, this.posY - 35840, 0);
                if (l2 == null) break;
                if (--this.grenadeCount < 0) {
                    this.grenadeCount = 0;
                }
                if (this.actionId == 5) {
                    l2.posY += 4096;
                    this.setFrame(0xA | this.facingFlag);
                } else {
                    this.setFrame(7 | this.facingFlag);
                }
                l2.targetVelX = l2.targetVelX + (!this.facingLeft ? 8192 : -8192);
                l2.targetVelY = -6656;
                l2.accelY = 1128;
                l2.maxVelY = 15360;
                break;
            }
            case 15: {
                if (this.magazineAmmo <= 0) {
                    if (this.actionId == 5) {
                        this.setFrame(0x1E | this.facingFlag);
                        return;
                    }
                    this.setFrame(0x1D | this.facingFlag);
                    return;
                }
                int n4 = !this.facingLeft ? 40 : -40;
                l2 = this.screen.spawnProjectile(15, 0 | this.facingFlag, 0, this.posX + (n4 = n4 << 10), this.posY - 18432, 0);
                if (l2 == null) break;
                --this.magazineAmmo;
                if (this.actionId == 5) {
                    l2.posY += 4096;
                    this.setFrame(9 | this.facingFlag);
                } else {
                    this.setFrame(6 | this.facingFlag);
                }
                if (this.screen.levelIndex != 4 && l2.advanceAndCollide(this.facingLeft)) {
                    this.screen.spawnProjectile(16, 0, 0, l2.posX, l2.posY, 0);
                    l2.deactivate();
                    break;
                }
                l2.computeHomingTrajectory();
            }
        }
        l2 = null;
    }

    public final void takeDamage(int n) {
        if (this.screen.state != 10) {
            return;
        }
        if (this.actionId == 13 || this.actionId == 19 || this.actionId == 15 || this.actionId == 16 || this.invulnTimer > 0) {
            return;
        }
        this.health -= n;
        this.frameTimer = 0;
        this.invulnTimer = 5;
        this.stateFlags &= 0xFFFFDFFF;
        this.setFrame(0x17 | this.facingFlag);
        if (this.screen.levelIndex != 4) {
            this.targetVelX = 0;
        }
    }

    public final boolean checkClimbable(TileMap b2) {
        boolean bl = false;
        boolean bl2 = false;
        boolean bl3 = false;
        int n = (this.posY + this.velY >> 10) + -56 >> 4;
        int n2 = (this.posY + this.velY >> 10) - 3 >> 4;
        int n3 = this.posX + this.velX >> 10;
        n3 += this.facingLeft ? -16 : 16;
        n3 >>= 4;
        int n4 = n;
        while (n4 <= n2) {
            int n5 = b2.queryColumnTileAt(n3, n4, true);
            if (n5 == 1) {
                if (n4 < n + 1) {
                    this.climbResult = 4;
                    return true;
                }
                if (n4 < n + 2 || n4 < n + 3) {
                    this.climbTargetX = this.facingLeft ? (n3 << 4) + 16 << 10 : n3 << 14;
                    this.climbTargetY = n4 << 14;
                    this.climbResult = n4 == n + 1 ? 3 : 2;
                    return true;
                }
                if (n4 < n + 4) {
                    this.climbResult = 1;
                    return true;
                }
            }
            ++n4;
        }
        this.climbResult = 0;
        return false;
    }

    private void handleVehicleInput() {
        if (this.screen.heldKeyAction == 1) {
            if (!this.facingLeft) {
                this.setFrame(this.actionId | Integer.MIN_VALUE);
                return;
            }
            this.targetVelX = 0;
            return;
        }
        if (this.screen.heldKeyAction == 2) {
            if (this.facingLeft) {
                this.setFrame(this.actionId);
                return;
            }
            this.targetVelX = 16384;
            return;
        }
        if (this.screen.heldKeyAction == 4) {
            if (this.actionId != 0) {
                this.setFrame(0 | this.facingFlag);
                return;
            }
        } else if (this.screen.heldKeyAction == 8) {
            if (this.actionId != 5) {
                this.setFrame(5 | this.facingFlag);
                return;
            }
        } else {
            if (this.screen.heldKeyAction == 16) {
                if (this.inputHoldCount == 0) {
                    ++this.inputHoldCount;
                    return;
                }
                switch (this.weaponIndex) {
                    case 0:
                    case 1: {
                        this.fireWeapon(21);
                        break;
                    }
                    case 2: {
                        this.fireWeapon(15);
                    }
                }
                this.inputHoldCount = 0;
                this.screen.heldKeyAction &= 0xFFFFFFEF;
                return;
            }
            if (this.screen.heldKeyAction == 32) {
                if (this.inputHoldCount > 1) {
                    switch (this.weaponIndex) {
                        case 0: {
                            if (this.ammoReserveB != 0 || this.ammoReserveC != 0) break;
                            return;
                        }
                        case 1: {
                            this.ammoReserveB += this.magazineAmmo;
                            break;
                        }
                        case 2: {
                            this.ammoReserveC += this.magazineAmmo;
                        }
                    }
                    this.inputHoldCount = 0;
                    this.magazineAmmo = 0;
                    ++this.weaponIndex;
                    this.switchOrReloadWeapon(32);
                    return;
                }
            } else if (this.screen.heldKeyAction == 2048) {
                if (this.inputHoldCount > 1) {
                    this.switchOrReloadWeapon(2048);
                    this.inputHoldCount = 0;
                    return;
                }
            } else if (this.screen.heldKeyAction == 1024) {
                if (this.inputHoldCount > 0) {
                    this.fireWeapon(20);
                    this.inputHoldCount = 0;
                    return;
                }
            } else {
                ++this.inputHoldCount;
                if (this.screen.reinforceBudget <= 12) {
                    this.targetVelX = this.screen.cameraVelX;
                }
                this.targetVelY = 0;
                this.accelY = 0;
            }
        }
    }

    public final boolean checkWallLeft(TileMap b2, int n) {
        if (n != 100) {
            if (this.velX > 0) {
                return false;
            }
        } else {
            n = 0;
        }
        int n2 = this.boundsTop;
        boolean bl = false;
        if ((this.stateFlags & 0x2000) != 0) {
            n2 = -20;
        }
        int n3 = this.posY + this.velY >> 10;
        int n4 = (this.posX + this.velX >> 10) + -9 - n >> 4;
        int n5 = n3 + n2 - 2 >> 4;
        int n6 = n3 - 10 >> 4;
        int n7 = n5;
        while (n7 <= n6) {
            n3 = b2.queryColumnTileAt(n4, n7, true);
            if (n3 == 1) {
                n3 = b2.queryColumnTileAt(n4 + 1, n7, true);
                if (n3 != 1) {
                    this.targetVelX = 0;
                    this.posX &= 0xFFFFFC00;
                    this.velX = ((n4 << 4) + 25 << 10) - this.posX;
                }
                return true;
            }
            ++n7;
        }
        return false;
    }

    public final boolean checkWallRight(TileMap b2, int n) {
        if (n != 100) {
            if (this.velX < 0) {
                return false;
            }
        } else {
            n = 0;
        }
        int n2 = this.boundsTop;
        boolean bl = false;
        if ((this.stateFlags & 0x2000) != 0) {
            n2 = -20;
        }
        int n3 = this.posY + this.velY >> 10;
        int n4 = (this.posX + this.velX >> 10) + 9 + n >> 4;
        int n5 = n3 + n2 - 2 >> 4;
        int n6 = n3 - 10 >> 4;
        int n7 = n5;
        while (n7 <= n6) {
            n3 = b2.queryColumnTileAt(n4, n7, true);
            if (n3 == 1) {
                n3 = b2.queryColumnTileAt(n4 - 1, n7, true);
                if (n3 != 1) {
                    this.targetVelX = 0;
                    this.posX &= 0xFFFFFC00;
                    this.velX = ((n4 << 4) - 10 << 10) - this.posX;
                }
                return true;
            }
            ++n7;
        }
        return false;
    }

    public final void onHitByProjectile(ProjectileActor l2) {
        if (this.actionId != 19 && this.actionId != 23 && this.actionId != 15 && this.actionId != 16) {
            switch (l2.typeId) {
                case 21: {
                    if (this.facingLeft && l2.targetVelX < 0) {
                        this.facingFlag = 0;
                        this.facingLeft = false;
                    } else if (!this.facingLeft && l2.targetVelX > 0) {
                        this.facingFlag = Integer.MIN_VALUE;
                        this.facingLeft = true;
                    }
                    if ((l2.frameIndex & 0xFFFFFF) != 0) break;
                    this.takeDamage(1);
                    l2.deactivate();
                    return;
                }
                case 20: {
                    int n = l2.targetVelX > 0 ? 8192 : -8192;
                    this.screen.spawnProjectile(16, 0, 0, l2.posX + n, l2.posY + 8192, l2.facingFlag);
                    l2.deactivate();
                    tjge.GameScreen.playSound(5, 1, 220);
                    return;
                }
                case 16: {
                    this.takeDamage(3);
                }
            }
        }
    }

    public final void switchOrReloadWeapon(int n) {
        boolean bl = false;
        if (this.weaponIndex > 2) {
            this.weaponIndex = 0;
        }
        while (!bl) {
            if (this.weaponIndex == 1) {
                if (n == 32) {
                    if (this.ammoReserveB <= 0) {
                        this.weaponIndex = 2;
                    } else {
                        bl = true;
                    }
                } else {
                    if (this.magazineAmmo >= 3 || this.ammoReserveB <= 0) break;
                    bl = true;
                }
            }
            if (this.weaponIndex == 2) {
                if (n == 32) {
                    if (this.ammoReserveC == 0) {
                        this.weaponIndex = 0;
                    } else {
                        bl = true;
                    }
                } else {
                    if (this.magazineAmmo >= 1 || this.ammoReserveC <= 0) break;
                    bl = true;
                }
            }
            if (this.weaponIndex != 0) continue;
            if (n == 32) {
                bl = true;
                continue;
            }
            if (this.magazineAmmo >= 10) break;
            bl = true;
        }
        if (bl) {
            if (this.actionId == 5 || this.actionId == 28) {
                this.setFrame(0x1C | this.facingFlag);
                return;
            }
            this.setFrame(1 | this.facingFlag);
        }
    }

    public final void fullAmmoInit() {
        this.weaponIndex = 0;
        this.ammoReserveB = 6;
        this.ammoReserveC = 3;
        this.grenadeCount = 3;
        this.magazineAmmo = 10;
    }

    public final void reloadFromReserve() {
        int n = 0;
        if (this.magazineAmmo < 0) {
            this.magazineAmmo = 0;
        }
        switch (this.weaponIndex) {
            case 0: {
                this.magazineAmmo = 10;
                return;
            }
            case 1: {
                n = 3 - this.magazineAmmo;
                if (this.ammoReserveB > n) {
                    this.ammoReserveB -= n;
                    this.magazineAmmo = 3;
                    return;
                }
                this.magazineAmmo += this.ammoReserveB;
                this.ammoReserveB = 0;
                return;
            }
            case 2: {
                n = 1 - this.magazineAmmo;
                if (this.ammoReserveC > n) {
                    this.ammoReserveC -= n;
                    this.magazineAmmo = 1;
                    return;
                }
                this.magazineAmmo += this.ammoReserveC;
                this.ammoReserveC = 0;
            }
        }
    }
}
