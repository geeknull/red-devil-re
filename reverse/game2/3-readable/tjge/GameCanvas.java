// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/a.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Canvas
 *  javax.microedition.lcdui.Font
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 */
package tjge;

import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import tjge.GameMIDlet;
import tjge.BossActor;      // c
import tjge.SpriteDef;      // d
import tjge.ItemActor;      // e
import tjge.EnemyActor;     // f
import tjge.PlayerActor;    // g
import tjge.ActorBase;      // h
import tjge.LevelScene;     // j
import tjge.ProjectileActor;// k

public final class GameCanvas
extends Canvas
implements Runnable {
    public static GameCanvas instance;          // a
    public int uiState;                          // b
    public int inputAction;                      // c
    public int heldAction;                       // d
    public int transitionProgress;               // e
    public long levelStartTime;                  // f
    public long elapsedSeconds;                  // g
    public int menuStartItem;                    // h
    private int resultAnimFrame;                 // G
    private int resultAnimCounter;               // H
    public int globalFrame;                      // i
    public int subState;                         // j
    public int levelIndex;                       // k
    public int menuSelection;                    // l
    public int cameraX;                          // m
    public int cameraY;                          // n
    public int cameraVelX;                       // o
    public int cameraVelY;                       // p
    public int viewportWidth;                    // q
    public int viewportHeight;                   // r
    private int sceneWidth;                       // I
    private int sceneHeight;                      // J
    private int shakeCounter;                      // K
    private boolean shaking;                       // L
    private boolean loadComplete;                  // M
    protected boolean running;                     // s
    protected boolean painting;                    // t
    private int underlineTargetWidth;              // N
    private int underlineWidth;                    // O
    private int underlineDir;                      // P
    Image logoImageMain;                           // u
    Image logoImageSub;                            // v
    protected Thread mainThread;                   // w
    protected GameMIDlet midlet;                   // x
    public PlayerActor player;                     // y
    public LevelScene scene;                       // z
    private Image logoTempImage1;                  // Q
    private Image logoTempImage2;                  // R
    private Image logoTempImage3;                  // S
    private Image logoTempImage4;                  // T
    public static final int[] briefingNumberX;     // A
    public static final int[] briefingNumberY;     // B
    static int briefingAnimC;                       // C
    static int briefingAnimD;                       // D
    static int briefingAnimE;                       // E
    public static int[] briefingLineState;          // F

    public GameCanvas(GameMIDlet gameMIDlet) {
        this.setFullScreenMode(true);
        instance = this;
        this.midlet = gameMIDlet;
        this.uiState = 3;
        this.mainThread = new Thread(this);
        this.mainThread.start();
        this.running = true;
        this.painting = false;
    }

    public final ActorBase createActor(int n, SpriteDef d2) {
        switch (n) {
            case 0: {
                this.player = new PlayerActor(n, d2);
                return this.player;
            }
            case 1:
            case 2:
            case 3:
            case 4:
            case 5: {
                return new EnemyActor(n, d2);
            }
            case 11:
            case 13:
            case 17:
            case 19:
            case 21: {
                return new BossActor(n, d2);
            }
            case 6:
            case 7:
            case 14:
            case 15:
            case 18:
            case 20:
            case 22: {
                return new ItemActor(n, d2);
            }
            case 9:
            case 10:
            case 12:
            case 16: {
                return new ProjectileActor(n, d2);
            }
        }
        return new ActorBase(n, d2);
    }

    public final void paint(Graphics graphics) {
        ++this.globalFrame;
        this.painting = true;
        graphics.setFont(Font.getFont((int)0, (int)0, (int)8));
        GameMIDlet.tickSoundTimeout();
        try {
            switch (this.uiState) {
                case 3: {
                    ++this.subState;
                    graphics.setClip(0, 0, 176, 204);
                    if (this.subState == 1) {
                        this.logoTempImage1 = GameMIDlet.loadImage("/res/logo.bin", 1);
                        this.logoTempImage2 = GameMIDlet.loadImage("/res/logo.bin", 2);
                        this.logoTempImage3 = GameMIDlet.loadImage("/res/logo.bin", 3);
                        this.logoTempImage4 = GameMIDlet.loadImage("/res/logo.bin", 4);
                        this.logoImageMain = GameMIDlet.loadImage("/res/logo.bin", 0);
                        this.logoImageSub = GameMIDlet.loadImage("/res/logo.bin", 5);
                        break;
                    }
                    if (this.subState == 2) {
                        GameMIDlet.loadSounds();
                        GameMIDlet.accessSaveRecord(0);
                        graphics.drawImage(this.logoTempImage1, 38, 60, 20);
                        this.logoTempImage1 = null;
                        graphics.setColor(238, 25, 33);
                        graphics.drawString("移动互连 无限可能", 96, 122, 17);
                        break;
                    }
                    if (this.subState == 29) {
                        graphics.setColor(0xFFFFFF);
                        graphics.fillRect(0, 0, 176, 204);
                        graphics.drawImage(this.logoTempImage2, 15, 15, 20);
                        this.logoTempImage2 = null;
                        graphics.drawImage(this.logoTempImage3, 36, 103, 20);
                        this.logoTempImage3 = null;
                        graphics.setColor(155, 166, 173);
                        graphics.drawString("新浪无线代理发行", 40, 139, 20);
                        break;
                    }
                    if (this.subState == 47) {
                        graphics.setColor(255, 255, 255);
                        graphics.fillRect(0, 0, 176, 208);
                        graphics.drawImage(this.logoTempImage4, 88, 45, 17);
                        this.logoTempImage4 = null;
                        break;
                    }
                    if (this.subState != 65) break;
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.drawImage(this.logoImageMain, 0, 0, 20);
                    graphics.drawImage(this.logoImageSub, 0, this.logoImageMain.getHeight() + 2, 20);
                    this.uiState = 1;
                    this.subState = 0;
                    GameMIDlet.playSound(0, 160);
                    break;
                }
                case 1: {
                    ++this.subState;
                    graphics.setClip(0, 0, 176, 204);
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.drawImage(this.logoImageMain, 0, 0, 20);
                    graphics.drawImage(this.logoImageSub, 0, this.logoImageMain.getHeight() + 2, 20);
                    graphics.setColor(0xFFFFFF);
                    graphics.drawRect(2, 194, 171, 6);
                    graphics.setColor(0);
                    graphics.fillRect(3, 195, 170, 5);
                    graphics.setColor(65280);
                    graphics.drawLine(4, 196, this.subState * 168 / 23 + 3, 196);
                    graphics.setColor(47872);
                    graphics.drawLine(4, 197, this.subState * 168 / 23 + 3, 197);
                    graphics.setColor(30464);
                    graphics.drawLine(4, 198, this.subState * 168 / 23 + 3, 198);
                    if (!LevelScene.loadResourcesUpTo(this, this.subState)) break;
                    this.uiState = 4;
                    this.levelIndex = 0;
                    this.subState = 0;
                    this.menuStartItem = 1;
                    this.menuSelection = 1;
                    this.startUnderline(120);
                    break;
                }
                case 4: {
                    graphics.setClip(0, 0, 176, 204);
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.drawImage(this.logoImageMain, 0, 0, 20);
                    graphics.drawImage(this.logoImageSub, 0, this.logoImageMain.getHeight() + 2, 20);
                    int n = this.menuStartItem;
                    while (n < 7) {
                        graphics.setColor(this.menuSelection == n && this.underlineDir == 1 ? 0xFFFFFF : 65280);
                        if (n == 3) {
                            graphics.drawString(GameMIDlet.menuTexts[GameMIDlet.saveRecord[2] == 0 ? 7 : 3], 88, 60 + n * 20, 17);
                        } else {
                            graphics.drawString(GameMIDlet.menuTexts[n], 88, 60 + n * 20, 17);
                        }
                        ++n;
                    }
                    graphics.setColor(65280);
                    this.drawUnderline(graphics, 88, 80 + this.menuSelection * 20);
                    if (this.inputAction == 4) {
                        this.startUnderline(120);
                        if (--this.menuSelection < this.menuStartItem) {
                            this.menuSelection = 6;
                        }
                    } else if (this.inputAction == 8) {
                        this.startUnderline(120);
                        if (++this.menuSelection > 6) {
                            this.menuSelection = this.menuStartItem;
                        }
                    } else if (this.inputAction == 16) {
                        switch (this.menuSelection) {
                            case 0: {
                                this.uiState = 10;
                                break;
                            }
                            case 1: {
                                this.levelIndex = 0;
                                GameMIDlet.accessSaveRecord(2);
                                this.transitionProgress = 0;
                                this.subState = 0;
                                this.uiState = 20;
                                PlayerActor.ammoReserve[1] = 6;
                                break;
                            }
                            case 2: {
                                if (GameMIDlet.saveRecord[3] == 0) {
                                    this.subState = 0;
                                    this.uiState = 100;
                                    break;
                                }
                                this.transitionProgress = 0;
                                this.subState = 0;
                                this.levelIndex = GameMIDlet.saveRecord[3];
                                byte by = GameMIDlet.saveRecord[1];
                                GameMIDlet.saveRecord[1] = (byte)(by + 1);
                                if (by > 99) {
                                    GameMIDlet.saveRecord[1] = 99;
                                }
                                PlayerActor.ammoReserve[1] = GameMIDlet.saveRecord[4];
                                this.uiState = this.levelIndex == 0 ? 20 : 2;
                                break;
                            }
                            case 3: {
                                GameMIDlet.saveRecord[2] = (byte)(GameMIDlet.saveRecord[2] ^ 1);
                                if (GameMIDlet.saveRecord[2] != 0) break;
                                GameMIDlet.stopSound();
                                break;
                            }
                            case 4: {
                                this.subState = 0;
                                GameMIDlet.loadTextEntry(7, "/res/string.bin");
                                this.inputAction = 0;
                                this.uiState = 6;
                                break;
                            }
                            case 5: {
                                GameMIDlet.loadTextEntry(8, "/res/string.bin");
                                this.inputAction = 0;
                                this.uiState = 19;
                                break;
                            }
                            case 6: {
                                this.midlet.destroyApp(true);
                            }
                        }
                    }
                    this.inputAction = 0;
                    break;
                }
                case 100: {
                    if (this.subState == 0) {
                        graphics.setClip(0, 0, 176, 204);
                        graphics.setColor(0);
                        graphics.fillRect(0, 0, 176, 204);
                        graphics.drawImage(this.logoImageMain, 0, 0, 20);
                        graphics.drawImage(this.logoImageSub, 0, this.logoImageMain.getHeight() + 6, 20);
                        LevelScene.fillBlackBand(graphics, 8, this.logoImageMain.getHeight() + 6, 176);
                        graphics.setClip(0, 0, 176, 208);
                        graphics.setColor(65280);
                        graphics.drawString("没有存档记录!!", 88, 104, 17);
                    }
                    ++this.subState;
                    if (this.subState <= 15) break;
                    this.subState = 0;
                    this.uiState = 4;
                    break;
                }
                case 2: {
                    this.loadLevel(this.levelIndex);
                    graphics.setColor(0);
                    graphics.setClip(0, 0, 176, 204);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.interludeTexts[11], 88, 184, 17);
                    if (!this.loadComplete) break;
                    this.subState = 0;
                    this.uiState = 10;
                    this.levelStartTime = System.currentTimeMillis();
                    break;
                }
                case 20: {
                    this.paintLevelIntro(graphics);
                    break;
                }
                case 22: {
                    this.scene.render(graphics);
                    graphics.setClip(0, 0, 176, 204);
                    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 171, 10, this.transitionProgress, 47872, 0, true);
                    this.scene.renderHud(graphics);
                    graphics.setClip(0, 0, 176, 204);
                    if (this.transitionProgress < 10) {
                        if (this.subState == 0) {
                            ++this.transitionProgress;
                        } else {
                            --this.transitionProgress;
                            if (this.transitionProgress < 0) {
                                this.subState = 0;
                                this.uiState = 10;
                            }
                        }
                        this.inputAction = 0;
                        break;
                    }
                    GameCanvas.drawExpandingFrame(graphics, 166, 40, 10, 70, 20, 20, 47872, 17408, true);
                    GameCanvas.drawExpandingFrame(graphics, 166, 90, 10, 145, 20, 20, 47872, 17408, true);
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex], 88, 15, 17);
                    graphics.drawString(GameMIDlet.missionTexts[this.levelIndex], 88, 47, 17);
                    LevelScene.hudFont.drawCell(graphics, 158, 157, 39, 0, 0);
                    LevelScene.hudFont.drawCell(graphics, 23, 95, 29, 0, 0);
                    int[] nArray = new int[]{5, 19, 44, 58, 81, 99, 124};
                    int[] nArray2 = new int[]{90, 100, 89, 101, 101, 93, 91};
                    int n = 0;
                    while (n < 7) {
                        if (n <= this.levelIndex && (n != this.levelIndex || this.globalFrame % 4 <= 1)) {
                            LevelScene.hudFont.drawCell(graphics, 24 + nArray[n], 24 + nArray2[n], 28, 0, 0);
                        }
                        ++n;
                    }
                    if (this.subState == 0 && this.inputAction == 32768) {
                        this.subState = 1;
                        --this.transitionProgress;
                    }
                    break;
                }
                case 10: {
                    this.scene.tick();
                    this.scene.render(graphics);
                    break;
                }
                case 18: {
                    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, this.transitionProgress, 47872, 0, true);
                    if (this.transitionProgress < 10) {
                        ++this.transitionProgress;
                        this.menuSelection = 0;
                        break;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex] + GameMIDlet.interludeTexts[8], 88, 30, 17);
                    graphics.drawString(GameMIDlet.interludeTexts[5], 36, 64, 20);
                    graphics.drawString(String.valueOf(GameCanvas.instance.scene.currentLevel), 140, 64, 24);
                    graphics.drawString(GameMIDlet.interludeTexts[7], 36, 90, 20);
                    graphics.drawString(String.valueOf(GameMIDlet.saveRecord[1] & 0xFF), 140, 90, 24);
                    graphics.drawString(GameMIDlet.interludeTexts[6], 36, 116, 20);
                    int n = (int)this.elapsedSeconds / 60;
                    int n2 = (int)this.elapsedSeconds % 60;
                    String string = String.valueOf(n);
                    String string2 = String.valueOf(n2);
                    if (n < 10) {
                        string = "0" + string;
                    }
                    if (n2 < 10) {
                        string2 = "0" + string2;
                    }
                    String string3 = string + ":" + string2;
                    graphics.drawString(string3, 140, 116, 24);
                    LevelScene.actorDefs[0].drawFrame(graphics, 48, 170, 4, 0, 0, 0);
                    graphics.setClip(0, 0, 176, 204);
                    if (this.inputAction == 4) {
                        this.startUnderline(64);
                        if (--this.menuSelection < 0) {
                            this.menuSelection = 1;
                        }
                        this.inputAction = 0;
                    } else if (this.inputAction == 8) {
                        this.startUnderline(64);
                        if (++this.menuSelection > 1) {
                            this.menuSelection = 0;
                        }
                        this.inputAction = 0;
                    } else if (this.inputAction == 16) {
                        if (this.menuSelection == 0) {
                            byte by = GameMIDlet.saveRecord[1];
                            GameMIDlet.saveRecord[1] = (byte)(by + 1);
                            if (by > 99) {
                                GameMIDlet.saveRecord[1] = 99;
                            }
                            this.uiState = 2;
                        } else {
                            this.menuStartItem = 1;
                            this.menuSelection = 1;
                            this.uiState = 4;
                        }
                        this.inputAction = 0;
                    }
                    int n3 = 0;
                    while (n3 < 2) {
                        graphics.setColor(n3 == this.menuSelection && this.underlineDir == 1 ? 0xFFFFFF : 65280);
                        if (n3 == 0) {
                            graphics.drawString(GameMIDlet.interludeTexts[0], 120, 150, 17);
                        } else {
                            graphics.drawString(GameMIDlet.interludeTexts[9], 120, 170, 17);
                        }
                        ++n3;
                    }
                    graphics.setColor(65280);
                    this.drawUnderline(graphics, 120, 169 + this.menuSelection * 20);
                    break;
                }
                case 16: {
                    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, this.transitionProgress, 47872, 0, true);
                    if (this.transitionProgress < 10) {
                        ++this.transitionProgress;
                        if (this.transitionProgress != 10) break;
                        GameMIDlet.playSound(1, 140);
                        break;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex] + GameMIDlet.interludeTexts[4], 88, 30, 17);
                    graphics.drawString(GameMIDlet.interludeTexts[5], 36, 64, 20);
                    graphics.drawString(String.valueOf(GameCanvas.instance.scene.currentLevel), 140, 64, 24);
                    graphics.drawString(GameMIDlet.interludeTexts[7], 36, 86, 20);
                    graphics.drawString(String.valueOf(GameMIDlet.saveRecord[1] & 0xFF), 140, 86, 24);
                    graphics.drawString(GameMIDlet.interludeTexts[6], 36, 108, 20);
                    int n = (int)this.elapsedSeconds / 60;
                    int n4 = (int)this.elapsedSeconds % 60;
                    String string = String.valueOf(n);
                    String string4 = String.valueOf(n4);
                    if (n < 10) {
                        string = "0" + string;
                    }
                    if (n4 < 10) {
                        string4 = "0" + string4;
                    }
                    String string5 = string + ":" + string4;
                    graphics.drawString(string5, 140, 108, 24);
                    LevelScene.hudFont.drawCell(graphics, 158, 189, 40, 0, 0);
                    LevelScene.actorDefs[0].drawFrame(graphics, 88, 170, this.resultAnimFrame, this.resultAnimCounter, 0, 0);
                    if (this.resultAnimFrame == 34) {
                        if (this.resultAnimCounter++ != 4) break;
                        if (this.levelIndex == 6) {
                            this.uiState = 21;
                        } else {
                            ++this.levelIndex;
                            this.uiState = 2;
                        }
                        GameMIDlet.saveRecord[0] = (byte)this.levelIndex;
                        GameMIDlet.saveRecord[3] = (byte)this.levelIndex;
                        GameMIDlet.saveRecord[4] = (byte)PlayerActor.ammoReserve[1];
                        GameMIDlet.accessSaveRecord(1);
                        break;
                    }
                    if (this.inputAction == 32768) {
                        this.resultAnimCounter = 0;
                        this.resultAnimFrame = 34;
                        break;
                    }
                    ++this.resultAnimCounter;
                    this.resultAnimCounter %= LevelScene.actorDefs[0].getFrameCount(this.resultAnimFrame);
                    break;
                }
                case 21: {
                    ++this.subState;
                    if (this.subState < 16) {
                        LevelScene.drawNumber(graphics, this.subState, 0, 204);
                        break;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.interludeTexts[10], 88, 102, 33);
                    if (this.subState <= 30) break;
                    this.menuStartItem = 1;
                    this.menuSelection = 1;
                    this.uiState = 4;
                    this.subState = 0;
                    System.gc();
                    break;
                }
                case 6: {
                    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
                    graphics.setColor(65280);
                    this.drawWrappedLines(graphics, GameMIDlet.tempText3, 5, 6, 19, this.subState, 9);
                    LevelScene.hudFont.drawCell(graphics, 158, 189, 40, 0, 0);
                    LevelScene.hudFont.drawCell(graphics, 5, 189, 39, 0, 0);
                    if (this.inputAction == 32768) {
                        this.subState += 9;
                        if (this.subState > 26) {
                            this.subState = 0;
                        }
                        this.inputAction = 0;
                        break;
                    }
                    if (this.inputAction != 16384) break;
                    this.uiState = 4;
                    this.inputAction = 0;
                    GameMIDlet.tempText3 = null;
                    System.gc();
                    break;
                }
                case 19: {
                    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
                    graphics.setColor(65280);
                    this.drawWrappedLines(graphics, GameMIDlet.tempText3, 5, 5, 18, 0, 10);
                    LevelScene.hudFont.drawCell(graphics, 5, 186, 39, 0, 0);
                    if (this.inputAction != 16384) break;
                    this.uiState = 4;
                    this.inputAction = 0;
                    GameMIDlet.tempText3 = null;
                    System.gc();
                }
            }
        }
        catch (Exception exception) {}
        this.painting = false;
    }

    public final void showResult(boolean bl) {
        this.transitionProgress = 0;
        this.subState = 0;
        this.elapsedSeconds = System.currentTimeMillis() - this.levelStartTime;
        this.elapsedSeconds /= 1000L;
        if (bl) {
            this.resultAnimFrame = 0;
            this.resultAnimCounter = 0;
            this.uiState = 16;
            return;
        }
        this.startUnderline(64);
        this.uiState = 18;
    }

    public final void hideNotify() {
        if (this.uiState == 10 || this.uiState == 22) {
            this.menuSelection = 0;
            this.menuStartItem = 0;
            this.inputAction = 0;
            this.uiState = 4;
        }
    }

    public final void enterBriefing() {
        this.transitionProgress = 0;
        this.subState = 0;
        this.uiState = 22;
        this.scene.subState = 0;
    }

    private void paintLevelIntro(Graphics graphics) {
        block17: {
            block19: {
                boolean bl;
                boolean bl2;
                block18: {
                    graphics.setColor(0);
                    graphics.setClip(0, 0, 176, 204);
                    graphics.fillRect(0, 0, 176, 204);
                    if (this.inputAction == 32768) {
                        this.uiState = 2;
                        return;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.interludeTexts[1], 171, 201, 40);
                    switch (this.transitionProgress) {
                        case 0: {
                            briefingAnimE = 0;
                            briefingAnimC = 0;
                            ++this.transitionProgress;
                            break;
                        }
                        case 1: {
                            briefingAnimE = 1;
                            if (++briefingAnimC <= 20) break;
                            briefingAnimC = 20;
                            briefingAnimD = 0;
                            ++this.transitionProgress;
                            break;
                        }
                        case 2: {
                            briefingAnimE = 2;
                            if (++briefingAnimD <= 20) break;
                            GameMIDlet.loadTextEntry(0, "/res/string.bin");
                            briefingAnimD = 20;
                            this.inputAction = 0;
                            ++this.transitionProgress;
                            GameCanvas.briefingLineState[0] = 0;
                            GameCanvas.briefingLineState[1] = 0;
                            GameCanvas.briefingLineState[2] = 2;
                            GameCanvas.briefingLineState[3] = 60;
                            break;
                        }
                        case 3: {
                            break;
                        }
                        case 4: {
                            if (--briefingAnimD > 0) break;
                            this.uiState = 2;
                        }
                    }
                    if (briefingAnimE > 0) {
                        GameCanvas.drawExpandingFrame(graphics, 171, 5, 5, 179, 20, briefingAnimC, 47872, 0, true);
                    }
                    if (briefingAnimE > 1) {
                        GameCanvas.drawExpandingFrame(graphics, 134, 72, 13, 25, 20, briefingAnimD, 47872, 17408, false);
                        GameCanvas.drawExpandingFrame(graphics, 42, 149, 163, 102, 20, briefingAnimD, 47872, 17408, false);
                        LevelScene.hudFont.drawCell(graphics, 144, 72 - LevelScene.hudFont.cellHeight[17], 17, 0, 0);
                        LevelScene.hudFont.drawCell(graphics, 15, 149 - LevelScene.hudFont.cellHeight[14], 14, 0, 0);
                    }
                    if (this.transitionProgress != 3) break block17;
                    graphics.setClip(0, 0, 176, 204);
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.interludeTexts[0], 5, 201, 36);
                    bl2 = this.selectParagraph(briefingLineState[0]);
                    bl = this.drawTypesetText(graphics, briefingLineState[1], briefingLineState[2], briefingNumberX[briefingLineState[0] % 2], briefingNumberY[briefingLineState[0] % 2], 90, 19);
                    boolean bl3 = this.inputAction == 16384 || this.inputAction == 16;
                    if (bl3) break block18;
                    int n = briefingLineState[3];
                    briefingLineState[3] = n - 1;
                    if (n >= 0) break block19;
                }
                if (bl2) {
                    ++this.transitionProgress;
                } else if (bl) {
                    briefingLineState[0] = briefingLineState[0] + 1;
                    GameCanvas.briefingLineState[1] = 0;
                    GameCanvas.briefingLineState[3] = 60;
                } else {
                    briefingLineState[1] = briefingLineState[1] + briefingLineState[2];
                    GameCanvas.briefingLineState[3] = 60;
                }
            }
            this.inputAction = 0;
        }
    }

    public final void initCamera() {
        this.viewportWidth = 180224;
        this.viewportHeight = 176128;
        this.sceneWidth = this.scene.mapWidth << 10;
        this.sceneHeight = this.scene.mapHeight << 10;
        int n = GameMIDlet.readIntLE(this.scene.actorInstanceTable[0], 1, 2);
        int n2 = GameMIDlet.readIntLE(this.scene.actorInstanceTable[0], 3, 2);
        this.player.posX = n << 10;
        this.player.posY = n2 << 10;
        this.cameraX = this.player.posX - this.viewportWidth * 1 / 4;
        this.cameraY = this.player.posY - this.viewportHeight * 7 / 10;
        if (this.cameraX > this.sceneWidth - this.viewportWidth) {
            this.cameraX = this.sceneWidth - this.viewportWidth;
        }
        if (this.cameraX < 0) {
            this.cameraX = 0;
        }
        if (this.cameraY > this.sceneHeight - this.viewportHeight) {
            this.cameraY = this.sceneHeight - this.viewportHeight;
        }
        if (this.cameraY < 0) {
            this.cameraY = 0;
        }
        int n3 = this.cameraX >> 10;
        int n4 = this.cameraY >> 10;
        this.scene.updateCameraTarget(n3, n4);
    }

    public final void followCamera(int n, int n2) {
        this.cameraVelX = 0;
        this.cameraVelY = 0;
        if (this.cameraX < n) {
            if (n - this.cameraX > 16384) {
                this.cameraVelX = this.player.targetVelX + 16384;
            } else {
                this.cameraX = n;
            }
        } else if (this.cameraX > n) {
            if (this.cameraX - n > 16384) {
                this.cameraVelX = this.player.targetVelX - 16384;
            } else {
                this.cameraX = n;
            }
        }
        if (this.cameraY < n2) {
            if (n2 - this.cameraY > 10240) {
                this.cameraVelY = Math.min(this.player.targetVelY + 10240, 15360);
            } else {
                this.cameraY = n2;
            }
        } else if (this.cameraY > n2) {
            if (this.cameraY - n2 > 10240) {
                this.cameraVelY = Math.max(this.player.targetVelY - 10240, -15360);
            } else {
                this.cameraY = n2;
            }
        }
        this.cameraX += this.cameraVelX;
        this.cameraY += this.cameraVelY;
        if (this.shaking) {
            this.cameraX = this.shakeCounter % 2 == 0 ? (this.cameraX -= 2048) : (this.cameraX += 2048);
            if (--this.shakeCounter <= 0) {
                this.shaking = false;
            }
        }
        if (this.cameraX > this.sceneWidth - this.viewportWidth) {
            this.cameraX = this.sceneWidth - this.viewportWidth;
        }
        if (this.cameraX < 0) {
            this.cameraX = 0;
        }
        if (this.cameraY > this.sceneHeight - this.viewportHeight) {
            this.cameraY = this.sceneHeight - this.viewportHeight;
        }
        if (this.cameraY < 0) {
            this.cameraY = 0;
        }
    }

    public final void loadLevel(int n) {
        this.loadComplete = false;
        switch (this.subState) {
            case 0: {
                if (this.scene != null && LevelScene.currentLevel != n) {
                    this.scene.dispose();
                    this.scene = null;
                }
                this.subState = 1;
                return;
            }
            case 1: {
                if (n != LevelScene.currentLevel) {
                    this.scene = LevelScene.loadLevel(this, n);
                }
                this.subState = 2;
                return;
            }
            case 2: {
                this.initCamera();
                this.loadComplete = true;
            }
        }
    }

    public final void run() {
        try {
            long l = System.currentTimeMillis();
            while (this.mainThread != null) {
                if (!this.running || this.painting) continue;
                long l2 = System.currentTimeMillis() - l;
                if (l2 < 80L) {
                    Thread.sleep(80L - l2);
                }
                this.repaint();
                l = System.currentTimeMillis();
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    private int keyToAction(int n) {
        int n2 = 0;
        this.heldAction = 0;
        switch (n) {
            case -1:
            case 1:
            case 50: {
                if (this.uiState == 10) {
                    n2 = 32;
                    break;
                }
                n2 = 4;
                break;
            }
            case -6:
            case 6:
            case 56: {
                n2 = 8;
                break;
            }
            case -2:
            case 2:
            case 52: {
                n2 = 1;
                break;
            }
            case -5:
            case 5:
            case 54: {
                n2 = 2;
                break;
            }
            case -20:
            case 20:
            case 53: {
                n2 = 16;
                this.heldAction = 16;
                break;
            }
            case 55: {
                n2 = 2048;
                break;
            }
            case 35:
            case 57: {
                n2 = 1024;
                break;
            }
            case 42: {
                n2 = 4096;
                break;
            }
            case 49: {
                n2 = 64;
                break;
            }
            case 51: {
                n2 = 128;
                break;
            }
            case -21:
            case 21: {
                n2 = 16384;
                break;
            }
            case -22:
            case 22: {
                n2 = this.uiState == 4 ? 16 : 32768;
            }
        }
        return n2;
    }

    public final void keyPressed(int n) {
        int n2;
        if (n == 21 || n == -21) {
            if (this.uiState == 10 || this.uiState == 22) {
                this.uiState = 4;
                this.menuStartItem = 0;
                this.menuSelection = 0;
                this.inputAction = 0;
                return;
            }
        } else if ((n == 22 || n == -22) && this.uiState == 10 && this.scene.subState == 0) {
            this.transitionProgress = 0;
            this.uiState = 22;
        }
        this.inputAction = n2 = this.keyToAction(n);
    }

    public final void keyReleased(int n) {
        this.inputAction = 0;
        this.heldAction = -1;
    }

    public final void startShake(int n) {
        if (!this.shaking) {
            this.shaking = true;
            this.shakeCounter = n;
        }
    }

    public static final void drawExpandingFrame(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6, int n7, int n8, boolean bl) {
        if (n6 <= 0) {
            return;
        }
        int n9 = Math.abs(n - n3);
        int n10 = Math.abs(n2 - n4);
        n9 = n9 * n6 / n5;
        n10 = n10 * n6 / n5;
        if (n > n3) {
            n -= n9;
        }
        if (n2 > n4) {
            n2 -= n10;
        }
        graphics.setColor(n7);
        graphics.drawRect(n, n2, n9, n10);
        if (n8 >= 0) {
            graphics.setColor(n8);
            graphics.fillRect(n + 1, n2 + 1, n9 - 1, n10 - 1);
        }
        if (bl) {
            graphics.setColor(0);
            graphics.drawRect(n + 1, n2 + 1, n9 - 2, n10 - 2);
            graphics.setColor(65280);
            graphics.drawRect(n + 2, n2 + 2, n9 - 4, n10 - 4);
        }
    }

    public final void drawWrappedLines(Graphics graphics, String string, int n, int n2, int n3, int n4, int n5) {
        int n6 = 0;
        int n7 = 0;
        int n8 = 0;
        do {
            n7 = string.indexOf(13, n6);
            if (n8 >= n4) {
                if (n7 == -1) {
                    graphics.drawString(string.substring(n6), n, n2, 20);
                } else {
                    graphics.drawString(string.substring(n6, n7), n, n2, 20);
                }
                n2 += n3;
                --n5;
            }
            n6 = n7 + 2;
            ++n8;
        } while (n7 >= 0 && n5 > 0);
    }

    public final boolean selectParagraph(int n) {
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        while (n4 < n) {
            if ((n2 = GameMIDlet.tempText1.indexOf(13, n2)) == -1) {
                return true;
            }
            n2 += 2;
            ++n4;
        }
        n3 = GameMIDlet.tempText1.indexOf(13, n2);
        GameMIDlet.tempText2 = n3 == -1 ? GameMIDlet.tempText1.substring(n2) : GameMIDlet.tempText1.substring(n2, n3);
        return n3 < 0;
    }

    public final boolean drawTypesetText(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = 0;
        int n8 = 0;
        int n9 = GameMIDlet.tempText2.length();
        while (n7 < n9 && n2 > 0) {
            int n10 = n3;
            int n11 = n7 + 1;
            while (n10 < n3 + n5 && n11 < n9) {
                n10 = n3 + graphics.getFont().substringWidth(GameMIDlet.tempText2, n7, n11 - n7);
                ++n11;
            }
            if (++n8 > n) {
                graphics.drawSubstring(GameMIDlet.tempText2, n7, n11 - n7, n3, n4, 20);
                n4 += n6;
                --n2;
            }
            n7 = n11;
        }
        return n7 >= n9;
    }

    private void startUnderline(int n) {
        this.underlineTargetWidth = n;
        this.underlineWidth = 48;
        this.underlineDir = 1;
    }

    private void drawUnderline(Graphics graphics, int n, int n2) {
        if (this.underlineDir == 1) {
            this.underlineWidth += 10;
            if (this.underlineWidth > this.underlineTargetWidth) {
                this.underlineDir = 0;
            }
        } else {
            this.underlineWidth -= 10;
            if (this.underlineWidth < 48) {
                this.underlineDir = 1;
            }
        }
        int n3 = this.underlineWidth >>> 1;
        graphics.drawLine(n - n3, n2, n + n3, n2);
    }

    static {
        briefingNumberX = new int[]{17, 46};
        briefingNumberY = new int[]{29, 106};
        briefingLineState = new int[4];
    }
}
