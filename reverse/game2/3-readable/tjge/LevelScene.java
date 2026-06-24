// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/j.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import java.io.InputStream;
import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.GameCanvas;
import tjge.TileMap;
import tjge.BossActor;
import tjge.SpriteDef;
import tjge.EnemyActor;
import tjge.PlayerActor;
import tjge.ActorBase;
import tjge.TileSheet;
import tjge.ProjectileActor;

public final class LevelScene {
    public static TileMap camera;
    public static SpriteDef[] actorDefs;
    public static boolean[] actorDefLoaded;
    public static ActorBase[][] actorPool;
    public static ActorBase[] activeActors;
    private static byte[] cellSpawnBuffer;
    public static ActorBase[] drawList;
    public static int drawCount;
    public static final int[] actorDrawLayer;
    private static int[] triggerParams;
    private static byte[] spawnBytes;
    public static int[] cutsceneState;
    public static int[] dialogState;
    public static int[] formationState;
    public byte[][] triggerTable;
    public byte[][] actorInstanceTable;
    public boolean[] triggerHitFlags;
    public boolean[] triggerFiredFlags;
    private int cellWidth;
    private int cellHeight;
    public byte[][] cellTriggers;
    public byte[][] cellActors;
    private int cellCount;
    public int currentCell;
    private int globalActorCount;
    public int residentActorSlots;
    public byte[] globalActors;
    public int mapWidth;
    public int mapHeight;
    public int subState;
    public int prevSubState;
    public int transitionMaskHeight;
    public static int currentLevel;
    private int verticalScrollY;
    public int cameraTargetCacheX;
    public int cameraTargetCacheY;
    public int waveSpawnCount;
    public int reservedD;
    public int cameraTargetX;
    public int cameraTargetY;
    public int diagonalFormationToggle;
    boolean dialogAdvancePressed;
    boolean dialogPagePressed;
    boolean isVerticalScrollLevel;
    private BossActor dialogActor;
    static TileSheet hudFont;
    GameCanvas canvas;
    static int cutsceneStep;
    static int cutsceneSubStep;
    public static final int[][] resourceLoadTable;

    private LevelScene() {
    }

    public final void buildDrawList() {
        int n;
        drawCount = 0;
        if (this.cellTriggers[this.currentCell] != null) {
            n = 0;
            while (n < this.cellTriggers[this.currentCell].length) {
                this.runTrigger(this.cellTriggers[this.currentCell][n]);
                ++n;
            }
        }
        n = 0;
        while (n < this.residentActorSlots) {
            if (activeActors[n] != null && LevelScene.activeActors[n].alive) {
                LevelScene.drawList[LevelScene.drawCount++] = activeActors[n];
            }
            ++n;
        }
        n = this.residentActorSlots;
        while (n < activeActors.length) {
            if (activeActors[n] != null && LevelScene.activeActors[n].alive) {
                LevelScene.drawList[LevelScene.drawCount++] = activeActors[n];
            }
            ++n;
        }
        n = 0;
        while (n < drawCount) {
            drawList[n].step();
            ++n;
        }
        n = 0;
        while (n < drawCount) {
            drawList[n].update();
            ++n;
        }
    }

    public final void updateCameraTarget(boolean followPlayer) {
        PlayerActor player = this.canvas.player;
        if (followPlayer) {
            this.cameraTargetX = player.actionHighByte == 0 ? player.posX - this.canvas.viewportWidth * 1 / 4 : player.posX - this.canvas.viewportWidth * 3 / 4;
            int targetY = player.posY - this.canvas.viewportHeight * 7 / 10;
            if (player.targetVelY == 0 || (player.reserved & 2) != 0 || player.targetVelY > 0 && targetY > this.canvas.cameraY || player.targetVelY < 0 && this.canvas.cameraY - targetY > this.canvas.viewportHeight * 2 / 5) {
                this.cameraTargetY = targetY;
                return;
            }
        } else {
            this.cameraTargetX = this.cameraTargetCacheX;
            this.cameraTargetY = this.cameraTargetCacheY;
        }
    }

    public final void tick() {
        this.cameraTargetX = this.canvas.cameraX;
        this.cameraTargetY = this.canvas.cameraY;
        this.buildDrawList();
        switch (this.subState) {
            case 0: {
                this.updateCameraTarget(true);
                break;
            }
            case 5: {
                this.updateCameraTarget(false);
                if (this.canvas.cameraX != this.cameraTargetX || this.canvas.cameraY != this.cameraTargetY) break;
                if (triggerParams[0] > 0 && activeActors[triggerParams[0]] == null) {
                    this.subState = this.prevSubState;
                    break;
                }
                if (triggerParams[6] <= 0 || this.waveSpawnCount > 0) break;
                if (triggerParams[5] > 0) {
                    this.spawnWave();
                    break;
                }
                this.subState = this.prevSubState;
                break;
            }
            case 6: {
                boolean cameraReached = false;
                if (cutsceneState[2] == 0) {
                    this.updateCameraTarget(true);
                    cameraReached = true;
                } else {
                    this.updateCameraTarget(false);
                    if (this.canvas.cameraX == this.cameraTargetX && this.canvas.cameraY == this.cameraTargetY) {
                        cameraReached = true;
                    }
                }
                if (!cameraReached || !this.canvas.player.isDead()) break;
                this.subState = 1;
                break;
            }
            case 1: {
                this.updateCameraTarget(cutsceneState[2] == 0);
                this.runCutscene();
                break;
            }
            case 4: {
                this.runDialogChoice();
                break;
            }
            case 2: {
                if ((this.transitionMaskHeight += 3) < 15) break;
                this.canvas.player.setTilePosition(triggerParams[0], triggerParams[1]);
                this.updateCameraTarget(true);
                this.canvas.cameraX = this.cameraTargetX;
                this.canvas.cameraY = this.cameraTargetY;
                this.subState = 3;
                break;
            }
            case 3: {
                if ((this.transitionMaskHeight -= 3) >= 1) break;
                this.subState = this.prevSubState;
            }
        }
        int camTileX = 0;
        int camTileY = 0;
        if (this.isVerticalScrollLevel && (this.canvas.player.reserved & 4) != 0) {
            camTileX = this.verticalScrollY;
            camTileY = this.canvas.cameraY >> 10;
            this.verticalScrollY += 8;
        } else {
            this.canvas.followCamera(this.cameraTargetX, this.cameraTargetY);
            camTileX = this.canvas.cameraX >> 10;
            camTileY = this.canvas.cameraY >> 10;
            this.switchCell(camTileX, camTileY);
        }
        camera.setCameraPosition(camTileX, camTileY);
    }

    public final void render(Graphics graphics) {
        camera.render(graphics);
        graphics.setClip(0, 0, 176, 204);
        int i = 0;
        int j = 0;
        int minIndex = 0;
        i = 0;
        while (i < drawCount - 1) {
            minIndex = i;
            j = i + 1;
            while (j < drawCount) {
                if (LevelScene.drawList[j].layer < LevelScene.drawList[minIndex].layer) {
                    minIndex = j;
                }
                ++j;
            }
            if (i != minIndex) {
                ActorBase swap = drawList[i];
                LevelScene.drawList[i] = drawList[minIndex];
                LevelScene.drawList[minIndex] = swap;
            }
            ++i;
        }
        graphics.setClip(0, 0, 176, 204);
        int camTileX = this.canvas.cameraX >> 10;
        int camTileY = this.canvas.cameraY >> 10;
        i = 0;
        while (i < drawCount) {
            drawList[i].paint(graphics, camTileX, camTileY);
            ++i;
        }
        switch (this.subState) {
            case 2:
            case 3: {
                LevelScene.fillBlackBand(graphics, this.transitionMaskHeight, 0, 172);
            }
            case 0:
            case 1:
            case 5: {
                this.renderHud(graphics);
                return;
            }
            case 4: {
                this.renderDialogBar(graphics);
            }
        }
    }

    private void runCutscene() {
        PlayerActor player = this.canvas.player;
        switch (cutsceneState[0]) {
            case 0: {
                if (cutsceneState[1] == 0) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        PlayerActor.throwCooldownQueue[0][0] = 2;
                        PlayerActor.throwCooldownQueue[0][1] = 13;
                        PlayerActor.throwCooldownQueue[0][2] = 0;
                        PlayerActor.throwCooldownQueue[1][0] = 16;
                        PlayerActor.throwCooldownQueue[1][1] = 1;
                        PlayerActor.throwCooldownQueue[1][2] = 2;
                        return;
                    }
                    if (cutsceneStep == 1) {
                        if (player.stepThrowQueue() == 1) {
                            player.advanceEffectFrame();
                            player.targetVelY = 8192;
                            ++cutsceneStep;
                        }
                        player.targetVelX = 10240;
                        return;
                    }
                    if (cutsceneStep != 2 || player.frameGroupIndex != 0) break;
                    this.canvas.enterBriefing();
                    return;
                }
                if (cutsceneState[1] != 9) break;
                if (cutsceneStep == 0) {
                    ++cutsceneStep;
                    player.setAction(0x1E | player.actionHighByte);
                    return;
                }
                if (player.frameGroupIndex != 0) break;
                player.setAction(33);
                this.canvas.showResult(true);
                return;
            }
            case 1: {
                if (cutsceneState[1] == 0) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        player.setAction(0x1E | player.actionHighByte);
                        return;
                    }
                    if (player.frameGroupIndex != 0 || cutsceneStep++ <= 4) break;
                    this.canvas.enterBriefing();
                    return;
                }
                if (cutsceneState[1] == 1) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        player.setAction(0x1E | player.actionHighByte);
                        return;
                    }
                    if (player.frameGroupIndex != 0 || cutsceneStep++ <= 4) break;
                    this.setSubState(4);
                    return;
                }
                if (cutsceneState[1] == 2) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        PlayerActor.throwCooldownQueue[0][0] = 1;
                        PlayerActor.throwCooldownQueue[0][1] = 50;
                        PlayerActor.throwCooldownQueue[0][2] = 0;
                        LevelScene.cutsceneState[2] = 1;
                        this.cameraTargetCacheX = this.cameraTargetX;
                        this.cameraTargetCacheY = this.cameraTargetY;
                        return;
                    }
                    player.stepThrowQueue();
                    if (player.posX >= this.canvas.cameraX - 20480) break;
                    this.canvas.showResult(true);
                    return;
                }
                if (cutsceneState[1] != 9) break;
                if (cutsceneStep == 0) {
                    ++cutsceneStep;
                    PlayerActor.throwCooldownQueue[0][0] = 2048;
                    PlayerActor.throwCooldownQueue[0][1] = 1;
                    PlayerActor.throwCooldownQueue[0][2] = 6;
                    PlayerActor.throwCooldownQueue[1][0] = 2;
                    cutsceneState[4] = cutsceneState[4] << 14;
                    PlayerActor.throwCooldownQueue[1][1] = (cutsceneState[4] - player.posX + 129024) / 8192;
                    PlayerActor.throwCooldownQueue[1][2] = 2;
                    PlayerActor.throwCooldownQueue[2][0] = 16;
                    PlayerActor.throwCooldownQueue[2][1] = 1;
                    PlayerActor.throwCooldownQueue[2][2] = 2;
                    PlayerActor.throwCooldownQueue[3][0] = 8;
                    PlayerActor.throwCooldownQueue[3][1] = 2;
                    PlayerActor.throwCooldownQueue[3][2] = 0;
                    player.currentWeaponIndex = 1;
                    if (PlayerActor.ammoCurrent[player.currentWeaponIndex] == PlayerActor.ammoInitTable[player.currentWeaponIndex]) {
                        return;
                    }
                    if (PlayerActor.ammoReserve[player.currentWeaponIndex] > 0) break;
                    PlayerActor.ammoReserve[player.currentWeaponIndex] = 1;
                    return;
                }
                if (cutsceneStep == 1) {
                    if (player.stepThrowQueue() != 3) break;
                    ++cutsceneStep;
                    return;
                }
                if (cutsceneStep == 3) {
                    if (player.stepThrowQueue() != 0) break;
                    ++cutsceneStep;
                    return;
                }
                if (player.frameGroupIndex != 0) break;
                if (cutsceneStep == 4) {
                    LevelScene.dialogState[0] = 0;
                    LevelScene.dialogState[1] = 0;
                    LevelScene.dialogState[2] = 1;
                    this.setSubState(4);
                    return;
                }
                if (cutsceneStep != 2) break;
                PlayerActor.throwCooldownQueue[0][0] = 2;
                PlayerActor.throwCooldownQueue[0][1] = 4;
                PlayerActor.throwCooldownQueue[0][2] = 2;
                ++cutsceneStep;
                return;
            }
            case 2: {
                if (cutsceneState[1] == 0) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        player.setAction(0x1E | player.actionHighByte);
                        return;
                    }
                    if (player.frameGroupIndex != 0 || cutsceneStep++ <= 4) break;
                    this.canvas.enterBriefing();
                    return;
                }
                if (cutsceneState[1] != 9) break;
                if (++cutsceneStep == 10) {
                    player.setAction(0x1E | player.actionHighByte);
                    return;
                }
                if (player.frameGroupIndex != 0) break;
                this.canvas.showResult(true);
                return;
            }
            case 3: {
                if (cutsceneState[1] == 0) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        player.setAction(0x1E | player.actionHighByte);
                        return;
                    }
                    if (player.frameGroupIndex != 0 || cutsceneStep++ <= 4) break;
                    LevelScene.dialogState[0] = 0;
                    LevelScene.dialogState[1] = 1;
                    LevelScene.dialogState[2] = 0;
                    this.setSubState(4);
                    return;
                }
                if (cutsceneState[1] == 1) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        PlayerActor.throwCooldownQueue[0][0] = 2;
                        PlayerActor.throwCooldownQueue[0][1] = 50;
                        PlayerActor.throwCooldownQueue[0][2] = 0;
                        LevelScene.cutsceneState[2] = 1;
                        return;
                    }
                    player.stepThrowQueue();
                    if (player.posX <= this.canvas.cameraX + this.canvas.viewportWidth + 20480) break;
                    player.targetVelX = 0;
                    player.setAction(0 | player.actionHighByte);
                    this.setSubState(4);
                    return;
                }
                if (cutsceneState[1] != 9) break;
                if (cutsceneStep == 0) {
                    ++cutsceneStep;
                    player.setAction(0x1E | player.actionHighByte);
                    return;
                }
                if (player.frameGroupIndex != 0 || cutsceneStep++ <= 5) break;
                this.canvas.showResult(true);
                return;
            }
            case 4: {
                if (cutsceneState[1] == 0) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        player.setAction(0x1E | player.actionHighByte);
                        return;
                    }
                    if (player.frameGroupIndex != 0 || cutsceneStep++ <= 4) break;
                    LevelScene.dialogState[0] = 0;
                    LevelScene.dialogState[1] = 0;
                    LevelScene.dialogState[2] = 1;
                    this.setSubState(4);
                    return;
                }
                if (cutsceneState[1] == 1) {
                    if (cutsceneStep++ == 0) {
                        player.setAction(0);
                        return;
                    }
                    if (cutsceneStep <= 4) break;
                    this.canvas.enterBriefing();
                    return;
                }
                if (cutsceneState[1] != 9) break;
                if (cutsceneStep == 0) {
                    ++cutsceneStep;
                    player.setAction(0x1E | player.actionHighByte);
                    return;
                }
                if (player.frameGroupIndex != 0 || cutsceneStep++ <= 5) break;
                this.canvas.showResult(true);
                return;
            }
            case 5: {
                if (cutsceneState[1] == 0) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        player.setAction(0x1E | player.actionHighByte);
                        return;
                    }
                    if (player.frameGroupIndex != 0 || cutsceneStep++ <= 4) break;
                    LevelScene.dialogState[0] = 0;
                    LevelScene.dialogState[1] = 0;
                    LevelScene.dialogState[2] = 1;
                    this.setSubState(4);
                    return;
                }
                if (cutsceneState[1] == 1) {
                    if (cutsceneStep++ == 0) {
                        player.setAction(0 | Integer.MIN_VALUE);
                        return;
                    }
                    if (cutsceneStep <= 4) break;
                    this.canvas.enterBriefing();
                    return;
                }
                if (cutsceneState[1] == 2) {
                    if (cutsceneStep == 0) {
                        this.dialogActor = (BossActor)this.spawnActor(19, -1);
                        this.dialogActor.resetBoss();
                    } else if (cutsceneStep < 22) {
                        this.dialogActor.posY += 4096;
                    } else if (cutsceneStep == 22) {
                        LevelScene.dialogState[1] = 2;
                        LevelScene.dialogState[2] = 0;
                        this.setSubState(4);
                    }
                    ++cutsceneStep;
                    return;
                }
                if (cutsceneState[1] == 3) {
                    this.cameraTargetCacheX = this.canvas.cameraX;
                    this.cameraTargetCacheY = this.canvas.cameraY;
                    LevelScene.triggerParams[0] = this.dialogActor.slotIndex;
                    LevelScene.triggerParams[1] = 0;
                    LevelScene.triggerParams[2] = 38;
                    LevelScene.triggerParams[3] = 0;
                    LevelScene.triggerParams[4] = 2;
                    LevelScene.triggerParams[5] = 100;
                    LevelScene.triggerParams[6] = 0;
                    this.setSubState(5);
                    this.dialogActor.dormant = false;
                    return;
                }
                if (cutsceneState[1] == 4) {
                    switch (cutsceneStep) {
                        case 0: {
                            int offsetX;
                            int offsetY;
                            this.cameraTargetCacheX = this.dialogActor.posX - this.canvas.viewportWidth / 3;
                            this.cameraTargetCacheY = this.dialogActor.posY - this.canvas.viewportHeight / 4;
                            if (this.canvas.globalFrame % 2 == 0) {
                                offsetY = 5 + GameMIDlet.randomBelow(3) << 13;
                                offsetX = GameMIDlet.randomBelow(3) << 13;
                                ProjectileActor.spawnProjectile(12, 0, this.dialogActor.posX - offsetY, this.dialogActor.posY - offsetX, 0, null);
                            }
                            if (cutsceneSubStep == 0) {
                                cutsceneSubStep = 1;
                                offsetY = 0x130000 - this.dialogActor.posX;
                                offsetX = 616448 - this.dialogActor.posY;
                                this.dialogActor.targetVelX = offsetY / 20;
                                this.dialogActor.targetVelY = offsetX / 20;
                                break;
                            }
                            if (this.dialogActor.posY <= 616448) break;
                            this.dialogActor.targetVelX = 0;
                            this.dialogActor.targetVelY = 0;
                            this.dialogActor.setAction(-2147483647);
                            cutsceneStep = 1;
                            break;
                        }
                        case 1: {
                            this.dialogActor.posY = this.dialogActor.posY + (cutsceneSubStep % 1 == 1 ? -2048 : 2048);
                            if (cutsceneSubStep++ <= 5) break;
                            cutsceneStep = 2;
                            this.dialogActor.targetVelX = 10240;
                            break;
                        }
                        case 2: {
                            if (this.dialogActor.posX <= this.canvas.cameraX + this.canvas.viewportWidth + 61440) break;
                            this.dialogActor.targetVelX = 0;
                            this.cameraTargetCacheX = player.posX - this.canvas.viewportWidth / 2;
                            LevelScene.cutsceneState[1] = 5;
                            LevelScene.cutsceneState[2] = 1;
                            this.setSubState(1);
                        }
                    }
                    return;
                }
                if (cutsceneState[1] != 5) break;
                if (cutsceneStep == 0) {
                    if (this.canvas.cameraX != this.cameraTargetCacheX) break;
                    ++cutsceneStep;
                    player.setAction(0);
                    PlayerActor.throwCooldownQueue[0][0] = 2;
                    PlayerActor.throwCooldownQueue[0][1] = (0x109000 - player.posX) / 8192;
                    PlayerActor.throwCooldownQueue[0][2] = 0;
                    PlayerActor.throwCooldownQueue[1][0] = 128;
                    PlayerActor.throwCooldownQueue[1][1] = 2;
                    PlayerActor.throwCooldownQueue[1][2] = 0;
                    PlayerActor.throwCooldownQueue[2][0] = 2;
                    PlayerActor.throwCooldownQueue[2][1] = 50;
                    PlayerActor.throwCooldownQueue[2][2] = 0;
                    LevelScene.cutsceneState[2] = 0;
                    return;
                }
                if (cutsceneStep == 1) {
                    int throwResult = player.stepThrowQueue();
                    if (throwResult == 0) {
                        this.cameraTargetCacheX = this.canvas.cameraX;
                        LevelScene.cutsceneState[2] = 1;
                        return;
                    }
                    if (throwResult != 1) break;
                    player.spawnEntryEffect();
                    ++cutsceneStep;
                    return;
                }
                if (cutsceneStep != 2) break;
                player.stepThrowQueue();
                if (player.posX <= this.canvas.cameraX + this.canvas.viewportWidth + 51200) break;
                this.canvas.showResult(true);
                return;
            }
            case 6: {
                if (cutsceneState[1] == 0) {
                    if (cutsceneStep == 0) {
                        ++cutsceneStep;
                        PlayerActor.throwCooldownQueue[0][0] = 2;
                        PlayerActor.throwCooldownQueue[0][1] = 10;
                        PlayerActor.throwCooldownQueue[0][2] = 0;
                        return;
                    }
                    if (cutsceneStep != 1) break;
                    if (player.stepThrowQueue() == 0) {
                        player.targetVelX = 0;
                        LevelScene.dialogState[0] = 0;
                        LevelScene.dialogState[1] = 0;
                        LevelScene.dialogState[2] = 2;
                        this.setSubState(4);
                        return;
                    }
                    player.targetVelX = 10240;
                    return;
                }
                if (cutsceneState[1] == 1) {
                    if (!player.publicFlagA) break;
                    this.dialogActor.despawn();
                    this.dialogActor = null;
                    LevelScene.dialogState[1] = 0;
                    LevelScene.dialogState[2] = 3;
                    this.setSubState(4);
                    return;
                }
                if (cutsceneState[1] != 2) break;
                if (cutsceneStep == 0) {
                    player.targetVelX = 0;
                    player.targetVelY = 12288;
                    player.publicFlagB = true;
                    ++cutsceneStep;
                    return;
                }
                if (cutsceneStep == 2) {
                    if (player.publicFlagC) {
                        ++cutsceneStep;
                    } else {
                        LevelScene.dialogState[1] = 3;
                        LevelScene.dialogState[2] = 0;
                        this.setSubState(4);
                    }
                    player.companionEffect.despawn();
                    player.despawn();
                    return;
                }
                if (cutsceneStep == 3) {
                    this.canvas.showResult(false);
                    return;
                }
                if (player.posY <= 132 << 10) break;
                int spawnIndex = 0;
                while (spawnIndex < 8) {
                    ActorBase debris = this.spawnActor(20, -1);
                    if (debris != null) {
                        debris.posX = player.posX + (player.boxLeft << 10) + spawnIndex % 4 * 14336 + spawnIndex / 4 * 8192;
                        debris.posY = player.posY + 14336 + spawnIndex / 4 * 8192;
                        debris.setAction(0);
                    }
                    ++spawnIndex;
                }
                ++cutsceneStep;
            }
        }
    }

    private void runDialogChoice() {
        block22: {
            block21: {
                boolean atResultScreen = this.canvas.inputAction == 16;
                if (atResultScreen) break block21;
                int timer = GameCanvas.briefingLineState[3];
                GameCanvas.briefingLineState[3] = timer - 1;
                if (timer >= 0) break block22;
            }
            if (this.dialogAdvancePressed) {
                switch (cutsceneState[0]) {
                    case 1: {
                        LevelScene.cutsceneState[1] = 2;
                        this.setSubState(1);
                        break;
                    }
                    case 3: {
                        this.canvas.enterBriefing();
                        break;
                    }
                    case 4: {
                        LevelScene.cutsceneState[1] = 1;
                        this.setSubState(1);
                        break;
                    }
                    case 5: {
                        LevelScene.cutsceneState[1] = 3;
                        this.setSubState(1);
                        break;
                    }
                    case 6: {
                        this.canvas.showResult(true);
                    }
                }
            } else if (this.dialogPagePressed) {
                GameCanvas.briefingLineState[0] = GameCanvas.briefingLineState[0] + 1;
                GameCanvas.briefingLineState[1] = 0;
                GameCanvas.briefingLineState[3] = 60;
                int prevLine1 = dialogState[1];
                LevelScene.dialogState[1] = dialogState[2];
                LevelScene.dialogState[2] = prevLine1;
                dialogState[0] = dialogState[0] + 1;
                switch (cutsceneState[0]) {
                    case 1: {
                        if (dialogState[0] != 6) break;
                        LevelScene.cutsceneState[1] = 1;
                        this.setSubState(1);
                        break;
                    }
                    case 3: {
                        if (dialogState[0] != 4) break;
                        LevelScene.cutsceneState[1] = 1;
                        this.setSubState(1);
                        break;
                    }
                    case 5: {
                        if (dialogState[0] != 2) break;
                        LevelScene.cutsceneState[1] = 1;
                        this.setSubState(1);
                        break;
                    }
                    case 6: {
                        if (dialogState[0] == 2) {
                            this.dialogActor = BossActor.instance;
                            this.dialogActor.dormant = false;
                            this.canvas.enterBriefing();
                            break;
                        }
                        if (dialogState[0] != 6) break;
                        LevelScene.cutsceneState[1] = 2;
                        this.setSubState(1);
                    }
                }
            } else {
                GameCanvas.briefingLineState[1] = GameCanvas.briefingLineState[1] + GameCanvas.briefingLineState[2];
                GameCanvas.briefingLineState[3] = 60;
            }
        }
        this.dialogAdvancePressed = false;
        this.dialogPagePressed = false;
    }

    private void renderDialogBar(Graphics graphics) {
        int[] numberX = new int[]{14, 134, 134, 134};
        int[] numberY = new int[]{36, 14, 14, 14};
        int[] iconCell = new int[]{14, 15, 16, 17};
        graphics.setColor(17408);
        graphics.setClip(0, 172, 176, 32);
        graphics.fillRect(0, 172, 176, 32);
        hudFont.drawCell(graphics, 0, 172, 30, 0, 0);
        hudFont.drawCell(graphics, 159, 172, 31, 0, 0);
        hudFont.drawCell(graphics, 12, 172, 32, 0, 0);
        hudFont.drawCell(graphics, 12, 202, 33, 0, 0);
        hudFont.drawCell(graphics, numberX[dialogState[1]], 170, iconCell[dialogState[1]], 0, 0);
        graphics.setColor(65280);
        graphics.setClip(0, 172, 176, 32);
        this.dialogAdvancePressed = this.canvas.selectParagraph(GameCanvas.briefingLineState[0]);
        this.dialogPagePressed = this.canvas.drawTypesetText(graphics, GameCanvas.briefingLineState[1], GameCanvas.briefingLineState[2], numberY[dialogState[1]], 178, 90, 19);
        this.canvas.inputAction = 0;
    }

    public final void setSubState(int newState) {
        switch (newState) {
            case 2: {
                this.transitionMaskHeight = 0;
                break;
            }
            case 4: {
                this.dialogAdvancePressed = false;
                this.dialogPagePressed = false;
                this.canvas.inputAction = 0;
                GameCanvas.briefingLineState[0] = dialogState[0];
                GameCanvas.briefingLineState[1] = 0;
                GameCanvas.briefingLineState[2] = 1;
                GameCanvas.briefingLineState[3] = 60;
            }
        }
        this.prevSubState = this.subState;
        this.subState = newState;
        cutsceneStep = 0;
        cutsceneSubStep = 0;
    }

    public final void renderHud(Graphics graphics) {
        PlayerActor player = this.canvas.player;
        hudFont.drawCell(graphics, 0, 172, 0, 0, 0);
        hudFont.drawCell(graphics, 12, 164, 14, 0, 0);
        int health = Math.max(0, player.health);
        int i = 0;
        while (i < health) {
            hudFont.drawCell(graphics, 14 + i * 4, 199 - LevelScene.hudFont.cellHeight[18 + i], 18 + i, 0, 0);
            ++i;
        }
        i = 0;
        while (i < PlayerActor.ammoCurrent[2]) {
            hudFont.drawCell(graphics, 127 + i * 9, 181, 12, 0, 0);
            ++i;
        }
        LevelScene.drawNumber(graphics, 84, 179, PlayerActor.ammoCurrent[0 + player.currentWeaponIndex], false, true);
        hudFont.drawCell(graphics, 86, 179, 11, 0, 0);
        LevelScene.drawNumber(graphics, 112, 179, PlayerActor.ammoReserve[0 + player.currentWeaponIndex], false, true);
        if (this.canvas.globalFrame % 4 > 1) {
            graphics.setColor(65280);
            graphics.setClip(0, 0, 176, 204);
            graphics.drawRect(65 + player.currentWeaponIndex * 27, 192, 23, 8);
            hudFont.drawCell(graphics, 0, 195, 13, 0, 0);
        }
    }

    public static final void fillBlackBand(Graphics graphics, int height, int y, int bandHeight) {
        graphics.setColor(0);
        graphics.setClip(0, y, 176, bandHeight);
        graphics.fillRect(0, y, 176, bandHeight);
    }

    public static final int drawNumber(Graphics graphics, int x, int y, int value, boolean withPrefix, boolean zeroPad) {
        int digit = 0;
        boolean unused = false;
        value = Math.max(0, value);
        int digitIndex = 0;
        while (digitIndex < 5) {
            digit = value % 10;
            hudFont.drawCell(graphics, x -= 8, y, 1 + digit, 0, 0);
            if ((value /= 10) == 0) {
                if (digitIndex != 0 || !zeroPad) break;
                hudFont.drawCell(graphics, x -= 8, y, 1, 0, 0);
                break;
            }
            ++digitIndex;
        }
        if (withPrefix) {
            hudFont.drawCell(graphics, x - 8, y, 38, 0, 0);
        }
        graphics.setClip(0, 0, 176, 208);
        return x;
    }

    public final void loadCell(int pixelX, int pixelY) {
        this.waveSpawnCount = 0;
        this.reservedD = 0;
        this.subState = 0;
        int cellIndex = pixelY / this.cellHeight * (camera.getMapWidth() / this.cellWidth) + pixelX / this.cellWidth;
        int i = 0;
        while (i < this.triggerHitFlags.length) {
            this.triggerHitFlags[i] = false;
            ++i;
        }
        i = 0;
        while (i < this.triggerFiredFlags.length) {
            this.triggerFiredFlags[i] = false;
            ++i;
        }
        i = 0;
        while (i < activeActors.length) {
            LevelScene.activeActors[i] = null;
            ++i;
        }
        i = 0;
        while (i < actorPool.length) {
            if (actorPool[i] != null) {
                int j = 0;
                while (j < actorPool[i].length) {
                    LevelScene.actorPool[i][j].alive = false;
                    ++j;
                }
            }
            ++i;
        }
        i = 0;
        while (i < this.globalActors.length) {
            this.spawnActor(-1, this.globalActors[i]);
            ++i;
        }
        i = 0;
        while (this.cellActors[cellIndex] != null && i < this.cellActors[cellIndex].length) {
            this.spawnActor(-1, this.cellActors[cellIndex][i]);
            ++i;
        }
        this.currentCell = cellIndex;
        camera.resetDrawnBounds();
        camera.setCameraPosition(pixelX, pixelY);
        this.verticalScrollY = 0;
        LevelScene.formationState[0] = -1;
        this.isVerticalScrollLevel = this.canvas.levelIndex == 6;
    }

    public final void runTrigger(int triggerIndex) {
        int height;
        int width;
        int top;
        if (this.triggerFiredFlags[triggerIndex]) {
            return;
        }
        int left = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 10, 2);
        if (this.canvas.player.intersectsRect(left, top = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 12, 2), width = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 14, 2), height = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 16, 2))) {
            this.fireTrigger(triggerIndex, true);
            return;
        }
        this.fireTrigger(triggerIndex, false);
    }

    public final void switchCell(int pixelX, int pixelY) {
        byte oldId;
        int cellIndex = pixelY / this.cellHeight * (camera.getMapWidth() / this.cellWidth) + pixelX / this.cellWidth;
        if (cellIndex == this.currentCell) {
            return;
        }
        int oldPos = 0;
        int newPos = 0;
        byte spawnCount = 0;
        while (this.cellActors[this.currentCell] != null && this.cellActors[cellIndex] != null && oldPos < this.cellActors[this.currentCell].length && newPos < this.cellActors[cellIndex].length) {
            oldId = this.cellActors[this.currentCell][oldPos];
            byte newId = this.cellActors[cellIndex][newPos];
            if (oldId < newId) {
                if (activeActors[oldId] != null) {
                    if (LevelScene.activeActors[oldId].typeId >= 1 && LevelScene.activeActors[oldId].typeId <= 5) {
                        if (Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].posX - this.canvas.player.posX) >= 180224 || Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].posY - this.canvas.player.posY) >= 180224) {
                            activeActors[oldId].despawn();
                            LevelScene.activeActors[oldId] = null;
                        }
                    } else {
                        activeActors[oldId].despawn();
                        LevelScene.activeActors[oldId] = null;
                    }
                }
                ++oldPos;
                continue;
            }
            if (oldId > newId) {
                LevelScene.cellSpawnBuffer[spawnCount++] = this.cellActors[cellIndex][newPos++];
                continue;
            }
            ++oldPos;
            ++newPos;
            if (activeActors[oldId] == null || LevelScene.activeActors[oldId].alive) continue;
            if (LevelScene.activeActors[oldId].typeId >= 1 && LevelScene.activeActors[oldId].typeId <= 5) {
                if (Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].posX - this.canvas.player.posX) < 180224 && Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].posY - this.canvas.player.posY) < 180224) continue;
                LevelScene.activeActors[oldId] = null;
                continue;
            }
            LevelScene.activeActors[oldId] = null;
        }
        while (this.cellActors[this.currentCell] != null && oldPos < this.cellActors[this.currentCell].length) {
            if (activeActors[this.cellActors[this.currentCell][oldPos]] != null) {
                if (LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].typeId >= 1 && LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].typeId <= 5) {
                    if (Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].posX - this.canvas.player.posX) >= 180224 || Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]].posY - this.canvas.player.posY) >= 180224) {
                        activeActors[this.cellActors[this.currentCell][oldPos]].despawn();
                        LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]] = null;
                    }
                } else {
                    activeActors[this.cellActors[this.currentCell][oldPos]].despawn();
                    LevelScene.activeActors[this.cellActors[this.currentCell][oldPos]] = null;
                }
            }
            ++oldPos;
        }
        while (this.cellActors[cellIndex] != null && newPos < this.cellActors[cellIndex].length) {
            if (this.cellActors[cellIndex][newPos] != 0) {
                LevelScene.cellSpawnBuffer[spawnCount++] = this.cellActors[cellIndex][newPos];
            }
            ++newPos;
        }
        oldId = 0;
        while (oldId < spawnCount) {
            if (activeActors[cellSpawnBuffer[oldId]] == null) {
                this.spawnActor(-1, cellSpawnBuffer[oldId]);
            }
            ++oldId;
        }
        this.currentCell = cellIndex;
    }

    public final ActorBase spawnActor(int typeId, int instanceIndex) {
        if (typeId < 0) {
            typeId = this.actorInstanceTable[instanceIndex][0];
        }
        int slot = 0;
        while (slot < actorPool[typeId].length) {
            ActorBase actor = actorPool[typeId][slot];
            if (!actor.alive) {
                if (instanceIndex >= 0) {
                    actor.slotIndex = instanceIndex;
                    if (!actor.spawnFromBytes(this.actorInstanceTable[instanceIndex])) {
                        return null;
                    }
                    actor.alive = true;
                    LevelScene.activeActors[instanceIndex] = actor;
                    return actor;
                }
                int dynamicSlot = this.residentActorSlots;
                while (dynamicSlot < activeActors.length) {
                    if (activeActors[dynamicSlot] == null) {
                        actor.slotIndex = dynamicSlot;
                        actor.alive = true;
                        LevelScene.activeActors[dynamicSlot] = actor;
                        actor.layer = actorDrawLayer[typeId];
                        return actor;
                    }
                    ++dynamicSlot;
                }
            }
            ++slot;
        }
        return null;
    }

    public final void fireTrigger(int triggerIndex, boolean entering) {
        int subType = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 0, 1);
        if (entering) {
            switch (subType) {
                case 0: {
                    LevelScene.triggerParams[0] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 18, 1);
                    LevelScene.triggerParams[1] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 19, 1);
                    if (triggerParams[0] < 0) {
                        triggerParams[0] = triggerParams[0] + 256;
                    }
                    if (triggerParams[1] < 0) {
                        triggerParams[1] = triggerParams[1] + 256;
                    }
                    this.canvas.player.triggerSwitch(true);
                    break;
                }
                case 1: {
                    this.triggerFiredFlags[triggerIndex] = true;
                    this.cameraTargetCacheX = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 18, 1);
                    this.cameraTargetCacheY = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 19, 1);
                    if (this.cameraTargetCacheX < 0) {
                        this.cameraTargetCacheX += 256;
                    }
                    if (this.cameraTargetCacheY < 0) {
                        this.cameraTargetCacheY += 256;
                    }
                    this.cameraTargetCacheX <<= 14;
                    this.cameraTargetCacheY <<= 14;
                    LevelScene.triggerParams[0] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 20, 1);
                    LevelScene.triggerParams[1] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 21, 1);
                    LevelScene.triggerParams[2] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 22, 1);
                    LevelScene.triggerParams[3] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 23, 1);
                    LevelScene.triggerParams[4] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 24, 1);
                    LevelScene.triggerParams[5] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 25, 1);
                    LevelScene.triggerParams[6] = triggerParams[5];
                    this.setSubState(5);
                    break;
                }
                case 2: {
                    if (this.canvas.levelIndex == 5 && (this.canvas.player.reserved & 1) == 0) {
                        return;
                    }
                    LevelScene.cutsceneState[3] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 19, 1);
                    if (cutsceneState[3] > 0 && activeActors[cutsceneState[3]] != null) {
                        LevelScene.cutsceneState[4] = LevelScene.activeActors[LevelScene.cutsceneState[3]].posX >> 14;
                        if (activeActors[cutsceneState[3]].isAlive()) {
                            return;
                        }
                    }
                    this.triggerFiredFlags[triggerIndex] = true;
                    LevelScene.cutsceneState[0] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 18, 1);
                    LevelScene.cutsceneState[2] = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 20, 1);
                    this.cameraTargetCacheX = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 14, 2);
                    this.cameraTargetCacheX <<= 10;
                    this.cameraTargetCacheX -= this.canvas.viewportWidth;
                    if (this.cameraTargetCacheX < 0) {
                        this.cameraTargetCacheX = 0;
                    }
                    this.cameraTargetCacheY = this.canvas.cameraY;
                    LevelScene.cutsceneState[1] = cutsceneState[0] % 10;
                    cutsceneState[0] = cutsceneState[0] / 10;
                    this.setSubState(6);
                    break;
                }
                case 3: {
                    if (formationState[0] != -1) {
                        return;
                    }
                    int spawnX = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 18, 1);
                    int spawnY = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 19, 1);
                    spawnX <<= 14;
                    spawnY <<= 14;
                    int count = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 20, 1);
                    LevelScene.formationState[0] = triggerIndex;
                    int memberIndex = 0;
                    while (memberIndex < count) {
                        ActorBase member = this.spawnActor(22, -1);
                        if (member != null) {
                            member.posX = spawnX + memberIndex * 16384;
                            member.posY = spawnY;
                            member.setAction(GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 21 + memberIndex, 1));
                            LevelScene.formationState[memberIndex + 1] = member.slotIndex;
                        }
                        ++memberIndex;
                    }
                    break;
                }
            }
            return;
        }
        if (subType == 3 && triggerIndex == formationState[0]) {
            int count = GameMIDlet.readIntLE(this.triggerTable[triggerIndex], 20, 1);
            int memberIndex = 0;
            while (memberIndex < count) {
                if (activeActors[formationState[memberIndex + 1]] != null) {
                    activeActors[formationState[memberIndex + 1]].despawn();
                }
                ++memberIndex;
            }
            LevelScene.formationState[0] = -1;
        }
    }

    public final void spawnWave() {
        int animFrame = triggerParams[2] << 4;
        int spawned = 0;
        int actorType = triggerParams[3];
        int spawnCount = triggerParams[4];
        int direction = 0;
        if (spawnCount == 0) {
            spawnCount = 1 + GameMIDlet.randomBelow(3);
        }
        direction = 1 + GameMIDlet.randomBelow(3);
        if (actorType == 0) {
            int[] typeChoices = new int[]{1, 3, 4};
            actorType = typeChoices[GameMIDlet.randomBelow(3)];
        }
        int spawnX = 0;
        int spawnYOffset = 0;
        int leftRowCount = 0;
        int rightRowCount = 0;
        this.waveSpawnCount = 0;
        while (spawned < spawnCount) {
            EnemyActor enemy = (EnemyActor)this.spawnActor(actorType, -1);
            if (enemy != null) {
                int resolvedDir;
                if (direction == 3) {
                    if (this.diagonalFormationToggle > 0) {
                        resolvedDir = 1;
                        this.diagonalFormationToggle = 0;
                    } else {
                        resolvedDir = 2;
                        this.diagonalFormationToggle = 1;
                    }
                } else {
                    resolvedDir = direction;
                }
                if (resolvedDir == 1) {
                    spawnX = this.canvas.cameraX - ++leftRowCount * 15360;
                    spawnYOffset = 0;
                } else if (resolvedDir == 2) {
                    spawnX = this.canvas.cameraX + this.canvas.viewportWidth + ++rightRowCount * 15060;
                    spawnYOffset = -128;
                }
                LevelScene.spawnBytes[0] = (byte)actorType;
                LevelScene.spawnBytes[1] = (byte)(spawnX >>= 10);
                LevelScene.spawnBytes[2] = (byte)(spawnX >> 8);
                LevelScene.spawnBytes[3] = (byte)animFrame;
                LevelScene.spawnBytes[4] = (byte)(animFrame >> 8);
                LevelScene.spawnBytes[5] = (byte)(0 | spawnYOffset);
                LevelScene.spawnBytes[6] = 1;
                LevelScene.spawnBytes[7] = 60;
                LevelScene.spawnBytes[8] = 22;
                LevelScene.spawnBytes[9] = (byte)GameMIDlet.randomBelow(3);
                if (enemy.spawnFromBytes(spawnBytes)) {
                    ++this.waveSpawnCount;
                    if (triggerParams[6] > 0 && triggerParams[6] < 100) {
                        triggerParams[5] = triggerParams[5] - 1;
                    }
                }
            }
            ++spawned;
        }
    }

    public final void dispose() {
        if (camera != null) {
            camera.dispose();
            camera = null;
        }
        if (this.dialogActor != null) {
            this.dialogActor.despawn();
            this.dialogActor = null;
        }
        int i = 0;
        while (i < activeActors.length) {
            LevelScene.activeActors[i] = null;
            ++i;
        }
        activeActors = null;
        int j = 0;
        while (j < this.cellActors.length) {
            this.cellActors[j] = null;
            ++j;
        }
        this.cellActors = null;
        int k = 0;
        while (k < this.actorInstanceTable.length) {
            this.actorInstanceTable[k] = null;
            ++k;
        }
        this.actorInstanceTable = null;
        int m = 0;
        while (m < this.triggerTable.length) {
            this.triggerTable[m] = null;
            ++m;
        }
        this.triggerTable = null;
        this.triggerFiredFlags = null;
        GameMIDlet.tempText1 = null;
        GameMIDlet.tempText2 = null;
        System.gc();
    }

    public static final void allocActorPool(GameCanvas canvas, int typeId, int poolSize) {
        if (actorPool[typeId] != null) {
            return;
        }
        LevelScene.actorPool[typeId] = new ActorBase[poolSize];
        int i = 0;
        while (i < poolSize) {
            LevelScene.actorPool[typeId][i] = canvas.createActor(typeId, actorDefs[typeId]);
            ++i;
        }
    }

    public static final void loadActorDef(int typeId) {
        if (actorDefs[typeId] == null) {
            LevelScene.actorDefs[typeId] = SpriteDef.loadFromArchive(typeId);
        }
        LevelScene.actorDefLoaded[typeId] = true;
        SpriteDef.loadedFlags[SpriteDef.idMap[typeId]] = true;
    }

    public static final boolean loadResourcesUpTo(GameCanvas canvas, int count) {
        int loaded = 0;
        loaded = 0;
        while (loaded < count && loaded < resourceLoadTable.length) {
            LevelScene.loadActorDef(resourceLoadTable[loaded][0]);
            LevelScene.allocActorPool(canvas, resourceLoadTable[loaded][0], resourceLoadTable[loaded][1]);
            ++loaded;
        }
        if (count == 3) {
            hudFont = TileSheet.loadFromBin(6);
        }
        return loaded >= resourceLoadTable.length;
    }

    public static final LevelScene loadLevel(GameCanvas canvas, int level) {
        LevelScene scene = new LevelScene();
        try {
            int n2;
            int n3;
            int n4;
            byte by;
            InputStream inputStream = GameMIDlet.openEntryStream("/res/s.bin", level);
            scene.cellWidth = GameMIDlet.readShortLE(inputStream);
            scene.cellHeight = GameMIDlet.readShortLE(inputStream);
            byte layerMode = GameMIDlet.readByte(inputStream);
            byte backgroundResource = 0;
            boolean bl = false;
            if (layerMode == 2) {
                GameMIDlet.readByte(inputStream);
                backgroundResource = GameMIDlet.readByte(inputStream);
            }
            GameMIDlet.readByte(inputStream);
            byte gridResource = GameMIDlet.readByte(inputStream);
            camera = new TileMap(176, 172);
            camera.load(gridResource, backgroundResource, layerMode);
            boolean bl2 = false;
            int actorTypeCount = inputStream.read();
            int typeIdx = 0;
            while (typeIdx < actorTypeCount) {
                by = GameMIDlet.readByte(inputStream);
                LevelScene.loadActorDef(by);
                GameMIDlet.readByte(inputStream);
                n4 = GameMIDlet.readByte(inputStream);
                LevelScene.allocActorPool(canvas, by, n4);
                ++typeIdx;
            }
            by = GameMIDlet.readByte(inputStream);
            scene.triggerTable = new byte[by][];
            scene.triggerFiredFlags = new boolean[by];
            n4 = 0;
            while (n4 < by) {
                n3 = GameMIDlet.readByte(inputStream);
                scene.triggerTable[n4] = new byte[n3 += 18];
                inputStream.read(scene.triggerTable[n4]);
                ++n4;
            }
            scene.residentActorSlots = n3 = inputStream.read();
            scene.actorInstanceTable = new byte[n3][];
            scene.triggerHitFlags = new boolean[n3];
            activeActors = new ActorBase[n3 + 30];
            int instanceIdx = 0;
            while (instanceIdx < n3) {
                scene.triggerHitFlags[instanceIdx] = false;
                n2 = GameMIDlet.readByte(inputStream);
                scene.actorInstanceTable[instanceIdx] = new byte[n2 += 7];
                inputStream.read(scene.actorInstanceTable[instanceIdx]);
                ++instanceIdx;
            }
            scene.cellCount = camera.getMapHeight() / scene.cellHeight * (camera.getMapWidth() / scene.cellWidth);
            scene.cellTriggers = new byte[scene.cellCount][];
            n2 = 0;
            while (n2 < scene.cellCount) {
                byte triggerCount = GameMIDlet.readByte(inputStream);
                n3 = triggerCount;
                if (triggerCount > 0) {
                    scene.cellTriggers[n2] = new byte[n3];
                    inputStream.read(scene.cellTriggers[n2]);
                }
                ++n2;
            }
            scene.globalActorCount = GameMIDlet.readByte(inputStream);
            scene.globalActors = new byte[scene.globalActorCount];
            inputStream.read(scene.globalActors);
            scene.cellActors = new byte[scene.cellCount][];
            int cellIdx = 0;
            while (cellIdx < scene.cellCount) {
                n3 = inputStream.read();
                scene.cellActors[cellIdx] = new byte[n3];
                inputStream.read(scene.cellActors[cellIdx]);
                ++cellIdx;
            }
            inputStream.close();
            scene.mapWidth = camera.getMapWidth();
            scene.mapHeight = camera.getMapHeight();
            scene.canvas = canvas;
            if (level != 0 && level != 2) {
                GameMIDlet.loadTextEntry(level, "/res/string.bin");
            }
            currentLevel = level;
        }
        catch (Exception exception) {
            return null;
        }
        return scene;
    }

    static {
        actorDrawLayer = new int[]{5, 3, 3, 3, 3, 3, 3, 8, 6, 9, 9, 1, 9, 7, 0, 0, 9, 1, 4, 3, 8, 0, 1};
        actorDefs = new SpriteDef[28];
        actorPool = new ActorBase[28][];
        cellSpawnBuffer = new byte[28];
        actorDefLoaded = new boolean[28];
        drawList = new ActorBase[40];
        triggerParams = new int[7];
        spawnBytes = new byte[11];
        cutsceneState = new int[5];
        dialogState = new int[3];
        formationState = new int[4];
        currentLevel = -1;
        resourceLoadTable = new int[][]{{0, 1}, {1, 10}, {2, 5}, {3, 10}, {4, 10}, {5, 5}, {6, 1}, {7, 5}, {8, 3}, {9, 5}, {10, 20}, {11, 3}, {12, 20}, {13, 5}, {14, 10}, {15, 10}, {16, 6}, {17, 10}, {18, 1}, {19, 1}, {20, 10}, {21, 1}, {22, 4}};
    }
}
