// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/e.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameScreen;       // 原 tjge.a
import tjge.SpriteDef;        // 原 tjge.d
import tjge.ActorBase;        // 原 tjge.g
import tjge.ProjectileActor;  // 原 tjge.l

public final class EffectActor
extends ActorBase {
    int destroyedFlag;   // 原 a
    int anchorX;         // 原 b
    int anchorY;         // 原 c
    int hitPoints;       // 原 d
    int shakeTick;       // 原 e
    int tintBits;        // 原 f
    int regenTimer;      // 原 g
    boolean activated;   // 原 h
    GameScreen world;    // 原 i (tjge.a)

    public EffectActor(int frameIndex, SpriteDef spriteDef, GameScreen world) {
        super(frameIndex, spriteDef);
        this.world = world;
    }

    // 原 e.a(III[BZ)Z —— 覆写 ActorBase.spawnAt
    public final boolean init(int frameIndex, int tileX, int tileY, byte[] params, boolean skip) {
        if (skip) {
            return false;
        }
        super.spawnAt(frameIndex, tileX, tileY, params, skip);
        this.shakeTick = 0;
        this.activated = false;
        switch (this.typeId) {
            case 19: {
                this.setFrame(params[0]);
                break;
            }
            case 22: {
                this.anchorX = params[0];
                this.anchorY = params[1];
                break;
            }
            case 5: {
                this.hitPoints = 4;
            }
            case 4: {
                this.destroyedFlag = 0;
                break;
            }
            case 7:
            case 9: {
                this.hitPoints = this.typeId == 7 ? 3 : 9;
                this.anchorX = this.posX;
                this.anchorY = this.posY;
            }
        }
        return true;
    }

    /*
     * Unable to fully structure code
     */
    // 原 e.a()V —— 覆写 ActorBase.update
    public final void update() {
        player = this.world.player;
        this.tintBits = this.frameIndex & -16777216;
        switch (this.typeId) {
            case 22: {
                if (this.intersectsActor(player)) {
                    player.actionFlag = true;
                    player.linkedEnemy = this;
                    player.spareO = this.anchorX << 4;
                    player.spareP = this.anchorY << 4;
                    return;
                }
                if (player.linkedEnemy != this) break;
                player.actionFlag = false;
                player.linkedEnemy = null;
                return;
            }
            case 12: {
                if (!this.world.flagE) {
                    return;
                }
                if (this.intersectsActor(player)) {
                    this.activated = true;
                }
                if (!this.activated || (player.stateFlags & 1) == 0) break;
                this.deactivate();
                this.world.state = 19;
                return;
            }
            case 9: {
                if (this.hitPoints >= 4) ** GOTO lbl28
                this.setFrame(2);
                ** GOTO lbl32
lbl28:
                // 1 sources

                if (this.hitPoints < 7) {
                    this.setFrame(1);
                } else {
                    this.setFrame(0);
                }
            }
lbl32:
            // 4 sources

            case 7: {
                if (this.hitPoints <= 0) {
                    triggered = false;
                    if (this.typeId == 9) {
                        if (this.world.levelIndex == 7 && this.posX >> 10 > 1720) {
                            if ((this.world.player.stateFlags & 1) != 0) {
                                triggered = true;
                                this.world.stateTimer = 11;
                                this.world.state = 19;
                            }
                        } else {
                            triggered = true;
                        }
                    } else {
                        triggered = true;
                    }
                    if (triggered) {
                        if (this.typeId == 9) {
                            this.world.spawnProjectile(16, 0, 0, this.posX, this.posY - 5120, 2);
                            this.world.spawnProjectile(16, 0, 0, this.posX - 10240, this.posY - 20480, 2);
                            this.world.spawnProjectile(16, 0, 0, this.posX + 5120, this.posY - 10240, 2);
                        } else {
                            this.world.spawnProjectile(16, 0, 1, this.posX, this.posY - 5120, 2);
                        }
                        this.posX = this.anchorX;
                        this.posY = this.anchorY;
                        tileCol = this.posX >> 14;
                        tileRow = this.posY - 5120 >> 14;
                        while (this.world.tileMap.queryColumnTileAt(--tileCol, tileRow, true) == 1) {
                        }
                        clearCount = this.typeId == 7 ? 2 : 3;
                        clearIndex = 0;
                        while (clearIndex < clearCount) {
                            this.world.tileMap.clearTileAt(tileCol + 1, tileRow - clearIndex);
                            ++clearIndex;
                        }
                        this.deactivate();
                        this.world.scriptFlagL = false;
                        this.world.levelLoader.actorSpawned[this.extra] = true;
                        GameScreen.playSound(5, 1, 220);
                    }
                    return;
                }
                if (this.activated) {
                    this.regenTimer = 0;
                    v0 = this.posX = this.posX == this.anchorX ? this.posX + 2048 : this.anchorX;
                    if (this.shakeTick++ <= 5) break;
                    this.activated = false;
                    this.shakeTick = 0;
                    this.posX = this.anchorX;
                    return;
                }
                if (this.typeId != 9 || this.regenTimer++ <= 40) break;
                if (this.hitPoints < 4 && this.hitPoints > 0) {
                    this.hitPoints = 6;
                } else if (this.hitPoints < 7) {
                    this.hitPoints = 9;
                }
                this.regenTimer = 0;
                return;
            }
            case 4: {
                if (this.intersectsActor(player)) {
                    this.activated = true;
                }
                if (!this.activated || (player.stateFlags & 1) == 0) break;
                this.world.state = 19;
                return;
            }
            case 5: {
                if (this.destroyedFlag == 1) {
                    this.setFrame(1 | this.tintBits);
                    player.health = 0;
                    this.world.state = 20;
                    return;
                }
                if (this.activated) {
                    if ((player.stateFlags & 1) == 0 || player.posY <= 490000) break;
                    this.world.state = 19;
                    return;
                }
                if (this.world.scriptFlagL && this.world.reinforceBudget <= 0 && this.world.enemyAliveCount <= 0) {
                    this.activated = true;
                    return;
                }
                actionLow = this.frameIndex & 0xFFFFFF;
                tintHigh = this.frameIndex & -16777216;
                if (actionLow != 1 || !this.isAnimationDone()) break;
                this.setFrame(0 | tintHigh);
            }
        }
    }

    // 原 e.a(Graphics,II)V —— 覆写 ActorBase.paint
    public final void paint(Graphics graphics, int cameraX, int cameraY) {
        if (this.typeId == 12 && !this.world.flagE) {
            return;
        }
        super.paint(graphics, cameraX, cameraY);
    }

    // 原 e.a(l)V —— 覆写 ActorBase.onProjectileHit
    public final void onProjectileHit(ProjectileActor projectile) {
        block18: {
            switch (this.typeId) {
                case 7:
                case 9: {
                    switch (projectile.typeId) {
                        case 21: {
                            if ((projectile.frameIndex & 0xFFFFFF) != 0) break;
                            this.activated = true;
                            this.shakeTick = 0;
                            --this.hitPoints;
                            if (projectile.targetVelX > 0) {
                                projectile.posX += 8192;
                            } else if (projectile.targetVelX < 0) {
                                projectile.posX -= 8192;
                            }
                            projectile.targetVelX = 0;
                            projectile.setFrame(1);
                            break;
                        }
                        case 10: {
                            this.activated = true;
                            this.shakeTick = 0;
                            --this.hitPoints;
                            break;
                        }
                        case 15:
                        case 20: {
                            this.activated = true;
                            this.shakeTick = 0;
                            this.world.spawnProjectile(16, 0, 0, projectile.posX, projectile.posY, 2);
                            projectile.deactivate();
                            this.hitPoints -= 3;
                            GameScreen.playSound(5, 1, 220);
                        }
                    }
                    return;
                }
                case 5: {
                    switch (projectile.typeId) {
                        case 21: {
                            if ((projectile.frameIndex & 0xFFFFFF) == 0) {
                                projectile.deactivate();
                                if (--this.hitPoints <= 0) {
                                    this.destroyedFlag = 1;
                                    GameScreen.playSound(4, 1, 200);
                                    return;
                                }
                                this.setFrame(1 | this.tintBits);
                                return;
                            }
                            break block18;
                        }
                        case 15:
                        case 20: {
                            this.world.spawnProjectile(16, 0, 0, projectile.posX, projectile.posY + 8192, 2);
                            projectile.deactivate();
                            this.destroyedFlag = 1;
                            GameScreen.playSound(5, 1, 220);
                        }
                    }
                }
            }
        }
    }
}
