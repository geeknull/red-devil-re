/**
 * 游戏2《红魔特种兵2-深海战舰》主类 —— 主 Canvas + 主循环 Runnable（最核心 UI 类，CFR 1008 行）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/a.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 角色：继承 Canvas（原 setFullScreenMode 全屏画布），实现 Runnable（→ async run()）。
 *   UI 状态机字段 b（与游戏1 的 a.p 不同！）；屏幕 176×204；帧率 80ms。
 *   状态值：3=开机logo序列, 1=载入进度条, 4=主菜单, 100=无存档提示, 2=载入关卡,
 *     20=游戏中初始化, 22=任务简报, 10=游戏中, 18=任务失败结算, 16=任务完成结算,
 *     21=游戏结束(全通), 6=帮助, 19=关于。
 *   持有玩家 g(字段 y, tjge.g) 与当前场景 j(字段 z, tjge.j)。
 *
 * 字段别名（混淆名沿用原版）：
 *   b=UI 状态机, c=当前输入动作位, d=按住动作位, e=过场动画进度, f=关卡开始时刻(long),
 *   g=用时秒数(long), h=菜单起始项, i=全局帧计数, j=子状态/计时, k=当前关卡号,
 *   l=菜单选中项, m/n=镜头定点坐标, o/p=镜头速度, q/r=视口宽高(定点),
 *   G/H=结算动画参数, I/J=场景定点尺寸, K=震屏计数, L=震屏中, M=载入完成标志,
 *   s=运行中, t=绘制中, N/O/P=菜单下划线动画(目标宽/当前宽/方向),
 *   u/v=logo 主图与副图, w=主循环线程, x=MIDlet, y=玩家, z=当前场景,
 *   Q/R/S/T=logo 序列临时图。
 *   静态：a=单例, A/B=任务简报数字定点坐标表, C/D/E=简报展开动画状态,
 *     F=简报逐行状态[行偏移,y,步进,计时]。
 *
 * 方法名按契约表（同 (名,描述符) → 同 TS 名）。框架方法 paint/keyPressed/keyReleased/
 *   hideNotify/run 与 constructor 保留原名。
 *
 * 必要偏差（位级/逻辑一致，仅平台桥接处）：
 *   - extends FullCanvas → shim Canvas（setFullScreenMode 等价，整体省略并注释）。
 *   - Font.getFont(...)+setFont(...)：shim 无 Font，绘制用系统字体近似，故 setFont 整体省略并注释。
 *   - getFont().substringWidth / drawSubstring（a_GIIIIII 内逐字测宽换行）：shim 无 Font，
 *     用底层 ctx.measureText 近似测宽、drawString 近似绘子串（控制流逐行一致，标注偏差）。
 *   - GameMIDlet.a(String,int)→a_SI 取预解码图（见 docs/05 §5）。
 *   - 音频（MIDI）GameMIDlet.a()/b()/c()/a(n,n2)→a_/b_/c_/a_II 已在 GameMIDlet 内空实现，直接调用。
 *   - System.gc() 删除并注释；System.currentTimeMillis() → Date.now()。
 */
import { Canvas, Graphics, Image, Thread, Font } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { BossActor } from "./BossActor.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ItemActor } from "./ItemActor.ts";
import { EnemyActor } from "./EnemyActor.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { LevelScene } from "./LevelScene.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { UiState, LevelSubState } from "./constants.ts";

// 原版：a extends FullCanvas implements Runnable（TS 无 Runnable 接口，run() 直接由 Thread 驱动）。
export class GameCanvas extends Canvas {
  static instance: GameCanvas;
  uiState: number = 0;
  inputAction: number = 0;
  heldAction: number = 0;
  transitionProgress: number = 0;
  levelStartTime: number = 0; // long（关卡开始时刻；仅用于计时差，不溢出，用 number）
  elapsedSeconds: number = 0; // long（用时秒数；不溢出，用 number）
  menuStartItem: number = 0;
  private resultAnimFrame: number = 0;
  private resultAnimCounter: number = 0;
  globalFrame: number = 0;
  subState: number = 0;
  levelIndex: number = 0;
  menuSelection: number = 0;
  cameraX: number = 0;
  cameraY: number = 0;
  cameraVelX: number = 0;
  cameraVelY: number = 0;
  viewportWidth: number = 0;
  viewportHeight: number = 0;
  private sceneWidth: number = 0;
  private sceneHeight: number = 0;
  private shakeCounter: number = 0;
  private shaking: boolean = false;
  private loadComplete: boolean = false;
  running: boolean = false; // protected
  painting: boolean = false; // protected
  private underlineTargetWidth: number = 0;
  private underlineWidth: number = 0;
  private underlineDir: number = 0;
  logoImageMain: Image | null = null;
  logoImageSub: Image | null = null;
  mainThread: Thread | null = null; // protected
  midlet: GameMIDlet; // protected
  player!: PlayerActor;
  scene!: LevelScene;
  private logoTempImage1: Image | null = null;
  private logoTempImage2: Image | null = null;
  private logoTempImage3: Image | null = null;
  private logoTempImage4: Image | null = null;
  static briefingNumberX: Int32Array;
  static briefingNumberY: Int32Array;
  static briefingAnimC: number = 0;
  static briefingAnimD: number = 0;
  static briefingAnimE: number = 0;
  static briefingLineState: Int32Array;

  // static {} 静态初始化块（对应 Java 末尾 static {}）
  static {
    GameCanvas.briefingNumberX = Int32Array.from([17, 46]);
    GameCanvas.briefingNumberY = Int32Array.from([29, 106]);
    GameCanvas.briefingLineState = new Int32Array(4);
  }

  constructor(gameMIDlet: GameMIDlet) {
    super();
    // this.setFullScreenMode(true); // shim Canvas 即全屏画布（整体省略）
    GameCanvas.instance = this;
    this.midlet = gameMIDlet;
    this.uiState = UiState.Splash;
    this.mainThread = new Thread(this);
    this.mainThread.start();
    this.running = true;
    this.painting = false;
  }

  // a(int,tjge.d) → a_ITd（精灵/场景对象工厂）
  createActor(n: number, d2: SpriteDef): ActorBase {
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

  paint(graphics: Graphics): void {
    ++this.globalFrame;
    this.painting = true;
    graphics.setFont(Font.getFont(0, 0, 8)); // SYSTEM/PLAIN/SMALL
    GameMIDlet.tickSoundTimeout();
    try {
      switch (this.uiState) {
        case UiState.Splash: {
          ++this.subState;
          graphics.setClip(0, 0, 176, 204);
          if (this.subState === 1) {
            this.logoTempImage1 = GameMIDlet.loadImage("/res/logo.bin", 1);
            this.logoTempImage2 = GameMIDlet.loadImage("/res/logo.bin", 2);
            this.logoTempImage3 = GameMIDlet.loadImage("/res/logo.bin", 3);
            this.logoTempImage4 = GameMIDlet.loadImage("/res/logo.bin", 4);
            this.logoImageMain = GameMIDlet.loadImage("/res/logo.bin", 0);
            this.logoImageSub = GameMIDlet.loadImage("/res/logo.bin", 5);
            break;
          }
          if (this.subState === 2) {
            GameMIDlet.loadSounds();
            GameMIDlet.accessSaveRecord(0);
            graphics.drawImage(this.logoTempImage1!, 38, 60, 20);
            this.logoTempImage1 = null;
            graphics.setColor(238, 25, 33);
            graphics.drawString("移动互连 无限可能", 96, 122, 17);
            break;
          }
          if (this.subState === 29) {
            graphics.setColor(0xffffff);
            graphics.fillRect(0, 0, 176, 204);
            graphics.drawImage(this.logoTempImage2!, 15, 15, 20);
            this.logoTempImage2 = null;
            graphics.drawImage(this.logoTempImage3!, 36, 103, 20);
            this.logoTempImage3 = null;
            graphics.setColor(155, 166, 173);
            graphics.drawString("新浪无线代理发行", 40, 139, 20);
            break;
          }
          if (this.subState === 47) {
            graphics.setColor(255, 255, 255);
            graphics.fillRect(0, 0, 176, 208);
            graphics.drawImage(this.logoTempImage4!, 88, 45, 17);
            this.logoTempImage4 = null;
            break;
          }
          if (this.subState !== 65) break;
          graphics.setColor(0);
          graphics.fillRect(0, 0, 176, 204);
          graphics.drawImage(this.logoImageMain!, 0, 0, 20);
          graphics.drawImage(this.logoImageSub!, 0, this.logoImageMain!.getHeight() + 2, 20);
          this.uiState = UiState.LoadingProgress;
          this.subState = 0;
          GameMIDlet.playSound(0, 160);
          break;
        }
        case UiState.LoadingProgress: {
          ++this.subState;
          graphics.setClip(0, 0, 176, 204);
          graphics.setColor(0);
          graphics.fillRect(0, 0, 176, 204);
          graphics.drawImage(this.logoImageMain!, 0, 0, 20);
          graphics.drawImage(this.logoImageSub!, 0, this.logoImageMain!.getHeight() + 2, 20);
          graphics.setColor(0xffffff);
          graphics.drawRect(2, 194, 171, 6);
          graphics.setColor(0);
          graphics.fillRect(3, 195, 170, 5);
          graphics.setColor(65280);
          graphics.drawLine(4, 196, (((this.subState * 168) / 23) | 0) + 3, 196);
          graphics.setColor(47872);
          graphics.drawLine(4, 197, (((this.subState * 168) / 23) | 0) + 3, 197);
          graphics.setColor(30464);
          graphics.drawLine(4, 198, (((this.subState * 168) / 23) | 0) + 3, 198);
          if (!LevelScene.loadResourcesUpTo(this, this.subState)) break;
          this.uiState = UiState.MainMenu;
          this.levelIndex = 0;
          this.subState = 0;
          this.menuStartItem = 1;
          this.menuSelection = 1;
          this.startUnderline(120);
          break;
        }
        case UiState.MainMenu: {
          graphics.setClip(0, 0, 176, 204);
          graphics.setColor(0);
          graphics.fillRect(0, 0, 176, 204);
          graphics.drawImage(this.logoImageMain!, 0, 0, 20);
          graphics.drawImage(this.logoImageSub!, 0, this.logoImageMain!.getHeight() + 2, 20);
          let n = this.menuStartItem;
          while (n < 7) {
            graphics.setColor(this.menuSelection === n && this.underlineDir === 1 ? 0xffffff : 65280);
            if (n === 3) {
              graphics.drawString(GameMIDlet.menuTexts[GameMIDlet.saveRecord[2] === 0 ? 7 : 3], 88, 60 + n * 20, 17);
            } else {
              graphics.drawString(GameMIDlet.menuTexts[n], 88, 60 + n * 20, 17);
            }
            ++n;
          }
          graphics.setColor(65280);
          this.drawUnderline(graphics, 88, 80 + this.menuSelection * 20);
          if (this.inputAction === 4) {
            this.startUnderline(120);
            if (--this.menuSelection < this.menuStartItem) {
              this.menuSelection = 6;
            }
          } else if (this.inputAction === 8) {
            this.startUnderline(120);
            if (++this.menuSelection > 6) {
              this.menuSelection = this.menuStartItem;
            }
          } else if (this.inputAction === 16) {
            switch (this.menuSelection) {
              case 0: {
                this.uiState = UiState.InGame;
                break;
              }
              case 1: {
                this.levelIndex = 0;
                GameMIDlet.accessSaveRecord(2);
                this.transitionProgress = 0;
                this.subState = 0;
                this.uiState = UiState.CutsceneIntro;
                PlayerActor.ammoReserve[1] = 6;
                break;
              }
              case 2: {
                if (GameMIDlet.saveRecord[3] === 0) {
                  this.subState = 0;
                  this.uiState = UiState.NoSave;
                  break;
                }
                this.transitionProgress = 0;
                this.subState = 0;
                this.levelIndex = GameMIDlet.saveRecord[3];
                const by = GameMIDlet.saveRecord[1];
                GameMIDlet.saveRecord[1] = (by + 1) << 24 >> 24; // (byte) 截断
                if (by > 99) {
                  GameMIDlet.saveRecord[1] = 99;
                }
                PlayerActor.ammoReserve[1] = GameMIDlet.saveRecord[4];
                this.uiState = this.levelIndex === 0 ? UiState.CutsceneIntro : UiState.LevelIntroLoading;
                break;
              }
              case 3: {
                GameMIDlet.saveRecord[2] = (GameMIDlet.saveRecord[2] ^ 1) << 24 >> 24; // (byte) 截断
                if (GameMIDlet.saveRecord[2] !== 0) break;
                GameMIDlet.stopSound();
                break;
              }
              case 4: {
                this.subState = 0;
                GameMIDlet.loadTextEntry(7, "/res/string.bin");
                this.inputAction = 0;
                this.uiState = UiState.Help;
                break;
              }
              case 5: {
                GameMIDlet.loadTextEntry(8, "/res/string.bin");
                this.inputAction = 0;
                this.uiState = UiState.About;
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
        case UiState.NoSave: {
          if (this.subState === 0) {
            graphics.setClip(0, 0, 176, 204);
            graphics.setColor(0);
            graphics.fillRect(0, 0, 176, 204);
            graphics.drawImage(this.logoImageMain!, 0, 0, 20);
            graphics.drawImage(this.logoImageSub!, 0, this.logoImageMain!.getHeight() + 6, 20);
            LevelScene.fillBlackBand(graphics, 8, this.logoImageMain!.getHeight() + 6, 176);
            graphics.setClip(0, 0, 176, 208);
            graphics.setColor(65280);
            graphics.drawString("没有存档记录!!", 88, 104, 17);
          }
          ++this.subState;
          if (this.subState <= 15) break;
          this.subState = 0;
          this.uiState = UiState.MainMenu;
          break;
        }
        case UiState.LevelIntroLoading: {
          this.loadLevel(this.levelIndex);
          graphics.setColor(0);
          graphics.setClip(0, 0, 176, 204);
          graphics.fillRect(0, 0, 176, 204);
          graphics.setColor(65280);
          graphics.drawString(GameMIDlet.interludeTexts[11], 88, 184, 17);
          if (!this.loadComplete) break;
          this.subState = 0;
          this.uiState = UiState.InGame;
          this.levelStartTime = Date.now(); // System.currentTimeMillis()
          break;
        }
        case UiState.CutsceneIntro: {
          this.paintLevelIntro(graphics);
          break;
        }
        case UiState.MissionBrief: {
          this.scene.render(graphics);
          graphics.setClip(0, 0, 176, 204);
          GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 171, 10, this.transitionProgress, 47872, 0, true);
          this.scene.renderHud(graphics);
          graphics.setClip(0, 0, 176, 204);
          if (this.transitionProgress < 10) {
            if (this.subState === 0) {
              ++this.transitionProgress;
            } else {
              --this.transitionProgress;
              if (this.transitionProgress < 0) {
                this.subState = 0;
                this.uiState = UiState.InGame;
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
          const nArray = Int32Array.from([5, 19, 44, 58, 81, 99, 124]);
          const nArray2 = Int32Array.from([90, 100, 89, 101, 101, 93, 91]);
          let n = 0;
          while (n < 7) {
            if (n <= this.levelIndex && (n !== this.levelIndex || this.globalFrame % 4 <= 1)) {
              LevelScene.hudFont.drawCell(graphics, 24 + nArray[n], 24 + nArray2[n], 28, 0, 0);
            }
            ++n;
          }
          if (this.subState === 0 && this.inputAction === 32768) {
            this.subState = 1;
            --this.transitionProgress;
          }
          break;
        }
        case UiState.InGame: {
          this.scene.tick();
          this.scene.render(graphics);
          break;
        }
        case UiState.LevelFailed: {
          GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, this.transitionProgress, 47872, 0, true);
          if (this.transitionProgress < 10) {
            ++this.transitionProgress;
            this.menuSelection = 0;
            break;
          }
          graphics.setColor(65280);
          graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex] + GameMIDlet.interludeTexts[8], 88, 30, 17);
          graphics.drawString(GameMIDlet.interludeTexts[5], 36, 64, 20);
          graphics.drawString(String(GameCanvas.instance.scene.reservedD), 140, 64, 24);
          graphics.drawString(GameMIDlet.interludeTexts[7], 36, 90, 20);
          graphics.drawString(String(GameMIDlet.saveRecord[1] & 0xff), 140, 90, 24);
          graphics.drawString(GameMIDlet.interludeTexts[6], 36, 116, 20);
          const n = ((this.elapsedSeconds / 60) | 0);
          const n2 = (this.elapsedSeconds % 60);
          let string = String(n);
          let string2 = String(n2);
          if (n < 10) {
            string = "0" + string;
          }
          if (n2 < 10) {
            string2 = "0" + string2;
          }
          const string3 = string + ":" + string2;
          graphics.drawString(string3, 140, 116, 24);
          LevelScene.actorDefs[0]!.drawFrame(graphics, 48, 170, 4, 0, 0, 0);
          graphics.setClip(0, 0, 176, 204);
          if (this.inputAction === 4) {
            this.startUnderline(64);
            if (--this.menuSelection < 0) {
              this.menuSelection = 1;
            }
            this.inputAction = 0;
          } else if (this.inputAction === 8) {
            this.startUnderline(64);
            if (++this.menuSelection > 1) {
              this.menuSelection = 0;
            }
            this.inputAction = 0;
          } else if (this.inputAction === 16) {
            if (this.menuSelection === 0) {
              const by = GameMIDlet.saveRecord[1];
              GameMIDlet.saveRecord[1] = (by + 1) << 24 >> 24; // (byte) 截断
              if (by > 99) {
                GameMIDlet.saveRecord[1] = 99;
              }
              this.uiState = UiState.LevelIntroLoading;
            } else {
              this.menuStartItem = 1;
              this.menuSelection = 1;
              this.uiState = UiState.MainMenu;
            }
            this.inputAction = 0;
          }
          let n3 = 0;
          while (n3 < 2) {
            graphics.setColor(n3 === this.menuSelection && this.underlineDir === 1 ? 0xffffff : 65280);
            if (n3 === 0) {
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
        case UiState.LevelClear: {
          GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, this.transitionProgress, 47872, 0, true);
          if (this.transitionProgress < 10) {
            ++this.transitionProgress;
            if (this.transitionProgress !== 10) break;
            GameMIDlet.playSound(1, 140);
            break;
          }
          graphics.setColor(65280);
          graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex] + GameMIDlet.interludeTexts[4], 88, 30, 17);
          graphics.drawString(GameMIDlet.interludeTexts[5], 36, 64, 20);
          graphics.drawString(String(GameCanvas.instance.scene.reservedD), 140, 64, 24);
          graphics.drawString(GameMIDlet.interludeTexts[7], 36, 86, 20);
          graphics.drawString(String(GameMIDlet.saveRecord[1] & 0xff), 140, 86, 24);
          graphics.drawString(GameMIDlet.interludeTexts[6], 36, 108, 20);
          const n = ((this.elapsedSeconds / 60) | 0);
          const n4 = (this.elapsedSeconds % 60);
          let string = String(n);
          let string4 = String(n4);
          if (n < 10) {
            string = "0" + string;
          }
          if (n4 < 10) {
            string4 = "0" + string4;
          }
          const string5 = string + ":" + string4;
          graphics.drawString(string5, 140, 108, 24);
          LevelScene.hudFont.drawCell(graphics, 158, 189, 40, 0, 0);
          LevelScene.actorDefs[0]!.drawFrame(graphics, 88, 170, this.resultAnimFrame, this.resultAnimCounter, 0, 0);
          if (this.resultAnimFrame === 34) {
            if (this.resultAnimCounter++ !== 4) break;
            if (this.levelIndex === 6) {
              this.uiState = UiState.GameComplete;
            } else {
              ++this.levelIndex;
              this.uiState = UiState.LevelIntroLoading;
            }
            GameMIDlet.saveRecord[0] = this.levelIndex << 24 >> 24; // (byte) 截断
            GameMIDlet.saveRecord[3] = this.levelIndex << 24 >> 24; // (byte) 截断
            GameMIDlet.saveRecord[4] = PlayerActor.ammoReserve[1] << 24 >> 24; // (byte) 截断
            GameMIDlet.accessSaveRecord(1);
            break;
          }
          if (this.inputAction === 32768) {
            this.resultAnimCounter = 0;
            this.resultAnimFrame = 34;
            break;
          }
          ++this.resultAnimCounter;
          this.resultAnimCounter %= LevelScene.actorDefs[0]!.getFrameCount(this.resultAnimFrame);
          break;
        }
        case UiState.GameComplete: {
          ++this.subState;
          if (this.subState < 16) {
            LevelScene.fillBlackBand(graphics, this.subState, 0, 204);
            break;
          }
          graphics.setColor(65280);
          graphics.drawString(GameMIDlet.interludeTexts[10], 88, 102, 33);
          if (this.subState <= 30) break;
          this.menuStartItem = 1;
          this.menuSelection = 1;
          this.uiState = UiState.MainMenu;
          this.subState = 0;
          // System.gc();
          break;
        }
        case UiState.Help: {
          GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
          graphics.setColor(65280);
          this.drawWrappedLines(graphics, GameMIDlet.tempText3, 5, 6, 19, this.subState, 9);
          LevelScene.hudFont.drawCell(graphics, 158, 189, 40, 0, 0);
          LevelScene.hudFont.drawCell(graphics, 5, 189, 39, 0, 0);
          if (this.inputAction === 32768) {
            this.subState += 9;
            if (this.subState > 26) {
              this.subState = 0;
            }
            this.inputAction = 0;
            break;
          }
          if (this.inputAction !== 16384) break;
          this.uiState = UiState.MainMenu;
          this.inputAction = 0;
          GameMIDlet.tempText3 = null as unknown as string;
          // System.gc();
          break;
        }
        case UiState.About: {
          GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
          graphics.setColor(65280);
          this.drawWrappedLines(graphics, GameMIDlet.tempText3, 5, 5, 18, 0, 10);
          LevelScene.hudFont.drawCell(graphics, 5, 186, 39, 0, 0);
          if (this.inputAction !== 16384) break;
          this.uiState = UiState.MainMenu;
          this.inputAction = 0;
          GameMIDlet.tempText3 = null as unknown as string;
          // System.gc();
        }
      }
    } catch (exception) {
      /* 吞异常（保持原空 catch） */
    }
    this.painting = false;
  }

  // a(boolean) → a_Z（结算入口：bl=true 任务完成→状态16；false 任务失败→状态18）
  showResult(bl: boolean): void {
    this.transitionProgress = 0;
    this.subState = 0;
    this.elapsedSeconds = Date.now() - this.levelStartTime; // System.currentTimeMillis()
    this.elapsedSeconds = (this.elapsedSeconds / 1000) | 0; // long /= 1000L（截断除法）
    if (bl) {
      this.resultAnimFrame = 0;
      this.resultAnimCounter = 0;
      this.uiState = UiState.LevelClear;
      return;
    }
    this.startUnderline(64);
    this.uiState = UiState.LevelFailed;
  }

  hideNotify(): void {
    if (this.uiState === UiState.InGame || this.uiState === UiState.MissionBrief) {
      this.menuSelection = 0;
      this.menuStartItem = 0;
      this.inputAction = 0;
      this.uiState = UiState.MainMenu;
    }
  }

  // a() → a_（进入任务简报）
  enterBriefing(): void {
    this.transitionProgress = 0;
    this.subState = 0;
    this.uiState = UiState.MissionBrief;
    this.scene.subState = 0;
  }

  // a(Graphics) → a_G（载入关卡过场 + 任务简报开场动画绘制）
  private paintLevelIntro(graphics: Graphics): void {
    block17: {
      block19: {
        let bl: boolean;
        let bl2: boolean;
        block18: {
          graphics.setColor(0);
          graphics.setClip(0, 0, 176, 204);
          graphics.fillRect(0, 0, 176, 204);
          if (this.inputAction === 32768) {
            this.uiState = UiState.LevelIntroLoading;
            return;
          }
          graphics.setColor(65280);
          graphics.drawString(GameMIDlet.interludeTexts[1], 171, 201, 40);
          switch (this.transitionProgress) {
            case 0: {
              GameCanvas.briefingAnimE = 0;
              GameCanvas.briefingAnimC = 0;
              ++this.transitionProgress;
              break;
            }
            case 1: {
              GameCanvas.briefingAnimE = 1;
              if (++GameCanvas.briefingAnimC <= 20) break;
              GameCanvas.briefingAnimC = 20;
              GameCanvas.briefingAnimD = 0;
              ++this.transitionProgress;
              break;
            }
            case 2: {
              GameCanvas.briefingAnimE = 2;
              if (++GameCanvas.briefingAnimD <= 20) break;
              GameMIDlet.loadTextEntry(0, "/res/string.bin");
              GameCanvas.briefingAnimD = 20;
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
              if (--GameCanvas.briefingAnimD > 0) break;
              this.uiState = UiState.LevelIntroLoading;
            }
          }
          if (GameCanvas.briefingAnimE > 0) {
            GameCanvas.drawExpandingFrame(graphics, 171, 5, 5, 179, 20, GameCanvas.briefingAnimC, 47872, 0, true);
          }
          if (GameCanvas.briefingAnimE > 1) {
            GameCanvas.drawExpandingFrame(graphics, 134, 72, 13, 25, 20, GameCanvas.briefingAnimD, 47872, 17408, false);
            GameCanvas.drawExpandingFrame(graphics, 42, 149, 163, 102, 20, GameCanvas.briefingAnimD, 47872, 17408, false);
            LevelScene.hudFont.drawCell(graphics, 144, 72 - LevelScene.hudFont.cellHeight[17], 17, 0, 0);
            LevelScene.hudFont.drawCell(graphics, 15, 149 - LevelScene.hudFont.cellHeight[14], 14, 0, 0);
          }
          if (this.transitionProgress !== 3) break block17;
          graphics.setClip(0, 0, 176, 204);
          graphics.setColor(65280);
          graphics.drawString(GameMIDlet.interludeTexts[0], 5, 201, 36);
          bl2 = this.selectParagraph(GameCanvas.briefingLineState[0]);
          bl = this.drawTypesetText(graphics, GameCanvas.briefingLineState[1], GameCanvas.briefingLineState[2], GameCanvas.briefingNumberX[GameCanvas.briefingLineState[0] % 2], GameCanvas.briefingNumberY[GameCanvas.briefingLineState[0] % 2], 90, 19);
          const bl3 = this.inputAction === 16384 || this.inputAction === 16;
          if (bl3) break block18;
          const n = GameCanvas.briefingLineState[3];
          GameCanvas.briefingLineState[3] = n - 1;
          if (n >= 0) break block19;
        }
        if (bl2) {
          ++this.transitionProgress;
        } else if (bl) {
          GameCanvas.briefingLineState[0] = GameCanvas.briefingLineState[0] + 1;
          GameCanvas.briefingLineState[1] = 0;
          GameCanvas.briefingLineState[3] = 60;
        } else {
          GameCanvas.briefingLineState[1] = GameCanvas.briefingLineState[1] + GameCanvas.briefingLineState[2];
          GameCanvas.briefingLineState[3] = 60;
        }
      }
      this.inputAction = 0;
    }
  }

  // b() → b_（镜头初始定位到玩家出生点）
  initCamera(): void {
    this.viewportWidth = 180224;
    this.viewportHeight = 176128;
    this.sceneWidth = this.scene.mapWidth << 10;
    this.sceneHeight = this.scene.mapHeight << 10;
    const n = GameMIDlet.readIntLE(this.scene.actorInstanceTable[0]!, 1, 2);
    const n2 = GameMIDlet.readIntLE(this.scene.actorInstanceTable[0]!, 3, 2);
    this.player.posX = n << 10;
    this.player.posY = n2 << 10;
    this.cameraX = this.player.posX - (((this.viewportWidth * 1) / 4) | 0);
    this.cameraY = this.player.posY - (((this.viewportHeight * 7) / 10) | 0);
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
    const n3 = this.cameraX >> 10;
    const n4 = this.cameraY >> 10;
    this.scene.loadCell(n3, n4);
  }

  // a(int,int) → a_II（镜头跟随玩家平滑滚动到 (n,n2)）
  followCamera(n: number, n2: number): void {
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
      this.cameraX = this.shakeCounter % 2 === 0 ? (this.cameraX -= 2048) : (this.cameraX += 2048);
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

  // a(int) → a_I（关卡载入状态机：卸载旧场景→创建新场景→定位镜头）
  loadLevel(n: number): void {
    this.loadComplete = false;
    switch (this.subState) {
      case 0: {
        if (this.scene != null && LevelScene.currentLevel !== n) {
          this.scene.dispose();
          this.scene = null as unknown as LevelScene;
        }
        this.subState = 1;
        return;
      }
      case 1: {
        if (n !== LevelScene.currentLevel) {
          this.scene = LevelScene.loadLevel(this, n)!;
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

  // run()：原 while(w!=null){...; Thread.sleep(...)} → async + await（控制流逐帧一致）
  async run(): Promise<void> {
    try {
      let l = Date.now(); // System.currentTimeMillis()
      while (this.mainThread != null) {
        if (!this.running || this.painting) {
          await Thread.sleep(0); // 让出执行权，等价于 continue 忙等的协作式空转
          continue;
        }
        const l2 = Date.now() - l; // System.currentTimeMillis()
        if (l2 < 80) {
          await Thread.sleep(80 - l2);
        }
        this.repaint();
        l = Date.now(); // System.currentTimeMillis()
      }
      return;
    } catch (exception) {
      return;
    }
  }

  // d(int) → d_I（键码 → 游戏动作位）
  private keyToAction(n: number): number {
    let n2 = 0;
    this.heldAction = 0;
    switch (n) {
      case -1:
      case 1:
      case 50: {
        if (this.uiState === UiState.InGame) {
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
        n2 = this.uiState === UiState.MainMenu ? 16 : 32768;
      }
    }
    return n2;
  }

  keyPressed(n: number): void {
    let n2: number;
    if (n === 21 || n === -21) {
      if (this.uiState === UiState.InGame || this.uiState === UiState.MissionBrief) {
        this.uiState = UiState.MainMenu;
        this.menuStartItem = 0;
        this.menuSelection = 0;
        this.inputAction = 0;
        return;
      }
    } else if ((n === 22 || n === -22) && this.uiState === UiState.InGame && this.scene.subState === 0) {
      this.transitionProgress = 0;
      this.uiState = UiState.MissionBrief;
    }
    this.inputAction = n2 = this.keyToAction(n);
  }

  keyReleased(n: number): void {
    this.inputAction = 0;
    this.heldAction = -1;
  }

  // b(int) → b_I（触发震屏，持续 n 帧）
  startShake(n: number): void {
    if (!this.shaking) {
      this.shaking = true;
      this.shakeCounter = n;
    }
  }

  // a(Graphics,int,int,int,int,int,int,int,int,boolean) → a_GIIIIIIIIZ
  // 由 (n,n2)→(n3,n4) 按进度 n6/n5 收缩绘制的双层描边框（过场展开动画原语）
  static drawExpandingFrame(
    graphics: Graphics,
    n: number,
    n2: number,
    n3: number,
    n4: number,
    n5: number,
    n6: number,
    n7: number,
    n8: number,
    bl: boolean
  ): void {
    if (n6 <= 0) {
      return;
    }
    let n9 = Math.abs(n - n3);
    let n10 = Math.abs(n2 - n4);
    n9 = ((n9 * n6) / n5) | 0;
    n10 = ((n10 * n6) / n5) | 0;
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

  // a(Graphics,String,int,int,int,int,int) → a_GSIIIII（按 \r 分行绘制字符串，从第 n4 行起绘 n5 行）
  drawWrappedLines(graphics: Graphics, string: string, n: number, n2: number, n3: number, n4: number, n5: number): void {
    let n6 = 0;
    let n7 = 0;
    let n8 = 0;
    do {
      n7 = string.indexOf("\r", n6); // indexOf(13,...)：char 13 = '\r'
      if (n8 >= n4) {
        if (n7 === -1) {
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

  // c(int) → c_I（取 GameMIDlet.l 的第 n 段（\r 分隔）存入 GameMIDlet.m，返回是否为最后一段）
  selectParagraph(n: number): boolean {
    let n2 = 0;
    let n3 = 0;
    let n4 = 0;
    while (n4 < n) {
      if ((n2 = GameMIDlet.tempText1.indexOf("\r", n2)) === -1) {
        // indexOf(13,...)：char 13 = '\r'
        return true;
      }
      n2 += 2;
      ++n4;
    }
    n3 = GameMIDlet.tempText1.indexOf("\r", n2); // indexOf(13,...)
    GameMIDlet.tempText2 = n3 === -1 ? GameMIDlet.tempText1.substring(n2) : GameMIDlet.tempText1.substring(n2, n3);
    return n3 < 0;
  }

  // a(Graphics,int,int,int,int,int,int) → a_GIIIIII（对 GameMIDlet.m 按宽度逐字换行绘制，从第 n 行起绘 n2 行）
  drawTypesetText(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number, n6: number): boolean {
    let n7 = 0;
    let n8 = 0;
    const n9 = GameMIDlet.tempText2.length;
    while (n7 < n9 && n2 > 0) {
      let n10 = n3;
      let n11 = n7 + 1;
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

  // e(int) → e_I（启动菜单下划线伸缩动画，目标宽 n）
  private startUnderline(n: number): void {
    this.underlineTargetWidth = n;
    this.underlineWidth = 48;
    this.underlineDir = 1;
  }

  // a(Graphics,int,int) → a_GII（绘制并推进菜单选中项下划线，以 (n,n2) 为中心横线）
  private drawUnderline(graphics: Graphics, n: number, n2: number): void {
    if (this.underlineDir === 1) {
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
    const n3 = this.underlineWidth >>> 1;
    graphics.drawLine(n - n3, n2, n + n3, n2);
  }
}
