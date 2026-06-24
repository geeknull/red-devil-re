// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/a.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  com.nokia.mid.sound.Sound
 *  com.nokia.mid.ui.DirectGraphics
 *  com.nokia.mid.ui.DirectUtils
 *  com.nokia.mid.ui.FullCanvas
 *  javax.microedition.lcdui.Font
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 *  javax.microedition.rms.RecordEnumeration
 *  javax.microedition.rms.RecordStore
 */
package tjge;

import com.nokia.mid.sound.Sound;
import com.nokia.mid.ui.DirectGraphics;
import com.nokia.mid.ui.DirectUtils;
import com.nokia.mid.ui.FullCanvas;
import java.io.InputStream;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import javax.microedition.rms.RecordEnumeration;
import javax.microedition.rms.RecordStore;
import tjge.GameMIDlet;
import tjge.TileMap;          // 原 b
import tjge.BossActor;        // 原 c
import tjge.SpriteDef;        // 原 d
import tjge.EffectActor;      // 原 e
import tjge.PlayerActor;      // 原 f
import tjge.ActorBase;        // 原 g
import tjge.EnemyActor;       // 原 h
import tjge.LevelLoader;      // 原 j
import tjge.PickupActor;      // 原 k
import tjge.ProjectileActor;  // 原 l

public final class GameScreen
extends FullCanvas
implements Runnable {
    public static int screenWidth = 176;        // a
    public static int playHeight = 176;         // b
    public static int viewWidthFx = 180224;     // c
    public static int screenHeight = 208;       // d
    public static GameScreen instance;          // e
    private long frameStepMs = 100L;            // W
    private boolean running;                     // X
    private boolean painting;                    // Y
    private boolean levelLoaded;                 // Z
    private Thread loopThread;                    // aa
    private GameMIDlet midlet;                    // ab
    protected TileMap tileMap;                    // f
    protected LevelLoader levelLoader;            // g
    Image hudImage;                               // h
    Image menuImage;                              // i
    PlayerActor player;                           // j
    ActorBase[] drawQueue;                        // k
    ProjectileActor[][] projectilePools;          // l
    EnemyActor[][] enemyGrid;                     // m
    BossActor boss;                               // n
    int frameCounter;                             // o
    int state;                                    // p
    int heldKeyAction;                            // q
    int cameraX;                                  // r
    int cameraY;                                  // s
    int cameraVelX;                               // t
    int cameraVelY;                               // u
    int drawQueueCount;                           // v
    int stateTimer;                               // w
    int levelIndex;                               // x
    int menuSelection;                            // y
    int enemyAliveCount;                          // z
    int airdropWaveCount;                         // A
    int reinforceBudget;                          // B
    int killCount;                                // C
    long levelStartMs;                            // D
    boolean flagE;                                // E
    int taskSelectIndex;                          // F
    int hudBlinkCounter;                          // G
    int menuVisibleMax;                           // H
    int animFrameIndex;                           // I
    short[] pixelBuffer;                          // J
    DirectGraphics directGraphics;                // K
    boolean scriptFlagL;                          // L
    boolean showIndicator;                        // M
    boolean indicatorToggle;                      // N
    int indicatorValue;                           // O
    private int scriptStageAc;                    // ac
    private int bossTriggerX;                     // ad
    private boolean inTaskSelectMenu;             // ae
    private boolean isCutsceneEntry;              // af
    private boolean levelResourcesReady;          // ag
    private boolean menuActive;                   // ah
    private boolean cursorExpanding;              // ai
    private int cursorWidth;                      // aj
    private int creditScrollX = -176;             // ak
    private int creditScrollX2 = -20;             // al
    public static int inputQueueCap;              // P
    private static int[] inputQueue;              // am
    private static int inputWriteIndex;           // an
    private static int inputReadIndex;            // ao
    public static byte[] saveData;                // Q
    public static int soundCount;                 // R
    public static Sound[] sounds;                 // S
    public static int currentSoundIndex;          // T
    static String currentText;                    // U
    static String taskNumberChars;                // V

    public GameScreen(GameMIDlet gameMIDlet) {
        instance = this;
        this.midlet = gameMIDlet;
        screenWidth = this.getWidth();
        playHeight = this.getHeight() - 32;
        this.state = 1;
        this.loopThread = new Thread(this);
        this.loopThread.start();
        this.running = true;
        this.painting = false;
        this.levelResourcesReady = false;
        this.pixelBuffer = new short[3600];
    }

    public final ActorBase createActor(int n, SpriteDef d2) {
        switch (n) {
            case 0: {
                this.player = new PlayerActor(n, d2, this);
                return this.player;
            }
            case 10: {
                return new ProjectileActor(n, d2, this);
            }
            case 1:
            case 2:
            case 18: {
                return new EnemyActor(n, d2, this);
            }
            case 4:
            case 5:
            case 6:
            case 7:
            case 9:
            case 12:
            case 19:
            case 22: {
                return new EffectActor(n, d2, this);
            }
            case 3:
            case 11:
            case 13: {
                return new PickupActor(n, d2, this);
            }
            case 8:
            case 14:
            case 17: {
                return new BossActor(n, d2, this);
            }
        }
        return new ActorBase(n, d2);
    }

    /*
     * Unable to fully structure code
     */
    public final void paint(Graphics var1_1) {
        this.painting = true;
        ++this.frameCounter;
        try {
            switch (this.state) {
                case 1: {
                    if (this.stateTimer++ == 0) {
                        this.hudImage = GameScreen.loadImageFromBin(8);
                        var1_1.drawImage(this.hudImage, 29, 55, 20);
                        var1_1.setColor(238, 25, 33);
                        var1_1.setFont(Font.getFont((int)0, (int)1, (int)0));
                        var1_1.drawString("移动互连 无限可能", GameScreen.screenWidth / 2, 128, 17);
                        this.hudImage = GameScreen.loadImageFromBin(7);
                        this.menuImage = GameScreen.loadImageFromBin(0);
                        this.initGameResources();
                        break;
                    }
                    if (this.stateTimer == 12) {
                        GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0xFFFFFF);
                        var1_1.drawImage(this.hudImage, 12, 12, 20);
                        var1_1.drawImage(this.menuImage, 88, 95, 17);
                        var1_1.setColor(155, 166, 173);
                        var1_1.drawString("新浪无线代理发行", 60, 142, 20);
                        this.menuImage = null;
                        this.hudImage = null;
                        break;
                    }
                    if (this.stateTimer == 22) {
                        this.menuImage = GameScreen.loadImageFromBin(1);
                        GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                        var1_1.drawImage(this.menuImage, 57, 80, 20);
                        var1_1.setColor(0xFFFFFF);
                        var1_1.drawString("www.tickgame.com", 88, 120, 17);
                        break;
                    }
                    if (this.stateTimer > 32 && this.stateTimer < 42) {
                        var2_2 = 0;
                        while (var2_2 < this.pixelBuffer.length) {
                            this.pixelBuffer[var2_2] = (short)(this.stateTimer - 32);
                            v0 = var2_2++;
                            this.pixelBuffer[v0] = (short)(this.pixelBuffer[v0] << 12);
                        }
                        this.directGraphics = DirectUtils.getDirectGraphics((Graphics)var1_1);
                        this.directGraphics.drawPixels(this.pixelBuffer, true, 0, 72, 57, 60, 72, 48, 0, 4444);
                        break;
                    }
                    if (this.stateTimer != 42) break;
                    this.stateTimer = 0;
                    this.state = 4;
                    this.menuVisibleMax = 0;
                    this.menuSelection = 0;
                    this.hudBlinkCounter = 1;
                    this.inTaskSelectMenu = false;
                    this.menuImage = GameScreen.loadImageFromBin(2);
                    GameScreen.playSound(0, 1, 160);
                    break;
                }
                case 4: {
                    GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                    var1_1.drawImage(this.menuImage, 18, 9, 20);
                    LevelLoader.spriteDefPool[8].paintSequenceFrame(var1_1, 128, 190, -2147483648, this.frameCounter % 3, 0, 0);
                    LevelLoader.spriteDefPool[0].paintSequenceFrame(var1_1, 153, 159, -2147483648, this.frameCounter % 3, 0, 0);
                    var1_1.setClip(0, 0, GameScreen.screenWidth, GameScreen.screenHeight);
                    if (this.menuActive) {
                        var2_3 = this.pollInputAction();
                        if (var2_3 == 4) {
                            if (!this.inTaskSelectMenu) {
                                this.resetCursorAnim();
                                if (--this.menuSelection < 0) {
                                    this.menuSelection = 6;
                                }
                                this.menuVisibleMax = this.menuSelection;
                            } else if (--this.taskSelectIndex < 0) {
                                this.taskSelectIndex = GameScreen.saveData[0];
                            }
                        } else if (var2_3 == 8) {
                            if (!this.inTaskSelectMenu) {
                                this.resetCursorAnim();
                                if (++this.menuSelection > 6) {
                                    this.menuSelection = 0;
                                }
                                this.menuVisibleMax = this.menuSelection;
                            } else if (++this.taskSelectIndex > GameScreen.saveData[0]) {
                                this.taskSelectIndex = 0;
                            }
                        } else if (var2_3 == 16) {
                            this.stateTimer = 0;
                            if (this.inTaskSelectMenu) {
                                if (this.levelResourcesReady && this.levelIndex != this.taskSelectIndex) {
                                    this.releaseLevel();
                                }
                                this.levelIndex = this.taskSelectIndex;
                                GameScreen.saveData[1] = (byte)this.levelIndex;
                                GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                                this.state = 2;
                                break;
                            }
                            switch (this.menuSelection) {
                                case 0: {
                                    GameScreen.saveData[0] = 0;
                                    GameScreen.saveData[1] = 0;
                                    this.levelIndex = 0;
                                    this.player.fullAmmoInit();
                                    if (this.levelResourcesReady) {
                                        this.releaseLevel();
                                    }
                                    this.state = 2;
                                    break;
                                }
                                case 1: {
                                    this.levelIndex = GameScreen.saveData[1];
                                    this.player.fullAmmoInit();
                                    this.state = 2;
                                    break;
                                }
                                case 2: {
                                    this.inTaskSelectMenu = true;
                                    this.taskSelectIndex = 0;
                                    this.player.fullAmmoInit();
                                    break;
                                }
                                case 3: {
                                    GameScreen.saveData[2] = GameScreen.saveData[2] == 0 ? 1 : 0;
                                    break;
                                }
                                case 4:
                                case 5: {
                                    this.state = this.menuSelection == 4 ? 6 : 3;
                                    this.heldKeyAction = 0;
                                    break;
                                }
                                case 6: {
                                    this.accessSaveData(0);
                                    this.painting = false;
                                    this.midlet.notifyDestroyed();
                                }
                            }
                            GameScreen.playSound(3, 1, 100);
                        }
                    }
                    if (this.inTaskSelectMenu) {
                        GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                        var1_1.setColor(65280);
                        var1_1.drawRect(0, 185, 175, 21);
                        var1_1.drawString("任务" + GameScreen.taskNumberChars.substring(this.taskSelectIndex, this.taskSelectIndex + 1), GameScreen.screenWidth / 2, 190, 17);
                        break;
                    }
                    var1_1.setFont(Font.getFont((int)64, (int)1, (int)8));
                    var2_3 = this.menuActive != false ? 6 : this.menuVisibleMax;
                    var3_5 = 0;
                    var4_7 = 0;
                    while (var4_7 <= var2_3) {
                        if (this.menuActive && var4_7 == this.menuSelection && this.hudBlinkCounter == 0) {
                            var1_1.setColor(0xFFFFFF);
                        } else {
                            var1_1.setColor(65280);
                        }
                        var3_5 = var4_7 == 3 && GameScreen.saveData[2] != 1 ? 7 : var4_7;
                        var1_1.drawString(GameMIDlet.menuTexts[var3_5], 52, 87 + var4_7 * 15, 17);
                        ++var4_7;
                    }
                    if (!this.menuActive) {
                        this.cursorWidth += 16;
                        if (this.cursorWidth > 64) {
                            if (++this.menuVisibleMax > 6) {
                                this.menuVisibleMax = this.menuSelection;
                                this.menuActive = true;
                                this.clearInputQueue();
                                this.cursorExpanding = true;
                            } else {
                                this.cursorWidth = 0;
                            }
                        }
                    } else {
                        this.animateCursorExpand();
                        this.menuVisibleMax = this.menuSelection;
                    }
                    var1_1.setColor(65280);
                    var5_9 = this.cursorWidth >>> 1;
                    var1_1.drawLine(52 - var5_9, 100 + this.menuVisibleMax * 15, 52 + var5_9, 100 + this.menuVisibleMax * 15);
                    break;
                }
                case 2: {
                    this.loadLevelStep(this.levelIndex);
                    if (this.levelLoaded) {
                        this.stateTimer = 0;
                        this.state = 22;
                        break;
                    }
                    GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                    var1_1.setColor(0xFF0000);
                    var1_1.drawString("载入中", 65, 192, 20);
                    var2_4 = 0;
                    while (var2_4 < this.stateTimer) {
                        var1_1.drawString(".", 110 + var2_4 * 3, 192, 20);
                        ++var2_4;
                    }
                    break;
                }
                case 22: {
                    if (this.heldKeyAction != 0) {
                        this.stateTimer = 71;
                    }
                    if (this.stateTimer == 0) {
                        this.loadTextFromBin(2);
                    }
                    if (this.stateTimer++ <= 70) {
                        GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                        this.drawBriefingScreen(var1_1, this.stateTimer);
                        break;
                    }
                    if (this.stateTimer <= 70) break;
                    GameScreen.currentText = null;
                    System.gc();
                    this.stateTimer = 0;
                    this.heldKeyAction = 0;
                    if (!this.levelLoaded) {
                        this.state = 10;
                        break;
                    }
                    this.levelLoaded = false;
                    this.killCount = 0;
                    this.levelStartMs = System.currentTimeMillis();
                    if (this.hudImage == null) {
                        this.hudImage = GameScreen.loadImageFromBin(3);
                    }
                    if (this.isCutsceneEntry) {
                        if (this.levelIndex == 7) {
                            this.scriptStageAc = this.cameraX = 184320;
                            this.player.posX -= 40960;
                        } else {
                            this.player.posX = 0;
                            this.cameraX = 4096;
                        }
                        this.player.targetVelX = 8192;
                        this.player.setFrame(2);
                        this.state = 14;
                        break;
                    }
                    this.cameraVelX = 0;
                    this.cameraX = 0;
                    this.player.posX = -81920;
                    this.state = 10;
                    break;
                }
                case 21: {
                    switch (this.levelIndex) {
                        case 2: {
                            if (!this.scriptFlagL) {
                                if (this.stateTimer++ <= 3) break;
                                this.cameraVelX = 12288;
                                this.cameraVelY = 0;
                                break;
                            }
                            if (this.stateTimer++ <= 9) break;
                            this.cameraVelX = -16384;
                            break;
                        }
                        case 7: {
                            if (!this.scriptFlagL) {
                                if (this.stateTimer == 0) {
                                    this.cameraVelX = -8192;
                                    break;
                                }
                                this.cameraVelX = 16384;
                                if (this.cameraX + this.cameraVelX <= this.scriptStageAc) break;
                                this.cameraX = this.scriptStageAc;
                                this.cameraVelX = 0;
                                this.state = 10;
                                this.heldKeyAction = 0;
                                this.stateTimer = 0;
                                break;
                            }
                            if (this.stateTimer++ > 30) {
                                this.scriptFlagL = false;
                                this.cameraVelY = 0;
                                break;
                            }
                            this.cameraVelX = 0;
                        }
                    }
                    this.updateWorld();
                    this.renderWorld(var1_1);
                    break;
                }
                case 14: {
                    if (this.stateTimer++ != 5) ** GOTO lbl248
                    this.player.targetVelX = 0;
                    this.player.setFrame(1);
                    ** GOTO lbl254
lbl248:
                    // 1 sources

                    if (this.stateTimer > 16) {
                        this.player.setFrame(0);
                        this.state = this.levelIndex == 7 ? 21 : 10;
                        this.heldKeyAction = 0;
                        this.isCutsceneEntry = false;
                        this.stateTimer = 0;
                    }
                }
lbl254:
                // 5 sources

                case 10: {
                    this.updateWorld();
                    this.renderWorld(var1_1);
                    break;
                }
                case 18: {
                    if (this.stateTimer == 0) {
                        this.levelStartMs = System.currentTimeMillis() - this.levelStartMs;
                        var1_1.setColor(65280);
                        var1_1.drawString("任务" + GameScreen.taskNumberChars.substring(GameScreen.instance.levelIndex, GameScreen.instance.levelIndex + 1) + "失败", GameScreen.screenWidth / 2, 35, 17);
                        var1_1.drawString("击毙敌人: " + this.killCount, 36, 74, 20);
                        var1_1.drawString("所用时间: " + GameScreen.formatTime(this.levelStartMs), 36, 105, 20);
                        this.drawBriefingAnim(var1_1, 0, 16, 40, 175, 0);
                        this.cursorWidth = 60;
                        ++this.stateTimer;
                        this.clearInputQueue();
                    } else {
                        var3_6 = this.pollInputAction();
                        if (var3_6 == 4) {
                            this.resetCursorAnim();
                            if (--this.menuSelection < 0) {
                                this.menuSelection = 1;
                            }
                        } else if (var3_6 == 8) {
                            this.resetCursorAnim();
                            if (++this.menuSelection > 1) {
                                this.menuSelection = 0;
                            }
                        } else if (var3_6 == 16) {
                            switch (this.menuSelection) {
                                case 0: {
                                    this.player.fullAmmoInit();
                                    this.state = 2;
                                    break;
                                }
                                case 1: {
                                    this.inTaskSelectMenu = false;
                                    this.state = 4;
                                }
                            }
                            this.stateTimer = 0;
                            this.clearInputQueue();
                            this.menuVisibleMax = 0;
                            this.hudBlinkCounter = 0;
                            this.menuSelection = 0;
                            this.levelResourcesReady = true;
                            break;
                        }
                    }
                    GameScreen.fillRectClipped(var1_1, 70, 150, 106, 58, 0);
                    var3_6 = 0;
                    while (var3_6 < 2) {
                        if (var3_6 == this.menuSelection && this.hudBlinkCounter == 0) {
                            var1_1.setColor(0xFFFFFF);
                        } else {
                            var1_1.setColor(65280);
                        }
                        if (var3_6 == 0) {
                            var1_1.drawString(GameMIDlet.menuTexts[1], 120, 150, 17);
                        } else {
                            var1_1.drawString(GameMIDlet.menuTexts[9], 120, 170, 17);
                        }
                        ++var3_6;
                    }
                    var1_1.setColor(65280);
                    var4_8 = this.cursorWidth >>> 1;
                    var1_1.drawLine(120 - var4_8, 164 + this.menuSelection * 20, 120 - var4_8 + this.cursorWidth, 164 + this.menuSelection * 20);
                    this.animateCursorExpand();
                    break;
                }
                case 15: {
                    GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                    if (this.stateTimer == 0) {
                        LevelLoader.retainSpriteDef(18);
                        this.stateTimer = 10;
                        break;
                    }
                    if (this.creditScrollX > 240) {
                        if (this.stateTimer > 0) {
                            this.stateTimer = 0;
                        }
                        var1_1.setColor(0xFF0000);
                        var1_1.setFont(Font.getFont((int)0, (int)1, (int)16));
                        var1_1.drawString("剧终", 88, 100, 17);
                        if (this.stateTimer-- >= -60) break;
                        this.state = 4;
                        this.stateTimer = 0;
                        this.clearInputQueue();
                        this.menuSelection = 0;
                        this.inTaskSelectMenu = false;
                        this.levelResourcesReady = true;
                        break;
                    }
                    var5_10 = 0;
                    var6_12 = 0;
                    var7_14 = 0;
                    var8_16 = 0;
                    var9_19 = 0;
                    var10_20 = 0;
                    while (var10_20 < 4) {
                        switch (var10_20) {
                            case 0: {
                                var5_10 = 0;
                                var8_16 = 146;
                                var7_14 = this.creditScrollX - 15;
                                this.creditScrollX += 6;
                                if (var7_14 > 3 && var7_14 < 40) {
                                    var6_12 = 1;
                                    var9_19 = 8;
                                    break;
                                }
                                var6_12 = 0;
                                var9_19 = 3;
                                break;
                            }
                            case 1: {
                                var5_10 = 18;
                                var7_14 = this.creditScrollX2 - 15;
                                var8_16 = 146;
                                this.creditScrollX2 += 6;
                                if (this.creditScrollX < 6 || this.creditScrollX > 25) {
                                    var6_12 = -2147483648;
                                    var9_19 = 4;
                                    break;
                                }
                                var6_12 = -2147483646;
                                var9_19 = 2;
                                break;
                            }
                            case 2:
                            case 3: {
                                var5_10 = 8;
                                var6_12 = 0;
                                var7_14 = var10_20 == 2 ? this.creditScrollX : this.creditScrollX2;
                                var8_16 = 176;
                                var9_19 = 3;
                            }
                        }
                        this.drawBriefingAnim(var1_1, var5_10, var6_12, var7_14, var8_16, this.stateTimer % var9_19);
                        ++var10_20;
                    }
                    ++this.stateTimer;
                    break;
                }
                case 16: {
                    if (this.heldKeyAction != 0 && this.stateTimer != 10) {
                        this.stateTimer = 10;
                        this.animFrameIndex = 0;
                        this.clearInputQueue();
                    }
                    this.drawReturnHint(var1_1);
                    if (this.stateTimer == 0) {
                        GameScreen.playSound(2, 1, 140);
                        this.levelStartMs = System.currentTimeMillis() - this.levelStartMs;
                        var1_1.setColor(65280);
                        var1_1.drawString("任务" + GameScreen.taskNumberChars.substring(GameScreen.instance.levelIndex, GameScreen.instance.levelIndex + 1) + "完成", GameScreen.screenWidth / 2, 35, 17);
                        var1_1.drawString("击毙敌人: " + this.killCount, 36, 74, 20);
                        var1_1.drawString("所用时间: " + GameScreen.formatTime(this.levelStartMs), 36, 105, 20);
                        this.stateTimer = 1;
                        this.animFrameIndex = 0;
                        break;
                    }
                    var1_1.setColor(0);
                    var1_1.fillRect(54, 125, 60, 50);
                    if (this.stateTimer == 10) {
                        if (!this.drawBriefingAnim(var1_1, 0, 14, 84, 175, this.animFrameIndex++)) break;
                        this.stateTimer = 0;
                        this.clearInputQueue();
                        if (this.levelIndex != 7) {
                            ++this.levelIndex;
                            this.releaseLevel();
                            this.state = 2;
                            if ((byte)this.levelIndex > GameScreen.saveData[0]) {
                                GameScreen.saveData[0] = (byte)this.levelIndex;
                            }
                            GameScreen.saveData[1] = (byte)this.levelIndex;
                            this.accessSaveData(0);
                        } else {
                            this.state = 15;
                            this.creditScrollX = -176;
                            this.creditScrollX2 = -20;
                        }
                        System.gc();
                        break;
                    }
                    this.drawBriefingAnim(var1_1, 0, 0, 84, 175, this.animFrameIndex++);
                    break;
                }
                case 19: {
                    if (this.stateTimer == 0) {
                        this.player.setFrame(1);
                        this.player.targetVelX = GameScreen.instance.levelIndex == 4 ? this.cameraVelX : 0;
                        this.player.accelX = 0;
                        this.player.targetVelY = 0;
                        this.player.accelY = 0;
                    } else if (this.stateTimer == 11) {
                        switch (this.levelIndex) {
                            case 0:
                            case 6:
                            case 7: {
                                this.player.targetVelX = 8192;
                                this.player.setFrame(2);
                                break;
                            }
                            case 1:
                            case 3: {
                                ++this.stateTimer;
                                this.player.setFrame(0 | this.player.facingFlag);
                                break;
                            }
                            case 2: {
                                this.player.targetVelX = 12288;
                                this.player.startLeapRight(-10240);
                                this.player.subState = 4;
                                ++this.stateTimer;
                                break;
                            }
                            case 4: {
                                this.player.targetVelX = 15360;
                            }
                        }
                    }
                    if ((this.levelIndex == 1 || this.levelIndex == 3) && this.stateTimer > 11) {
                        if (this.stateTimer++ > 23) {
                            this.state = 16;
                            this.heldKeyAction = 0;
                            this.stateTimer = 0;
                            break;
                        }
                        this.fillScreenColor(var1_1, this.stateTimer - 11);
                        break;
                    }
                    if (this.player.posX > this.cameraX + GameScreen.viewWidthFx + 10240) {
                        this.player.targetVelX = 0;
                        if (this.stateTimer++ > 32) {
                            this.state = 16;
                            this.heldKeyAction = 0;
                            this.cameraVelY = 0;
                            this.stateTimer = 0;
                            break;
                        }
                        this.fillScreenColor(var1_1, this.stateTimer - 20);
                        break;
                    }
                    this.updateWorld();
                    this.renderWorld(var1_1);
                    if (this.stateTimer < 11) {
                        ++this.stateTimer;
                        break;
                    }
                    this.stateTimer = 20;
                    break;
                }
                case 13: {
                    if (this.stateTimer == 0) {
                        var5_11 = 0;
                        while (var5_11 < this.pixelBuffer.length) {
                            this.pixelBuffer[var5_11] = 24603;
                            ++var5_11;
                        }
                        ++this.stateTimer;
                    }
                    if ((var5_11 = this.pollInputAction()) == 4) {
                        if (--this.menuSelection < 0) {
                            this.menuSelection = 3;
                        }
                    } else if (var5_11 == 8) {
                        if (++this.menuSelection > 3) {
                            this.menuSelection = 0;
                        }
                    } else if (var5_11 == 16) {
                        switch (this.menuSelection) {
                            case 0: {
                                this.heldKeyAction = 0;
                                this.state = 10;
                                break;
                            }
                            case 1: {
                                GameScreen.saveData[2] = GameScreen.saveData[2] == 0 ? 1 : 0;
                                break;
                            }
                            case 2: {
                                this.levelResourcesReady = true;
                                this.clearInputQueue();
                                this.menuVisibleMax = 0;
                                this.hudBlinkCounter = 0;
                                this.menuSelection = 0;
                                this.inTaskSelectMenu = false;
                                this.state = 4;
                                break;
                            }
                            case 3: {
                                this.accessSaveData(0);
                                this.painting = false;
                                this.midlet.notifyDestroyed();
                                return;
                            }
                        }
                        this.stateTimer = 0;
                        GameScreen.playSound(3, 1, 100);
                        if (this.menuSelection != 1) break;
                    }
                    this.renderWorld(var1_1);
                    var1_1.setClip(0, 0, GameScreen.screenWidth, GameScreen.screenHeight);
                    var1_1.setColor(240, 176, 0);
                    var1_1.drawRect(44, 45, 88, 78);
                    this.directGraphics = DirectUtils.getDirectGraphics((Graphics)var1_1);
                    this.directGraphics.drawPixels(this.pixelBuffer, true, 0, 87, 45, 46, 87, 39, 0, 4444);
                    this.directGraphics.drawPixels(this.pixelBuffer, true, 0, 87, 45, 85, 87, 38, 0, 4444);
                    var6_13 = 0;
                    var7_15 = 0;
                    while (var7_15 < 4) {
                        if (this.menuSelection == var7_15) {
                            var1_1.setColor(0xFFFFFF);
                        } else {
                            var1_1.setColor(96, 192, 255);
                        }
                        if (var7_15 == 0) {
                            var6_13 = 8;
                        } else if (var7_15 == 1) {
                            var6_13 = GameScreen.saveData[2] == 1 ? 3 : 7;
                        } else if (var7_15 == 2) {
                            var6_13 = 9;
                        } else if (var7_15 == 3) {
                            var6_13 = 6;
                        }
                        var1_1.drawString(GameMIDlet.menuTexts[var6_13], 56, 56 + var7_15 * 16, 20);
                        ++var7_15;
                    }
                    break;
                }
                case 3:
                case 6: {
                    if (this.heldKeyAction != 0) {
                        this.state = 4;
                        this.inTaskSelectMenu = false;
                        this.stateTimer = 0;
                        this.clearInputQueue();
                        GameScreen.currentText = null;
                        System.gc();
                        break;
                    }
                    if (this.stateTimer == 0) {
                        if (this.state == 6) {
                            this.loadTextFromBin(0);
                            var8_17 = 3;
                        } else {
                            this.loadTextFromBin(1);
                            var8_17 = 25;
                        }
                        GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                        var1_1.setFont(Font.getFont((int)0, (int)1, (int)8));
                        var1_1.setColor(65280);
                        this.drawWrappedText(var1_1, 20, var8_17, 14);
                        ++this.stateTimer;
                    }
                    this.drawReturnHint(var1_1);
                    break;
                }
                case 20: {
                    this.fillScreenColor(var1_1, this.stateTimer++);
                    if (this.stateTimer <= 12) break;
                    this.stateTimer = 0;
                    this.player.actionFlag = false;
                    this.player.linkedEnemy = null;
                    this.menuSelection = 0;
                    this.heldKeyAction = 0;
                    if (this.player.spareO == 16 && this.player.spareP == 16) {
                        this.state = 16;
                        break;
                    }
                    if (this.player.health <= 0) {
                        this.state = 18;
                        break;
                    }
                    this.player.setFrame(0);
                    this.player.facingFlag = 0;
                    this.player.posX = this.player.spareO << 10;
                    this.player.posY = this.player.spareP << 10;
                    var8_18 = GameScreen.playHeight << 10;
                    GameScreen.instance.cameraX = this.player.posX - GameScreen.viewWidthFx / 5;
                    GameScreen.instance.cameraY = this.player.posY - var8_18 * 3 / 4;
                    this.tileMap.invalidateBuffer();
                    this.state = 10;
                }
            }
        }
        catch (Exception v1) {}
        this.painting = false;
    }

    public final void updateWorld() {
        int n;
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int[] nArray = new int[10];
        n2 = 0;
        while (n2 < this.drawQueueCount) {
            this.drawQueue[n2] = null;
            ++n2;
        }
        this.drawQueueCount = 0;
        n2 = 0;
        while (n2 < this.levelLoader.blockActorIndices[this.levelLoader.currentBlock].length) {
            n = this.levelLoader.blockActorIndices[this.levelLoader.currentBlock][n2];
            if (n != 0 && LevelLoader.activeActors[n] != null && LevelLoader.activeActors[n].active && LevelLoader.activeActors[n].typeId != 0) {
                if (this.isPickupType(LevelLoader.activeActors[n].typeId)) {
                    nArray[n4++] = n;
                } else {
                    this.drawQueue[this.drawQueueCount++] = LevelLoader.activeActors[n];
                }
            }
            ++n2;
        }
        if (this.levelIndex != 4) {
            this.drawQueue[this.drawQueueCount++] = this.player;
        }
        if (this.enemyAliveCount > 0) {
            n2 = 0;
            while (n2 < 2) {
                n3 = 0;
                while (n3 < 3) {
                    if (this.enemyGrid[n2][n3].active) {
                        if (this.enemyGrid[n2][n3].trailEffect != null && this.enemyGrid[n2][n3].trailEffect.active) {
                            this.drawQueue[this.drawQueueCount++] = this.enemyGrid[n2][n3].trailEffect;
                        }
                        this.drawQueue[this.drawQueueCount++] = this.enemyGrid[n2][n3];
                    }
                    ++n3;
                }
                ++n2;
            }
            if (this.levelIndex == 4 && this.boss != null) {
                if (this.boss.active) {
                    this.drawQueue[this.drawQueueCount++] = this.boss;
                }
                if (this.boss.minion != null && this.boss.minion.active) {
                    this.drawQueue[this.drawQueueCount++] = this.boss.minion;
                }
            }
        }
        if (this.levelIndex == 4) {
            this.drawQueue[this.drawQueueCount++] = this.player;
        }
        n2 = 0;
        while (n2 < n4) {
            this.drawQueue[this.drawQueueCount++] = LevelLoader.activeActors[nArray[n2]];
            ++n2;
        }
        n3 = 0;
        while (n3 < 5) {
            if (this.projectilePools[n3] != null) {
                n2 = 0;
                while (n2 < this.projectilePools[n3].length) {
                    if (this.projectilePools[n3][n2].active) {
                        this.drawQueue[this.drawQueueCount++] = this.projectilePools[n3][n2];
                    }
                    ++n2;
                }
            }
            ++n3;
        }
        n2 = 0;
        while (n2 < this.drawQueueCount) {
            this.drawQueue[n2].stepPhysics();
            ++n2;
        }
        n2 = 0;
        while (n2 < this.drawQueueCount) {
            this.drawQueue[n2].update();
            ++n2;
        }
        this.updateCamera();
        n = this.cameraX >> 10;
        int n5 = this.cameraY >> 10;
        if (this.levelIndex != 4) {
            this.levelLoader.streamScreenTransitionTo(n, n5);
        }
        this.tileMap.setViewportOrigin(n, n5);
    }

    public final void renderWorld(Graphics graphics) {
        int n;
        int n2 = this.cameraX >> 10;
        int n3 = this.cameraY >> 10;
        this.tileMap.draw(graphics);
        int n4 = 0;
        while (n4 < this.drawQueueCount) {
            this.drawQueue[n4].paint(graphics, n2, n3);
            ++n4;
        }
        graphics.setClip(0, 176, 176, 32);
        graphics.drawImage(this.hudImage, 0, 176, 20);
        graphics.setClip(25, 201, 40, 2);
        if (this.player.health > 6) {
            graphics.setColor(65280);
        } else if (this.player.health >= 4) {
            graphics.setColor(200, 200, 0);
        } else {
            graphics.setColor(0xFF0000);
        }
        graphics.fillRect(25, 201, this.player.health << 2, 2);
        graphics.setClip(161, 186, 8, 8);
        ++this.hudBlinkCounter;
        if (this.levelIndex == 4) {
            graphics.drawImage(this.hudImage, 89, 154, 20);
        } else {
            graphics.drawImage(this.hudImage, 161 - this.player.grenadeCount * 8, 154, 20);
        }
        graphics.setColor(0);
        graphics.fillRect(80, 180, 44, 15);
        if (this.state == 10 && this.showIndicator && this.hudBlinkCounter % 2 == 0) {
            this.drawNumber(graphics, this.indicatorValue, 150, 162, this.levelIndex == 7, false);
        }
        int n5 = 0;
        graphics.setClip(0, 0, screenWidth, screenHeight);
        graphics.setColor(66, 214, 198);
        switch (this.player.weaponIndex) {
            case 0: {
                n5 = 99;
                break;
            }
            case 1: {
                n5 = this.player.ammoReserveB;
                break;
            }
            case 2: {
                n5 = this.player.ammoReserveC;
            }
        }
        if (this.hudBlinkCounter > 1) {
            graphics.drawRect(76 + this.player.weaponIndex * 20, 195, 16, 10);
        }
        int n6 = this.player.magazineAmmo % 10;
        int n7 = this.player.magazineAmmo / 10;
        if (this.player.magazineAmmo != 0 || this.player.magazineAmmo == 0 && this.hudBlinkCounter > 1) {
            n = this.player.magazineAmmo == 0 ? 99 : 0;
            graphics.setClip(82, 184, 8, 8);
            graphics.drawImage(this.hudImage, 82 - n7 * 8 - n, 152, 20);
            graphics.setClip(90, 184, 8, 8);
            graphics.drawImage(this.hudImage, 90 - n6 * 8 - n, 152, 20);
        }
        graphics.setClip(100, 184, 8, 8);
        graphics.drawImage(this.hudImage, 20, 152, 20);
        n = n5 % 10;
        graphics.setClip(110, 184, 8, 8);
        graphics.drawImage(this.hudImage, 110 - (n5 /= 10) * 8, 152, 20);
        graphics.setClip(118, 184, 8, 8);
        graphics.drawImage(this.hudImage, 118 - n * 8, 152, 20);
        if (this.hudBlinkCounter > 1) {
            graphics.setClip(5, 196, 8, 8);
            graphics.drawImage(this.hudImage, -84, 164, 20);
        }
        if (this.hudBlinkCounter > 3) {
            this.hudBlinkCounter = -1;
        }
        if (this.levelIndex < 3) {
            graphics.setClip(0, 0, 176, 176);
            graphics.setColor(0xFFFFFF);
            int n8 = 0;
            while (n8 < 4) {
                int n9 = GameMIDlet.nextRandomMod(176);
                int n10 = GameMIDlet.nextRandomMod(176);
                if (n8 % 2 == 0) {
                    graphics.drawLine(n9, n10, n9 - 5, n10 + 11);
                } else {
                    graphics.drawLine(n9, n10, n9 - 3, n10 + 6);
                }
                ++n8;
            }
        }
    }

    public final void initCamera() {
        int n = screenWidth << 10;
        int n2 = playHeight << 10;
        int n3 = this.tileMap.getPixelWidth();
        int n4 = this.tileMap.getPixelHeight();
        n3 <<= 10;
        n4 <<= 10;
        this.player.posX = this.levelLoader.actorSpawnX[0] << 10;
        this.player.posY = this.levelLoader.actorSpawnY[0] << 10;
        this.cameraX = this.player.posX - n / 5;
        this.cameraY = this.player.posY - n2 * 3 / 4;
        if (this.cameraX > n3 - n) {
            this.cameraX = n3 - n;
        }
        if (this.cameraX < 0) {
            this.cameraX = 0;
        }
        if (this.cameraY > n4 - n2) {
            this.cameraY = n4 - n2;
        }
        if (this.cameraY < 0) {
            this.cameraY = 0;
        }
        int n5 = this.cameraX >> 10;
        int n6 = this.cameraY >> 10;
        this.levelLoader.activateScreenAt(n5, n6);
        this.tileMap.invalidateBuffer();
        this.tileMap.setViewportOrigin(n5, n6);
    }

    public final void updateCamera() {
        int n = playHeight << 10;
        int n2 = this.tileMap.getPixelWidth();
        int n3 = this.tileMap.getPixelHeight();
        n2 <<= 10;
        n3 <<= 10;
        if (this.isCutsceneEntry) {
            this.cameraVelX = 0;
            return;
        }
        switch (this.levelIndex) {
            case 0: {
                if (this.scriptFlagL || this.cameraX >> 14 != 33 || this.cameraY >> 14 != 11) break;
                this.scriptFlagL = true;
                this.cameraVelY = 0;
                this.cameraVelX = 0;
                this.cameraX = 540672;
                this.cameraY = 180224;
                break;
            }
            case 1: {
                if (this.scriptFlagL) {
                    if (this.enemyAliveCount < 0) {
                        this.enemyAliveCount = 0;
                    }
                    if (this.enemyAliveCount == 0 && this.reinforceBudget > 0) {
                        int n4 = 425984;
                        instance.spawnEnemyWave(2, 1, GameScreen.instance.cameraX + viewWidthFx, n4, 1, 1);
                        n4 = 507904;
                        instance.spawnEnemyWave(1, 2, GameScreen.instance.cameraX + viewWidthFx, n4, 1, 1);
                        --this.reinforceBudget;
                    }
                    this.indicatorValue = this.enemyAliveCount + this.reinforceBudget * 3;
                    break;
                }
                int n5 = this.cameraX >> 14;
                if (n5 != 43 && n5 != 44 || this.cameraY >> 14 != 22) break;
                this.scriptFlagL = true;
                this.showIndicator = true;
                this.reinforceBudget = 4;
                this.cameraVelX = 0;
                this.cameraVelY = 0;
                this.cameraY = 360448;
                this.cameraX = 720896;
                break;
            }
            case 2: {
                if (this.state != 21) break;
                this.cameraX += this.cameraVelX;
                if (this.cameraX > n2 - viewWidthFx) {
                    this.cameraX = n2 - viewWidthFx;
                    this.cameraVelX = 0;
                    this.stateTimer = 0;
                    this.scriptFlagL = true;
                } else if (this.cameraX < 0 && this.scriptFlagL) {
                    this.cameraX = 0;
                    this.state = 10;
                    this.heldKeyAction = 0;
                    this.scriptFlagL = false;
                    this.stateTimer = 0;
                    this.cameraVelX = 0;
                }
                if (this.cameraY < 0) {
                    this.cameraY = 0;
                }
                return;
            }
            case 3: {
                if (this.scriptFlagL || this.scriptStageAc != 0) break;
                int n6 = this.cameraX >> 14;
                int n7 = this.cameraY >> 14;
                int n8 = this.player.posX >> 14;
                int n9 = this.player.posY >> 14;
                if (n8 <= 66 || n9 <= 0 || n6 != 68) break;
                this.cameraVelX = 0;
                if (n7 == 5) {
                    this.scriptFlagL = true;
                    this.cameraVelY = 0;
                    this.cameraVelX = 0;
                    this.cameraX = 0x110000;
                    this.cameraY = 81920;
                    ++this.scriptStageAc;
                    break;
                }
                this.cameraVelY = 8192;
                break;
            }
            case 4: {
                this.cameraX += this.cameraVelX;
                if (this.player.linkedBoss != null) {
                    this.player.linkedBoss.posX = this.player.posX + 23552;
                }
                if (this.reinforceBudget > 0) {
                    return;
                }
                if (this.enemyAliveCount < 0) {
                    this.enemyAliveCount = 0;
                }
                if (this.enemyAliveCount == 0) {
                    if (this.airdropWaveCount < 5) {
                        this.spawnAirdropWave();
                    } else if (GameScreen.instance.state == 10) {
                        GameScreen.instance.state = 19;
                    }
                }
                this.indicatorValue = this.enemyAliveCount + (5 - this.airdropWaveCount) * 4;
                this.showIndicator = true;
                return;
            }
            case 6: {
                if (!this.scriptFlagL && this.scriptStageAc == 0 && this.cameraX >> 14 == 33) {
                    if (this.cameraY >> 14 != 22) break;
                    this.scriptFlagL = true;
                    this.cameraVelY = 0;
                    this.cameraVelX = 0;
                    this.cameraX = 671744;
                    this.cameraY = 442368;
                    ++this.scriptStageAc;
                    break;
                }
                if (GameScreen.instance.state != 19) break;
                this.cameraVelY = this.indicatorToggle ? -1536 : 1536;
                this.indicatorToggle = !this.indicatorToggle;
                break;
            }
            case 7: {
                if (this.state == 10 || this.state == 19) {
                    int n10 = this.cameraX >> 10;
                    int n11 = this.player.posX >> 10;
                    int n12 = n11 - this.bossTriggerX;
                    if (n12 < 176) {
                        this.cameraVelY = n12 > 50 ? (this.indicatorToggle ? -1536 : 1536) : (this.indicatorToggle ? -2048 : 2048);
                        boolean bl = this.indicatorToggle = !this.indicatorToggle;
                    }
                    if (this.bossTriggerX == 0) {
                        this.bossTriggerX = 30;
                    }
                    this.bossTriggerX += 2;
                    if (n12 < 0) {
                        n12 = 0;
                    }
                    this.indicatorValue = n12;
                    this.showIndicator = true;
                    if (this.bossTriggerX <= n10) break;
                    int n13 = this.bossTriggerX - n10;
                    if (n13 > 172) {
                        this.bossTriggerX = n10 + 172;
                    }
                    this.spawnExplosionScatter(n13);
                    break;
                }
                if (this.state != 21) break;
                if (this.scriptFlagL) {
                    this.cameraVelY = this.cameraVelY > 0 ? -2048 : 2048;
                    this.cameraY += this.cameraVelY;
                    if (this.stateTimer <= 12) break;
                    this.spawnExplosionScatter(this.stateTimer * 3);
                    break;
                }
                this.cameraX += this.cameraVelX;
                if (this.cameraX < 0) {
                    this.scriptFlagL = true;
                    this.cameraX = 0;
                }
                return;
            }
        }
        if (!GameScreen.instance.scriptFlagL) {
            this.cameraX += this.cameraVelX;
            this.cameraY += this.cameraVelY;
            if (this.cameraVelX > 0) {
                if (this.player.posX - this.cameraX < viewWidthFx / 5) {
                    this.cameraX = this.player.posX - viewWidthFx / 5;
                }
            } else if (this.cameraVelX < 0 && this.player.posX - this.cameraX > viewWidthFx * 4 / 5) {
                this.cameraX = this.player.posX - viewWidthFx * 4 / 5;
            }
            if (this.cameraVelY > 0) {
                if (this.cameraY > this.player.posY - n / 3) {
                    this.cameraY = this.player.posY - n / 3;
                }
            } else if (this.cameraVelY < 0 && this.cameraY < this.player.posY - n * 3 / 4) {
                this.cameraY = this.player.posY - n * 3 / 4;
            }
        }
        if (this.cameraX > n2 - viewWidthFx) {
            this.cameraX = n2 - viewWidthFx;
        }
        if (this.cameraX < 0) {
            this.cameraX = 0;
        }
        if (this.cameraY > n3 - n + (this.levelIndex == 7 ? 2048 : 0)) {
            this.cameraY = n3 - n;
        }
        if (this.cameraY < 0) {
            this.cameraY = 0;
        }
    }

    public final void initGameResources() {
        this.drawQueue = new ActorBase[40];
        this.projectilePools = new ProjectileActor[5][];
        LevelLoader.initBootSprites(this);
        GameScreen.loadSounds();
        this.accessSaveData(1);
    }

    public final void loadLevelStep(int n) {
        this.levelLoaded = false;
        switch (this.stateTimer) {
            case 0: {
                System.gc();
                this.isCutsceneEntry = n != 4;
                this.stateTimer = 1;
                return;
            }
            case 1: {
                if (!this.levelResourcesReady) {
                    this.levelLoader = LevelLoader.loadLevel(this, n);
                } else {
                    LevelLoader.tileMap.reloadColumnData(n);
                }
                this.stateTimer = 2;
                return;
            }
            case 2: {
                if (!this.levelResourcesReady) {
                    this.tileMap = LevelLoader.tileMap;
                }
                this.initCamera();
                this.stateTimer = 3;
                return;
            }
            case 3: {
                if (LevelLoader.spriteDefPool[21] == null) {
                    LevelLoader.retainSpriteDef(21);
                    this.projectilePools[0] = new ProjectileActor[10];
                    int n2 = 0;
                    while (n2 < 10) {
                        this.projectilePools[0][n2] = new ProjectileActor(21, LevelLoader.spriteDefPool[21], this);
                        ++n2;
                    }
                }
                this.stateTimer = 4;
                return;
            }
            case 4: {
                if (LevelLoader.spriteDefPool[10] == null) {
                    LevelLoader.retainSpriteDef(10);
                }
                if (this.projectilePools[1] == null) {
                    this.projectilePools[1] = new ProjectileActor[3];
                    int n3 = 0;
                    while (n3 < 3) {
                        this.projectilePools[1][n3] = new ProjectileActor(10, LevelLoader.spriteDefPool[10], this);
                        ++n3;
                    }
                }
                this.stateTimer = 5;
                return;
            }
            case 5: {
                if (LevelLoader.spriteDefPool[20] == null) {
                    LevelLoader.retainSpriteDef(20);
                    this.projectilePools[2] = new ProjectileActor[6];
                    int n4 = 0;
                    while (n4 < 6) {
                        this.projectilePools[2][n4] = new ProjectileActor(20, LevelLoader.spriteDefPool[20], this);
                        ++n4;
                    }
                }
                this.stateTimer = 6;
                return;
            }
            case 6: {
                if (LevelLoader.spriteDefPool[15] == null) {
                    LevelLoader.retainSpriteDef(15);
                    this.projectilePools[3] = new ProjectileActor[2];
                    int n5 = 0;
                    while (n5 < 2) {
                        this.projectilePools[3][n5] = new ProjectileActor(15, LevelLoader.spriteDefPool[15], this);
                        ++n5;
                    }
                }
                if (this.levelIndex == 2 || this.levelIndex == 4) {
                    LevelLoader.retainSpriteDef(6);
                }
                this.stateTimer = 7;
                return;
            }
            case 7: {
                if (LevelLoader.spriteDefPool[16] == null) {
                    LevelLoader.retainSpriteDef(16);
                    this.projectilePools[4] = new ProjectileActor[10];
                    int n6 = 0;
                    while (n6 < 10) {
                        this.projectilePools[4][n6] = new ProjectileActor(16, LevelLoader.spriteDefPool[16], this);
                        ++n6;
                    }
                }
                this.stateTimer = 8;
                return;
            }
            case 8: {
                switch (this.levelIndex) {
                    case 0:
                    case 1:
                    case 3:
                    case 4:
                    case 6: {
                        if (this.enemyGrid == null) {
                            this.enemyGrid = new EnemyActor[2][];
                            LevelLoader.retainSpriteDef(2);
                            this.enemyGrid[0] = new EnemyActor[3];
                            int n7 = 0;
                            while (n7 < 3) {
                                this.enemyGrid[0][n7] = new EnemyActor(2, LevelLoader.spriteDefPool[2], this);
                                ++n7;
                            }
                            LevelLoader.retainSpriteDef(1);
                            this.enemyGrid[1] = new EnemyActor[3];
                            int n8 = 0;
                            while (n8 < 3) {
                                this.enemyGrid[1][n8] = new EnemyActor(1, LevelLoader.spriteDefPool[1], this);
                                ++n8;
                            }
                        }
                        if (this.levelIndex != 4 || this.boss != null) break;
                        this.boss = new BossActor(8, LevelLoader.spriteDefPool[8], this);
                        this.boss.minion = new EnemyActor(1, LevelLoader.spriteDefPool[1], this);
                    }
                }
                this.stateTimer = 9;
                return;
            }
            case 9: {
                LevelLoader.releaseUnusedSpriteDefs();
                this.player.resetForLevel();
                this.resetSpawnPools();
                this.enemyAliveCount = 0;
                this.airdropWaveCount = 0;
                this.reinforceBudget = 30;
                this.flagE = false;
                this.scriptFlagL = false;
                this.showIndicator = false;
                this.levelLoaded = true;
                this.scriptStageAc = 0;
                this.stateTimer = 0;
                this.bossTriggerX = 0;
            }
        }
    }

    public final void run() {
        try {
            long l2 = System.currentTimeMillis();
            while (this.loopThread != null) {
                if (!this.running || this.painting) continue;
                long l3 = System.currentTimeMillis() - l2;
                if (l3 < this.frameStepMs) {
                    Thread.sleep(this.frameStepMs - l3);
                    System.gc();
                }
                this.repaint();
                l2 = System.currentTimeMillis();
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    private int keyCodeToAction(int n) {
        int n2 = 0;
        switch (n) {
            case -1:
            case 1: {
                n2 = 4;
                break;
            }
            case -2:
            case 6: {
                n2 = 8;
                break;
            }
            case -3:
            case 2: {
                n2 = 1;
                break;
            }
            case -4:
            case 5: {
                n2 = 2;
                break;
            }
            case -6:
            case -5: {
                if (this.state == 10) break;
                n2 = 16;
                break;
            }
            case -7: {
                n2 = 4096;
                break;
            }
            case 42:
            case 48:
            case 55:
            case 56: {
                n2 = 16;
                break;
            }
            case 35:
            case 57: {
                if (this.state == 10) {
                    n2 = 32;
                    break;
                }
                n2 = 16;
                break;
            }
            case 51:
            case 54: {
                if (this.state == 10) {
                    n2 = 2048;
                    break;
                }
                n2 = 16;
                break;
            }
            case 49:
            case 50:
            case 52:
            case 53: {
                n2 = this.state == 10 ? 1024 : 16;
            }
        }
        return n2;
    }

    public final void keyPressed(int n) {
        int n2;
        if (n == -6 || n == -5) {
            if (this.state == 10) {
                this.clearInputQueue();
                this.menuSelection = 0;
                this.state = 13;
                return;
            }
            if (this.state == 4) {
                this.enqueueInputAction(16, false);
                return;
            }
        } else if (n == -7) {
            if (this.state == 10) {
                this.clearInputQueue();
                this.state = 22;
                this.stateTimer = 0;
                return;
            }
            if (this.state == 13) {
                this.state = 10;
                return;
            }
        }
        this.heldKeyAction = n2 = this.keyCodeToAction(n);
        this.enqueueInputAction(n2, false);
    }

    public final void keyReleased(int n) {
        this.heldKeyAction = 0;
    }

    public final ProjectileActor spawnProjectile(int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = 0;
        boolean bl = false;
        switch (n) {
            case 21: {
                n7 = 0;
                break;
            }
            case 10: {
                n7 = 1;
                break;
            }
            case 20: {
                n7 = 2;
                bl = true;
                break;
            }
            case 15: {
                n7 = 3;
                bl = true;
                break;
            }
            case 16: {
                n7 = 4;
                break;
            }
            default: {
                return null;
            }
        }
        int n8 = 0;
        while (n8 < this.projectilePools[n7].length) {
            if (!this.projectilePools[n7][n8].active) {
                this.projectilePools[n7][n8].posX = n4;
                this.projectilePools[n7][n8].posY = n5;
                this.projectilePools[n7][n8].launchOriginX = n4;
                this.projectilePools[n7][n8].setFrame(n2);
                this.projectilePools[n7][n8].active = true;
                this.projectilePools[n7][n8].loopAnimation = bl;
                this.projectilePools[n7][n8].frameCounter = 0;
                this.projectilePools[n7][n8].targetVelX = this.levelIndex == 4 ? this.cameraVelX : 0;
                this.projectilePools[n7][n8].targetVelY = 0;
                this.projectilePools[n7][n8].mode = n6;
                this.projectilePools[n7][n8].drawParam = n3;
                return this.projectilePools[n7][n8];
            }
            ++n8;
        }
        return null;
    }

    public final void releaseLevel() {
        int n = 0;
        while (n < this.drawQueueCount) {
            this.drawQueue[n] = null;
            ++n;
        }
        if (this.enemyGrid != null) {
            int n2 = 0;
            while (n2 < this.enemyGrid.length) {
                if (this.enemyGrid[n2] != null) {
                    int n3 = 0;
                    while (n3 < this.enemyGrid[n2].length) {
                        this.enemyGrid[n2][n3].trailEffect = null;
                        this.enemyGrid[n2][n3] = null;
                        ++n3;
                    }
                }
                this.enemyGrid[n2] = null;
                ++n2;
            }
            this.enemyGrid = null;
        }
        if (this.boss != null) {
            this.boss.minion = null;
            this.boss = null;
        }
        this.player.linkedBoss = null;
        this.levelLoader.disposeLevel();
        this.levelLoader = null;
        this.levelResourcesReady = false;
        System.gc();
    }

    public final boolean isPickupType(int n) {
        switch (n) {
            case 3:
            case 8:
            case 11:
            case 13: {
                return true;
            }
        }
        return false;
    }

    public final boolean spawnEnemyWave(int n, int n2, int n3, int n4, int n5, int n6) {
        if (n2 > 3 || n2 == 0) {
            return false;
        }
        int n7 = 0;
        int n8 = 0;
        if (this.enemyAliveCount < 0) {
            this.enemyAliveCount = 0;
        }
        int n9 = n == 2 ? 0 : 1;
        int n10 = 0;
        while (n10 < 3) {
            if (!this.enemyGrid[n9][n10].active) {
                EnemyActor h2 = this.enemyGrid[n9][n10];
                h2.setFrame(n5);
                h2.active = true;
                h2.loopAnimation = true;
                h2.aiming = false;
                h2.target = this.player;
                h2.timerB = 0;
                h2.lives = 1;
                h2.rhythmThreshold = 5;
                h2.hurtBlinkTimer = 0;
                h2.hitPoints = 0;
                h2.fromSpawner = true;
                switch (n6) {
                    case 0: {
                        h2.isPatroller = false;
                        h2.patrolRange = 0;
                        int n11 = GameMIDlet.nextRandomMod(160);
                        h2.posX = this.cameraX + 5120 + (n11 <<= 10);
                        if (h2.posX > this.cameraX + 90112) {
                            h2.targetVelX = 7168;
                        } else {
                            h2.targetVelX = 9216;
                            h2.setFrame(n5 | Integer.MIN_VALUE);
                        }
                        h2.targetVelY = 1024;
                        h2.posY = n4 - n7;
                        n7 += 20480;
                        h2.timerA = 0;
                        h2.aiState = 0;
                        if (h2.trailEffect == null) {
                            h2.trailEffect = new EffectActor(6, LevelLoader.spriteDefPool[6], this);
                        }
                        h2.trailEffect.active = true;
                        h2.trailEffect.posX = h2.posX;
                        h2.trailEffect.posY = h2.posY - 30720;
                        h2.trailEffect.setFrame(0);
                        break;
                    }
                    case 1: {
                        h2.posY = n4;
                        h2.targetVelX = 0;
                        h2.targetVelY = 0;
                        h2.isPatroller = true;
                        h2.attackRangeUpper = 40960;
                        h2.attackRangeLower = -40960;
                        h2.aiState = 7;
                        h2.posX = n3 + 20480;
                        h2.patrolDir = 0;
                        h2.patrolRange = 100;
                        h2.patrolLeftBound = this.cameraX + 61440;
                        h2.timerA = n8 << 3;
                        h2.patrolRightBound = n3 - 51200 + n8 * 20480;
                        if (n8 > 0) {
                            h2.hitPoints = 1;
                        }
                        if (n != 2) break;
                        h2.attackRangeUpper = 122880;
                        h2.patrolRightBound = n3 - 30720;
                        h2.patrolRange = 0;
                    }
                }
                ++this.enemyAliveCount;
                h2.drawParam = h2.hitPoints;
                h2.lives = h2.hitPoints + 1;
                if (++n8 == n2) {
                    return true;
                }
            }
            ++n10;
        }
        return false;
    }

    public final boolean spawnBossAttack(int n, int n2) {
        if (this.boss == null || this.boss.minion == null) {
            return false;
        }
        this.boss.active = true;
        this.boss.disabled = false;
        this.boss.visible = true;
        this.boss.posX = n;
        this.boss.posY = this.player.linkedBoss.posY - 3072;
        this.boss.targetVelX = n2;
        this.boss.setFrame(0);
        EnemyActor h2 = this.boss.minion;
        this.boss.minion.active = true;
        h2.attackRangeUpper = 40960;
        h2.attackRangeLower = -40960;
        if (n > this.player.posX) {
            h2.posX = this.boss.posX + 23552;
            h2.setFrame(2);
        } else {
            h2.posX = this.boss.posX - 23552;
            h2.setFrame(-2147483646);
        }
        h2.posY = this.player.posY - 2048;
        h2.targetVelX = this.boss.targetVelX;
        h2.targetVelY = 0;
        h2.patrolRange = 0;
        h2.lives = 2;
        h2.drawParam = 1;
        h2.hitPoints = 1;
        h2.aiState = 0;
        h2.target = this.player;
        h2.rhythmThreshold = 8;
        h2.hurtBlinkTimer = 0;
        h2.isPatroller = true;
        this.enemyAliveCount = this.enemyAliveCount < 0 ? 1 : ++this.enemyAliveCount;
        return true;
    }

    private int pollInputAction() {
        if (inputWriteIndex == inputReadIndex) {
            return 0;
        }
        int n = inputQueue[inputReadIndex];
        if (++inputReadIndex == inputQueueCap) {
            inputReadIndex = 0;
        }
        return n;
    }

    private void enqueueInputAction(int n, boolean bl) {
        GameScreen.inputQueue[GameScreen.inputWriteIndex] = bl ? n | Integer.MIN_VALUE : n;
        if (++inputWriteIndex >= inputQueueCap) {
            inputWriteIndex = 0;
        }
        if (inputWriteIndex == inputReadIndex && ++inputReadIndex >= inputQueueCap) {
            inputReadIndex = 0;
        }
    }

    public final void clearInputQueue() {
        inputWriteIndex = 0;
        inputReadIndex = 0;
    }

    private void spawnAirdropWave() {
        int n;
        int n2;
        int n3;
        int n4 = n3 = this.airdropWaveCount % 2 == 0 ? 2 : 1;
        if (this.player.posX < this.cameraX + 90112) {
            n2 = this.cameraX + 210944;
            n = 2048;
        } else {
            n2 = this.cameraX - 30720;
            n = this.cameraVelX + 6144;
        }
        if (this.spawnEnemyWave(n3, 3, this.cameraX, 0, 0, 0) && this.spawnBossAttack(n2, n)) {
            ++this.airdropWaveCount;
        }
    }

    public final void fillScreenColor(Graphics graphics, int n) {
        short s = (short)n;
        s = (short)(s << 12);
        int n2 = 0;
        while (n2 < this.pixelBuffer.length) {
            this.pixelBuffer[n2] = s;
            ++n2;
        }
        graphics.setClip(0, 0, screenWidth, screenHeight);
        this.blitPixelBuffer(graphics);
    }

    public final void blitPixelBuffer(Graphics graphics) {
        this.directGraphics = DirectUtils.getDirectGraphics((Graphics)graphics);
        int n = 0;
        while (n < 13) {
            this.directGraphics.drawPixels(this.pixelBuffer, true, 0, 176, 0, 16 * n, 176, 16, 0, 4444);
            ++n;
        }
    }

    public final void accessSaveData(int n) {
        try {
            RecordStore recordStore = RecordStore.openRecordStore((String)"TGS_CT", (boolean)true);
            RecordEnumeration recordEnumeration = recordStore.enumerateRecords(null, null, false);
            if (recordEnumeration.hasNextElement()) {
                int n2 = recordEnumeration.nextRecordId();
                switch (n) {
                    case 0: {
                        recordStore.setRecord(n2, saveData, 0, 3);
                        break;
                    }
                    case 1: {
                        saveData = recordStore.getRecord(n2);
                    }
                }
            } else {
                switch (n) {
                    case 0: {
                        recordStore.addRecord(saveData, 0, 3);
                        break;
                    }
                    case 1: {
                        GameScreen.saveData[0] = 0;
                        GameScreen.saveData[1] = 0;
                    }
                }
            }
            recordEnumeration.destroy();
            recordStore.closeRecordStore();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    private boolean drawBriefingAnim(Graphics graphics, int n, int n2, int n3, int n4, int n5) {
        short s = LevelLoader.spriteDefPool[n].getSequenceFrameCount(n2 & 0xFFFFFF);
        if (n5 >= s) {
            this.animFrameIndex = 0;
            n5 = 0;
        }
        LevelLoader.spriteDefPool[n].paintSequenceFrame(graphics, n3, n4, n2, n5, 0, 0);
        return n5 >= s - 1;
    }

    private void resetSpawnPools() {
        int n;
        int n2;
        if (this.projectilePools != null) {
            n2 = 0;
            while (n2 < 5) {
                if (this.projectilePools[n2] != null) {
                    n = 0;
                    while (n < this.projectilePools[n2].length) {
                        this.projectilePools[n2][n].active = false;
                        ++n;
                    }
                }
                ++n2;
            }
        }
        if (this.enemyGrid != null) {
            n2 = 0;
            while (n2 < this.enemyGrid.length) {
                if (this.enemyGrid[n2] != null) {
                    n = 0;
                    while (n < this.enemyGrid[n2].length) {
                        if (this.enemyGrid[n2][n].trailEffect != null) {
                            this.enemyGrid[n2][n].trailEffect.active = false;
                        }
                        this.enemyGrid[n2][n].active = false;
                        ++n;
                    }
                }
                ++n2;
            }
        }
    }

    private void drawBriefingScreen(Graphics graphics, int n) {
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int n5 = 1;
        graphics.setColor(65280);
        switch (this.levelIndex) {
            case 2: {
                n3 = 5;
                n4 = 45;
                n2 = 5;
                graphics.drawString("敌人绑架了化学专家", 78, 16, 17);
                break;
            }
            case 4: {
                n3 = 8;
                n4 = 50;
                n5 = 6;
                n2 = 4;
                graphics.drawString("敌人制造了巨型炸弹", 78, 16, 17);
                break;
            }
            case 0: {
                n3 = 0;
                break;
            }
            case 1: {
                n3 = 3;
                break;
            }
            case 3: {
                n3 = 7;
                break;
            }
            case 5: {
                n3 = 10;
                break;
            }
            case 6: {
                n3 = 11;
                break;
            }
            case 7: {
                n3 = 12;
            }
        }
        if (this.levelIndex != 2 && this.levelIndex != 4) {
            n4 = 30;
            n5 = 3;
            n2 = 13;
            graphics.drawString("总部呼叫红帽", screenWidth / 2, 16, 17);
        }
        if (LevelLoader.spriteDefPool[n2] == null) {
            LevelLoader.spriteDefPool[n2] = SpriteDef.loadFromBin(n2);
        }
        LevelLoader.spriteDefPool[n2].paintSequenceFrame(graphics, 145, n4, 0, n % n5, 0, 0);
        GameScreen.fillRectClipped(graphics, 135, 0, 25, 6, 0);
        GameScreen.fillRectClipped(graphics, 135, 34, 25, 25, 0);
        LevelLoader.spriteDefPool[0].paintSequenceFrame(graphics, 25, 212, 0, n % 3, 0, 0);
        GameScreen.fillRectClipped(graphics, 0, 200, 50, 8, 0);
        graphics.setColor(65280);
        graphics.setClip(0, 0, screenWidth, screenHeight);
        graphics.drawRect(5, 5, 166, 32);
        graphics.drawRect(5, 42, 166, 124);
        graphics.drawRect(5, 171, 166, 32);
        graphics.drawString("收到", 60, 180, 20);
        graphics.drawString("任务" + taskNumberChars.substring(GameScreen.instance.levelIndex, GameScreen.instance.levelIndex + 1), 15, 52, 20);
        this.drawTextLine(graphics, n3, 30, 72);
        if (this.levelIndex != 3 && this.levelIndex != 5 && this.levelIndex != 6) {
            graphics.drawString("注意", 15, 110, 20);
            this.drawTextLine(graphics, n3 + 1, 30, 130);
            if (this.levelIndex < 1) {
                this.drawTextLine(graphics, n3 + 2, 30, 150);
            }
        }
    }

    static final boolean isScrollLevel(int n) {
        switch (n) {
            case 1:
            case 2:
            case 8:
            case 10:
            case 15:
            case 16:
            case 20:
            case 21: {
                return true;
            }
        }
        return false;
    }

    public static final String formatTime(long l2) {
        int n = (int)((l2 /= 1000L) / 60L);
        int n2 = (int)(l2 % 60L);
        int n3 = n2 % 10;
        return new String(n + ":" + (n2 /= 10) + "" + n3);
    }

    public final void drawNumber(Graphics graphics, int n, int n2, int n3, boolean bl, boolean bl2) {
        int n4;
        int n5 = 1000;
        int n6 = 0;
        int n7 = 0;
        int n8 = n4 = bl ? 99 : 0;
        if (bl2) {
            graphics.setClip(n2 - 10, n3, 8, 8);
            graphics.drawImage(this.hudImage, n2 - 12 - 178, n3 - 32, 20);
        }
        if (n < 0) {
            n = 0;
        }
        int n9 = 0;
        while (n9 < 4) {
            n7 = n / n5;
            n %= n5;
            if (n7 != 0 || n7 == 0 && n6 != 0 || n9 == 3) {
                graphics.setClip(n2 + n6, n3, 8, 8);
                graphics.drawImage(this.hudImage, n2 + n6 - n7 * 8 - n4, n3 - 32, 20);
                n6 += 8;
            }
            n5 /= 10;
            ++n9;
        }
    }

    public static final void fillRectClipped(Graphics graphics, int n, int n2, int n3, int n4, int n5) {
        graphics.setClip(n, n2, n3, n4);
        graphics.setColor(n5);
        graphics.fillRect(n, n2, n3, n4);
    }

    public final void spawnExplosionScatter(int n) {
        int n2 = 0;
        while (n2 < 2) {
            int n3 = GameMIDlet.nextRandomMod(n);
            int n4 = GameMIDlet.nextRandomMod(160);
            instance.spawnProjectile(16, 0, 0, this.cameraX + (n3 <<= 10), this.cameraY + (n4 <<= 10), 2);
            ++n2;
        }
        GameScreen.playSound(5, 1, 220);
    }

    private void drawReturnHint(Graphics graphics) {
        if (this.hudBlinkCounter++ < 4) {
            graphics.setColor(65535);
            graphics.drawString("按任意键返回", 88, 187, 17);
            return;
        }
        graphics.setColor(0);
        graphics.fillRect(0, 187, 176, 23);
        if (this.hudBlinkCounter > 8) {
            this.hudBlinkCounter = 0;
        }
    }

    private void animateCursorExpand() {
        if (this.cursorExpanding) {
            this.cursorWidth += 8;
            this.hudBlinkCounter = 0;
            if (this.cursorWidth > 64) {
                this.cursorExpanding = false;
                return;
            }
        } else {
            this.cursorWidth -= 8;
            this.hudBlinkCounter = 1;
            if (this.cursorWidth < 48) {
                this.cursorExpanding = true;
            }
        }
    }

    private void resetCursorAnim() {
        this.hudBlinkCounter = 0;
        this.cursorWidth = 42;
        this.cursorExpanding = true;
    }

    public static final Image loadImageFromBin(int n) {
        String string = "/res/image.bin";
        Image image = null;
        InputStream inputStream = string.getClass().getResourceAsStream(string);
        try {
            int n2 = GameMIDlet.readI32Le(inputStream);
            int[] nArray = new int[n2];
            int n3 = 0;
            while (n3 < n2) {
                nArray[n3] = GameMIDlet.readI32Le(inputStream);
                ++n3;
            }
            int n4 = nArray[n + 1] - nArray[n];
            byte[] byArray = new byte[n4];
            inputStream.skip(nArray[n]);
            inputStream.read(byArray);
            image = Image.createImage((byte[])byArray, (int)0, (int)n4);
            inputStream.close();
            System.gc();
        }
        catch (Exception exception) {}
        return image;
    }

    public final void hideNotify() {
        if (this.state == 10) {
            this.menuSelection = 0;
            this.clearInputQueue();
            this.state = 13;
        }
    }

    public static final void loadSounds() {
        int n = 0;
        try {
            byte[] byArray;
            String string = "/res/sound.bin";
            InputStream inputStream = "/res/sound.bin".getClass().getResourceAsStream(string);
            int n2 = GameMIDlet.readI32Le(inputStream);
            int[] nArray = new int[n2];
            n = 0;
            while (n < n2) {
                nArray[n] = GameMIDlet.readI32Le(inputStream);
                ++n;
            }
            n = 0;
            while (n < n2 - 1) {
                int n3 = nArray[n + 1] - nArray[n];
                int n4 = n3 < 256 ? 1 : 5;
                byArray = new byte[n3];
                inputStream.read(byArray);
                GameScreen.sounds[n] = new Sound(byArray, n4);
                ++n;
            }
            byArray = null;
            inputStream.close();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public static final void playSound(int n, int n2, int n3) {
        if (sounds == null || sounds[n] == null) {
            return;
        }
        try {
            if (saveData[2] == 1) {
                if (currentSoundIndex >= 0 && sounds[currentSoundIndex].getState() == 0) {
                    return;
                }
                currentSoundIndex = n;
                sounds[n].setGain(n3);
                sounds[n].play(1);
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public final void loadTextFromBin(int n) {
        String string = "/res/x.bin";
        try {
            InputStream inputStream = string.getClass().getResourceAsStream(string);
            int n2 = GameMIDlet.readI32Le(inputStream);
            int[] nArray = new int[n2];
            int n3 = 0;
            while (n3 < n2) {
                nArray[n3] = GameMIDlet.readI32Le(inputStream);
                ++n3;
            }
            int n4 = (nArray[n + 1] - nArray[n]) / 2;
            inputStream.skip(nArray[n] + 2);
            char[] cArray = new char[n4 - 1];
            n3 = 0;
            while (n3 < n4 - 1) {
                cArray[n3] = (char)GameMIDlet.readU16Le(inputStream);
                ++n3;
            }
            currentText = new String(cArray);
            inputStream.close();
            System.gc();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public final void drawWrappedText(Graphics graphics, int n, int n2, int n3) {
        int n4 = 0;
        int n5 = 0;
        do {
            if ((n5 = currentText.indexOf(13, n4)) == -1) {
                graphics.drawString(currentText.substring(n4), n, n2, 20);
            } else {
                graphics.drawString(currentText.substring(n4, n5), n, n2, 20);
            }
            n2 += n3;
            n4 = n5 + 2;
        } while (n5 >= 0);
    }

    public final void drawTextLine(Graphics graphics, int n, int n2, int n3) {
        int n4 = 0;
        int n5 = 0;
        while (true) {
            n5 = currentText.indexOf(13, n4);
            if (n-- <= 0) break;
            n4 = n5 + 2;
        }
        if (n5 == -1) {
            graphics.drawString(currentText.substring(n4), n2, n3, 20);
            return;
        }
        graphics.drawString(currentText.substring(n4, n5), n2, n3, 20);
    }

    static {
        inputQueueCap = 4;
        inputQueue = new int[inputQueueCap];
        inputReadIndex = 0;
        inputWriteIndex = 0;
        saveData = new byte[]{0, 0, 1};
        soundCount = 6;
        sounds = new Sound[soundCount];
        currentSoundIndex = -1;
        taskNumberChars = "一二三四五六七八";
    }
}

