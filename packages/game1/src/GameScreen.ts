/**
 * 游戏1《红魔特种兵》主类 —— 主 Canvas + 主循环 Runnable（最核心，CFR ~2244 行）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/a.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 角色：继承 FullCanvas（→ shim Canvas），实现 Runnable（→ async run()）。
 *   持有关卡地图 f(tjge.b)、精灵库 g(tjge.j)、主角 j(tjge.f)、绘制队列 k(tjge.g[])、
 *   子弹/特效池 l(tjge.l[][])、敌兵阵 m(tjge.h[][])、Boss n(tjge.c)。
 *   状态机字段 p（见 docs/game1-红魔特种兵/游戏状态机.md），状态值：
 *     1=开机logo, 4=主菜单, 2=载入中, 22=任务简报, 21/14/19=过场, 10=游戏中,
 *     18=任务失败, 16=任务完成, 15=片尾, 13=暂停菜单, 3/6=帮助/关于, 20=主角死亡。
 *   静态字段 a/b=屏幕宽/可玩高, c=屏宽*1024(定点视宽), d=屏高, e=单例,
 *     P/am/an/ao=输入环形队列, Q=3字节存档[最高关,当前关,音效开关], S=音效数组, T=当前音效,
 *     U=当前文本(x.bin解出), V=任务编号汉字串。
 *
 * 方法名按契约表（同 (名,描述符) → 同 TS 名）。框架方法 paint/keyPressed/keyReleased/
 *   hideNotify/run 与 constructor 保留原名。
 *
 * 必要偏差（位级/逻辑一致，仅平台桥接处）：
 *   - extends FullCanvas → shim Canvas（全屏画布等价）。
 *   - Font.getFont(...)+setFont(...)：shim 无 Font，绘制用系统字体近似，故 setFont 整体省略并注释。
 *   - DirectGraphics(this.K)+drawPixels(short[],...)：shim 无 DirectGraphics，按 game1 像素管线
 *     用 RGB4444 short→ARGB 解码后经 Image.createRGBImage 生成图再 drawImage 贴出（见 b_G / paint case1,13）。
 *   - Image.createImage(byte[],off,len)（仅 f_I 内）→ getCachedImage("/res/image.bin", i)（按索引取预解码图）。
 *   - new Sound(byte[],gain)：第二参原为增益档，这里作为 Sound type 传入（音频暂静音，调用保留）。
 *   - RecordStore（RMS 存档，c_I）：shim 无 RMS，用 localStorage 复刻 3 字节存档读写，控制流保持一致。
 *   - System.gc() 删除；System.currentTimeMillis() → Date.now()。
 */
import {
  Canvas,
  Graphics,
  Image,
  Thread,
  Font,
  getResourceAsStream,
  getCachedImage,
  Sound,
} from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { TileMap } from "./TileMap.ts";
import { BossActor } from "./BossActor.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { EffectActor } from "./EffectActor.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { EnemyActor } from "./EnemyActor.ts";
import { LevelLoader } from "./LevelLoader.ts";
import { PickupActor } from "./PickupActor.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { GameState, ActorType, SEQUENCE_MASK, px } from "./constants.ts";

const INT_MIN = -2147483648; // Integer.MIN_VALUE / 0x80000000

// 原版：a extends FullCanvas implements Runnable（TS 无 Runnable 接口，run() 直接由 Thread 驱动）。
export class GameScreen extends Canvas {
  static screenWidth: number = 176;
  static playHeight: number = 176;
  static viewWidthFx: number = px(176);
  static screenHeight: number = 208;
  static instance: GameScreen;
  private frameStepMs: number = 100; // long（计时步长，不溢出，用 number）
  private running: boolean = false;
  private painting: boolean = false;
  private levelLoaded: boolean = false;
  private loopThread: Thread | null = null;
  private midlet: GameMIDlet;
  tileMap!: TileMap; // protected
  levelLoader!: LevelLoader; // protected
  hudImage: Image | null = null;
  menuImage: Image | null = null;
  player!: PlayerActor;
  drawQueue!: (ActorBase | null)[];
  projectilePools!: ((ProjectileActor | null)[] | null)[];
  enemyGrid!: ((EnemyActor | null)[] | null)[] | null;
  boss: BossActor | null = null;
  frameCounter: number = 0;
  state: number = 0;
  heldKeyAction: number = 0;
  cameraX: number = 0;
  cameraY: number = 0;
  cameraVelX: number = 0;
  cameraVelY: number = 0;
  drawQueueCount: number = 0;
  stateTimer: number = 0;
  levelIndex: number = 0;
  menuSelection: number = 0;
  enemyAliveCount: number = 0;
  airdropWaveCount: number = 0;
  reinforceBudget: number = 0;
  killCount: number = 0;
  levelStartMs: number = 0; // long（仅计时差，用 number）
  flagE: boolean = false;
  taskSelectIndex: number = 0;
  hudBlinkCounter: number = 0;
  menuVisibleMax: number = 0;
  animFrameIndex: number = 0;
  pixelBuffer!: Int16Array; // short[]
  // K：原 DirectGraphics 句柄；shim 无 DirectGraphics，仅作为 b_G 内像素贴图的占位（不持状态）。
  directGraphics: Graphics | null = null;
  scriptFlagL: boolean = false;
  showIndicator: boolean = false;
  indicatorToggle: boolean = false;
  indicatorValue: number = 0;
  private scriptStageAc: number = 0;
  private bossTriggerX: number = 0;
  private inTaskSelectMenu: boolean = false;
  private isCutsceneEntry: boolean = false;
  private levelResourcesReady: boolean = false;
  private menuActive: boolean = false;
  private cursorExpanding: boolean = false;
  private cursorWidth: number = 0;
  private creditScrollX: number = -176;
  private creditScrollX2: number = -20;
  static inputQueueCap: number;
  private static inputQueue: Int32Array;
  private static inputWriteIndex: number;
  private static inputReadIndex: number;
  static saveData: Int8Array;
  static soundCount: number;
  static sounds: (Sound | null)[];
  static currentSoundIndex: number;
  static currentText: string | null;
  static taskNumberChars: string;

  // static {} 静态初始化块（对应 Java 末尾 static {}）
  static {
    GameScreen.inputQueueCap = 4;
    GameScreen.inputQueue = new Int32Array(GameScreen.inputQueueCap);
    GameScreen.inputReadIndex = 0;
    GameScreen.inputWriteIndex = 0;
    GameScreen.saveData = new Int8Array([0, 0, 1]);
    GameScreen.soundCount = 6;
    GameScreen.sounds = new Array<Sound | null>(GameScreen.soundCount).fill(null);
    GameScreen.currentSoundIndex = -1;
    GameScreen.taskNumberChars = "一二三四五六七八";
  }

  /**
   * 构造主 Canvas（对应 CFR a.java:110 `a(GameMIDlet)`）。
   * 登记自身为单例 `instance`、保存宿主 MIDlet，按当前画布尺寸初始化
   * 屏宽 `screenWidth` 与可玩高 `playHeight`（屏高减 32px HUD 条），
   * 置初始状态为 Logo，创建并启动主循环线程 `loopThread`（驱动 `run()`），
   * 分配像素行缓冲 `pixelBuffer`（short[3600]，供 DirectGraphics 像素管线用）。
   * @param gameMIDlet 宿主 MIDlet，退出时经其 `notifyDestroyed()` 关闭应用
   */
  constructor(gameMIDlet: GameMIDlet) {
    super();
    GameScreen.instance = this;
    this.midlet = gameMIDlet;
    GameScreen.screenWidth = this.getWidth();
    GameScreen.playHeight = this.getHeight() - 32;
    this.state = GameState.Logo;
    this.loopThread = new Thread(this);
    this.loopThread.start();
    this.running = true;
    this.painting = false;
    this.levelResourcesReady = false;
    this.pixelBuffer = new Int16Array(3600);
  }

  /**
   * 精灵工厂：按类型 ID 实例化对应 Actor 子类（对应 CFR a.java:124 `g a(int,d)`）。
   * 映射：0→玩家 PlayerActor（并存入 `this.player`），10→子弹 ProjectileActor，
   * 1/2/18→敌兵 EnemyActor，4/5/6/7/9/12/19/22→特效 EffectActor，
   * 3/11/13→道具/关门 PickupActor，8/14/17→Boss/触发 BossActor，
   * 其余→精灵基类 ActorBase。被 LevelLoader 布置关卡单位时调用。
   * @param n 类型 ID（资源/布置表里的精灵种类）
   * @param d2 该类型对应的精灵帧定义
   */
  // a(int,tjge.d) → a_ITd（精灵工厂）
  createActor(n: number, d2: SpriteDef): ActorBase {
    switch (n) {
      case ActorType.Player: {
        this.player = new PlayerActor(n, d2, this);
        return this.player;
      }
      case ActorType.PlayerBounceShot: {
        return new ProjectileActor(n, d2, this);
      }
      case ActorType.ReconScoutEnemy:
      case ActorType.MeleeBomberEnemy:
      case ActorType.ScrollChaserHeavy: {
        return new EnemyActor(n, d2, this);
      }
      case ActorType.RescueTargetNpc:
      case ActorType.CaptureTrigger:
      case ActorType.ParachuteTrailEffect:
      case ActorType.ExplosiveBarrel:
      case ActorType.RegeneratingBarrier:
      case ActorType.GatedTrigger:
      case ActorType.TreasureChestProp:
      case ActorType.GrabAnchorZone: {
        return new EffectActor(n, d2, this);
      }
      case ActorType.AmmoSupplyPickup:
      case ActorType.HealthPickup:
      case ActorType.LevelExitGate: {
        return new PickupActor(n, d2, this);
      }
      case ActorType.AtvVehicleBoss:
      case ActorType.ScriptedFuseTrigger:
      case ActorType.DivingHazard: {
        return new BossActor(n, d2, this);
      }
    }
    return new ActorBase(n, d2);
  }

  /**
   * 总渲染分发器 / 帧入口（对应 CFR a.java:165-858 `paint(Graphics)`）。
   * 由主循环 `run()` 经 `repaint()` 每帧触发，按状态字 `state` 大 switch 分流：
   * 开机 Logo→主菜单→分步载入→任务简报→进场/卷动过场→游戏中→任务失败/完成→片尾，
   * 以及暂停菜单、帮助/关于、抓捕过场等（各状态值见类级 JSDoc 与《游戏状态机.md》）。
   * 游戏内分支统一「先 `updateWorld()` 更新逻辑、再 `renderWorld()` 绘制」；其余分支直接绘制菜单/过场全屏。
   * 进入置 `painting=true`、`++frameCounter`，退出置 `painting=false`，与 `run()` 的挂起标志互锁；
   * 整个 switch 包在 try/catch 中，绘制期异常被静默吞掉（与原版一致）。
   * @param var1_1 当前帧的图形上下文
   */
  /*
   * Unable to fully structure code（CFR 注：含不可完全结构化的跳转，已逐分支忠实还原）
   */
  paint(var1_1: Graphics): void {
    this.painting = true;
    ++this.frameCounter;
    try {
      switch (this.state) {
        case GameState.Logo: {
          if (this.stateTimer++ === 0) {
            this.hudImage = GameScreen.loadImageFromBin(8);
            var1_1.drawImage(this.hudImage!, 29, 55, 20);
            var1_1.setColor(238, 25, 33);
            var1_1.setFont(Font.getFont(0, 1, 0)); // SYSTEM/BOLD/MEDIUM
            var1_1.drawString("移动互连 无限可能", (GameScreen.screenWidth / 2) | 0, 128, 17);
            this.hudImage = GameScreen.loadImageFromBin(7);
            this.menuImage = GameScreen.loadImageFromBin(0);
            this.initGameResources();
            break;
          }
          if (this.stateTimer === 12) {
            GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0xffffff);
            var1_1.drawImage(this.hudImage!, 12, 12, 20);
            var1_1.drawImage(this.menuImage!, 88, 95, 17);
            var1_1.setColor(155, 166, 173);
            var1_1.drawString("新浪无线代理发行", 60, 142, 20);
            this.menuImage = null;
            this.hudImage = null;
            break;
          }
          if (this.stateTimer === 22) {
            this.menuImage = GameScreen.loadImageFromBin(1);
            GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
            var1_1.drawImage(this.menuImage!, 57, 80, 20);
            var1_1.setColor(0xffffff);
            var1_1.drawString("www.tickgame.com", 88, 120, 17);
            break;
          }
          if (this.stateTimer > 32 && this.stateTimer < 42) {
            let var2_2 = 0;
            while (var2_2 < this.pixelBuffer.length) {
              this.pixelBuffer[var2_2] = ((this.stateTimer - 32) << 16) >> 16; // (short)(w-32)
              const v0 = var2_2++;
              this.pixelBuffer[v0] = (this.pixelBuffer[v0] << 12) << 16 >> 16; // (short)(... << 12)
            }
            // this.K = DirectUtils.getDirectGraphics(var1_1);
            // K.drawPixels(J, true, 0, 72, 57, 60, 72, 48, 0, 4444);
            this.directGraphics = var1_1;
            this.drawPixels(var1_1, this.pixelBuffer, 0, 72, 57, 60, 72, 48);
            break;
          }
          if (this.stateTimer !== 42) break;
          this.stateTimer = 0;
          this.state = GameState.MainMenu;
          this.menuVisibleMax = 0;
          this.menuSelection = 0;
          this.hudBlinkCounter = 1;
          this.inTaskSelectMenu = false;
          this.menuImage = GameScreen.loadImageFromBin(2);
          GameScreen.playSound(0, 1, 160);
          break;
        }
        case GameState.MainMenu: {
          GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
          var1_1.drawImage(this.menuImage!, 18, 9, 20);
          LevelLoader.spriteDefPool[8]!.paintSequenceFrame(var1_1, 128, 190, INT_MIN, this.frameCounter % 3, 0, 0);
          LevelLoader.spriteDefPool[0]!.paintSequenceFrame(var1_1, 153, 159, INT_MIN, this.frameCounter % 3, 0, 0);
          var1_1.setClip(0, 0, GameScreen.screenWidth, GameScreen.screenHeight);
          if (this.menuActive) {
            const var2_3 = this.pollInputAction();
            if (var2_3 === 4) {
              if (!this.inTaskSelectMenu) {
                this.resetCursorAnim();
                if (--this.menuSelection < 0) {
                  this.menuSelection = 6;
                }
                this.menuVisibleMax = this.menuSelection;
              } else if (--this.taskSelectIndex < 0) {
                this.taskSelectIndex = GameScreen.saveData[0];
              }
            } else if (var2_3 === 8) {
              if (!this.inTaskSelectMenu) {
                this.resetCursorAnim();
                if (++this.menuSelection > 6) {
                  this.menuSelection = 0;
                }
                this.menuVisibleMax = this.menuSelection;
              } else if (++this.taskSelectIndex > GameScreen.saveData[0]) {
                this.taskSelectIndex = 0;
              }
            } else if (var2_3 === 16) {
              this.stateTimer = 0;
              if (this.inTaskSelectMenu) {
                if (this.levelResourcesReady && this.levelIndex !== this.taskSelectIndex) {
                  this.releaseLevel();
                }
                this.levelIndex = this.taskSelectIndex;
                GameScreen.saveData[1] = (this.levelIndex << 24) >> 24; // (byte)
                GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
                this.state = GameState.LevelLoading;
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
                  this.state = GameState.LevelLoading;
                  break;
                }
                case 1: {
                  this.levelIndex = GameScreen.saveData[1];
                  this.player.fullAmmoInit();
                  this.state = GameState.LevelLoading;
                  break;
                }
                case 2: {
                  this.inTaskSelectMenu = true;
                  this.taskSelectIndex = 0;
                  this.player.fullAmmoInit();
                  break;
                }
                case 3: {
                  GameScreen.saveData[2] = GameScreen.saveData[2] === 0 ? 1 : 0;
                  break;
                }
                case 4:
                case 5: {
                  this.state = this.menuSelection === 4 ? GameState.Help : GameState.About;
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
            var1_1.drawString("任务" + GameScreen.taskNumberChars.substring(this.taskSelectIndex, this.taskSelectIndex + 1), (GameScreen.screenWidth / 2) | 0, 190, 17);
            break;
          }
          var1_1.setFont(Font.getFont(64, 1, 8)); // PROPORTIONAL/BOLD/SMALL
          {
            const var2_3 = this.menuActive !== false ? 6 : this.menuVisibleMax;
            let var3_5 = 0;
            let var4_7 = 0;
            while (var4_7 <= var2_3) {
              if (this.menuActive && var4_7 === this.menuSelection && this.hudBlinkCounter === 0) {
                var1_1.setColor(0xffffff);
              } else {
                var1_1.setColor(65280);
              }
              var3_5 = var4_7 === 3 && GameScreen.saveData[2] !== 1 ? 7 : var4_7;
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
            const var5_9 = this.cursorWidth >>> 1;
            var1_1.drawLine(52 - var5_9, 100 + this.menuVisibleMax * 15, 52 + var5_9, 100 + this.menuVisibleMax * 15);
          }
          break;
        }
        case GameState.LevelLoading: {
          this.loadLevelStep(this.levelIndex);
          if (this.levelLoaded) {
            this.stateTimer = 0;
            this.state = GameState.MissionBriefing;
            break;
          }
          GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
          var1_1.setColor(0xff0000);
          var1_1.drawString("载入中", 65, 192, 20);
          {
            let var2_4 = 0;
            while (var2_4 < this.stateTimer) {
              var1_1.drawString(".", 110 + var2_4 * 3, 192, 20);
              ++var2_4;
            }
          }
          break;
        }
        case GameState.MissionBriefing: {
          if (this.heldKeyAction !== 0) {
            this.stateTimer = 71;
          }
          if (this.stateTimer === 0) {
            this.loadTextFromBin(2);
          }
          if (this.stateTimer++ <= 70) {
            GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
            this.drawBriefingScreen(var1_1, this.stateTimer);
            break;
          }
          if (this.stateTimer <= 70) break;
          GameScreen.currentText = null;
          // System.gc();
          this.stateTimer = 0;
          this.heldKeyAction = 0;
          if (!this.levelLoaded) {
            this.state = GameState.Playing;
            break;
          }
          this.levelLoaded = false;
          this.killCount = 0;
          this.levelStartMs = Date.now(); // System.currentTimeMillis()
          if (this.hudImage == null) {
            this.hudImage = GameScreen.loadImageFromBin(3);
          }
          if (this.isCutsceneEntry) {
            if (this.levelIndex === 7) {
              this.scriptStageAc = this.cameraX = px(180);
              this.player.posX -= px(40);
            } else {
              this.player.posX = 0;
              this.cameraX = px(4);
            }
            this.player.targetVelX = px(8);
            this.player.setFrame(2);
            this.state = GameState.LevelEnter;
            break;
          }
          this.cameraVelX = 0;
          this.cameraX = 0;
          this.player.posX = px(-80);
          this.state = GameState.Playing;
          break;
        }
        case GameState.LevelScroll: {
          switch (this.levelIndex) {
            case 2: {
              if (!this.scriptFlagL) {
                if (this.stateTimer++ <= 3) break;
                this.cameraVelX = px(12);
                this.cameraVelY = 0;
                break;
              }
              if (this.stateTimer++ <= 9) break;
              this.cameraVelX = px(-16);
              break;
            }
            case 7: {
              if (!this.scriptFlagL) {
                if (this.stateTimer === 0) {
                  this.cameraVelX = px(-8);
                  break;
                }
                this.cameraVelX = px(16);
                if (this.cameraX + this.cameraVelX <= this.scriptStageAc) break;
                this.cameraX = this.scriptStageAc;
                this.cameraVelX = 0;
                this.state = GameState.Playing;
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
        case GameState.LevelEnter: {
          if (this.stateTimer++ !== 5) {
            // lbl248
            if (this.stateTimer > 16) {
              this.player.setFrame(0);
              this.state = this.levelIndex === 7 ? GameState.LevelScroll : GameState.Playing;
              this.heldKeyAction = 0;
              this.isCutsceneEntry = false;
              this.stateTimer = 0;
            }
          } else {
            this.player.targetVelX = 0;
            this.player.setFrame(1);
          }
          // fall through to case 10（CFR：lbl254 落入 case 10）
          this.updateWorld();
          this.renderWorld(var1_1);
          break;
        }
        case GameState.Playing: {
          this.updateWorld();
          this.renderWorld(var1_1);
          break;
        }
        case GameState.MissionFailed: {
          if (this.stateTimer === 0) {
            this.levelStartMs = Date.now() - this.levelStartMs; // System.currentTimeMillis() - D
            var1_1.setColor(65280);
            var1_1.drawString(
              "任务" + GameScreen.taskNumberChars.substring(GameScreen.instance.levelIndex, GameScreen.instance.levelIndex + 1) + "失败",
              (GameScreen.screenWidth / 2) | 0,
              35,
              17
            );
            var1_1.drawString("击毙敌人: " + this.killCount, 36, 74, 20);
            var1_1.drawString("所用时间: " + GameScreen.formatTime(this.levelStartMs), 36, 105, 20);
            this.drawBriefingAnim(var1_1, 0, 16, 40, 175, 0);
            this.cursorWidth = 60;
            ++this.stateTimer;
            this.clearInputQueue();
          } else {
            const var3_6 = this.pollInputAction();
            if (var3_6 === 4) {
              this.resetCursorAnim();
              if (--this.menuSelection < 0) {
                this.menuSelection = 1;
              }
            } else if (var3_6 === 8) {
              this.resetCursorAnim();
              if (++this.menuSelection > 1) {
                this.menuSelection = 0;
              }
            } else if (var3_6 === 16) {
              switch (this.menuSelection) {
                case 0: {
                  this.player.fullAmmoInit();
                  this.state = GameState.LevelLoading;
                  break;
                }
                case 1: {
                  this.inTaskSelectMenu = false;
                  this.state = GameState.MainMenu;
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
          {
            let var3_6 = 0;
            while (var3_6 < 2) {
              if (var3_6 === this.menuSelection && this.hudBlinkCounter === 0) {
                var1_1.setColor(0xffffff);
              } else {
                var1_1.setColor(65280);
              }
              if (var3_6 === 0) {
                var1_1.drawString(GameMIDlet.menuTexts[1], 120, 150, 17);
              } else {
                var1_1.drawString(GameMIDlet.menuTexts[9], 120, 170, 17);
              }
              ++var3_6;
            }
          }
          var1_1.setColor(65280);
          {
            const var4_8 = this.cursorWidth >>> 1;
            var1_1.drawLine(120 - var4_8, 164 + this.menuSelection * 20, 120 - var4_8 + this.cursorWidth, 164 + this.menuSelection * 20);
          }
          this.animateCursorExpand();
          break;
        }
        case GameState.Ending: {
          GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
          if (this.stateTimer === 0) {
            LevelLoader.retainSpriteDef(18);
            this.stateTimer = 10;
            break;
          }
          if (this.creditScrollX > 240) {
            if (this.stateTimer > 0) {
              this.stateTimer = 0;
            }
            var1_1.setColor(0xff0000);
            var1_1.setFont(Font.getFont(0, 1, 16)); // SYSTEM/BOLD/LARGE
            var1_1.drawString("剧终", 88, 100, 17);
            if (this.stateTimer-- >= -60) break;
            this.state = GameState.MainMenu;
            this.stateTimer = 0;
            this.clearInputQueue();
            this.menuSelection = 0;
            this.inTaskSelectMenu = false;
            this.levelResourcesReady = true;
            break;
          }
          {
            let var5_10 = 0;
            let var6_12 = 0;
            let var7_14 = 0;
            let var8_16 = 0;
            let var9_19 = 0;
            let var10_20 = 0;
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
                    var6_12 = INT_MIN;
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
                  var7_14 = var10_20 === 2 ? this.creditScrollX : this.creditScrollX2;
                  var8_16 = 176;
                  var9_19 = 3;
                }
              }
              this.drawBriefingAnim(var1_1, var5_10, var6_12, var7_14, var8_16, this.stateTimer % var9_19);
              ++var10_20;
            }
            ++this.stateTimer;
          }
          break;
        }
        case GameState.MissionComplete: {
          if (this.heldKeyAction !== 0 && this.stateTimer !== 10) {
            this.stateTimer = 10;
            this.animFrameIndex = 0;
            this.clearInputQueue();
          }
          this.drawReturnHint(var1_1);
          if (this.stateTimer === 0) {
            GameScreen.playSound(2, 1, 140);
            this.levelStartMs = Date.now() - this.levelStartMs; // System.currentTimeMillis() - D
            var1_1.setColor(65280);
            var1_1.drawString(
              "任务" + GameScreen.taskNumberChars.substring(GameScreen.instance.levelIndex, GameScreen.instance.levelIndex + 1) + "完成",
              (GameScreen.screenWidth / 2) | 0,
              35,
              17
            );
            var1_1.drawString("击毙敌人: " + this.killCount, 36, 74, 20);
            var1_1.drawString("所用时间: " + GameScreen.formatTime(this.levelStartMs), 36, 105, 20);
            this.stateTimer = 1;
            this.animFrameIndex = 0;
            break;
          }
          var1_1.setColor(0);
          var1_1.fillRect(54, 125, 60, 50);
          if (this.stateTimer === 10) {
            if (!this.drawBriefingAnim(var1_1, 0, 14, 84, 175, this.animFrameIndex++)) break;
            this.stateTimer = 0;
            this.clearInputQueue();
            if (this.levelIndex !== 7) {
              ++this.levelIndex;
              this.releaseLevel();
              this.state = GameState.LevelLoading;
              if (((this.levelIndex << 24) >> 24) > GameScreen.saveData[0]) {
                GameScreen.saveData[0] = (this.levelIndex << 24) >> 24; // (byte)
              }
              GameScreen.saveData[1] = (this.levelIndex << 24) >> 24; // (byte)
              this.accessSaveData(0);
            } else {
              this.state = GameState.Ending;
              this.creditScrollX = -176;
              this.creditScrollX2 = -20;
            }
            // System.gc();
            break;
          }
          this.drawBriefingAnim(var1_1, 0, 0, 84, 175, this.animFrameIndex++);
          break;
        }
        case GameState.GoalCutscene: {
          if (this.stateTimer === 0) {
            this.player.setFrame(1);
            this.player.targetVelX = GameScreen.instance.levelIndex === 4 ? this.cameraVelX : 0;
            this.player.accelX = 0;
            this.player.targetVelY = 0;
            this.player.accelY = 0;
          } else if (this.stateTimer === 11) {
            switch (this.levelIndex) {
              case 0:
              case 6:
              case 7: {
                this.player.targetVelX = px(8);
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
                this.player.targetVelX = px(12);
                this.player.startLeapRight(px(-10));
                this.player.subState = 4;
                ++this.stateTimer;
                break;
              }
              case 4: {
                this.player.targetVelX = px(15);
              }
            }
          }
          if ((this.levelIndex === 1 || this.levelIndex === 3) && this.stateTimer > 11) {
            if (this.stateTimer++ > 23) {
              this.state = GameState.MissionComplete;
              this.heldKeyAction = 0;
              this.stateTimer = 0;
              break;
            }
            this.fillScreenColor(var1_1, this.stateTimer - 11);
            break;
          }
          if (this.player.posX > this.cameraX + GameScreen.viewWidthFx + px(10)) {
            this.player.targetVelX = 0;
            if (this.stateTimer++ > 32) {
              this.state = GameState.MissionComplete;
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
        case GameState.Paused: {
          let var5_11 = 0;
          if (this.stateTimer === 0) {
            var5_11 = 0;
            while (var5_11 < this.pixelBuffer.length) {
              this.pixelBuffer[var5_11] = 24603;
              ++var5_11;
            }
            ++this.stateTimer;
          }
          if ((var5_11 = this.pollInputAction()) === 4) {
            if (--this.menuSelection < 0) {
              this.menuSelection = 3;
            }
          } else if (var5_11 === 8) {
            if (++this.menuSelection > 3) {
              this.menuSelection = 0;
            }
          } else if (var5_11 === 16) {
            switch (this.menuSelection) {
              case 0: {
                this.heldKeyAction = 0;
                this.state = GameState.Playing;
                break;
              }
              case 1: {
                GameScreen.saveData[2] = GameScreen.saveData[2] === 0 ? 1 : 0;
                break;
              }
              case 2: {
                this.levelResourcesReady = true;
                this.clearInputQueue();
                this.menuVisibleMax = 0;
                this.hudBlinkCounter = 0;
                this.menuSelection = 0;
                this.inTaskSelectMenu = false;
                this.state = GameState.MainMenu;
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
            if (this.menuSelection !== 1) break;
          }
          this.renderWorld(var1_1);
          var1_1.setClip(0, 0, GameScreen.screenWidth, GameScreen.screenHeight);
          var1_1.setColor(240, 176, 0);
          var1_1.drawRect(44, 45, 88, 78);
          // this.K = DirectUtils.getDirectGraphics(var1_1);
          this.directGraphics = var1_1;
          this.drawPixels(var1_1, this.pixelBuffer, 0, 87, 45, 46, 87, 39);
          this.drawPixels(var1_1, this.pixelBuffer, 0, 87, 45, 85, 87, 38);
          {
            let var6_13 = 0;
            let var7_15 = 0;
            while (var7_15 < 4) {
              if (this.menuSelection === var7_15) {
                var1_1.setColor(0xffffff);
              } else {
                var1_1.setColor(96, 192, 255);
              }
              if (var7_15 === 0) {
                var6_13 = 8;
              } else if (var7_15 === 1) {
                var6_13 = GameScreen.saveData[2] === 1 ? 3 : 7;
              } else if (var7_15 === 2) {
                var6_13 = 9;
              } else if (var7_15 === 3) {
                var6_13 = 6;
              }
              var1_1.drawString(GameMIDlet.menuTexts[var6_13], 56, 56 + var7_15 * 16, 20);
              ++var7_15;
            }
          }
          break;
        }
        case GameState.About:
        case GameState.Help: {
          if (this.heldKeyAction !== 0) {
            this.state = GameState.MainMenu;
            this.inTaskSelectMenu = false;
            this.stateTimer = 0;
            this.clearInputQueue();
            GameScreen.currentText = null;
            // System.gc();
            break;
          }
          if (this.stateTimer === 0) {
            let var8_17: number;
            if (this.state === GameState.Help) {
              this.loadTextFromBin(0);
              var8_17 = 3;
            } else {
              this.loadTextFromBin(1);
              var8_17 = 25;
            }
            GameScreen.fillRectClipped(var1_1, 0, 0, GameScreen.screenWidth, GameScreen.screenHeight, 0);
            var1_1.setFont(Font.getFont(0, 1, 8)); // SYSTEM/BOLD/SMALL
            var1_1.setColor(65280);
            this.drawWrappedText(var1_1, 20, var8_17, 14);
            ++this.stateTimer;
          }
          this.drawReturnHint(var1_1);
          break;
        }
        case GameState.CaptureCutscene: {
          this.fillScreenColor(var1_1, this.stateTimer++);
          if (this.stateTimer <= 12) break;
          this.stateTimer = 0;
          this.player.actionFlag = false;
          this.player.linkedEnemy = null;
          this.menuSelection = 0;
          this.heldKeyAction = 0;
          if (this.player.spareO === 16 && this.player.spareP === 16) {
            this.state = GameState.MissionComplete;
            break;
          }
          if (this.player.health <= 0) {
            this.state = GameState.MissionFailed;
            break;
          }
          this.player.setFrame(0);
          this.player.facingFlag = 0;
          this.player.posX = this.player.spareO << 10;
          this.player.posY = this.player.spareP << 10;
          {
            const var8_18 = GameScreen.playHeight << 10;
            GameScreen.instance.cameraX = this.player.posX - ((GameScreen.viewWidthFx / 5) | 0);
            GameScreen.instance.cameraY = this.player.posY - ((var8_18 * 3 / 4) | 0);
          }
          this.tileMap.invalidateBuffer();
          this.state = GameState.Playing;
        }
      }
    } catch (v1) {}
    this.painting = false;
  }

  /**
   * 每帧逻辑更新（对应 CFR a.java:860-949 `a()`），由 `paint()` 的游戏内分支在绘制前调用。
   * 流程：① 清空并按层序重建渲染队列 `drawQueue`（容量 40，后压入者绘制在上层）——
   * 当前屏块内激活精灵、玩家、敌兵矩阵 `enemyGrid`（及拖尾特效）、关卡4 的 Boss 及随从、
   * 道具类(后置绘制)、各投射物池 `projectilePools`；② 对队列逐个 `stepPhysics()` 走物理位移；
   * ③ 再逐个 `update()` 走行为/AI；④ `updateCamera()` 相机+脚本；⑤ 流式加载地图块并定位视口。
   * 两遍循环（先全物理再全行为）保证同帧确定性，复刻须保持。
   */
  // a() → a_
  updateWorld(): void {
    const pickupIds = new Int32Array(10);
    let pickupCount = 0;
    let i = 0;
    while (i < this.drawQueueCount) {
      this.drawQueue[i] = null;
      ++i;
    }
    this.drawQueueCount = 0;
    i = 0;
    const activeIdRow = this.levelLoader.blockActorIndices[this.levelLoader.currentBlock]!; // f[g] 为当前活动单位 id 行（原 Java byte[]，此路径非空）
    while (i < activeIdRow.length) {
      const actorId = activeIdRow[i];
      // typeId 在 ActorBase 中为 protected（原 Java 为包内可见）；GameScreen 非 ActorBase 子类，经结构视图读取保持等价。
      const actor = LevelLoader.activeActors[actorId] as unknown as ({ active: boolean; typeId: number } | null);
      if (actorId !== 0 && actor != null && actor.active && actor.typeId !== ActorType.Player) {
        if (this.isPickupType(actor.typeId)) {
          pickupIds[pickupCount++] = actorId;
        } else {
          this.drawQueue[this.drawQueueCount++] = LevelLoader.activeActors[actorId];
        }
      }
      ++i;
    }
    if (this.levelIndex !== 4) {
      this.drawQueue[this.drawQueueCount++] = this.player;
    }
    if (this.enemyAliveCount > 0) {
      i = 0;
      while (i < 2) {
        let j = 0;
        while (j < 3) {
          if (this.enemyGrid![i]![j]!.active) {
            if (this.enemyGrid![i]![j]!.trailEffect != null && this.enemyGrid![i]![j]!.trailEffect!.active) {
              this.drawQueue[this.drawQueueCount++] = this.enemyGrid![i]![j]!.trailEffect;
            }
            this.drawQueue[this.drawQueueCount++] = this.enemyGrid![i]![j];
          }
          ++j;
        }
        ++i;
      }
      if (this.levelIndex === 4 && this.boss != null) {
        if (this.boss.active) {
          this.drawQueue[this.drawQueueCount++] = this.boss;
        }
        if (this.boss.minion != null && this.boss.minion.active) {
          this.drawQueue[this.drawQueueCount++] = this.boss.minion;
        }
      }
    }
    if (this.levelIndex === 4) {
      this.drawQueue[this.drawQueueCount++] = this.player;
    }
    i = 0;
    while (i < pickupCount) {
      this.drawQueue[this.drawQueueCount++] = LevelLoader.activeActors[pickupIds[i]];
      ++i;
    }
    let poolIdx = 0;
    while (poolIdx < 5) {
      if (this.projectilePools[poolIdx] != null) {
        i = 0;
        while (i < this.projectilePools[poolIdx]!.length) {
          if (this.projectilePools[poolIdx]![i]!.active) {
            this.drawQueue[this.drawQueueCount++] = this.projectilePools[poolIdx]![i];
          }
          ++i;
        }
      }
      ++poolIdx;
    }
    i = 0;
    while (i < this.drawQueueCount) {
      this.drawQueue[i]!.stepPhysics();
      ++i;
    }
    i = 0;
    while (i < this.drawQueueCount) {
      this.drawQueue[i]!.update();
      ++i;
    }
    this.updateCamera();
    const cameraPxX = this.cameraX >> 10;
    const cameraPxY = this.cameraY >> 10;
    if (this.levelIndex !== 4) {
      this.levelLoader.streamScreenTransitionTo(cameraPxX, cameraPxY);
    }
    this.tileMap.setViewportOrigin(cameraPxX, cameraPxY);
  }

  /**
   * 关卡内世界绘制（对应 CFR a.java:951 `a(Graphics)`），在 `updateWorld()` 之后调用。
   * 依序：地图瓦片层 → 渲染队列 `drawQueue` 中各 Actor → 下方 32px HUD 条
   * （血条按血量变色、手雷数、武器框、弹匣/备弹/计分数字、关卡进度指示数）→
   * 关卡 0~2 叠加随机雨雪粒子线。坐标用相机 `cameraX/cameraY`（>>10 转像素）换算屏幕位置。
   * @param graphics 当前帧的图形上下文
   */
  // a(Graphics) → a_G
  renderWorld(graphics: Graphics): void {
    const cameraPxX = this.cameraX >> 10;
    const cameraPxY = this.cameraY >> 10;
    this.tileMap.draw(graphics);
    let drawIdx = 0;
    while (drawIdx < this.drawQueueCount) {
      this.drawQueue[drawIdx]!.paint(graphics, cameraPxX, cameraPxY);
      ++drawIdx;
    }
    graphics.setClip(0, 176, 176, 32);
    graphics.drawImage(this.hudImage!, 0, 176, 20);
    graphics.setClip(25, 201, 40, 2);
    if (this.player.health > 6) {
      graphics.setColor(65280);
    } else if (this.player.health >= 4) {
      graphics.setColor(200, 200, 0);
    } else {
      graphics.setColor(0xff0000);
    }
    graphics.fillRect(25, 201, this.player.health << 2, 2);
    graphics.setClip(161, 186, 8, 8);
    ++this.hudBlinkCounter;
    if (this.levelIndex === 4) {
      graphics.drawImage(this.hudImage!, 89, 154, 20);
    } else {
      graphics.drawImage(this.hudImage!, 161 - this.player.grenadeCount * 8, 154, 20);
    }
    graphics.setColor(0);
    graphics.fillRect(80, 180, 44, 15);
    if (this.state === GameState.Playing && this.showIndicator && this.hudBlinkCounter % 2 === 0) {
      this.drawNumber(graphics, this.indicatorValue, 150, 162, this.levelIndex === 7, false);
    }
    let reserveAmmo = 0;
    graphics.setClip(0, 0, GameScreen.screenWidth, GameScreen.screenHeight);
    graphics.setColor(66, 214, 198);
    switch (this.player.weaponIndex) {
      case 0: {
        reserveAmmo = 99;
        break;
      }
      case 1: {
        reserveAmmo = this.player.ammoReserveB;
        break;
      }
      case 2: {
        reserveAmmo = this.player.ammoReserveC;
      }
    }
    if (this.hudBlinkCounter > 1) {
      graphics.drawRect(76 + this.player.weaponIndex * 20, 195, 16, 10);
    }
    const magazineOnesDigit = this.player.magazineAmmo % 10;
    const magazineTensDigit = (this.player.magazineAmmo / 10) | 0;
    if (this.player.magazineAmmo !== 0 || (this.player.magazineAmmo === 0 && this.hudBlinkCounter > 1)) {
      // 弹匣为空时用偏移 99 把数字画到屏外（隐藏），否则偏移 0 正常显示
      const magazineHideOffset = this.player.magazineAmmo === 0 ? 99 : 0;
      graphics.setClip(82, 184, 8, 8);
      graphics.drawImage(this.hudImage!, 82 - magazineTensDigit * 8 - magazineHideOffset, 152, 20);
      graphics.setClip(90, 184, 8, 8);
      graphics.drawImage(this.hudImage!, 90 - magazineOnesDigit * 8 - magazineHideOffset, 152, 20);
    }
    graphics.setClip(100, 184, 8, 8);
    graphics.drawImage(this.hudImage!, 20, 152, 20);
    const reserveOnesDigit = reserveAmmo % 10;
    const reserveTensDigit = (reserveAmmo / 10) | 0;
    graphics.setClip(110, 184, 8, 8);
    graphics.drawImage(this.hudImage!, 110 - reserveTensDigit * 8, 152, 20);
    graphics.setClip(118, 184, 8, 8);
    graphics.drawImage(this.hudImage!, 118 - reserveOnesDigit * 8, 152, 20);
    if (this.hudBlinkCounter > 1) {
      graphics.setClip(5, 196, 8, 8);
      graphics.drawImage(this.hudImage!, -84, 164, 20);
    }
    if (this.hudBlinkCounter > 3) {
      this.hudBlinkCounter = -1;
    }
    if (this.levelIndex < 3) {
      graphics.setClip(0, 0, 176, 176);
      graphics.setColor(0xffffff);
      let particleIdx = 0;
      while (particleIdx < 4) {
        const particleX = GameMIDlet.nextRandomMod(176);
        const particleY = GameMIDlet.nextRandomMod(176);
        if (particleIdx % 2 === 0) {
          graphics.drawLine(particleX, particleY, particleX - 5, particleY + 11);
        } else {
          graphics.drawLine(particleX, particleY, particleX - 3, particleY + 6);
        }
        ++particleIdx;
      }
    }
  }

  /**
   * 关卡开始时初始化相机（对应 CFR b.java 对应的 `b()`）。
   * 把玩家放到布置表的出生点 `actorSpawnX/Y[0]`，相机定位到玩家左侧 1/5 屏、上方 3/4 可玩高处，
   * 再用地图像素尺寸钳制相机不越界，最后激活初始屏并刷新瓦片缓冲、设视口原点。
   */
  // b() → b_
  initCamera(): void {
    const n = GameScreen.screenWidth << 10;
    const n2 = GameScreen.playHeight << 10;
    let n3 = this.tileMap.getPixelWidth();
    let n4 = this.tileMap.getPixelHeight();
    n3 <<= 10;
    n4 <<= 10;
    this.player.posX = this.levelLoader.actorSpawnX[0] << 10;
    this.player.posY = this.levelLoader.actorSpawnY[0] << 10;
    this.cameraX = this.player.posX - ((n / 5) | 0);
    this.cameraY = this.player.posY - ((n2 * 3 / 4) | 0);
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
    const n5 = this.cameraX >> 10;
    const n6 = this.cameraY >> 10;
    this.levelLoader.activateScreenAt(n5, n6);
    this.tileMap.invalidateBuffer();
    this.tileMap.setViewportOrigin(n5, n6);
  }

  /**
   * 相机控制 + 关卡专属脚本（对应 CFR a.java:1073 `c()`），由 `updateWorld()` 末尾调用。
   * 按当前关卡 `levelIndex` 大 switch：触发各关一次性过场（到达特定坐标即锁相机、置脚本标志 `scriptFlagL`、
   * 跳坐标）、关卡1/4 的增援/空投刷敌与进度数 `indicatorValue`、关卡2/7 的卷动脚本、关卡6/7 的相机上下摆动、
   * 关卡7 的 Boss 追逼与爆炸散布；脚本未进行时则常规跟随玩家并按地图尺寸钳制相机边界。
   * 相机坐标定点存在 <<10/<<14 混用，复刻须逐处对齐。
   */
  // c() → c_
  updateCamera(): void {
    const n = GameScreen.playHeight << 10;
    let n2 = this.tileMap.getPixelWidth();
    let n3 = this.tileMap.getPixelHeight();
    n2 <<= 10;
    n3 <<= 10;
    if (this.isCutsceneEntry) {
      this.cameraVelX = 0;
      return;
    }
    switch (this.levelIndex) {
      case 0: {
        if (this.scriptFlagL || this.cameraX >> 14 !== 33 || this.cameraY >> 14 !== 11) break;
        this.scriptFlagL = true;
        this.cameraVelY = 0;
        this.cameraVelX = 0;
        this.cameraX = px(528);
        this.cameraY = px(176);
        break;
      }
      case 1: {
        if (this.scriptFlagL) {
          if (this.enemyAliveCount < 0) {
            this.enemyAliveCount = 0;
          }
          if (this.enemyAliveCount === 0 && this.reinforceBudget > 0) {
            let n4 = px(416);
            GameScreen.instance.spawnEnemyWave(2, 1, GameScreen.instance.cameraX + GameScreen.viewWidthFx, n4, 1, 1);
            n4 = px(496);
            GameScreen.instance.spawnEnemyWave(1, 2, GameScreen.instance.cameraX + GameScreen.viewWidthFx, n4, 1, 1);
            --this.reinforceBudget;
          }
          this.indicatorValue = this.enemyAliveCount + this.reinforceBudget * 3;
          break;
        }
        const n5 = this.cameraX >> 14;
        if ((n5 !== 43 && n5 !== 44) || this.cameraY >> 14 !== 22) break;
        this.scriptFlagL = true;
        this.showIndicator = true;
        this.reinforceBudget = 4;
        this.cameraVelX = 0;
        this.cameraVelY = 0;
        this.cameraY = px(352);
        this.cameraX = px(704);
        break;
      }
      case 2: {
        if (this.state !== GameState.LevelScroll) break;
        this.cameraX += this.cameraVelX;
        if (this.cameraX > n2 - GameScreen.viewWidthFx) {
          this.cameraX = n2 - GameScreen.viewWidthFx;
          this.cameraVelX = 0;
          this.stateTimer = 0;
          this.scriptFlagL = true;
        } else if (this.cameraX < 0 && this.scriptFlagL) {
          this.cameraX = 0;
          this.state = GameState.Playing;
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
        if (this.scriptFlagL || this.scriptStageAc !== 0) break;
        const n6 = this.cameraX >> 14;
        const n7 = this.cameraY >> 14;
        const n8 = this.player.posX >> 14;
        const n9 = this.player.posY >> 14;
        if (n8 <= 66 || n9 <= 0 || n6 !== 68) break;
        this.cameraVelX = 0;
        if (n7 === 5) {
          this.scriptFlagL = true;
          this.cameraVelY = 0;
          this.cameraVelX = 0;
          this.cameraX = px(1088);
          this.cameraY = px(80);
          ++this.scriptStageAc;
          break;
        }
        this.cameraVelY = px(8);
        break;
      }
      case 4: {
        this.cameraX += this.cameraVelX;
        if (this.player.linkedBoss != null) {
          this.player.linkedBoss.posX = this.player.posX + px(23);
        }
        if (this.reinforceBudget > 0) {
          return;
        }
        if (this.enemyAliveCount < 0) {
          this.enemyAliveCount = 0;
        }
        if (this.enemyAliveCount === 0) {
          if (this.airdropWaveCount < 5) {
            this.spawnAirdropWave();
          } else if (GameScreen.instance.state === GameState.Playing) {
            GameScreen.instance.state = GameState.GoalCutscene;
          }
        }
        this.indicatorValue = this.enemyAliveCount + (5 - this.airdropWaveCount) * 4;
        this.showIndicator = true;
        return;
      }
      case 6: {
        if (!this.scriptFlagL && this.scriptStageAc === 0 && this.cameraX >> 14 === 33) {
          if (this.cameraY >> 14 !== 22) break;
          this.scriptFlagL = true;
          this.cameraVelY = 0;
          this.cameraVelX = 0;
          this.cameraX = px(656);
          this.cameraY = px(432);
          ++this.scriptStageAc;
          break;
        }
        if (GameScreen.instance.state !== GameState.GoalCutscene) break;
        this.cameraVelY = this.indicatorToggle ? -1536 : 1536;
        this.indicatorToggle = !this.indicatorToggle;
        break;
      }
      case 7: {
        if (this.state === GameState.Playing || this.state === GameState.GoalCutscene) {
          const n10 = this.cameraX >> 10;
          const n11 = this.player.posX >> 10;
          const n12 = n11 - this.bossTriggerX;
          if (n12 < 176) {
            this.cameraVelY = n12 > 50 ? (this.indicatorToggle ? -1536 : 1536) : this.indicatorToggle ? px(-2) : px(2);
            this.indicatorToggle = !this.indicatorToggle;
          }
          if (this.bossTriggerX === 0) {
            this.bossTriggerX = 30;
          }
          this.bossTriggerX += 2;
          let n12b = n12;
          if (n12b < 0) {
            n12b = 0;
          }
          this.indicatorValue = n12b;
          this.showIndicator = true;
          if (this.bossTriggerX <= n10) break;
          let n13 = this.bossTriggerX - n10;
          if (n13 > 172) {
            this.bossTriggerX = n10 + 172;
          }
          this.spawnExplosionScatter(n13);
          break;
        }
        if (this.state !== GameState.LevelScroll) break;
        if (this.scriptFlagL) {
          this.cameraVelY = this.cameraVelY > 0 ? px(-2) : px(2);
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
        if (this.player.posX - this.cameraX < ((GameScreen.viewWidthFx / 5) | 0)) {
          this.cameraX = this.player.posX - ((GameScreen.viewWidthFx / 5) | 0);
        }
      } else if (this.cameraVelX < 0 && this.player.posX - this.cameraX > ((GameScreen.viewWidthFx * 4 / 5) | 0)) {
        this.cameraX = this.player.posX - ((GameScreen.viewWidthFx * 4 / 5) | 0);
      }
      if (this.cameraVelY > 0) {
        if (this.cameraY > this.player.posY - ((n / 3) | 0)) {
          this.cameraY = this.player.posY - ((n / 3) | 0);
        }
      } else if (this.cameraVelY < 0 && this.cameraY < this.player.posY - ((n * 3 / 4) | 0)) {
        this.cameraY = this.player.posY - ((n * 3 / 4) | 0);
      }
    }
    if (this.cameraX > n2 - GameScreen.viewWidthFx) {
      this.cameraX = n2 - GameScreen.viewWidthFx;
    }
    if (this.cameraX < 0) {
      this.cameraX = 0;
    }
    if (this.cameraY > n3 - n + (this.levelIndex === 7 ? px(2) : 0)) {
      this.cameraY = n3 - n;
    }
    if (this.cameraY < 0) {
      this.cameraY = 0;
    }
  }

  /**
   * 全局资源/数据结构一次性初始化（对应 CFR a.java:1272 `d()`），开机 Logo 阶段调用一次。
   * 分配渲染队列(40)与投射物池槽位(5)，加载开机/菜单精灵，载入音效，并从存档读入进度（`accessSaveData(1)`）。
   */
  // d() → d_
  initGameResources(): void {
    this.drawQueue = new Array<ActorBase | null>(40).fill(null);
    this.projectilePools = new Array<(ProjectileActor | null)[] | null>(5).fill(null);
    LevelLoader.initBootSprites(this);
    GameScreen.loadSounds();
    this.accessSaveData(1);
  }

  /**
   * 关卡分步加载状态机（对应 CFR a.java:1280 `a(int)`），由 LevelLoading 状态每帧推进一步。
   * 用 `stateTimer`（原 `w`）作步号 0→9 逐帧加载：地图与布置表、初始化相机、按需保留并预建各子弹池
   * （21/10/20/15/16，子池大小 10/3/6/2/10）、敌兵矩阵 enemyGrid[2][3]、关卡4 的 Boss 与随从，
   * 最后复位玩家与对象池、设各计数初值并置 `levelLoaded=true`（paint 据此转任务简报）。
   * @param n 要加载的关卡 ID
   */
  // a(int) → a_I（关卡分步加载，按 w 推进）
  loadLevelStep(n: number): void {
    this.levelLoaded = false;
    switch (this.stateTimer) {
      case 0: {
        // System.gc();
        this.isCutsceneEntry = n !== 4;
        this.stateTimer = 1;
        return;
      }
      case 1: {
        if (!this.levelResourcesReady) {
          this.levelLoader = LevelLoader.loadLevel(this, n)!; // a_TaI 返回 j|null，原版直接赋给可空字段 g
        } else {
          LevelLoader.tileMap!.reloadColumnData(n);
        }
        this.stateTimer = 2;
        return;
      }
      case 2: {
        if (!this.levelResourcesReady) {
          this.tileMap = LevelLoader.tileMap!;
        }
        this.initCamera();
        this.stateTimer = 3;
        return;
      }
      case 3: {
        if (LevelLoader.spriteDefPool[21] == null) {
          LevelLoader.retainSpriteDef(21);
          this.projectilePools[0] = new Array<ProjectileActor | null>(10).fill(null);
          let n2 = 0;
          while (n2 < 10) {
            this.projectilePools[0]![n2] = new ProjectileActor(ActorType.GuidedMissileProjectile, LevelLoader.spriteDefPool[21]!, this);
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
          this.projectilePools[1] = new Array<ProjectileActor | null>(3).fill(null);
          let n3 = 0;
          while (n3 < 3) {
            this.projectilePools[1]![n3] = new ProjectileActor(ActorType.PlayerBounceShot, LevelLoader.spriteDefPool[10]!, this);
            ++n3;
          }
        }
        this.stateTimer = 5;
        return;
      }
      case 5: {
        if (LevelLoader.spriteDefPool[20] == null) {
          LevelLoader.retainSpriteDef(20);
          this.projectilePools[2] = new Array<ProjectileActor | null>(6).fill(null);
          let n4 = 0;
          while (n4 < 6) {
            this.projectilePools[2]![n4] = new ProjectileActor(ActorType.FallingBombProjectile, LevelLoader.spriteDefPool[20]!, this);
            ++n4;
          }
        }
        this.stateTimer = 6;
        return;
      }
      case 6: {
        if (LevelLoader.spriteDefPool[15] == null) {
          LevelLoader.retainSpriteDef(15);
          this.projectilePools[3] = new Array<ProjectileActor | null>(2).fill(null);
          let n5 = 0;
          while (n5 < 2) {
            this.projectilePools[3]![n5] = new ProjectileActor(ActorType.GrenadeProjectile, LevelLoader.spriteDefPool[15]!, this);
            ++n5;
          }
        }
        if (this.levelIndex === 2 || this.levelIndex === 4) {
          LevelLoader.retainSpriteDef(6);
        }
        this.stateTimer = 7;
        return;
      }
      case 7: {
        if (LevelLoader.spriteDefPool[16] == null) {
          LevelLoader.retainSpriteDef(16);
          this.projectilePools[4] = new Array<ProjectileActor | null>(10).fill(null);
          let n6 = 0;
          while (n6 < 10) {
            this.projectilePools[4]![n6] = new ProjectileActor(ActorType.ExplosionEffect, LevelLoader.spriteDefPool[16]!, this);
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
              this.enemyGrid = new Array<(EnemyActor | null)[] | null>(2).fill(null);
              LevelLoader.retainSpriteDef(2);
              this.enemyGrid[0] = new Array<EnemyActor | null>(3).fill(null);
              let n7 = 0;
              while (n7 < 3) {
                this.enemyGrid[0]![n7] = new EnemyActor(ActorType.MeleeBomberEnemy, LevelLoader.spriteDefPool[2]!, this);
                ++n7;
              }
              LevelLoader.retainSpriteDef(1);
              this.enemyGrid[1] = new Array<EnemyActor | null>(3).fill(null);
              let n8 = 0;
              while (n8 < 3) {
                this.enemyGrid[1]![n8] = new EnemyActor(ActorType.ReconScoutEnemy, LevelLoader.spriteDefPool[1]!, this);
                ++n8;
              }
            }
            if (this.levelIndex !== 4 || this.boss != null) break;
            this.boss = new BossActor(ActorType.AtvVehicleBoss, LevelLoader.spriteDefPool[8]!, this);
            this.boss.minion = new EnemyActor(ActorType.ReconScoutEnemy, LevelLoader.spriteDefPool[1]!, this);
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

  /**
   * 主循环（对应 CFR a.java:1426 `run()`），由构造时启动的线程驱动。
   * 固定 100ms/帧（约 10 FPS）：本帧不足 `frameStepMs` 则补睡，超时不追帧；
   * `running=false` 或 `painting=true`（正在绘制/挂起）时让出执行权空转；每帧调 `repaint()` 触发 `paint()`。
   * 原 Java 阻塞 while+Thread.sleep 改为 async/await，控制流逐帧一致；异常全部吞掉。
   */
  // run()：原 while(aa!=null){...; Thread.sleep(...)} → async + await（控制流逐帧一致）
  async run(): Promise<void> {
    try {
      let l2 = Date.now(); // System.currentTimeMillis()
      while (this.loopThread != null) {
        if (!this.running || this.painting) {
          await Thread.sleep(0); // 让出执行权，等价于忙等的协作式空转
          continue;
        }
        const l3 = Date.now() - l2;
        if (l3 < this.frameStepMs) {
          await Thread.sleep(this.frameStepMs - l3);
          // System.gc();
        }
        this.repaint();
        l2 = Date.now();
      }
      return;
    } catch (exception) {
      return;
    }
  }

  // h(int) → h_I（键码 → 游戏动作位）
  private keyCodeToAction(keyCode: number): number {
    let actionMask = 0;
    switch (keyCode) {
      case -1:
      case 1: {
        actionMask = 4;
        break;
      }
      case -2:
      case 6: {
        actionMask = 8;
        break;
      }
      case -3:
      case 2: {
        actionMask = 1;
        break;
      }
      case -4:
      case 5: {
        actionMask = 2;
        break;
      }
      case -6:
      case -5: {
        if (this.state === GameState.Playing) break;
        actionMask = 16;
        break;
      }
      case -7: {
        actionMask = 4096;
        break;
      }
      case 42:
      case 48:
      case 55:
      case 56: {
        actionMask = 16;
        break;
      }
      case 35:
      case 57: {
        if (this.state === GameState.Playing) {
          actionMask = 32;
          break;
        }
        actionMask = 16;
        break;
      }
      case 51:
      case 54: {
        if (this.state === GameState.Playing) {
          actionMask = 2048;
          break;
        }
        actionMask = 16;
        break;
      }
      case 49:
      case 50:
      case 52:
      case 53: {
        actionMask = this.state === GameState.Playing ? 1024 : 16;
      }
    }
    return actionMask;
  }

  /**
   * 框架按键回调（对应 CFR `keyPressed(int)`）。
   * 先处理两个上下文相关的特例：软键(-6/-5) 在游戏中切暂停、在主菜单作确认；右软键(-7) 在游戏中切任务简报、在暂停时返回游戏。
   * 其余按键经 `keyCodeToAction()` 转成动作位存入 `heldKeyAction` 并压入输入环形队列。
   * @param n 平台键码（含 Nokia 软键负值）
   */
  keyPressed(n: number): void {
    let n2: number;
    if (n === -6 || n === -5) {
      if (this.state === GameState.Playing) {
        this.clearInputQueue();
        this.menuSelection = 0;
        this.state = GameState.Paused;
        return;
      }
      if (this.state === GameState.MainMenu) {
        this.enqueueInputAction(16, false);
        return;
      }
    } else if (n === -7) {
      if (this.state === GameState.Playing) {
        this.clearInputQueue();
        this.state = GameState.MissionBriefing;
        this.stateTimer = 0;
        return;
      }
      if (this.state === GameState.Paused) {
        this.state = GameState.Playing;
        return;
      }
    }
    this.heldKeyAction = n2 = this.keyCodeToAction(n);
    this.enqueueInputAction(n2, false);
  }

  /** 框架按键释放回调（对应 CFR `keyReleased(int)`）：清空当前持有动作 `heldKeyAction`（忽略具体键码）。 */
  keyReleased(_n: number): void {
    this.heldKeyAction = 0;
  }

  /**
   * 从投射物对象池取一个空闲 ProjectileActor 并发射（对应 CFR a.java `a(int,int,int,int,int,int)`）。
   * 按弹种 `n`(21/10/20/15/16) 选对应子池，找到首个非激活者就位置/帧/模式初始化并激活返回；池满返回 null。
   * 玩家武器、爆炸散布等都经此取弹。
   * @param n 弹种类型 ID；@param n2 起始帧；@param n3 绘制参数；@param n4/n5 起点 X/Y（定点）；@param n6 模式
   * @returns 取到并初始化的投射物，池满则 null
   */
  // a(int,int,int,int,int,int) → a_IIIIII（从对象池取一个 tjge.l 并初始化）
  spawnProjectile(typeId: number, frame: number, drawParam: number, posX: number, posY: number, mode: number): ProjectileActor | null {
    let poolIndex = 0;
    let loopAnim = false;
    switch (typeId) {
      case ActorType.GuidedMissileProjectile: {
        poolIndex = 0;
        break;
      }
      case ActorType.PlayerBounceShot: {
        poolIndex = 1;
        break;
      }
      case ActorType.FallingBombProjectile: {
        poolIndex = 2;
        loopAnim = true;
        break;
      }
      case ActorType.GrenadeProjectile: {
        poolIndex = 3;
        loopAnim = true;
        break;
      }
      case ActorType.ExplosionEffect: {
        poolIndex = 4;
        break;
      }
      default: {
        return null;
      }
    }
    let slotIdx = 0;
    while (slotIdx < this.projectilePools[poolIndex]!.length) {
      if (!this.projectilePools[poolIndex]![slotIdx]!.active) {
        const proj = this.projectilePools[poolIndex]![slotIdx]!;
        proj.posX = posX;
        proj.posY = posY;
        proj.launchOriginX = posX;
        proj.setFrame(frame);
        proj.active = true;
        // loopAnimation 在 ActorBase 中为 protected（原 Java 包内可见）；经结构视图写入保持等价。
        (proj as unknown as { loopAnimation: boolean }).loopAnimation = loopAnim;
        proj.frameCounter = 0;
        proj.targetVelX = this.levelIndex === 4 ? this.cameraVelX : 0;
        proj.targetVelY = 0;
        proj.mode = mode;
        proj.drawParam = drawParam;
        return this.projectilePools[poolIndex]![slotIdx];
      }
      ++slotIdx;
    }
    return null;
  }

  /**
   * 卸载当前关卡资源（对应 CFR a.java `e()`）。
   * 清空渲染队列、释放敌兵矩阵 `enemyGrid` 与拖尾特效、Boss 及随从、玩家与 Boss 的关联，
   * 调 LevelLoader 释放关卡并置 `levelResourcesReady=false`。切关/重选任务/通关进下一关前调用。
   */
  // e() → e_（卸载当前关卡资源）
  releaseLevel(): void {
    let i = 0;
    while (i < this.drawQueueCount) {
      this.drawQueue[i] = null;
      ++i;
    }
    if (this.enemyGrid != null) {
      let gridRow = 0;
      while (gridRow < this.enemyGrid.length) {
        if (this.enemyGrid[gridRow] != null) {
          let gridCol = 0;
          while (gridCol < this.enemyGrid[gridRow]!.length) {
            this.enemyGrid[gridRow]![gridCol]!.trailEffect = null;
            this.enemyGrid[gridRow]![gridCol] = null;
            ++gridCol;
          }
        }
        this.enemyGrid[gridRow] = null;
        ++gridRow;
      }
      this.enemyGrid = null;
    }
    if (this.boss != null) {
      this.boss.minion = null;
      this.boss = null;
    }
    this.player.linkedBoss = null;
    this.levelLoader.disposeLevel();
    this.levelLoader = null as unknown as LevelLoader;
    this.levelResourcesReady = false;
    // System.gc();
  }

  // b(int) → b_I（判断类型 id 是否属于“后置绘制”单位）
  isPickupType(typeId: number): boolean {
    switch (typeId) {
      case ActorType.AmmoSupplyPickup:
      case ActorType.AtvVehicleBoss:
      case ActorType.HealthPickup:
      case ActorType.LevelExitGate: {
        return true;
      }
    }
    return false;
  }

  /**
   * 生成一批敌兵（对应 CFR a.java `b(int,int,int,int,int,int)`），从敌兵矩阵 `enemyGrid` 取空闲槽初始化。
   * 按行类型 `n` 选矩阵行，按生成模式 `n6`(0=空降冲锋兵带拖尾/1=巡逻兵) 配置位置、速度、AI 状态、巡逻边界与血量，
   * 每成功一只 `++enemyAliveCount`，达到请求数量 `n2` 即返回 true；`n2` 越界返回 false。被增援/空投脚本调用。
   * @returns 是否已凑满请求的敌兵数量
   */
  // b(int,int,int,int,int,int) → b_IIIIII（生成一批敌兵 tjge.h）
  spawnEnemyWave(enemyType: number, requestCount: number, baseX: number, baseY: number, frame: number, spawnMode: number): boolean {
    if (requestCount > 3 || requestCount === 0) {
      return false;
    }
    let stackOffsetY = 0;
    let spawnedCount = 0;
    if (this.enemyAliveCount < 0) {
      this.enemyAliveCount = 0;
    }
    const gridRow = enemyType === 2 ? 0 : 1;
    let gridCol = 0;
    while (gridCol < 3) {
      if (!this.enemyGrid![gridRow]![gridCol]!.active) {
        const enemy = this.enemyGrid![gridRow]![gridCol]!;
        enemy.setFrame(frame);
        enemy.active = true;
        // loopAnimation 在 ActorBase 中为 protected（原 Java 包内可见）；经结构视图写入保持等价。
        (enemy as unknown as { loopAnimation: boolean }).loopAnimation = true;
        enemy.aiming = false;
        enemy.target = this.player;
        enemy.timerB = 0;
        enemy.lives = 1;
        enemy.rhythmThreshold = 5;
        enemy.hurtBlinkTimer = 0;
        enemy.hitPoints = 0;
        enemy.fromSpawner = true;
        switch (spawnMode) {
          case 0: {
            enemy.isPatroller = false;
            enemy.patrolRange = 0;
            let randOffsetX = GameMIDlet.nextRandomMod(160);
            enemy.posX = this.cameraX + px(5) + (randOffsetX <<= 10);
            if (enemy.posX > this.cameraX + px(88)) {
              enemy.targetVelX = px(7);
            } else {
              enemy.targetVelX = px(9);
              enemy.setFrame(frame | INT_MIN); // Integer.MIN_VALUE
            }
            enemy.targetVelY = px(1);
            enemy.posY = baseY - stackOffsetY;
            stackOffsetY += px(20);
            enemy.timerA = 0;
            enemy.aiState = 0;
            if (enemy.trailEffect == null) {
              enemy.trailEffect = new EffectActor(ActorType.ParachuteTrailEffect, LevelLoader.spriteDefPool[6]!, this);
            }
            enemy.trailEffect.active = true;
            enemy.trailEffect.posX = enemy.posX;
            enemy.trailEffect.posY = enemy.posY - px(30);
            enemy.trailEffect.setFrame(0);
            break;
          }
          case 1: {
            enemy.posY = baseY;
            enemy.targetVelX = 0;
            enemy.targetVelY = 0;
            enemy.isPatroller = true;
            enemy.attackRangeUpper = px(40);
            enemy.attackRangeLower = px(-40);
            enemy.aiState = 7;
            enemy.posX = baseX + px(20);
            enemy.patrolDir = 0;
            enemy.patrolRange = 100;
            enemy.patrolLeftBound = this.cameraX + px(60);
            enemy.timerA = spawnedCount << 3;
            enemy.patrolRightBound = baseX - px(50) + spawnedCount * px(20);
            if (spawnedCount > 0) {
              enemy.hitPoints = 1;
            }
            if (enemyType !== 2) break;
            enemy.attackRangeUpper = px(120);
            enemy.patrolRightBound = baseX - px(30);
            enemy.patrolRange = 0;
          }
        }
        ++this.enemyAliveCount;
        enemy.drawParam = enemy.hitPoints;
        enemy.lives = enemy.hitPoints + 1;
        if (++spawnedCount === requestCount) {
          return true;
        }
      }
      ++gridCol;
    }
    return false;
  }

  /**
   * 关卡4 专用：激活 Boss 及其随从发动一次攻击（对应 CFR a.java `a(int,int)`）。
   * 在指定 X(`n`) 与速度(`n2`) 上启用 Boss，并据 Boss 与玩家相对位置在左/右侧布置随从（设朝向/血量/AI/巡逻），
   * 更新 `enemyAliveCount`。被关卡4 空投波 `spawnAirdropWave()` 调用。
   * @returns Boss 或随从缺失时 false，否则 true
   */
  // a(int,int) → a_II（生成 Boss 的同伴 tjge.h）
  spawnBossAttack(bossX: number, bossVelX: number): boolean {
    if (this.boss == null || this.boss.minion == null) {
      return false;
    }
    this.boss.active = true;
    this.boss.disabled = false;
    this.boss.visible = true;
    this.boss.posX = bossX;
    this.boss.posY = this.player.linkedBoss!.posY - px(3);
    this.boss.targetVelX = bossVelX;
    this.boss.setFrame(0);
    const minion = this.boss.minion;
    this.boss.minion.active = true;
    minion.attackRangeUpper = px(40);
    minion.attackRangeLower = px(-40);
    if (bossX > this.player.posX) {
      minion.posX = this.boss.posX + px(23);
      minion.setFrame(2);
    } else {
      minion.posX = this.boss.posX - px(23);
      minion.setFrame(-2147483646);
    }
    minion.posY = this.player.posY - px(2);
    minion.targetVelX = this.boss.targetVelX;
    minion.targetVelY = 0;
    minion.patrolRange = 0;
    minion.lives = 2;
    minion.drawParam = 1;
    minion.hitPoints = 1;
    minion.aiState = 0;
    minion.target = this.player;
    minion.rhythmThreshold = 8;
    minion.hurtBlinkTimer = 0;
    minion.isPatroller = true;
    this.enemyAliveCount = this.enemyAliveCount < 0 ? 1 : ++this.enemyAliveCount;
    return true;
  }

  // h() → h_（从输入环形队列取下一个动作）
  private pollInputAction(): number {
    if (GameScreen.inputWriteIndex === GameScreen.inputReadIndex) {
      return 0;
    }
    const action = GameScreen.inputQueue[GameScreen.inputReadIndex];
    if (++GameScreen.inputReadIndex === GameScreen.inputQueueCap) {
      GameScreen.inputReadIndex = 0;
    }
    return action;
  }

  // a(int,boolean) → a_IZ（向输入环形队列压入一个动作）
  private enqueueInputAction(action: number, bl: boolean): void {
    GameScreen.inputQueue[GameScreen.inputWriteIndex] = bl ? action | INT_MIN : action; // Integer.MIN_VALUE
    if (++GameScreen.inputWriteIndex >= GameScreen.inputQueueCap) {
      GameScreen.inputWriteIndex = 0;
    }
    if (GameScreen.inputWriteIndex === GameScreen.inputReadIndex && ++GameScreen.inputReadIndex >= GameScreen.inputQueueCap) {
      GameScreen.inputReadIndex = 0;
    }
  }

  // f() → f_（清空输入环形队列）
  clearInputQueue(): void {
    GameScreen.inputWriteIndex = 0;
    GameScreen.inputReadIndex = 0;
  }

  // i() → i_（关卡4：投放炸弹兵）
  private spawnAirdropWave(): void {
    let spawnVelX: number;
    let spawnX: number;
    const enemyCount = this.airdropWaveCount % 2 === 0 ? 2 : 1;
    const unusedCopy = enemyCount; // 死代码守卫：原 CFR 存在的空副本，保留赋值+void 以维持位级一致
    void unusedCopy;
    if (this.player.posX < this.cameraX + px(88)) {
      spawnX = this.cameraX + px(206);
      spawnVelX = px(2);
    } else {
      spawnX = this.cameraX - px(30);
      spawnVelX = this.cameraVelX + px(6);
    }
    if (this.spawnEnemyWave(enemyCount, 3, this.cameraX, 0, 0, 0) && this.spawnBossAttack(spawnX, spawnVelX)) {
      ++this.airdropWaveCount;
    }
  }

  // a(Graphics,int) → a_GI（全屏纯色 RGB4444 渐变填充，过场用）
  fillScreenColor(graphics: Graphics, colorShort: number): void {
    let pixel = (colorShort << 16) >> 16; // (short)n
    pixel = (pixel << 12) << 16 >> 16; // (short)(s << 12)
    let i = 0;
    while (i < this.pixelBuffer.length) {
      this.pixelBuffer[i] = pixel;
      ++i;
    }
    graphics.setClip(0, 0, GameScreen.screenWidth, GameScreen.screenHeight);
    this.blitPixelBuffer(graphics);
  }

  // b(Graphics) → b_G（把 J(short[] RGB4444) 整屏 13 段贴出）
  blitPixelBuffer(graphics: Graphics): void {
    // this.K = DirectUtils.getDirectGraphics(graphics);
    this.directGraphics = graphics;
    let segIdx = 0;
    while (segIdx < 13) {
      this.drawPixels(graphics, this.pixelBuffer, 0, 176, 0, 16 * segIdx, 176, 16);
      ++segIdx;
    }
  }

  /**
   * 存档读写（对应 CFR a.java `c(int)`）。3 字节存档 `saveData`=[最高关, 当前关, 音效开关]。
   * `n===0` 写盘（保存进度/设置），`n===1` 读盘到 `saveData`（无记录时清零进度）。
   * 偏差：shim 无 RMS，用 localStorage 键 "TGS_CT" 复刻，控制流与原版一致。
   * @param mode 0=保存，1=读取
   */
  // c(int) → c_I（存档 RecordStore 读写；shim 无 RMS，用 localStorage 复刻 3 字节）
  accessSaveData(mode: number): void {
    try {
      // RecordStore.openRecordStore("TGS_CT", true) → localStorage 键
      const key = "TGS_CT";
      const stored = GameScreen.rmsLoad(key);
      if (stored != null) {
        // 已有记录（hasNextElement / nextRecordId 后处理首条）
        switch (mode) {
          case 0: {
            // setRecord(id, Q, 0, 3)
            GameScreen.rmsSave(key, GameScreen.saveData.subarray(0, 3));
            break;
          }
          case 1: {
            // Q = getRecord(id)
            GameScreen.saveData = new Int8Array(stored);
            break;
          }
        }
      } else {
        switch (mode) {
          case 0: {
            // addRecord(Q, 0, 3)
            GameScreen.rmsSave(key, GameScreen.saveData.subarray(0, 3));
            break;
          }
          case 1: {
            GameScreen.saveData[0] = 0;
            GameScreen.saveData[1] = 0;
          }
        }
      }
      return;
    } catch (exception) {
      return;
    }
  }

  // 偏差：RMS 替身（localStorage），仅 c_I 使用。3 字节存档以逗号分隔的有符号整数存。
  private static rmsLoad(key: string): Int8Array | null {
    try {
      if (typeof localStorage === "undefined") return null;
      const v = localStorage.getItem(key);
      if (v == null) return null;
      const parts = v.split(",");
      const out = new Int8Array(parts.length);
      for (let i = 0; i < parts.length; i++) out[i] = parseInt(parts[i], 10) | 0;
      return out;
    } catch {
      return null;
    }
  }
  private static rmsSave(key: string, data: Int8Array): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, Array.from(data).join(","));
    } catch {
      /* 吞异常，与原 catch(Exception) 一致 */
    }
  }

  // b(Graphics,int,int,int,int,int) → b_GIIIII（绘制 d 精灵某帧并判定动画终止）
  private drawBriefingAnim(graphics: Graphics, spriteDefIndex: number, frameId: number, x: number, y: number, frameIndex: number): boolean {
    const frameCount = LevelLoader.spriteDefPool[spriteDefIndex]!.getSequenceFrameCount(frameId & SEQUENCE_MASK); // short
    if (frameIndex >= frameCount) {
      this.animFrameIndex = 0;
      frameIndex = 0;
    }
    LevelLoader.spriteDefPool[spriteDefIndex]!.paintSequenceFrame(graphics, x, y, frameId, frameIndex, 0, 0);
    return frameIndex >= frameCount - 1;
  }

  // j() → j_（复位子弹/敌兵的存活标志）
  private resetSpawnPools(): void {
    let j: number;
    let i: number;
    if (this.projectilePools != null) {
      i = 0;
      while (i < 5) {
        if (this.projectilePools[i] != null) {
          j = 0;
          while (j < this.projectilePools[i]!.length) {
            this.projectilePools[i]![j]!.active = false;
            ++j;
          }
        }
        ++i;
      }
    }
    if (this.enemyGrid != null) {
      i = 0;
      while (i < this.enemyGrid.length) {
        if (this.enemyGrid[i] != null) {
          j = 0;
          while (j < this.enemyGrid[i]!.length) {
            if (this.enemyGrid[i]![j]!.trailEffect != null) {
              this.enemyGrid[i]![j]!.trailEffect!.active = false;
            }
            this.enemyGrid[i]![j]!.active = false;
            ++j;
          }
        }
        ++i;
      }
    }
  }

  // b(Graphics,int) → b_GI（任务简报界面绘制）
  private drawBriefingScreen(graphics: Graphics, n: number): void {
    let n2 = 0;
    let n3 = 0;
    let n4 = 0;
    let n5 = 1;
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
    if (this.levelIndex !== 2 && this.levelIndex !== 4) {
      n4 = 30;
      n5 = 3;
      n2 = 13;
      graphics.drawString("总部呼叫红帽", (GameScreen.screenWidth / 2) | 0, 16, 17);
    }
    if (LevelLoader.spriteDefPool[n2] == null) {
      LevelLoader.spriteDefPool[n2] = SpriteDef.loadFromBin(n2);
    }
    LevelLoader.spriteDefPool[n2]!.paintSequenceFrame(graphics, 145, n4, 0, n % n5, 0, 0);
    GameScreen.fillRectClipped(graphics, 135, 0, 25, 6, 0);
    GameScreen.fillRectClipped(graphics, 135, 34, 25, 25, 0);
    LevelLoader.spriteDefPool[0]!.paintSequenceFrame(graphics, 25, 212, 0, n % 3, 0, 0);
    GameScreen.fillRectClipped(graphics, 0, 200, 50, 8, 0);
    graphics.setColor(65280);
    graphics.setClip(0, 0, GameScreen.screenWidth, GameScreen.screenHeight);
    graphics.drawRect(5, 5, 166, 32);
    graphics.drawRect(5, 42, 166, 124);
    graphics.drawRect(5, 171, 166, 32);
    graphics.drawString("收到", 60, 180, 20);
    graphics.drawString("任务" + GameScreen.taskNumberChars.substring(GameScreen.instance.levelIndex, GameScreen.instance.levelIndex + 1), 15, 52, 20);
    this.drawTextLine(graphics, n3, 30, 72);
    if (this.levelIndex !== 3 && this.levelIndex !== 5 && this.levelIndex !== 6) {
      graphics.drawString("注意", 15, 110, 20);
      this.drawTextLine(graphics, n3 + 1, 30, 130);
      if (this.levelIndex < 1) {
        this.drawTextLine(graphics, n3 + 2, 30, 150);
      }
    }
  }

  // d(int) → d_I（静态：类型 id 是否为可加载精灵）
  static isScrollLevel(n: number): boolean {
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

  // a(long) → a_J（毫秒 → "分:秒" 文本）
  static formatTime(l2: number): string {
    l2 = (l2 / 1000) | 0; // l2 /= 1000L
    const n = (l2 / 60) | 0;
    let n2 = l2 % 60;
    const n3 = n2 % 10;
    n2 = (n2 / 10) | 0;
    return n + ":" + n2 + "" + n3;
  }

  // a(Graphics,int,int,int,boolean,boolean) → a_GIIIZZ（数字 HUD 绘制，4 位）
  drawNumber(graphics: Graphics, value: number, x: number, y: number, bl: boolean, bl2: boolean): void {
    let placeDivisor = 1000;
    let xAdvance = 0;
    let digit = 0;
    const glyphOffset = bl ? 99 : 0;
    if (bl2) {
      graphics.setClip(x - 10, y, 8, 8);
      graphics.drawImage(this.hudImage!, x - 12 - 178, y - 32, 20);
    }
    if (value < 0) {
      value = 0;
    }
    let place = 0;
    while (place < 4) {
      digit = (value / placeDivisor) | 0;
      value %= placeDivisor;
      if (digit !== 0 || (digit === 0 && xAdvance !== 0) || place === 3) {
        graphics.setClip(x + xAdvance, y, 8, 8);
        graphics.drawImage(this.hudImage!, x + xAdvance - digit * 8 - glyphOffset, y - 32, 20);
        xAdvance += 8;
      }
      placeDivisor = (placeDivisor / 10) | 0;
      ++place;
    }
  }

  // a(Graphics,int,int,int,int,int) → a_GIIIII（静态：裁剪并填充纯色矩形）
  static fillRectClipped(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number): void {
    graphics.setClip(n, n2, n3, n4);
    graphics.setColor(n5);
    graphics.fillRect(n, n2, n3, n4);
  }

  // e(int) → e_I（随机散布爆炸特效 + 播音效）
  spawnExplosionScatter(xRange: number): void {
    let i = 0;
    while (i < 2) {
      let randX = GameMIDlet.nextRandomMod(xRange);
      let randY = GameMIDlet.nextRandomMod(160);
      GameScreen.instance.spawnProjectile(ActorType.ExplosionEffect, 0, 0, this.cameraX + (randX <<= 10), this.cameraY + (randY <<= 10), 2);
      ++i;
    }
    GameScreen.playSound(5, 1, 220);
  }

  // c(Graphics) → c_G（“按任意键返回”闪烁提示）
  private drawReturnHint(graphics: Graphics): void {
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

  // k() → k_（菜单光标下划线伸缩动画）
  private animateCursorExpand(): void {
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

  // l() → l_（重置菜单光标动画）
  private resetCursorAnim(): void {
    this.hudBlinkCounter = 0;
    this.cursorWidth = 42;
    this.cursorExpanding = true;
  }

  /**
   * 从 image.bin 取第 `n` 张图（对应 CFR a.java `f(int)`）。
   * 读偏移表定位条目（共 9 张：Logo/HUD 图集/菜单底图等，索引见《资源映射.md》）。
   * 偏差：原 `Image.createImage(byte[],0,len)` → `getCachedImage("/res/image.bin", n)` 按索引取预解码图。
   * @param n 图片索引
   * @returns 解码后的图片，失败为 null
   */
  // f(int) → f_I（静态：从 image.bin 取第 n 张图）
  // 偏差：原 Image.createImage(byte[],0,len) → getCachedImage("/res/image.bin", n)（按索引取预解码图）。
  static loadImageFromBin(n: number): Image | null {
    const string = "/res/image.bin";
    let image: Image | null = null;
    const inputStream = getResourceAsStream(string)!;
    try {
      const n2 = GameMIDlet.readI32Le(inputStream);
      const nArray = new Int32Array(n2);
      let n3 = 0;
      while (n3 < n2) {
        nArray[n3] = GameMIDlet.readI32Le(inputStream);
        ++n3;
      }
      const n4 = nArray[n + 1] - nArray[n];
      const byArray = new Int8Array(n4);
      inputStream.skip(nArray[n]);
      inputStream.read(byArray);
      // image = Image.createImage(byArray, 0, n4);
      image = getCachedImage<Image>(string, n);
      void byArray;
      inputStream.close();
      // System.gc();
    } catch (exception) {}
    return image;
  }

  /** 框架失焦回调（对应 CFR `hideNotify()`）：若正在游戏中则清输入、复位菜单选项并切到暂停状态。 */
  hideNotify(): void {
    if (this.state === GameState.Playing) {
      this.menuSelection = 0;
      this.clearInputQueue();
      this.state = GameState.Paused;
    }
  }

  /**
   * 从 sound.bin 加载全部音效到 `sounds[]`（对应 CFR a.java `g()`），开机初始化时调用。
   * 读偏移表逐条读 6 条音效字节并构造 Sound。
   * 偏差：第二参原为音频格式/增益档，音频暂静音、Sound 仅构造保留调用。
   */
  // g() → g_（静态：从 sound.bin 加载音效；音频暂静音，Sound 仅构造）
  static loadSounds(): void {
    let n = 0;
    try {
      let byArray: Int8Array | null;
      const string = "/res/sound.bin";
      const inputStream = getResourceAsStream(string)!;
      const n2 = GameMIDlet.readI32Le(inputStream);
      const nArray = new Int32Array(n2);
      n = 0;
      while (n < n2) {
        nArray[n] = GameMIDlet.readI32Le(inputStream);
        ++n;
      }
      n = 0;
      while (n < n2 - 1) {
        const n3 = nArray[n + 1] - nArray[n];
        const n4 = n3 < 256 ? 1 : 5;
        byArray = new Int8Array(n3);
        inputStream.read(byArray);
        // new Sound(byArray, n4)：第二参原为音频格式/增益档，暂静音（音频后续接入）。
        GameScreen.sounds[n] = new Sound(new Uint8Array(byArray.buffer, byArray.byteOffset, byArray.length), n4);
        ++n;
      }
      byArray = null;
      void byArray;
      inputStream.close();
      return;
    } catch (exception) {
      return;
    }
  }

  /**
   * 播放音效（对应 CFR a.java `a(int,int,int)`）。仅当存档音效开关 `saveData[2]===1` 才放；
   * 若有正在播放的音效则本次跳过（不打断）。第二参 `_n2` 忽略，`n3` 为增益。
   * @param n 音效索引；@param n3 增益
   */
  // a(int,int,int) → a_III（静态：播放音效 n，增益 n3；仅当音效开关 Q[2]==1）
  static playSound(n: number, _n2: number, n3: number): void {
    if (GameScreen.sounds == null || GameScreen.sounds[n] == null) {
      return;
    }
    try {
      if (GameScreen.saveData[2] === 1) {
        if (GameScreen.currentSoundIndex >= 0 && GameScreen.sounds[GameScreen.currentSoundIndex]!.getState() === 0) {
          return;
        }
        GameScreen.currentSoundIndex = n;
        GameScreen.sounds[n]!.setGain(n3);
        GameScreen.sounds[n]!.play(1);
      }
      return;
    } catch (exception) {
      return;
    }
  }

  // g(int) → g_I（从 x.bin 取第 n 段文本到 U）
  loadTextFromBin(n: number): void {
    const string = "/res/x.bin";
    try {
      const inputStream = getResourceAsStream(string)!;
      const n2 = GameMIDlet.readI32Le(inputStream);
      const nArray = new Int32Array(n2);
      let n3 = 0;
      while (n3 < n2) {
        nArray[n3] = GameMIDlet.readI32Le(inputStream);
        ++n3;
      }
      const n4 = ((nArray[n + 1] - nArray[n]) / 2) | 0;
      inputStream.skip(nArray[n] + 2);
      const cArray = new Array<number>(n4 - 1);
      n3 = 0;
      while (n3 < n4 - 1) {
        cArray[n3] = GameMIDlet.readU16Le(inputStream) & 0xffff; // (char)
        ++n3;
      }
      GameScreen.currentText = String.fromCharCode(...cArray);
      inputStream.close();
      // System.gc();
      return;
    } catch (exception) {
      return;
    }
  }

  // a(Graphics,int,int,int) → a_GIII（多行文本绘制，回车 \r 分行）
  drawWrappedText(graphics: Graphics, x: number, y: number, lineHeight: number): void {
    let lineStart = 0;
    let crIndex = 0;
    do {
      if ((crIndex = GameScreen.currentText!.indexOf("\r", lineStart)) === -1) {
        graphics.drawString(GameScreen.currentText!.substring(lineStart), x, y, 20);
      } else {
        graphics.drawString(GameScreen.currentText!.substring(lineStart, crIndex), x, y, 20);
      }
      y += lineHeight;
      lineStart = crIndex + 2;
    } while (crIndex >= 0);
  }

  // b(Graphics,int,int,int) → b_GIII（取 U 的第 n 行绘制）
  drawTextLine(graphics: Graphics, lineIndex: number, x: number, y: number): void {
    let lineStart = 0;
    let crIndex = 0;
    while (true) {
      crIndex = GameScreen.currentText!.indexOf("\r", lineStart);
      if (lineIndex-- <= 0) break;
      lineStart = crIndex + 2;
    }
    if (crIndex === -1) {
      graphics.drawString(GameScreen.currentText!.substring(lineStart), x, y, 20);
      return;
    }
    graphics.drawString(GameScreen.currentText!.substring(lineStart, crIndex), x, y, 20);
  }

  /**
   * DirectGraphics.drawPixels 复刻（RGB4444，processAlpha=true，format=4444）。
   * 偏差：shim 无 DirectGraphics；按 game1 像素管线把 short[] 的 0xARGB(4444) 段
   *   解码为 0xAARRGGBB，经 Image.createRGBImage 生成图后 drawImage 贴到 (x,y)。
   * 对应原签名：drawPixels(pixels, transparency=true, offset, scanlength,
   *   x, y, width, height, manipulation=0, format=4444)。
   */
  private drawPixels(
    graphics: Graphics,
    pixels: Int16Array,
    offset: number,
    scanlength: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const argb = new Int32Array(width * height);
    let idx = 0;
    let row = offset;
    for (let yy = 0; yy < height; yy++) {
      for (let xx = 0; xx < width; xx++) {
        const p = pixels[row + xx] & 0xffff; // 0xARGB4444
        const a4 = (p >> 12) & 0xf;
        const r4 = (p >> 8) & 0xf;
        const g4 = (p >> 4) & 0xf;
        const b4 = p & 0xf;
        // 4bit → 8bit 扩展（高低位复制）
        const av = (a4 << 4) | a4;
        const rv = (r4 << 4) | r4;
        const gv = (g4 << 4) | g4;
        const bv = (b4 << 4) | b4;
        argb[idx++] = ((av << 24) | (rv << 16) | (gv << 8) | bv) | 0;
      }
      row += scanlength;
    }
    const img = Image.createRGBImage(argb, width, height, true);
    graphics.drawImage(img, x, y, 20); // anchor TOP|LEFT
  }
}
