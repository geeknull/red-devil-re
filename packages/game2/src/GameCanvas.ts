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
import { UiState, LevelSubState, ActorType, InputAction, px } from "./constants.ts";

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

  /**
   * 构造主 Canvas（CFR a.java:76-86）。
   * 设全屏（shim 省略）→存自身单例 GameCanvas.instance→记宿主 MIDlet→
   * 初始 UI 状态置 Splash(3)→新建并启动主循环线程 mainThread→置 running=true、painting=false。
   * 二开入口：由 GameMIDlet 在 startApp 时 `new GameCanvas(this)`，一旦构造即开始跑 run() 主循环。
   * @param gameMIDlet 宿主 MIDlet（提供资源加载/存档/音频等静态服务）
   */
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

  /**
   * Actor 工厂（CFR a.java:87-125；原 `a(int,tjge.d)` → 契约名 a_ITd）。
   * 按 actor 类型 ID 分派构造对应运行时子类，供 LevelScene 加载/生成 actor 时调用：
   *   0→PlayerActor（玩家，并缓存到 this.player）；1-5→EnemyActor（普通敌人）；
   *   11/13/17/19/21→BossActor（Boss）；6/7/14/15/18/20/22→ItemActor（道具/机关）；
   *   9/10/12/16→ProjectileActor（弹丸）；其余 ID→ActorBase（基类）。
   * @param actorType actor 类型 ID
   * @param spriteDef 该类型的动作定义（SpriteDef，提供帧/动作数据）
   * @returns 新建的 actor 实例
   */
  // a(int,tjge.d) → a_ITd（精灵/场景对象工厂）
  createActor(actorType: number, spriteDef: SpriteDef): ActorBase {
    switch (actorType) {
      case ActorType.Player: {
        this.player = new PlayerActor(actorType, spriteDef);
        return this.player;
      }
      case ActorType.RiflemanGrunt:
      case ActorType.VehicleGunner:
      case ActorType.GrenadierGrunt:
      case ActorType.SentryGrunt:
      case ActorType.TurretEmplacement: {
        return new EnemyActor(actorType, spriteDef);
      }
      case ActorType.MobileGunEmplacement:
      case ActorType.DestructibleConsole:
      case ActorType.PatrolLauncher:
      case ActorType.HelicopterBoss:
      case ActorType.FinalBoss: {
        return new BossActor(actorType, spriteDef);
      }
      case ActorType.NavalOfficerNpc:
      case ActorType.ItemPickup:
      case ActorType.DriftingFlotsam:
      case ActorType.PatrolFlyer:
      case ActorType.PlayerAttachedEffect:
      case ActorType.SplashEffect:
      case ActorType.GrappleMarker: {
        return new ItemActor(actorType, spriteDef);
      }
      case ActorType.GuidedGrenade:
      case ActorType.DirectBullet:
      case ActorType.ExplosionDebris:
      case ActorType.ArcCannonShell: {
        return new ProjectileActor(actorType, spriteDef);
      }
    }
    return new ActorBase(actorType, spriteDef);
  }

  /**
   * UI 状态机总渲染（CFR a.java:126-551）—— 整个游戏每帧唯一的绘制+逻辑推进入口。
   * 由 run() 主循环通过 repaint() 触发。先自增全局帧计数 globalFrame、置 painting=true、
   * 推进音频超时，然后按 uiState 的值 switch 到对应分支：开机 logo 序列(Splash)、载入进度条
   * (LoadingProgress)、主菜单(MainMenu)、无存档提示(NoSave)、关卡载入(LevelIntroLoading)、
   * 剧情过场(CutsceneIntro→paintLevelIntro)、任务简报(MissionBrief)、游戏中(InGame→scene.tick+render)、
   * 任务失败/完成结算(LevelFailed/LevelClear)、全通(GameComplete)、帮助(Help)、关于(About)。
   * 各分支内既绘制画面也读取/清空输入动作 inputAction 并切换 uiState。整体 try/catch 吞异常（保持原空 catch），
   * 末尾置 painting=false。二开调整任意界面或状态跳转都从这里入手。
   * @param graphics 目标图形上下文
   */
  paint(graphics: Graphics): void {
    ++this.globalFrame;
    this.painting = true;
    graphics.setFont(Font.getFont(0, 0, 8)); // SYSTEM/PLAIN/SMALL
    GameMIDlet.tickSoundTimeout();
    // 纯分派器：按 uiState 转对应 paint<State> helper（每 case 一 helper，逐行对应 CFR a.java:132-546）。
    // 宿主保留 try/catch 静默吞异常 + painting 重入标志；各 helper 顶层 break→return（switch 后仅 painting=false）。
    try {
      switch (this.uiState) {
        case UiState.Splash:
          this.paintSplash(graphics);
          break;
        case UiState.LoadingProgress:
          this.paintLoadingProgress(graphics);
          break;
        case UiState.MainMenu:
          this.paintMainMenu(graphics);
          break;
        case UiState.NoSave:
          this.paintNoSave(graphics);
          break;
        case UiState.LevelIntroLoading:
          this.paintLevelIntroLoading(graphics);
          break;
        case UiState.CutsceneIntro:
          this.paintLevelIntro(graphics); // case 20：直接复用既有的过场/简报开场动画 helper
          break;
        case UiState.MissionBrief:
          this.paintMissionBrief(graphics);
          break;
        case UiState.InGame:
          this.paintInGame(graphics);
          break;
        case UiState.LevelFailed:
          this.paintLevelFailed(graphics);
          break;
        case UiState.LevelClear:
          this.paintLevelClear(graphics);
          break;
        case UiState.GameComplete:
          this.paintGameComplete(graphics);
          break;
        case UiState.Help:
          this.paintHelp(graphics);
          break;
        case UiState.About:
          this.paintAbout(graphics);
          break;
      }
    } catch (exception) {
      /* 吞异常（保持原空 catch） */
    }
    this.painting = false;
  }

  // paint case 3 (UiState.Splash)：开机 logo 分帧序列（subState 1/2/29/47/65 各阶段）→ 进 LoadingProgress。
  private paintSplash(graphics: Graphics): void {
    ++this.subState;
    graphics.setClip(0, 0, 176, 204);
    if (this.subState === 1) {
      this.logoTempImage1 = GameMIDlet.loadImage("/res/logo.bin", 1);
      this.logoTempImage2 = GameMIDlet.loadImage("/res/logo.bin", 2);
      this.logoTempImage3 = GameMIDlet.loadImage("/res/logo.bin", 3);
      this.logoTempImage4 = GameMIDlet.loadImage("/res/logo.bin", 4);
      this.logoImageMain = GameMIDlet.loadImage("/res/logo.bin", 0);
      this.logoImageSub = GameMIDlet.loadImage("/res/logo.bin", 5);
      return;
    }
    if (this.subState === 2) {
      GameMIDlet.loadSounds();
      GameMIDlet.accessSaveRecord(0);
      graphics.drawImage(this.logoTempImage1!, 38, 60, 20);
      this.logoTempImage1 = null;
      graphics.setColor(238, 25, 33);
      graphics.drawString("移动互连 无限可能", 96, 122, 17);
      return;
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
      return;
    }
    if (this.subState === 47) {
      graphics.setColor(255, 255, 255);
      graphics.fillRect(0, 0, 176, 208);
      graphics.drawImage(this.logoTempImage4!, 88, 45, 17);
      this.logoTempImage4 = null;
      return;
    }
    if (this.subState !== 65) return;
    graphics.setColor(0);
    graphics.fillRect(0, 0, 176, 204);
    graphics.drawImage(this.logoImageMain!, 0, 0, 20);
    graphics.drawImage(this.logoImageSub!, 0, this.logoImageMain!.getHeight() + 2, 20);
    this.uiState = UiState.LoadingProgress;
    this.subState = 0;
    GameMIDlet.playSound(0, 160);
  }

  // paint case 1 (UiState.LoadingProgress)：绘 logo + 进度条，按 subState 递进加载资源，满则进 MainMenu。
  private paintLoadingProgress(graphics: Graphics): void {
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
    if (!LevelScene.loadResourcesUpTo(this, this.subState)) return;
    this.uiState = UiState.MainMenu;
    this.levelIndex = 0;
    this.subState = 0;
    this.menuStartItem = 1;
    this.menuSelection = 1;
    this.startUnderline(120);
  }

  // paint case 4 (UiState.MainMenu)：绘菜单项 + 下划线，上/下移光标，确定(16)进内层 switch(menuSelection) 分派。
  private paintMainMenu(graphics: Graphics): void {
    graphics.setClip(0, 0, 176, 204);
    graphics.setColor(0);
    graphics.fillRect(0, 0, 176, 204);
    graphics.drawImage(this.logoImageMain!, 0, 0, 20);
    graphics.drawImage(this.logoImageSub!, 0, this.logoImageMain!.getHeight() + 2, 20);
    let menuItem = this.menuStartItem;
    while (menuItem < 7) {
      graphics.setColor(this.menuSelection === menuItem && this.underlineDir === 1 ? 0xffffff : 65280);
      if (menuItem === 3) {
        graphics.drawString(GameMIDlet.menuTexts[GameMIDlet.saveRecord[2] === 0 ? 7 : 3], 88, 60 + menuItem * 20, 17);
      } else {
        graphics.drawString(GameMIDlet.menuTexts[menuItem], 88, 60 + menuItem * 20, 17);
      }
      ++menuItem;
    }
    graphics.setColor(65280);
    this.drawUnderline(graphics, 88, 80 + this.menuSelection * 20);
    if (this.inputAction === InputAction.Up) {
      this.startUnderline(120);
      if (--this.menuSelection < this.menuStartItem) {
        this.menuSelection = 6;
      }
    } else if (this.inputAction === InputAction.Down) {
      this.startUnderline(120);
      if (++this.menuSelection > 6) {
        this.menuSelection = this.menuStartItem;
      }
    } else if (this.inputAction === InputAction.Fire) {
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
          const continueCount = GameMIDlet.saveRecord[1];
          GameMIDlet.saveRecord[1] = (continueCount + 1) << 24 >> 24; // (byte) 截断
          if (continueCount > 99) {
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
          this.inputAction = InputAction.None;
          this.uiState = UiState.Help;
          break;
        }
        case 5: {
          GameMIDlet.loadTextEntry(8, "/res/string.bin");
          this.inputAction = InputAction.None;
          this.uiState = UiState.About;
          break;
        }
        case 6: {
          this.midlet.destroyApp(true);
        }
      }
    }
    this.inputAction = InputAction.None;
  }

  // paint case 100 (UiState.NoSave)：无存档提示页，显示 ~15 帧后自动回 MainMenu。
  private paintNoSave(graphics: Graphics): void {
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
    if (this.subState <= 15) return;
    this.subState = 0;
    this.uiState = UiState.MainMenu;
  }

  // paint case 2 (UiState.LevelIntroLoading)：分帧 loadLevel + 载入提示，loadComplete 后进 InGame 并记开始时刻。
  private paintLevelIntroLoading(graphics: Graphics): void {
    this.loadLevel(this.levelIndex);
    graphics.setColor(0);
    graphics.setClip(0, 0, 176, 204);
    graphics.fillRect(0, 0, 176, 204);
    graphics.setColor(65280);
    graphics.drawString(GameMIDlet.interludeTexts[11], 88, 184, 17);
    if (!this.loadComplete) return;
    this.subState = 0;
    this.uiState = UiState.InGame;
    this.levelStartTime = Date.now(); // System.currentTimeMillis()
  }

  // paint case 22 (UiState.MissionBrief)：渲染场景 + 展开边框动画；进度满则绘任务简报文本与关卡星标。
  private paintMissionBrief(graphics: Graphics): void {
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
      this.inputAction = InputAction.None;
      return;
    }
    GameCanvas.drawExpandingFrame(graphics, 166, 40, 10, 70, 20, 20, 47872, 17408, true);
    GameCanvas.drawExpandingFrame(graphics, 166, 90, 10, 145, 20, 20, 47872, 17408, true);
    graphics.setColor(65280);
    graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex], 88, 15, 17);
    graphics.drawString(GameMIDlet.missionTexts[this.levelIndex], 88, 47, 17);
    LevelScene.hudFont.drawCell(graphics, 158, 157, 39, 0, 0);
    LevelScene.hudFont.drawCell(graphics, 23, 95, 29, 0, 0);
    const stageMarkX = Int32Array.from([5, 19, 44, 58, 81, 99, 124]);
    const stageMarkY = Int32Array.from([90, 100, 89, 101, 101, 93, 91]);
    let stageIndex = 0;
    while (stageIndex < 7) {
      if (stageIndex <= this.levelIndex && (stageIndex !== this.levelIndex || this.globalFrame % 4 <= 1)) {
        LevelScene.hudFont.drawCell(graphics, 24 + stageMarkX[stageIndex], 24 + stageMarkY[stageIndex], 28, 0, 0);
      }
      ++stageIndex;
    }
    if (this.subState === 0 && this.inputAction === InputAction.SoftRight) {
      this.subState = 1;
      --this.transitionProgress;
    }
  }

  // paint case 10 (UiState.InGame)：游戏中——推进场景逻辑并渲染。
  private paintInGame(graphics: Graphics): void {
    this.scene.tick();
    this.scene.render(graphics);
  }

  // paint case 18 (UiState.LevelFailed)：任务失败结算页，展开边框后绘统计（分/秒/储备）+ 重试/菜单双选项。
  private paintLevelFailed(graphics: Graphics): void {
    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, this.transitionProgress, 47872, 0, true);
    if (this.transitionProgress < 10) {
      ++this.transitionProgress;
      this.menuSelection = 0;
      return;
    }
    graphics.setColor(65280);
    graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex] + GameMIDlet.interludeTexts[8], 88, 30, 17);
    graphics.drawString(GameMIDlet.interludeTexts[5], 36, 64, 20);
    graphics.drawString(String(GameCanvas.instance.scene.reservedD), 140, 64, 24);
    graphics.drawString(GameMIDlet.interludeTexts[7], 36, 90, 20);
    graphics.drawString(String(GameMIDlet.saveRecord[1] & 0xff), 140, 90, 24);
    graphics.drawString(GameMIDlet.interludeTexts[6], 36, 116, 20);
    const minutes = ((this.elapsedSeconds / 60) | 0);
    const seconds = (this.elapsedSeconds % 60);
    let minStr = String(minutes);
    let secStr = String(seconds);
    if (minutes < 10) {
      minStr = "0" + minStr;
    }
    if (seconds < 10) {
      secStr = "0" + secStr;
    }
    const timeStr = minStr + ":" + secStr;
    graphics.drawString(timeStr, 140, 116, 24);
    LevelScene.actorDefs[0]!.drawFrame(graphics, 48, 170, 4, 0, 0, 0);
    graphics.setClip(0, 0, 176, 204);
    if (this.inputAction === InputAction.Up) {
      this.startUnderline(64);
      if (--this.menuSelection < 0) {
        this.menuSelection = 1;
      }
      this.inputAction = InputAction.None;
    } else if (this.inputAction === InputAction.Down) {
      this.startUnderline(64);
      if (++this.menuSelection > 1) {
        this.menuSelection = 0;
      }
      this.inputAction = InputAction.None;
    } else if (this.inputAction === InputAction.Fire) {
      if (this.menuSelection === 0) {
        const continueCount = GameMIDlet.saveRecord[1];
        GameMIDlet.saveRecord[1] = (continueCount + 1) << 24 >> 24; // (byte) 截断
        if (continueCount > 99) {
          GameMIDlet.saveRecord[1] = 99;
        }
        this.uiState = UiState.LevelIntroLoading;
      } else {
        this.menuStartItem = 1;
        this.menuSelection = 1;
        this.uiState = UiState.MainMenu;
      }
      this.inputAction = InputAction.None;
    }
    let optionIndex = 0;
    while (optionIndex < 2) {
      graphics.setColor(optionIndex === this.menuSelection && this.underlineDir === 1 ? 0xffffff : 65280);
      if (optionIndex === 0) {
        graphics.drawString(GameMIDlet.interludeTexts[0], 120, 150, 17);
      } else {
        graphics.drawString(GameMIDlet.interludeTexts[9], 120, 170, 17);
      }
      ++optionIndex;
    }
    graphics.setColor(65280);
    this.drawUnderline(graphics, 120, 169 + this.menuSelection * 20);
  }

  // paint case 16 (UiState.LevelClear)：任务完成结算页，展开边框→绘统计→播结算动画；到 frame34 存档并进下一关/GameComplete。
  private paintLevelClear(graphics: Graphics): void {
    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, this.transitionProgress, 47872, 0, true);
    if (this.transitionProgress < 10) {
      ++this.transitionProgress;
      if (this.transitionProgress !== 10) return;
      GameMIDlet.playSound(1, 140);
      return;
    }
    graphics.setColor(65280);
    graphics.drawString(GameMIDlet.interludeTexts[2] + GameMIDlet.numeralTexts[this.levelIndex] + GameMIDlet.interludeTexts[4], 88, 30, 17);
    graphics.drawString(GameMIDlet.interludeTexts[5], 36, 64, 20);
    graphics.drawString(String(GameCanvas.instance.scene.reservedD), 140, 64, 24);
    graphics.drawString(GameMIDlet.interludeTexts[7], 36, 86, 20);
    graphics.drawString(String(GameMIDlet.saveRecord[1] & 0xff), 140, 86, 24);
    graphics.drawString(GameMIDlet.interludeTexts[6], 36, 108, 20);
    const minutes = ((this.elapsedSeconds / 60) | 0);
    const seconds = (this.elapsedSeconds % 60);
    let minStr = String(minutes);
    let secStr = String(seconds);
    if (minutes < 10) {
      minStr = "0" + minStr;
    }
    if (seconds < 10) {
      secStr = "0" + secStr;
    }
    const timeStr = minStr + ":" + secStr;
    graphics.drawString(timeStr, 140, 108, 24);
    LevelScene.hudFont.drawCell(graphics, 158, 189, 40, 0, 0);
    LevelScene.actorDefs[0]!.drawFrame(graphics, 88, 170, this.resultAnimFrame, this.resultAnimCounter, 0, 0);
    if (this.resultAnimFrame === 34) {
      if (this.resultAnimCounter++ !== 4) return;
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
      return;
    }
    if (this.inputAction === InputAction.SoftRight) {
      this.resultAnimCounter = 0;
      this.resultAnimFrame = 34;
      return;
    }
    ++this.resultAnimCounter;
    this.resultAnimCounter %= LevelScene.actorDefs[0]!.getFrameCount(this.resultAnimFrame);
  }

  // paint case 21 (UiState.GameComplete)：全通画面——黑幕渐展(subState<16) + 通关文字，30 帧后回 MainMenu。
  private paintGameComplete(graphics: Graphics): void {
    ++this.subState;
    if (this.subState < 16) {
      LevelScene.fillBlackBand(graphics, this.subState, 0, 204);
      return;
    }
    graphics.setColor(65280);
    graphics.drawString(GameMIDlet.interludeTexts[10], 88, 102, 33);
    if (this.subState <= 30) return;
    this.menuStartItem = 1;
    this.menuSelection = 1;
    this.uiState = UiState.MainMenu;
    this.subState = 0;
    // System.gc();
  }

  // paint case 6 (UiState.Help)：帮助页——分页绘制换行文本；右软键(32768)翻页，左软键(16384)回 MainMenu。
  private paintHelp(graphics: Graphics): void {
    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
    graphics.setColor(65280);
    this.drawWrappedLines(graphics, GameMIDlet.tempText3, 5, 6, 19, this.subState, 9);
    LevelScene.hudFont.drawCell(graphics, 158, 189, 40, 0, 0);
    LevelScene.hudFont.drawCell(graphics, 5, 189, 39, 0, 0);
    if (this.inputAction === InputAction.SoftRight) {
      this.subState += 9;
      if (this.subState > 26) {
        this.subState = 0;
      }
      this.inputAction = InputAction.None;
      return;
    }
    if (this.inputAction !== InputAction.SoftLeft) return;
    this.uiState = UiState.MainMenu;
    this.inputAction = InputAction.None;
    GameMIDlet.tempText3 = null as unknown as string;
    // System.gc();
  }

  // paint case 19 (UiState.About)：关于页——绘换行文本；左软键(16384)回 MainMenu。CFR 末 case 无末尾 break，落到函数尾自然返回。
  private paintAbout(graphics: Graphics): void {
    GameCanvas.drawExpandingFrame(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
    graphics.setColor(65280);
    this.drawWrappedLines(graphics, GameMIDlet.tempText3, 5, 5, 18, 0, 10);
    LevelScene.hudFont.drawCell(graphics, 5, 186, 39, 0, 0);
    if (this.inputAction !== InputAction.SoftLeft) return;
    this.uiState = UiState.MainMenu;
    this.inputAction = InputAction.None;
    GameMIDlet.tempText3 = null as unknown as string;
    // System.gc();
  }

  /**
   * 本关结束结算入口（CFR a.java:552-566；原 `a(boolean)` → 契约名 a_Z）。
   * 由场景在关卡判定胜/负时调用。复位 transitionProgress/subState，按
   * elapsedSeconds = (now - levelStartTime)/1000 截断算出本关用时（秒），然后：
   *   bl=true（任务完成）→复位结算动画帧/计数，切 LevelClear(16)；
   *   bl=false（任务失败）→启动下划线动画，切 LevelFailed(18)。
   * @param bl true=胜利结算，false=失败结算
   */
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

  /**
   * 失焦回调（CFR a.java:567-575）—— 框架在画布失去焦点（来电/锁屏等）时调用。
   * 若当前在游戏中或任务简报页，则复位菜单与输入并切回主菜单（相当于自动暂停回到菜单）。
   */
  hideNotify(): void {
    if (this.uiState === UiState.InGame || this.uiState === UiState.MissionBrief) {
      this.menuSelection = 0;
      this.menuStartItem = 0;
      this.inputAction = InputAction.None;
      this.uiState = UiState.MainMenu;
    }
  }

  /**
   * 进入任务简报页（CFR a.java:576-582；原 `a()` → 契约名 a_）。
   * 复位 transitionProgress/subState，切 uiState 到 MissionBrief(20)，并把当前场景的子状态归零。
   */
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
        let textFullyDrawn: boolean;
        let isLastParagraph: boolean;
        block18: {
          graphics.setColor(0);
          graphics.setClip(0, 0, 176, 204);
          graphics.fillRect(0, 0, 176, 204);
          if (this.inputAction === InputAction.SoftRight) {
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
              this.inputAction = InputAction.None;
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
          isLastParagraph = this.selectParagraph(GameCanvas.briefingLineState[0]);
          textFullyDrawn = this.drawTypesetText(graphics, GameCanvas.briefingLineState[1], GameCanvas.briefingLineState[2], GameCanvas.briefingNumberX[GameCanvas.briefingLineState[0] % 2], GameCanvas.briefingNumberY[GameCanvas.briefingLineState[0] % 2], 90, 19);
          const advanceInput = this.inputAction === InputAction.SoftLeft || this.inputAction === InputAction.Fire;
          if (advanceInput) break block18;
          const lineDelay = GameCanvas.briefingLineState[3];
          GameCanvas.briefingLineState[3] = lineDelay - 1;
          if (lineDelay >= 0) break block19;
        }
        if (isLastParagraph) {
          ++this.transitionProgress;
        } else if (textFullyDrawn) {
          GameCanvas.briefingLineState[0] = GameCanvas.briefingLineState[0] + 1;
          GameCanvas.briefingLineState[1] = 0;
          GameCanvas.briefingLineState[3] = 60;
        } else {
          GameCanvas.briefingLineState[1] = GameCanvas.briefingLineState[1] + GameCanvas.briefingLineState[2];
          GameCanvas.briefingLineState[3] = 60;
        }
      }
      this.inputAction = InputAction.None;
    }
  }

  /**
   * 镜头初始化/对焦玩家出生点（CFR a.java:670-697；原 `b()` → 契约名 b_）。
   * 设视口尺寸（定点）viewportWidth=180224(176<<10)、viewportHeight=176128、场景定点尺寸
   * sceneWidth/sceneHeight（由地图格宽高<<10），从场景 actor 实例表读出玩家出生坐标并定位
   * player.posX/posY，再把相机置于玩家偏左偏上处并按场景边界钳制，最后让场景按相机格加载当前屏块。
   * 由 loadLevel 在关卡加载末段调用。
   */
  // b() → b_（镜头初始定位到玩家出生点）
  initCamera(): void {
    this.viewportWidth = px(176);
    this.viewportHeight = px(172);
    this.sceneWidth = this.scene.mapWidth << 10;
    this.sceneHeight = this.scene.mapHeight << 10;
    const spawnX = GameMIDlet.readIntLE(this.scene.actorInstanceTable[0]!, 1, 2);
    const spawnY = GameMIDlet.readIntLE(this.scene.actorInstanceTable[0]!, 3, 2);
    this.player.posX = spawnX << 10;
    this.player.posY = spawnY << 10;
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
    const cameraCellX = this.cameraX >> 10;
    const cameraCellY = this.cameraY >> 10;
    this.scene.loadCell(cameraCellX, cameraCellY);
  }

  /**
   * 镜头平滑跟随（CFR a.java:698-748；原 `a(int,int)` → 契约名 a_II）。
   * 每帧由场景调用，把相机朝目标 (targetX,targetY) 做差值步进（X/Y 各自计算 cameraVelX/cameraVelY，
   * 超过阈值用玩家速度叠加偏移、否则直接吸附），叠加震屏抖动（shaking 时按帧奇偶 ±2048 并递减
   * shakeCounter），最后按场景边界钳制相机坐标。
   * @param targetX 目标相机 X（定点）
   * @param targetY 目标相机 Y（定点）
   */
  // a(int,int) → a_II（镜头跟随玩家平滑滚动到 (targetX,targetY)）
  followCamera(targetX: number, targetY: number): void {
    this.cameraVelX = 0;
    this.cameraVelY = 0;
    if (this.cameraX < targetX) {
      if (targetX - this.cameraX > px(16)) {
        this.cameraVelX = this.player.targetVelX + px(16);
      } else {
        this.cameraX = targetX;
      }
    } else if (this.cameraX > targetX) {
      if (this.cameraX - targetX > px(16)) {
        this.cameraVelX = this.player.targetVelX - px(16);
      } else {
        this.cameraX = targetX;
      }
    }
    if (this.cameraY < targetY) {
      if (targetY - this.cameraY > px(10)) {
        this.cameraVelY = Math.min(this.player.targetVelY + px(10), px(15));
      } else {
        this.cameraY = targetY;
      }
    } else if (this.cameraY > targetY) {
      if (this.cameraY - targetY > px(10)) {
        this.cameraVelY = Math.max(this.player.targetVelY - px(10), px(-15));
      } else {
        this.cameraY = targetY;
      }
    }
    this.cameraX += this.cameraVelX;
    this.cameraY += this.cameraVelY;
    if (this.shaking) {
      this.cameraX = this.shakeCounter % 2 === 0 ? (this.cameraX -= px(2)) : (this.cameraX += px(2));
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

  /**
   * 关卡加载步进机（CFR a.java:749-773；原 `a(int)` → 契约名 a_I）。
   * 分帧推进（用 subState 0→1→2 三步，每帧只走一步，避免长卡顿）：
   *   step0=若有旧场景且关卡号变了则 dispose 卸载；step1=按需 LevelScene.loadLevel 建新场景；
   *   step2=initCamera 对焦并置 loadComplete=true。
   * 由 paint 的 LevelIntroLoading 分支反复调用直到 loadComplete。
   * @param targetLevel 目标关卡号（0~6）
   */
  // a(int) → a_I（关卡载入状态机：卸载旧场景→创建新场景→定位镜头）
  loadLevel(targetLevel: number): void {
    this.loadComplete = false;
    switch (this.subState) {
      case 0: {
        if (this.scene != null && LevelScene.currentLevel !== targetLevel) {
          this.scene.dispose();
          this.scene = null as unknown as LevelScene;
        }
        this.subState = 1;
        return;
      }
      case 1: {
        if (targetLevel !== LevelScene.currentLevel) {
          this.scene = LevelScene.loadLevel(this, targetLevel)!;
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

  /**
   * 主循环（CFR a.java:774-792）—— Runnable.run()，由构造时启动的 mainThread 驱动。
   * 约 80ms/帧（不足则 Thread.sleep 补齐）：若未运行或正在 painting 则让出执行权空转，
   * 否则节流到 80ms 后 repaint() 触发一次 paint()。原 Java `while(w!=null)` 阻塞循环移植为
   * async + await（控制流逐帧一致）；整体 try/catch 静默退出。
   */
  // run()：原 while(w!=null){...; Thread.sleep(...)} → async + await（控制流逐帧一致）
  async run(): Promise<void> {
    try {
      let lastFrameMs = Date.now(); // System.currentTimeMillis()
      while (this.mainThread != null) {
        if (!this.running || this.painting) {
          await Thread.sleep(0); // 让出执行权，等价于 continue 忙等的协作式空转
          continue;
        }
        const elapsedMs = Date.now() - lastFrameMs; // System.currentTimeMillis()
        if (elapsedMs < 80) {
          await Thread.sleep(80 - elapsedMs);
        }
        this.repaint();
        lastFrameMs = Date.now(); // System.currentTimeMillis()
      }
      return;
    } catch (exception) {
      return;
    }
  }

  // d(int) → d_I（键码 → 游戏动作位）
  private keyToAction(keyCode: number): number {
    let action = InputAction.None;
    this.heldAction = InputAction.None;
    switch (keyCode) {
      case -1:
      case 1:
      case 50: {
        if (this.uiState === UiState.InGame) {
          action = InputAction.ClimbUp;
          break;
        }
        action = InputAction.Up;
        break;
      }
      case -6:
      case 6:
      case 56: {
        action = InputAction.Down;
        break;
      }
      case -2:
      case 2:
      case 52: {
        action = InputAction.Left;
        break;
      }
      case -5:
      case 5:
      case 54: {
        action = InputAction.Right;
        break;
      }
      case -20:
      case 20:
      case 53: {
        action = InputAction.Fire;
        this.heldAction = InputAction.Fire;
        break;
      }
      case 55: {
        action = InputAction.Reload;
        break;
      }
      case 35:
      case 57: {
        action = InputAction.Grenade;
        break;
      }
      case 42: {
        action = InputAction.SwitchWeapon;
        break;
      }
      case 49: {
        action = InputAction.JumpLeft;
        break;
      }
      case 51: {
        action = InputAction.JumpRight;
        break;
      }
      case -21:
      case 21: {
        action = InputAction.SoftLeft;
        break;
      }
      case -22:
      case 22: {
        action = this.uiState === UiState.MainMenu ? InputAction.Fire : InputAction.SoftRight;
      }
    }
    return action;
  }

  /**
   * 按键按下回调（CFR a.java:866-882）—— 框架输入入口。
   * 先处理软键直切状态：左软键(21/-21) 在游戏中/简报页时回主菜单；右软键(22/-22) 在游戏中且场景常规态时进任务简报。
   * 其余按键经 keyToAction 译成动作位掩码写入 inputAction，供 paint 各分支读取。
   * 各键的实际效果以 keyToAction 为准（另见 memory「按键动作映射」）。
   * @param keyCode J2ME 键码（含方向键/小键盘/软键负码）
   */
  keyPressed(keyCode: number): void {
    let action: number;
    if (keyCode === 21 || keyCode === -21) {
      if (this.uiState === UiState.InGame || this.uiState === UiState.MissionBrief) {
        this.uiState = UiState.MainMenu;
        this.menuStartItem = 0;
        this.menuSelection = 0;
        this.inputAction = InputAction.None;
        return;
      }
    } else if ((keyCode === 22 || keyCode === -22) && this.uiState === UiState.InGame && this.scene.subState === 0) {
      this.transitionProgress = 0;
      this.uiState = UiState.MissionBrief;
    }
    this.inputAction = action = this.keyToAction(keyCode);
  }

  /**
   * 按键松开回调（CFR a.java:883-887）—— 清空当前输入动作 inputAction=0，并置 heldAction=-1（解除持续按住标志）。
   * @param keyCode J2ME 键码（此实现不区分具体键，统一清状态）
   */
  keyReleased(keyCode: number): void {
    this.inputAction = InputAction.None;
    this.heldAction = -1;
  }

  /**
   * 触发震屏（CFR a.java:888-894；原 `b(int)` → 契约名 b_I）。
   * 若当前未在震屏，则置 shaking=true、shakeCounter=n，后续由 followCamera 每帧抖动相机直到计数耗尽。
   * @param durationFrames 震屏持续帧数
   */
  // b(int) → b_I（触发震屏，持续 durationFrames 帧）
  startShake(durationFrames: number): void {
    if (!this.shaking) {
      this.shaking = true;
      this.shakeCounter = durationFrames;
    }
  }

  /**
   * 展开/收缩描边框绘制原语（CFR a.java:895-922；原 9 参 `a(Graphics,...)` → 契约名 a_GIIIIIIIIZ）。
   * 过场/任务简报/结算页对话框边框的动画基元：把矩形从 (x0,y0) 朝 (x1,y1) 按进度 progress/fullProgress 比例收缩，
   * 用颜色 strokeColor 描边、fillColor≥0 时填充内部；doubleBorder=true 再叠加内层黑+绿双描边。进度 progress≤0 时不绘制。
   * @param graphics 目标图形上下文
   * @param x0 起点 X
   * @param y0 起点 Y
   * @param x1 终点 X
   * @param y1 终点 Y
   * @param fullProgress 进度分母（满进度）
   * @param progress 当前进度（0..fullProgress）
   * @param strokeColor 描边颜色
   * @param fillColor 填充颜色（<0 表示不填充）
   * @param doubleBorder 是否叠加双层内描边
   */
  // a(Graphics,int,int,int,int,int,int,int,int,boolean) → a_GIIIIIIIIZ
  // 由 (x0,y0)→(x1,y1) 按进度 progress/fullProgress 收缩绘制的双层描边框（过场展开动画原语）
  static drawExpandingFrame(
    graphics: Graphics,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    fullProgress: number,
    progress: number,
    strokeColor: number,
    fillColor: number,
    doubleBorder: boolean
  ): void {
    if (progress <= 0) {
      return;
    }
    let width = Math.abs(x0 - x1);
    let height = Math.abs(y0 - y1);
    width = ((width * progress) / fullProgress) | 0;
    height = ((height * progress) / fullProgress) | 0;
    if (x0 > x1) {
      x0 -= width;
    }
    if (y0 > y1) {
      y0 -= height;
    }
    graphics.setColor(strokeColor);
    graphics.drawRect(x0, y0, width, height);
    if (fillColor >= 0) {
      graphics.setColor(fillColor);
      graphics.fillRect(x0 + 1, y0 + 1, width - 1, height - 1);
    }
    if (doubleBorder) {
      graphics.setColor(0);
      graphics.drawRect(x0 + 1, y0 + 1, width - 2, height - 2);
      graphics.setColor(65280);
      graphics.drawRect(x0 + 2, y0 + 2, width - 4, height - 4);
    }
  }

  /**
   * 按 \r(回车,char 13) 分行绘制多行文本（CFR a.java:923-942；原 `a(Graphics,String,...)` → 契约名 a_GSIIIII）。
   * 帮助/关于页用：跳过前 skipLines 行，从第 skipLines 行起、以 (x,y) 为左上、行高 lineHeight 连续绘制至多 maxLines 行。
   * @param graphics 目标图形上下文
   * @param text 含 \r 分隔的多行原文
   * @param x 起始 X
   * @param y 起始 Y
   * @param lineHeight 行高
   * @param skipLines 起始行号（跳过的行数）
   * @param maxLines 最多绘制的行数
   */
  // a(Graphics,String,int,int,int,int,int) → a_GSIIIII（按 \r 分行绘制字符串，从第 skipLines 行起绘 maxLines 行）
  drawWrappedLines(graphics: Graphics, text: string, x: number, y: number, lineHeight: number, skipLines: number, maxLines: number): void {
    let cursor = 0;
    let breakPos = 0;
    let lineNo = 0;
    do {
      breakPos = text.indexOf("\r", cursor); // indexOf(13,...)：char 13 = '\r'
      if (lineNo >= skipLines) {
        if (breakPos === -1) {
          graphics.drawString(text.substring(cursor), x, y, 20);
        } else {
          graphics.drawString(text.substring(cursor, breakPos), x, y, 20);
        }
        y += lineHeight;
        --maxLines;
      }
      cursor = breakPos + 2;
      ++lineNo;
    } while (breakPos >= 0 && maxLines > 0);
  }

  /**
   * 选取任务简报正文的第 n 段（CFR a.java:943-958；原 `c(int)` → 契约名 c_I）。
   * 在 GameMIDlet.tempText1 中按 \r(char 13) 跳过前 paragraphIndex 段，把第 paragraphIndex 段子串存入 GameMIDlet.tempText2，
   * 供 drawTypesetText 逐字折行绘制。任务简报逐段推进时由 paintLevelIntro 调用。
   * @param paragraphIndex 目标段落游标（从 0 起）
   * @returns 是否已到最后一段（无更多 \r）
   */
  // c(int) → c_I（取 GameMIDlet.l 的第 paragraphIndex 段（\r 分隔）存入 GameMIDlet.m，返回是否为最后一段）
  selectParagraph(paragraphIndex: number): boolean {
    let searchPos = 0;
    let breakPos = 0;
    let counter = 0;
    while (counter < paragraphIndex) {
      if ((searchPos = GameMIDlet.tempText1.indexOf("\r", searchPos)) === -1) {
        // indexOf(13,...)：char 13 = '\r'
        return true;
      }
      searchPos += 2;
      ++counter;
    }
    breakPos = GameMIDlet.tempText1.indexOf("\r", searchPos); // indexOf(13,...)
    GameMIDlet.tempText2 = breakPos === -1 ? GameMIDlet.tempText1.substring(searchPos) : GameMIDlet.tempText1.substring(searchPos, breakPos);
    return breakPos < 0;
  }

  /**
   * 按字宽自动折行绘制任务简报正文（CFR a.java:959-979；原 6 参 `a(Graphics,...)` → 契约名 a_GIIIIII）。
   * 对 GameMIDlet.tempText2 逐字测宽断行：跳过前 skipLines 行，从第 skipLines 行起、左上 (x,y)、行宽 wrapWidth、行高 lineHeight
   * 连续绘制至多 maxLines 行。shim 无 Font，故用底层 ctx.measureText 近似测宽、drawString 近似绘子串
   * （控制流逐行与 CFR 一致，见类级 JSDoc 偏差说明）。
   * @param graphics 目标图形上下文
   * @param skipLines 起始行号（跳过的行数）
   * @param maxLines 最多绘制的行数
   * @param x 起始 X（左边界）
   * @param y 起始 Y
   * @param wrapWidth 折行宽度
   * @param lineHeight 行高
   * @returns 文本是否已全部绘完
   */
  // a(Graphics,int,int,int,int,int,int) → a_GIIIIII（对 GameMIDlet.m 按宽度逐字换行绘制，从第 skipLines 行起绘 maxLines 行）
  drawTypesetText(graphics: Graphics, skipLines: number, maxLines: number, x: number, y: number, wrapWidth: number, lineHeight: number): boolean {
    let charCursor = 0;
    let lineNo = 0;
    const textLen = GameMIDlet.tempText2.length;
    while (charCursor < textLen && maxLines > 0) {
      let penX = x;
      let charEnd = charCursor + 1;
      while (penX < x + wrapWidth && charEnd < textLen) {
        penX = x + graphics.getFont().substringWidth(GameMIDlet.tempText2, charCursor, charEnd - charCursor);
        ++charEnd;
      }
      if (++lineNo > skipLines) {
        graphics.drawSubstring(GameMIDlet.tempText2, charCursor, charEnd - charCursor, x, y, 20);
        y += lineHeight;
        --maxLines;
      }
      charCursor = charEnd;
    }
    return charCursor >= textLen;
  }

  // e(int) → e_I（启动菜单下划线伸缩动画，目标宽 targetWidth）
  private startUnderline(targetWidth: number): void {
    this.underlineTargetWidth = targetWidth;
    this.underlineWidth = 48;
    this.underlineDir = 1;
  }

  // a(Graphics,int,int) → a_GII（绘制并推进菜单选中项下划线，以 (centerX,centerY) 为中心横线）
  private drawUnderline(graphics: Graphics, centerX: number, centerY: number): void {
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
    const halfWidth = this.underlineWidth >>> 1;
    graphics.drawLine(centerX - halfWidth, centerY, centerX + halfWidth, centerY);
  }
}
