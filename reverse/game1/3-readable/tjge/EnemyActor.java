// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/h.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.GameScreen;     // 原 tjge.a
import tjge.SpriteDef;      // 原 tjge.d
import tjge.EffectActor;    // 原 tjge.e
import tjge.PlayerActor;    // 原 tjge.f
import tjge.ActorBase;      // 原 tjge.g
import tjge.ProjectileActor; // 原 tjge.l

public final class EnemyActor
extends ActorBase {
    int timerA;            // 原 a
    int timerB;            // 原 b
    int patrolBaseX;       // 原 c
    int patrolRange;       // 原 d
    int patrolDir;         // 原 e
    int attackRangeUpper;  // 原 f
    int attackRangeLower;  // 原 g
    int hitPoints;         // 原 h
    int patrolLeftBound;   // 原 i
    int patrolRightBound;  // 原 j
    int facingFlag;        // 原 k
    int rhythmThreshold;   // 原 l
    int lives;             // 原 m
    int actionLow24;       // 原 n
    int aiState;           // 原 o
    int attackMode;        // 原 O
    int hurtBlinkTimer;    // 原 P
    boolean comboToggle;   // 原 Q
    boolean knockedBack;   // 原 R
    boolean aiming;        // 原 S
    boolean isPatroller;   // 原 T
    boolean fromSpawner;   // 原 U
    PlayerActor target;    // 原 V (tjge.f)
    GameScreen screen;     // 原 W (tjge.a)
    EffectActor trailEffect; // 原 X (tjge.e)

    public EnemyActor(int frameIndex, SpriteDef spriteDef, GameScreen screen) {
        super(frameIndex, spriteDef);
        this.screen = screen;
    }

    public final boolean spawnAt(int frameIndex, int tileX, int tileY, byte[] params, boolean flag) {
        if (flag) {
            return false;
        }
        super.spawnAt(frameIndex, tileX, tileY, params, flag);
        this.loopAnimation = true;
        this.patrolBaseX = this.posX;
        this.comboToggle = false;
        this.knockedBack = false;
        this.aiming = false;
        this.timerB = 0;
        this.timerA = 0;
        this.hurtBlinkTimer = 0;
        this.target = this.screen.player;
        this.fromSpawner = false;
        this.trailEffect = null;
        switch (params[3]) {
            case 0: {
                this.attackRangeUpper = 40960;
                this.attackRangeLower = -40960;
                break;
            }
            case 1: {
                this.attackRangeUpper = 81920;
                this.attackRangeLower = -40960;
                break;
            }
            case 2: {
                this.attackRangeUpper = 40960;
                this.attackRangeLower = -81920;
                break;
            }
            case 3: {
                this.attackRangeUpper = 81920;
                this.attackRangeLower = -81920;
            }
        }
        switch (this.typeId) {
            case 1:
            case 2: {
                this.isPatroller = true;
                this.drawParam = this.hitPoints = params[2];
                this.rhythmThreshold = 3;
                break;
            }
            case 18: {
                this.hitPoints = 0;
            }
        }
        this.patrolDir = params[0];
        this.patrolRange = params[1];
        this.lives = this.hitPoints + 1;
        this.aiState = 0;
        if (this.patrolDir == 0) {
            this.patrolLeftBound = this.patrolBaseX - (this.patrolRange << 10);
            this.patrolRightBound = this.patrolBaseX;
            this.facingFlag = 0;
            this.setFrame(frameIndex | 0);
        } else {
            this.patrolLeftBound = this.patrolBaseX;
            this.patrolRightBound = this.patrolBaseX + (this.patrolRange << 10);
            this.facingFlag = Integer.MIN_VALUE;
            this.setFrame(frameIndex | Integer.MIN_VALUE);
        }
        return true;
    }

    public final void update() {
        if (this.screen.state == 21) {
            return;
        }
        this.facingFlag = this.frameIndex & 0xFF000000;
        this.actionLow24 = this.frameIndex & 0xFFFFFF;
        if (this.target.actionId == 19 && this.aiState != 4 && this.intersectsActor(this.target)) {
            this.target.frameTimer = 0;
            this.target.targetVelX = 0;
            this.target.movingFlag = 0;
            this.knockedBack = true;
            this.target.posX = this.target.posX + (this.target.facingLeft ? 8192 : -8192);
            this.target.setFrame(0x14 | this.target.facingFlag);
            return;
        }
        if (this.knockedBack) {
            if (this.target.actionId == 21 && this.aiState != 4 && Math.abs(this.posX - this.target.posX) < 40960) {
                this.targetVelX = 0;
                this.lives = 0;
                this.aiState = 9;
                this.knockedBack = false;
                if (this.typeId == 18) {
                    this.loopAnimation = false;
                    this.setFrame(3 | this.facingFlag);
                } else {
                    this.setFrame(7 | this.facingFlag);
                }
                GameScreen.playSound(4, 1, 200);
            } else if (this.target.actionId != 20) {
                this.knockedBack = false;
            }
        }
        switch (this.typeId) {
            case 1:
            case 2: {
                if (this.isPatroller) {
                    this.patrolUpdate();
                    return;
                }
                this.airUpdate();
                return;
            }
            case 18: {
                this.bossUpdate();
            }
        }
    }

    public final void patrolUpdate() {
        if (this.screen.scriptFlagL && this.timerA-- > 0) {
            return;
        }
        if (this.intersectsActor(this.target) && this.aiState != 7 && (this.aiState != 5 && this.aiState != 9 && this.aiState != 4 || this.aiState == 5 && this.timerB < this.rhythmThreshold) && (this.facingFlag != 0 && this.target.posX < this.posX || this.facingFlag == 0 && this.posX < this.target.posX)) {
            this.facingFlag ^= Integer.MIN_VALUE;
            this.setFrame(this.actionLow24 | this.facingFlag);
            this.timerB = 0;
        }
        if (this.aiState == 0 || this.aiState == 3 || this.aiState == 1) {
            if ((this.facingFlag == 0 && this.posX > this.target.posX && this.posX - this.target.posX < 30720 || this.facingFlag != 0 && this.target.posX > this.posX && this.target.posX - this.posX < 30720) && Math.abs(this.target.posY - this.posY) < 10240 && this.target.actionId != 23 && this.target.actionId != 15 && this.target.actionId != 16 && this.target.actionId != 20 && this.target.actionId != 21 && this.target.actionId != 19) {
                this.attackMode = 1;
                this.targetVelX = 0;
                this.timerB = 0;
                this.aiState = 5;
                this.aiming = false;
                this.setFrame(4 | this.facingFlag);
                return;
            }
            if (this.target.posY < this.posY + this.attackRangeUpper && this.target.posY > this.posY + this.attackRangeLower) {
                int rangeFx = 143360;
                if (this.facingFlag == 0 && this.posX > this.target.posX && this.posX - this.target.posX < rangeFx || this.facingFlag != 0 && this.posX < this.target.posX && this.target.posX - this.posX < rangeFx) {
                    if (this.aiming && this.timerB++ > this.rhythmThreshold) {
                        this.aiState = this.hitPoints > 0 && this.comboToggle ? 8 : 5;
                        this.attackMode = 0;
                        this.timerB = 0;
                        this.targetVelX = 0;
                        this.aiming = false;
                        this.comboToggle = !this.comboToggle;
                    } else if (!this.aiming) {
                        this.timerB = 0;
                        this.targetVelX = 0;
                        this.aiState = 0;
                        this.aiming = true;
                        if (this.hitPoints > 0 && this.comboToggle) {
                            this.setFrame(8 | this.facingFlag);
                        } else if (this.typeId == 2) {
                            this.setFrame(0 | this.facingFlag);
                        } else {
                            this.setFrame(2 | this.facingFlag);
                        }
                    }
                } else {
                    this.aiming = false;
                }
            } else {
                this.aiming = false;
            }
        }
        switch (this.aiState) {
            case 0: {
                if (this.aiming) break;
                this.timerB = 0;
                if (!this.isAnimationDone()) break;
                if (this.patrolRange > 0) {
                    if (this.facingFlag == 0 && this.posX > this.patrolLeftBound || this.facingFlag != 0 && this.posX < this.patrolRightBound) {
                        this.targetVelX = this.facingFlag == 0 ? -3072 : 3072;
                        this.setFrame(1 | this.facingFlag);
                    } else {
                        this.targetVelX = 0;
                        this.setFrame(0 | this.facingFlag);
                    }
                    this.aiState = 3;
                    return;
                }
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 1: {
                if (++this.timerB == 10) {
                    this.facingFlag = this.facingFlag == 0 ? Integer.MIN_VALUE : 0;
                    this.setFrame(this.actionLow24 | this.facingFlag);
                    return;
                }
                if (this.timerB < 20) break;
                this.timerB = 0;
                this.aiState = 3;
                this.targetVelX = this.facingFlag == 0 ? -3072 : 3072;
                this.setFrame(1 | this.facingFlag);
                return;
            }
            case 11: {
                if (this.isAnimationDone()) {
                    if (this.actionLow24 == 3) {
                        this.setFrame(2 | this.facingFlag);
                    } else if (this.actionLow24 == 9) {
                        this.setFrame(8 | this.facingFlag);
                    }
                }
                if (this.timerB++ <= 4) break;
                this.timerB = 0;
                this.aiState = 0;
                return;
            }
            case 3: {
                if ((this.facingFlag != 0 || this.posX >= this.patrolLeftBound) && (this.facingFlag == 0 || this.posX <= this.patrolRightBound)) break;
                this.targetVelX = 0;
                this.timerB = 0;
                this.aiState = 1;
                if (this.typeId == 2) {
                    this.setFrame(0 | this.facingFlag);
                    return;
                }
                this.setFrame(2 | this.facingFlag);
                return;
            }
            case 5:
            case 8: {
                switch (this.attackMode) {
                    case 0: {
                        switch (this.typeId) {
                            case 2: {
                                if (this.aiState == 8) {
                                    this.setFrame(8 | this.facingFlag);
                                    if (this.timerB++ > 10) {
                                        this.timerB = 0;
                                        this.aiState = 0;
                                    }
                                    return;
                                }
                                if (this.actionLow24 == 2) {
                                    if (this.isAnimationDone()) {
                                        this.setFrame(3 | this.facingFlag);
                                    }
                                    return;
                                }
                                if (this.actionLow24 == 3) {
                                    this.aiState = 0;
                                    this.setFrame(0 | this.facingFlag);
                                    return;
                                }
                                this.spawnMeleeHitbox();
                                break;
                            }
                            case 1: {
                                if (this.aiState == 8 && this.hitPoints == 1) {
                                    if (this.timerB++ > 10) {
                                        this.timerB = 0;
                                        this.aiState = 0;
                                    }
                                    return;
                                }
                                ProjectileActor projectile = this.fireProjectile(this.aiState == 5 ? 32 : 14);
                                if (projectile == null) break;
                                if (this.aiState == 5) {
                                    this.setFrame(3 | this.facingFlag);
                                } else {
                                    this.setFrame(9 | this.facingFlag);
                                }
                                if (projectile.advanceAndCollide(this.facingFlag == 0)) {
                                    projectile.setFrame(1);
                                } else {
                                    projectile.targetVelX = projectile.targetVelX + (this.facingFlag == 0 ? -12288 : 12288);
                                }
                                this.aiState = 11;
                                this.rhythmThreshold = this.hitPoints > 0 ? 12 : 15;
                            }
                        }
                        break;
                    }
                    case 1: {
                        if (!this.isAnimationDone()) break;
                        this.target.takeDamage(1);
                        if (this.posX <= this.target.posX && !this.target.checkWallRight(this.screen.tileMap, 100) || this.posX >= this.target.posX && !this.target.checkWallLeft(this.screen.tileMap, 100)) {
                            this.target.posX = this.target.posX + (this.posX >= this.target.posX ? -8192 : 8192);
                        }
                        this.aiState = 0;
                        this.setFrame(0 | this.facingFlag);
                    }
                }
                return;
            }
            case 9: {
                if (this.timerB++ <= 1) break;
                this.timerB = 0;
                if (this.lives <= 0) {
                    this.aiState = 4;
                    this.loopAnimation = false;
                    if (!this.fromSpawner) {
                        this.screen.levelLoader.actorSpawned[this.extra] = true;
                    }
                    this.setFrame(5 | this.facingFlag);
                    return;
                }
                this.aiState = 0;
                this.aiming = false;
                this.facingFlag = this.posX < this.target.posX ? Integer.MIN_VALUE : 0;
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 4: {
                if (this.actionLow24 == 5) {
                    if (this.timerB++ <= 1) break;
                    this.hurtBlinkTimer = 15;
                    this.setFrame(6 | this.facingFlag);
                    return;
                }
                if (this.actionLow24 != 6 || this.hurtBlinkTimer != 0) break;
                this.deactivate();
                ++this.screen.killCount;
                if (!this.fromSpawner) break;
                --this.screen.enemyAliveCount;
                return;
            }
            case 7: {
                if (this.patrolDir == 0 && this.posX <= this.patrolRightBound || this.patrolDir != 0 && this.posX >= this.patrolLeftBound) {
                    this.targetVelX = 0;
                    this.aiState = 0;
                    return;
                }
                this.targetVelX = this.patrolDir == 0 ? -4096 : 4096;
            }
        }
    }

    public final void airUpdate() {
        if (this.trailEffect != null && this.trailEffect.active) {
            this.trailEffect.posX = this.posX;
            this.trailEffect.posY = this.posY - 30720;
        }
        if (this.aiState == 0) {
            if (this.facingFlag == 0 && this.posX < this.target.posX) {
                this.facingFlag = Integer.MIN_VALUE;
                this.setFrame(this.actionLow24 | Integer.MIN_VALUE);
            } else if (this.facingFlag != 0 && this.posX > this.target.posX) {
                this.facingFlag = 0;
                this.setFrame(this.actionLow24 | 0);
            }
            if (this.posY < this.target.posY && this.targetVelY > 0) {
                if (this.timerA++ % 60 == 0 && this.posX > this.screen.cameraX + 61440 && this.posX < this.screen.cameraX + GameScreen.viewWidthFx - 61440) {
                    int chosenVelX = this.targetVelX = GameMIDlet.nextRandomMod(1) == 1 ? 9216 : 7168;
                }
                if (this.posX < this.screen.cameraX + 40960) {
                    this.targetVelX = 9216;
                } else if (this.posX > this.screen.cameraX + GameScreen.viewWidthFx - 40960) {
                    this.targetVelX = 7168;
                }
            }
            if ((this.typeId == 2 && this.posY > this.screen.cameraY + 40960 || this.typeId == 1 && this.posY >= this.target.posY - 30720) && Math.abs(this.posX - this.target.posX) > 40960 && this.timerB++ > this.rhythmThreshold) {
                this.timerB = 0;
                this.aiState = 5;
            }
        }
        if (this.posX < this.screen.cameraX || this.posX > this.screen.cameraX + GameScreen.viewWidthFx) {
            this.deactivate();
            this.killTrailEffect();
            ++this.screen.killCount;
            --this.screen.enemyAliveCount;
            return;
        }
        if (this.posY >= this.target.posY + 25600 && this.targetVelY > 0) {
            this.targetVelY = 0;
            this.targetVelX = 0;
            this.killTrailEffect();
            if (this.aiState == 9) {
                this.setFrame(5 | this.facingFlag);
                this.aiState = 4;
                return;
            }
            this.setFrame(0 | this.facingFlag);
            return;
        }
        if (this.aiState != 4 && this.aiState != 9 && this.intersectsActor(this.target.linkedBoss)) {
            this.aiState = 9;
            this.targetVelX = 0;
            this.timerB = 0;
            this.targetVelY = 10240;
            this.lives = 0;
            this.setFrame(7 | this.facingFlag);
        }
        switch (this.aiState) {
            case 0: {
                if (!this.isAnimationDone()) break;
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 5: {
                switch (this.typeId) {
                    case 2: {
                        if (this.actionLow24 == 2) {
                            if (this.isAnimationDone()) {
                                this.setFrame(3 | this.facingFlag);
                            }
                            return;
                        }
                        if (this.actionLow24 == 3) {
                            this.aiState = 0;
                            this.setFrame(0 | this.facingFlag);
                            return;
                        }
                        this.spawnMeleeHitbox();
                        break;
                    }
                    case 1: {
                        ProjectileActor projectile = this.fireProjectile(28);
                        if (projectile == null) break;
                        this.aiState = 0;
                        projectile.targetVelX = projectile.targetVelX + (this.facingFlag == 0 ? -12288 : 12288);
                        this.setFrame(3 | this.facingFlag);
                        this.rhythmThreshold = 12;
                    }
                }
                return;
            }
            case 9: {
                this.killTrailEffect();
                if (this.targetVelY <= 0 || this.targetVelY >= 12288) break;
                this.targetVelY = 12288;
                return;
            }
            case 4: {
                if (this.actionLow24 != 5 || this.timerB++ <= 1) break;
                this.setFrame(6 | this.facingFlag);
            }
        }
    }

    private final void spawnMeleeHitbox() {
        ProjectileActor projectile = this.screen.spawnProjectile(20, 0, 0, this.posX, this.posY - 30720, 1);
        if (projectile != null) {
            this.timerB = 0;
            projectile.spawn(this.facingFlag != 0 ? 1 : 0);
            this.setFrame(2 | this.facingFlag);
            this.rhythmThreshold = this.hitPoints > 0 ? 12 : 15;
        }
    }

    private final ProjectileActor fireProjectile(int verticalOffsetTiles) {
        int spawnOffsetX = 29696;
        if (this.facingFlag == 0) {
            spawnOffsetX = -29696;
        }
        return this.screen.spawnProjectile(21, 0 | (this.facingFlag == 0 ? Integer.MIN_VALUE : 0), 0, this.posX + spawnOffsetX, this.posY - (verticalOffsetTiles << 10), 1);
    }

    private final void killTrailEffect() {
        if (this.trailEffect != null) {
            this.trailEffect.deactivate();
        }
    }

    public final void bossUpdate() {
        if ((this.aiState == 0 || this.aiState == 1 || this.aiState == 3) && Math.abs(this.posX - this.target.posX) < 131072) {
            if (this.target.posY < this.posY + 61440 && this.target.posY > this.posY - 10240 && Math.abs(this.posX - this.target.posX) < 81920) {
                this.targetVelX = 4096;
                this.aiState = 6;
                this.facingFlag = Integer.MIN_VALUE;
                this.setFrame(1 | Integer.MIN_VALUE);
            } else if (this.screen.scriptFlagL && this.screen.enemyAliveCount <= 0 && this.posX < this.screen.cameraX + GameScreen.viewWidthFx - 40960) {
                this.targetVelX = 0;
                this.aiState = 5;
                this.facingFlag = 0;
                this.setFrame(2);
            }
        }
        switch (this.aiState) {
            case 0: {
                if (this.isAnimationDone()) {
                    this.setFrame(0 | this.facingFlag);
                }
                if (this.timerB++ <= 10) break;
                this.timerB = 0;
                this.aiState = 3;
                this.targetVelX = this.facingFlag == 0 ? -2560 : 2560;
                this.setFrame(1 | this.facingFlag);
                return;
            }
            case 1: {
                if (this.timerB++ <= 20) break;
                this.timerB = 0;
                this.aiState = 3;
                this.facingFlag = this.facingFlag == 0 ? Integer.MIN_VALUE : 0;
                this.targetVelX = this.facingFlag == 0 ? -2560 : 2560;
                this.setFrame(1 | this.facingFlag);
                return;
            }
            case 3: {
                if ((this.facingFlag != 0 || this.posX >= this.patrolLeftBound) && (this.facingFlag == 0 || this.posX <= this.patrolRightBound)) break;
                this.targetVelX = 0;
                this.aiState = 1;
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 5: {
                if (!this.isAnimationDone()) break;
                this.aiState = 0;
                int spawnX = 327680;
                this.screen.spawnEnemyWave(1, 3, this.screen.cameraX + GameScreen.viewWidthFx, spawnX, 1, 1);
                return;
            }
            case 6: {
                if (this.posX <= this.screen.cameraX + GameScreen.viewWidthFx + 20480) break;
                this.targetVelX = 0;
                this.facingFlag = 0;
                this.aiState = 10;
                this.setFrame(0 | this.facingFlag);
                return;
            }
            case 10: {
                if (this.target.posY - this.posY <= 71680) break;
                this.aiState = 0;
                this.timerB = 11;
                return;
            }
            case 4:
            case 9: {
                if (this.actionLow24 == 3 && this.timerB++ > 2) {
                    if ((this.target.stateFlags & 1) == 0) break;
                    this.hurtBlinkTimer = 10;
                    this.setFrame(4 | this.facingFlag);
                    this.screen.state = 19;
                    return;
                }
                if (this.actionLow24 != 4 || this.hurtBlinkTimer != 0) break;
                this.deactivate();
            }
        }
    }

    public final void onProjectileHit(ProjectileActor projectile) {
        if (projectile.mode == 1 || this.aiState == 4 || this.aiState == 9 || this.aiState == 10) {
            return;
        }
        boolean killed = false;
        switch (projectile.typeId) {
            case 21: {
                if ((projectile.frameIndex & 0xFFFFFF) != 0) break;
                projectile.deactivate();
                --this.lives;
                killed = true;
                break;
            }
            case 10:
            case 16: {
                this.lives = 0;
                killed = true;
                break;
            }
            case 15:
            case 20: {
                int hitOffsetX = projectile.targetVelX > 0 ? 8192 : -8192;
                this.screen.spawnProjectile(16, 0, 0, projectile.posX + hitOffsetX, projectile.posY + 8192, 0);
                projectile.deactivate();
                GameScreen.playSound(5, 1, 220);
            }
        }
        if (killed) {
            this.timerB = 0;
            this.targetVelX = 0;
            this.aiState = 9;
            if (this.typeId == 18) {
                this.loopAnimation = false;
                this.setFrame(3 | this.facingFlag);
            } else {
                this.setFrame(7 | this.facingFlag);
            }
        }
        if (this.lives <= 0) {
            GameScreen.playSound(4, 1, 200);
        }
    }

    public final void paint(Graphics graphics, int cameraX, int cameraY) {
        if (this.hurtBlinkTimer == 0 || --this.hurtBlinkTimer > 0 && (this.hurtBlinkTimer & 1) != 0) {
            super.paint(graphics, cameraX, cameraY);
        }
    }
}
