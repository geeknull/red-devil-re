/**
 * 游戏2《红魔特种兵2-深海战舰》场景/关卡运行时（最大类，1364 行）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/j.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 职责：解析 /res/s.bin（actor 类型表 / 触发器 / 实例 / 分屏 spawn 表），
 *   驱动相机（字段 a，类型 tjge.b）、spawn 与剧情对话推进（j.f_()），
 *   子状态机 w（0-6）；持有当前主控 a（tjge.a）。
 *
 * 字段别名（沿用原混淆名）：
 *   a=相机（tjge.b，静态）；b=动作集 d[]；c=已加载标志；d=actor 池[类型][槽]；
 *   e=活动 actor 槽位表；P=分屏临时缓冲；f=本帧绘制列表；g=本帧绘制数；
 *   h=actor 类型→绘制层；Q=触发器/对话参数缓冲；R=spawn 字节缓冲；
 *   i/j/k=剧情/结算/编队 状态数组；l=触发器表；m=actor 实例表；
 *   n/o=触发器一次性标志；S/T=分屏单元宽高；p=每屏 spawn 触发器索引；
 *   q=每屏常驻 actor 索引；U=分屏总数；r=当前屏索引；V=常驻 actor 数；
 *   s=常驻 actor 槽位数；t=全局常驻 actor 索引；u/v=地图宽高；
 *   w=子状态；x=上一子状态；y=过场遮罩高度；z=当前关卡号（静态）；
 *   W=纵向卷屏 y；A/B=相机目标缓存；C=本波生成数；D=保留；E/F=相机目标 x/y；
 *   G=斜向编队切换；H/I=对话推进/翻页标志；J=纵向卷屏关；X=对话 actor（tjge.c）；
 *   K=HUD 字模（tjge.i，静态）；L=主控（tjge.a）；M/N=子状态内部计步（静态）；
 *   O=关卡资源加载表[类型, 实例数]（静态）。
 *
 * 跨类方法名按契约表：
 *   a（字段，类型 tjge.b 相机）：a_G/a_II/a_/b_/c_/d_；
 *   L（tjge.a 主控）：a_/a_Z/a_II/c_I/a_GIIIIII；其字段 y(tjge.g)/m/n/q/r/i/k/c；
 *   L.y（tjge.g 玩家）：a_/a_I/b_II/c_/o_/p_/e_ 及字段 H/G/u/v/z/y/l/T/U/p/ag/ah/ai/aj；
 *   tjge.g 静态：Q/e/f/c；tjge.h（actor 基类）：a_AY/e_/a_I/i_/b_/a_GII 及字段 g/h/t/u/v/I；
 *   tjge.c（对话/特效）：a_/e_/v/t/e；tjge.k 静态 a_IIIIIAI；tjge.i 静态 a_I、a_GIIIII；
 *   tjge.d 静态 b_I、其静态字段 b/c；GameMIDlet.a_I（随机）、a_AYII（小端字节）、
 *   b_In（读短）、a_In（读字节）、b_SI（定位流）、a_IS（字符串）。
 *
 * 必要偏差：
 *   - System.gc() 已删除并在原位置注释（见 d_()）。
 *   - 音频已在 GameMIDlet 内空实现；本类无直接音频调用。
 *   - 像素：直接 Image + drawRegion，本类不含像素管线；HUD 经 tjge.i / tjge.b 绘制。
 *   - 资源 .bin 经 GameMIDlet.b_SI / a_In / b_In / a_AYII 同步解析，逻辑逐行一致。
 */
import { Graphics, InputStream } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameCanvas } from "./GameCanvas.ts";
import { TileMap } from "./TileMap.ts";
import { BossActor } from "./BossActor.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { EnemyActor } from "./EnemyActor.ts";
import { PlayerActor } from "./PlayerActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { TileSheet } from "./TileSheet.ts";
import { ProjectileActor } from "./ProjectileActor.ts";
import { setJ } from "./jref.ts";
import { ActorType, LevelSubState, px } from "./constants.ts";

/**
 * tjge.h 的包内可见（Java protected）成员视图。
 * Java 中 protected 允许同包（tjge）跨类访问，而 TS protected 仅限子类；
 * LevelScene 与 ActorBase 同包但非子类，故对 ActorBase 的 protected 字段 frameGroupIndex/boxLeft/typeId
 * 与方法 isAlive 经此结构视图访问，不改变运行时行为（位级一致），仅绕过 TS 的访问性检查。详见 docs/05-移植规约.md。
 */
type HPkg = { frameGroupIndex: number; boxLeft: number; typeId: number; isAlive(): boolean };
/** 将 h / g（h 子类）实例视为包内可见视图（保留运行时引用不变）。 */
function pkg(x: ActorBase): HPkg {
  return x as unknown as HPkg;
}

export class LevelScene {
  // ---- 静态字段（保留原混淆名）----
  static camera: TileMap; // tjge.b 相机
  static actorDefs: (SpriteDef | null)[]; // tjge.d[]
  static actorDefLoaded: boolean[];
  static actorPool: (ActorBase | null)[][]; // tjge.h[][]
  static activeActors: (ActorBase | null)[]; // tjge.h[]
  private static cellSpawnBuffer: Int8Array; // byte[]
  static drawList: (ActorBase | null)[]; // tjge.h[]
  static drawCount: number = 0;
  // static final：内联初始化（TS readonly 仅允许声明处/构造器内赋值）
  static readonly actorDrawLayer: Int32Array = Int32Array.from([5, 3, 3, 3, 3, 3, 3, 8, 6, 9, 9, 1, 9, 7, 0, 0, 9, 1, 4, 3, 8, 0, 1]);
  private static triggerParams: Int32Array; // int[]
  private static spawnBytes: Int8Array; // byte[]
  static cutsceneState: Int32Array; // int[]
  static dialogState: Int32Array; // int[]
  static formationState: Int32Array; // int[]

  // ---- 实例字段 ----
  triggerTable!: (Int8Array | null)[]; // byte[][]
  actorInstanceTable!: (Int8Array | null)[]; // byte[][]
  triggerHitFlags!: boolean[];
  triggerFiredFlags!: boolean[];
  private cellWidth: number = 0;
  private cellHeight: number = 0;
  cellTriggers!: (Int8Array | null)[]; // byte[][]
  cellActors!: (Int8Array | null)[]; // byte[][]
  private cellCount: number = 0;
  currentCell: number = 0;
  private globalActorCount: number = 0;
  residentActorSlots: number = 0;
  globalActors!: Int8Array; // byte[]
  mapWidth: number = 0;
  mapHeight: number = 0;
  subState: number = LevelSubState.Normal;
  prevSubState: number = 0;
  transitionMaskHeight: number = 0;
  static currentLevel: number;
  private verticalScrollY: number = 0;
  cameraTargetCacheX: number = 0;
  cameraTargetCacheY: number = 0;
  waveSpawnCount: number = 0;
  reservedD: number = 0;
  cameraTargetX: number = 0;
  cameraTargetY: number = 0;
  diagonalFormationToggle: number = 0;
  dialogAdvancePressed: boolean = false;
  dialogPagePressed: boolean = false;
  isVerticalScrollLevel: boolean = false;
  private dialogActor!: BossActor | null; // tjge.c
  static hudFont: TileSheet; // tjge.i
  canvas!: GameCanvas; // tjge.a
  static cutsceneStep: number = 0;
  static cutsceneSubStep: number = 0;
  // static final：内联初始化
  static readonly resourceLoadTable: number[][] = [
    [0, 1], [1, 10], [2, 5], [3, 10], [4, 10], [5, 5], [6, 1], [7, 5], [8, 3], [9, 5],
    [10, 20], [11, 3], [12, 20], [13, 5], [14, 10], [15, 10], [16, 6], [17, 10], [18, 1], [19, 1],
    [20, 10], [21, 1], [22, 4],
  ];

  /**
   * 私有构造函数（对应 CFR `private tjge.j()`）。
   * 仅创建空实例；真正的场景装配由静态工厂 {@link LevelScene.loadLevel} 解析 /res/s.bin 完成。
   * 二开请勿直接 new，应走 `LevelScene.loadLevel(canvas, levelIndex)`。
   */
  // private tjge.j();
  private constructor() {
  }

  /**
   * 每帧准备阶段（CFR j.java `a()`）。在 {@link tick} 开头被调用。
   * 流程：跑当前屏的触发器 → 把所有存活 actor（先常驻槽、后动态槽）收入本帧绘制列表 `drawList`，
   * 再对列表中每个 actor 依次调 `step()`（物理）与 `update()`（行为）。
   * 是 actor 物理/AI 推进的统一入口，绘制列表 `drawList`/`drawCount` 即在此填充。
   */
  // public final void a();  → a_
  buildDrawList(): void {
    let i: number;
    LevelScene.drawCount = 0;
    if (this.cellTriggers[this.currentCell] != null) {
      i = 0;
      while (i < this.cellTriggers[this.currentCell]!.length) {
        this.runTrigger(this.cellTriggers[this.currentCell]![i]);
        ++i;
      }
    }
    i = 0;
    while (i < this.residentActorSlots) {
      if (LevelScene.activeActors[i] != null && LevelScene.activeActors[i]!.alive) {
        LevelScene.drawList[LevelScene.drawCount++] = LevelScene.activeActors[i];
      }
      ++i;
    }
    i = this.residentActorSlots;
    while (i < LevelScene.activeActors.length) {
      if (LevelScene.activeActors[i] != null && LevelScene.activeActors[i]!.alive) {
        LevelScene.drawList[LevelScene.drawCount++] = LevelScene.activeActors[i];
      }
      ++i;
    }
    i = 0;
    while (i < LevelScene.drawCount) {
      LevelScene.drawList[i]!.step();
      ++i;
    }
    i = 0;
    while (i < LevelScene.drawCount) {
      LevelScene.drawList[i]!.update();
      ++i;
    }
  }

  /**
   * 计算本帧相机目标点（CFR j.java `a(boolean)`）。写入 {@link cameraTargetX}/{@link cameraTargetY}。
   * @param followPlayer true=跟随玩家（按朝向把镜头偏到玩家身前 1/4 或 3/4 屏，纵向考虑速度/跳跃留头部空间）；
   *           false=回到剧情锁定的缓存目标 {@link cameraTargetCacheX}/{@link cameraTargetCacheY}（运镜用）。
   */
  // public final void a(boolean);  → a_Z
  updateCameraTarget(followPlayer: boolean): void {
    const player: PlayerActor = this.canvas.player!;
    if (followPlayer) {
      this.cameraTargetX = player.actionHighByte === 0 ? player.posX - ((this.canvas.viewportWidth * 1 / 4) | 0) : player.posX - ((this.canvas.viewportWidth * 3 / 4) | 0);
      const targetY: number = player.posY - ((this.canvas.viewportHeight * 7 / 10) | 0);
      if (player.targetVelY === 0 || (player.reserved & 2) !== 0 || player.targetVelY > 0 && targetY > this.canvas.cameraY || player.targetVelY < 0 && this.canvas.cameraY - targetY > ((this.canvas.viewportHeight * 2 / 5) | 0)) {
        this.cameraTargetY = targetY;
        return;
      }
    } else {
      this.cameraTargetX = this.cameraTargetCacheX;
      this.cameraTargetY = this.cameraTargetCacheY;
    }
  }

  /**
   * 场景主更新（CFR j.java `b()`）。GameCanvas 在 `b==10` 游戏中每帧调用（紧接 {@link render}）。
   * 先调 {@link buildDrawList} 推进所有 actor，再按子状态机 {@link subState}（{@link LevelSubState}）分派：
   * 常规跟拍 / 战斗波（{@link spawnWave}）/ Boss 剧本 / 剧情演出（{@link runCutscene}）/ 任务对话（{@link runDialogChoice}）/
   * 屏幕过渡（黑幕高度 {@link transitionMaskHeight} 推进与传送）。末尾推进相机 {@link GameCanvas.followCamera}
   * 并按分屏格号调 {@link switchCell} 做屏块切换；纵向卷屏关（{@link isVerticalScrollLevel}）走特殊卷屏分支。
   */
  // public final void b();  → b_
  tick(): void {
    this.cameraTargetX = this.canvas.cameraX;
    this.cameraTargetY = this.canvas.cameraY;
    this.buildDrawList();
    switch (this.subState) {
      case LevelSubState.Normal: {
        this.updateCameraTarget(true);
        break;
      }
      case LevelSubState.BattleWave: {
        this.updateCameraTarget(false);
        if (this.canvas.cameraX !== this.cameraTargetX || this.canvas.cameraY !== this.cameraTargetY) break;
        if (LevelScene.triggerParams[0] > 0 && LevelScene.activeActors[LevelScene.triggerParams[0]] == null) {
          this.subState = this.prevSubState;
          break;
        }
        if (LevelScene.triggerParams[6] <= 0 || this.waveSpawnCount > 0) break;
        if (LevelScene.triggerParams[5] > 0) {
          this.spawnWave();
          break;
        }
        this.subState = this.prevSubState;
        break;
      }
      case LevelSubState.BossScript: {
        let cameraSettled: boolean = false;
        if (LevelScene.cutsceneState[2] === 0) {
          this.updateCameraTarget(true);
          cameraSettled = true;
        } else {
          this.updateCameraTarget(false);
          if (this.canvas.cameraX === this.cameraTargetX && this.canvas.cameraY === this.cameraTargetY) {
            cameraSettled = true;
          }
        }
        if (!cameraSettled || !this.canvas.player!.isDead()) break;
        this.subState = LevelSubState.Cutscene;
        break;
      }
      case LevelSubState.Cutscene: {
        this.updateCameraTarget(LevelScene.cutsceneState[2] === 0);
        this.runCutscene();
        break;
      }
      case LevelSubState.MissionDialog: {
        this.runDialogChoice();
        break;
      }
      case LevelSubState.TransitionOut: {
        if ((this.transitionMaskHeight += 3) < 15) break;
        this.canvas.player!.setTilePosition(LevelScene.triggerParams[0], LevelScene.triggerParams[1]);
        this.updateCameraTarget(true);
        this.canvas.cameraX = this.cameraTargetX;
        this.canvas.cameraY = this.cameraTargetY;
        this.subState = LevelSubState.TransitionIn;
        break;
      }
      case LevelSubState.TransitionIn: {
        if ((this.transitionMaskHeight -= 3) >= 1) break;
        this.subState = this.prevSubState;
      }
    }
    let camX: number = 0;
    let camY: number = 0;
    if (this.isVerticalScrollLevel && (this.canvas.player!.reserved & 4) !== 0) {
      camX = this.verticalScrollY;
      camY = this.canvas.cameraY >> 10;
      this.verticalScrollY += 8;
    } else {
      this.canvas.followCamera(this.cameraTargetX, this.cameraTargetY);
      camX = this.canvas.cameraX >> 10;
      camY = this.canvas.cameraY >> 10;
      this.switchCell(camX, camY);
    }
    LevelScene.camera.setCameraPosition(camX, camY);
  }

  /**
   * 场景渲染（CFR j.java `a(Graphics)`）。GameCanvas 在游戏中每帧调用。
   * 流程：先画地图（{@link LevelScene.camera} 渲染）→ 按 actor 的绘制层 `layer` 对 `drawList` 做选择排序（深度排序，低层在后）→
   * 逐个 `paint`（传入相机像素坐标 cameraX>>10 / cameraY>>10）→ 末尾按子状态 {@link subState} 叠加：
   * 过渡黑幕（{@link LevelScene.fillBlackBand}）、HUD（{@link renderHud}）、任务对话条（{@link renderDialogBar}）。
   */
  // public final void a(Graphics);  → a_G
  render(graphics: Graphics): void {
    LevelScene.camera.render(graphics);
    graphics.setClip(0, 0, 176, 204);
    let i: number = 0;
    let j: number = 0;
    let minIdx: number = 0;
    i = 0;
    while (i < LevelScene.drawCount - 1) {
      minIdx = i;
      j = i + 1;
      while (j < LevelScene.drawCount) {
        if (LevelScene.drawList[j]!.layer < LevelScene.drawList[minIdx]!.layer) {
          minIdx = j;
        }
        ++j;
      }
      if (i !== minIdx) {
        const swapActor: ActorBase = LevelScene.drawList[i]!;
        LevelScene.drawList[i] = LevelScene.drawList[minIdx];
        LevelScene.drawList[minIdx] = swapActor;
      }
      ++i;
    }
    graphics.setClip(0, 0, 176, 204);
    const cameraPxX: number = this.canvas.cameraX >> 10;
    const cameraPxY: number = this.canvas.cameraY >> 10;
    i = 0;
    while (i < LevelScene.drawCount) {
      LevelScene.drawList[i]!.paint(graphics, cameraPxX, cameraPxY);
      ++i;
    }
    switch (this.subState) {
      case LevelSubState.TransitionOut:
      case LevelSubState.TransitionIn: {
        LevelScene.fillBlackBand(graphics, this.transitionMaskHeight, 0, 172);
        // fallthrough
      }
      case LevelSubState.Normal:
      case LevelSubState.Cutscene:
      case LevelSubState.BattleWave: {
        this.renderHud(graphics);
        return;
      }
      case LevelSubState.MissionDialog: {
        this.renderDialogBar(graphics);
      }
    }
  }

  /**
   * 剧情演出脚本机（CFR j.java `e()`，巨型方法，子状态 {@link LevelSubState.Cutscene} 下每帧调用）。
   * 按剧情参数 {@link LevelScene.cutsceneState}（i[]：i[0]=场次 0-6、i[1]=子步、i[2]=相机锁定、i[3]/i[4]=临时坐标）
   * 配合静态计步 {@link LevelScene.cutsceneStep}/{@link LevelScene.cutsceneSubStep} 推进各关的开场/过场/Boss 登场演出：
   * 含玩家动作脚本（投雷队列 {@link PlayerActor.throwCooldownQueue}）、相机运镜、生成敌人/Boss（{@link spawnActor}）、
   * 切到任务对话（{@link setSubState}(MissionDialog)）或进结算/简报（{@link GameCanvas.showResult}/{@link GameCanvas.enterBriefing}）。
   */
  // private void e();  → e_
  private runCutscene(): void {
    const g2: PlayerActor = this.canvas.player!;
    switch (LevelScene.cutsceneState[0]) {
      case 0: {
        if (LevelScene.cutsceneState[1] === 0) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            PlayerActor.throwCooldownQueue[0][0] = 2;
            PlayerActor.throwCooldownQueue[0][1] = 13;
            PlayerActor.throwCooldownQueue[0][2] = 0;
            PlayerActor.throwCooldownQueue[1][0] = 16;
            PlayerActor.throwCooldownQueue[1][1] = 1;
            PlayerActor.throwCooldownQueue[1][2] = 2;
            return;
          }
          if (LevelScene.cutsceneStep === 1) {
            if (g2.stepThrowQueue() === 1) {
              g2.advanceEffectFrame();
              g2.targetVelY = px(8);
              ++LevelScene.cutsceneStep;
            }
            g2.targetVelX = px(10);
            return;
          }
          if (LevelScene.cutsceneStep !== 2 || pkg(g2).frameGroupIndex !== 0) break;
          this.canvas.enterBriefing();
          return;
        }
        if (LevelScene.cutsceneState[1] !== 9) break;
        if (LevelScene.cutsceneStep === 0) {
          ++LevelScene.cutsceneStep;
          g2.setAction(0x1E | g2.actionHighByte);
          return;
        }
        if (pkg(g2).frameGroupIndex !== 0) break;
        g2.setAction(33);
        this.canvas.showResult(true);
        return;
      }
      case 1: {
        if (LevelScene.cutsceneState[1] === 0) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            g2.setAction(0x1E | g2.actionHighByte);
            return;
          }
          if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 4) break;
          this.canvas.enterBriefing();
          return;
        }
        if (LevelScene.cutsceneState[1] === 1) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            g2.setAction(0x1E | g2.actionHighByte);
            return;
          }
          if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 4) break;
          this.setSubState(LevelSubState.MissionDialog);
          return;
        }
        if (LevelScene.cutsceneState[1] === 2) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            PlayerActor.throwCooldownQueue[0][0] = 1;
            PlayerActor.throwCooldownQueue[0][1] = 50;
            PlayerActor.throwCooldownQueue[0][2] = 0;
            LevelScene.cutsceneState[2] = 1;
            this.cameraTargetCacheX = this.cameraTargetX;
            this.cameraTargetCacheY = this.cameraTargetY;
            return;
          }
          g2.stepThrowQueue();
          if (g2.posX >= this.canvas.cameraX - px(20)) break;
          this.canvas.showResult(true);
          return;
        }
        if (LevelScene.cutsceneState[1] !== 9) break;
        if (LevelScene.cutsceneStep === 0) {
          ++LevelScene.cutsceneStep;
          PlayerActor.throwCooldownQueue[0][0] = 2048;
          PlayerActor.throwCooldownQueue[0][1] = 1;
          PlayerActor.throwCooldownQueue[0][2] = 6;
          PlayerActor.throwCooldownQueue[1][0] = 2;
          LevelScene.cutsceneState[4] = LevelScene.cutsceneState[4] << 14;
          PlayerActor.throwCooldownQueue[1][1] = ((LevelScene.cutsceneState[4] - g2.posX + px(126)) / px(8)) | 0;
          PlayerActor.throwCooldownQueue[1][2] = 2;
          PlayerActor.throwCooldownQueue[2][0] = 16;
          PlayerActor.throwCooldownQueue[2][1] = 1;
          PlayerActor.throwCooldownQueue[2][2] = 2;
          PlayerActor.throwCooldownQueue[3][0] = 8;
          PlayerActor.throwCooldownQueue[3][1] = 2;
          PlayerActor.throwCooldownQueue[3][2] = 0;
          g2.currentWeaponIndex = 1;
          if (PlayerActor.ammoCurrent[g2.currentWeaponIndex] === PlayerActor.ammoInitTable[g2.currentWeaponIndex]) {
            return;
          }
          if (PlayerActor.ammoReserve[g2.currentWeaponIndex] > 0) break;
          PlayerActor.ammoReserve[g2.currentWeaponIndex] = 1;
          return;
        }
        if (LevelScene.cutsceneStep === 1) {
          if (g2.stepThrowQueue() !== 3) break;
          ++LevelScene.cutsceneStep;
          return;
        }
        if (LevelScene.cutsceneStep === 3) {
          if (g2.stepThrowQueue() !== 0) break;
          ++LevelScene.cutsceneStep;
          return;
        }
        if (pkg(g2).frameGroupIndex !== 0) break;
        if (LevelScene.cutsceneStep === 4) {
          LevelScene.dialogState[0] = 0;
          LevelScene.dialogState[1] = 0;
          LevelScene.dialogState[2] = 1;
          this.setSubState(LevelSubState.MissionDialog);
          return;
        }
        if (LevelScene.cutsceneStep !== 2) break;
        PlayerActor.throwCooldownQueue[0][0] = 2;
        PlayerActor.throwCooldownQueue[0][1] = 4;
        PlayerActor.throwCooldownQueue[0][2] = 2;
        ++LevelScene.cutsceneStep;
        return;
      }
      case 2: {
        if (LevelScene.cutsceneState[1] === 0) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            g2.setAction(0x1E | g2.actionHighByte);
            return;
          }
          if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 4) break;
          this.canvas.enterBriefing();
          return;
        }
        if (LevelScene.cutsceneState[1] !== 9) break;
        if (++LevelScene.cutsceneStep === 10) {
          g2.setAction(0x1E | g2.actionHighByte);
          return;
        }
        if (pkg(g2).frameGroupIndex !== 0) break;
        this.canvas.showResult(true);
        return;
      }
      case 3: {
        if (LevelScene.cutsceneState[1] === 0) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            g2.setAction(0x1E | g2.actionHighByte);
            return;
          }
          if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 4) break;
          LevelScene.dialogState[0] = 0;
          LevelScene.dialogState[1] = 1;
          LevelScene.dialogState[2] = 0;
          this.setSubState(LevelSubState.MissionDialog);
          return;
        }
        if (LevelScene.cutsceneState[1] === 1) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            PlayerActor.throwCooldownQueue[0][0] = 2;
            PlayerActor.throwCooldownQueue[0][1] = 50;
            PlayerActor.throwCooldownQueue[0][2] = 0;
            LevelScene.cutsceneState[2] = 1;
            return;
          }
          g2.stepThrowQueue();
          if (g2.posX <= this.canvas.cameraX + this.canvas.viewportWidth + px(20)) break;
          g2.targetVelX = 0;
          g2.setAction(0 | g2.actionHighByte);
          this.setSubState(LevelSubState.MissionDialog);
          return;
        }
        if (LevelScene.cutsceneState[1] !== 9) break;
        if (LevelScene.cutsceneStep === 0) {
          ++LevelScene.cutsceneStep;
          g2.setAction(0x1E | g2.actionHighByte);
          return;
        }
        if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 5) break;
        this.canvas.showResult(true);
        return;
      }
      case 4: {
        if (LevelScene.cutsceneState[1] === 0) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            g2.setAction(0x1E | g2.actionHighByte);
            return;
          }
          if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 4) break;
          LevelScene.dialogState[0] = 0;
          LevelScene.dialogState[1] = 0;
          LevelScene.dialogState[2] = 1;
          this.setSubState(LevelSubState.MissionDialog);
          return;
        }
        if (LevelScene.cutsceneState[1] === 1) {
          if (LevelScene.cutsceneStep++ === 0) {
            g2.setAction(0);
            return;
          }
          if (LevelScene.cutsceneStep <= 4) break;
          this.canvas.enterBriefing();
          return;
        }
        if (LevelScene.cutsceneState[1] !== 9) break;
        if (LevelScene.cutsceneStep === 0) {
          ++LevelScene.cutsceneStep;
          g2.setAction(0x1E | g2.actionHighByte);
          return;
        }
        if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 5) break;
        this.canvas.showResult(true);
        return;
      }
      case 5: {
        if (LevelScene.cutsceneState[1] === 0) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            g2.setAction(0x1E | g2.actionHighByte);
            return;
          }
          if (pkg(g2).frameGroupIndex !== 0 || LevelScene.cutsceneStep++ <= 4) break;
          LevelScene.dialogState[0] = 0;
          LevelScene.dialogState[1] = 0;
          LevelScene.dialogState[2] = 1;
          this.setSubState(LevelSubState.MissionDialog);
          return;
        }
        if (LevelScene.cutsceneState[1] === 1) {
          if (LevelScene.cutsceneStep++ === 0) {
            g2.setAction(0 | (-2147483648)); // 0 | Integer.MIN_VALUE
            return;
          }
          if (LevelScene.cutsceneStep <= 4) break;
          this.canvas.enterBriefing();
          return;
        }
        if (LevelScene.cutsceneState[1] === 2) {
          if (LevelScene.cutsceneStep === 0) {
            this.dialogActor = this.spawnActor(ActorType.HelicopterBoss, -1) as unknown as BossActor; // 原 (c)this.c(19,-1)
            this.dialogActor!.resetBoss();
          } else if (LevelScene.cutsceneStep < 22) {
            this.dialogActor!.posY += px(4);
          } else if (LevelScene.cutsceneStep === 22) {
            LevelScene.dialogState[1] = 2;
            LevelScene.dialogState[2] = 0;
            this.setSubState(LevelSubState.MissionDialog);
          }
          ++LevelScene.cutsceneStep;
          return;
        }
        if (LevelScene.cutsceneState[1] === 3) {
          this.cameraTargetCacheX = this.canvas.cameraX;
          this.cameraTargetCacheY = this.canvas.cameraY;
          LevelScene.triggerParams[0] = this.dialogActor!.slotIndex;
          LevelScene.triggerParams[1] = 0;
          LevelScene.triggerParams[2] = 38;
          LevelScene.triggerParams[3] = 0;
          LevelScene.triggerParams[4] = 2;
          LevelScene.triggerParams[5] = 100;
          LevelScene.triggerParams[6] = 0;
          this.setSubState(LevelSubState.BattleWave);
          this.dialogActor!.dormant = false;
          return;
        }
        if (LevelScene.cutsceneState[1] === 4) {
          switch (LevelScene.cutsceneStep) {
            case 0: {
              let n: number;
              let n2: number;
              this.cameraTargetCacheX = this.dialogActor!.posX - ((this.canvas.viewportWidth / 3) | 0);
              this.cameraTargetCacheY = this.dialogActor!.posY - ((this.canvas.viewportHeight / 4) | 0);
              if (this.canvas.globalFrame % 2 === 0) {
                n2 = (5 + GameMIDlet.randomBelow(3)) << 13;
                n = GameMIDlet.randomBelow(3) << 13;
                ProjectileActor.spawnProjectile(ActorType.ExplosionDebris, 0, this.dialogActor!.posX - n2, this.dialogActor!.posY - n, 0, null as unknown as Int32Array);
              }
              if (LevelScene.cutsceneSubStep === 0) {
                LevelScene.cutsceneSubStep = 1;
                n2 = 0x130000 - this.dialogActor!.posX;
                n = px(602) - this.dialogActor!.posY;
                this.dialogActor!.targetVelX = (n2 / 20) | 0;
                this.dialogActor!.targetVelY = (n / 20) | 0;
                break;
              }
              if (this.dialogActor!.posY <= px(602)) break;
              this.dialogActor!.targetVelX = 0;
              this.dialogActor!.targetVelY = 0;
              this.dialogActor!.setAction(-2147483647);
              LevelScene.cutsceneStep = 1;
              break;
            }
            case 1: {
              this.dialogActor!.posY = this.dialogActor!.posY + (LevelScene.cutsceneSubStep % 1 === 1 ? px(-2) : px(2));
              if (LevelScene.cutsceneSubStep++ <= 5) break;
              LevelScene.cutsceneStep = 2;
              this.dialogActor!.targetVelX = px(10);
              break;
            }
            case 2: {
              if (this.dialogActor!.posX <= this.canvas.cameraX + this.canvas.viewportWidth + px(60)) break;
              this.dialogActor!.targetVelX = 0;
              this.cameraTargetCacheX = g2.posX - ((this.canvas.viewportWidth / 2) | 0);
              LevelScene.cutsceneState[1] = 5;
              LevelScene.cutsceneState[2] = 1;
              this.setSubState(LevelSubState.Cutscene);
            }
          }
          return;
        }
        if (LevelScene.cutsceneState[1] !== 5) break;
        if (LevelScene.cutsceneStep === 0) {
          if (this.canvas.cameraX !== this.cameraTargetCacheX) break;
          ++LevelScene.cutsceneStep;
          g2.setAction(0);
          PlayerActor.throwCooldownQueue[0][0] = 2;
          PlayerActor.throwCooldownQueue[0][1] = ((0x109000 - g2.posX) / px(8)) | 0;
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
        if (LevelScene.cutsceneStep === 1) {
          const n: number = g2.stepThrowQueue();
          if (n === 0) {
            this.cameraTargetCacheX = this.canvas.cameraX;
            LevelScene.cutsceneState[2] = 1;
            return;
          }
          if (n !== 1) break;
          g2.spawnEntryEffect();
          ++LevelScene.cutsceneStep;
          return;
        }
        if (LevelScene.cutsceneStep !== 2) break;
        g2.stepThrowQueue();
        if (g2.posX <= this.canvas.cameraX + this.canvas.viewportWidth + px(50)) break;
        this.canvas.showResult(true);
        return;
      }
      case 6: {
        if (LevelScene.cutsceneState[1] === 0) {
          if (LevelScene.cutsceneStep === 0) {
            ++LevelScene.cutsceneStep;
            PlayerActor.throwCooldownQueue[0][0] = 2;
            PlayerActor.throwCooldownQueue[0][1] = 10;
            PlayerActor.throwCooldownQueue[0][2] = 0;
            return;
          }
          if (LevelScene.cutsceneStep !== 1) break;
          if (g2.stepThrowQueue() === 0) {
            g2.targetVelX = 0;
            LevelScene.dialogState[0] = 0;
            LevelScene.dialogState[1] = 0;
            LevelScene.dialogState[2] = 2;
            this.setSubState(LevelSubState.MissionDialog);
            return;
          }
          g2.targetVelX = px(10);
          return;
        }
        if (LevelScene.cutsceneState[1] === 1) {
          if (!g2.publicFlagA) break;
          this.dialogActor!.kill();
          this.dialogActor = null;
          LevelScene.dialogState[1] = 0;
          LevelScene.dialogState[2] = 3;
          this.setSubState(LevelSubState.MissionDialog);
          return;
        }
        if (LevelScene.cutsceneState[1] !== 2) break;
        if (LevelScene.cutsceneStep === 0) {
          g2.targetVelX = 0;
          g2.targetVelY = px(12);
          g2.publicFlagB = true;
          ++LevelScene.cutsceneStep;
          return;
        }
        if (LevelScene.cutsceneStep === 2) {
          if (g2.publicFlagC) {
            ++LevelScene.cutsceneStep;
          } else {
            LevelScene.dialogState[1] = 3;
            LevelScene.dialogState[2] = 0;
            this.setSubState(LevelSubState.MissionDialog);
          }
          g2.companionEffect!.kill();
          g2.kill();
          return;
        }
        if (LevelScene.cutsceneStep === 3) {
          this.canvas.showResult(false);
          return;
        }
        if (g2.posY <= 132 << 10) break;
        let n: number = 0;
        while (n < 8) {
          const h2: ActorBase | null = this.spawnActor(ActorType.SplashEffect, -1);
          if (h2 != null) {
            h2.posX = g2.posX + (pkg(g2).boxLeft << 10) + n % 4 * px(14) + ((n / 4) | 0) * px(8);
            h2.posY = g2.posY + px(14) + ((n / 4) | 0) * px(8);
            h2.setAction(0);
          }
          ++n;
        }
        ++LevelScene.cutsceneStep;
      }
    }
  }

  /**
   * 关内底部任务对话条的逐字/翻页推进（CFR j.java `f()`，子状态 {@link LevelSubState.MissionDialog} 下每帧调用）。
   * 据 {@link renderDialogBar} 写入的两个标志推进：{@link dialogAdvancePressed}=本段文字已显示完（按场次 {@link LevelScene.cutsceneState} 收尾或回切剧情演出）；
   * {@link dialogPagePressed}=本框翻到下一段（推进 {@link GameCanvas.briefingLineState}/{@link LevelScene.dialogState}，轮换说话人，到指定段数时结束对话）；
   * 都不满足则继续吐字。倒计时由 briefingLineState[3] 驱动，按确认键（inputAction==16）可跳过等待。
   */
  // private void f();  → f_
  private runDialogChoice(): void {
    block22: {
      block21: {
        const bl: boolean = this.canvas.inputAction === 16;
        if (bl) break block21;
        const n: number = GameCanvas.briefingLineState[3];
        GameCanvas.briefingLineState[3] = n - 1;
        if (n >= 0) break block22;
      }
      if (this.dialogAdvancePressed) {
        switch (LevelScene.cutsceneState[0]) {
          case 1: {
            LevelScene.cutsceneState[1] = 2;
            this.setSubState(LevelSubState.Cutscene);
            break;
          }
          case 3: {
            this.canvas.enterBriefing();
            break;
          }
          case 4: {
            LevelScene.cutsceneState[1] = 1;
            this.setSubState(LevelSubState.Cutscene);
            break;
          }
          case 5: {
            LevelScene.cutsceneState[1] = 3;
            this.setSubState(LevelSubState.Cutscene);
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
        const n: number = LevelScene.dialogState[1];
        LevelScene.dialogState[1] = LevelScene.dialogState[2];
        LevelScene.dialogState[2] = n;
        LevelScene.dialogState[0] = LevelScene.dialogState[0] + 1;
        switch (LevelScene.cutsceneState[0]) {
          case 1: {
            if (LevelScene.dialogState[0] !== 6) break;
            LevelScene.cutsceneState[1] = 1;
            this.setSubState(LevelSubState.Cutscene);
            break;
          }
          case 3: {
            if (LevelScene.dialogState[0] !== 4) break;
            LevelScene.cutsceneState[1] = 1;
            this.setSubState(LevelSubState.Cutscene);
            break;
          }
          case 5: {
            if (LevelScene.dialogState[0] !== 2) break;
            LevelScene.cutsceneState[1] = 1;
            this.setSubState(LevelSubState.Cutscene);
            break;
          }
          case 6: {
            if (LevelScene.dialogState[0] === 2) {
              this.dialogActor = BossActor.instance;
              this.dialogActor!.dormant = false;
              this.canvas.enterBriefing();
              break;
            }
            if (LevelScene.dialogState[0] !== 6) break;
            LevelScene.cutsceneState[1] = 2;
            this.setSubState(LevelSubState.Cutscene);
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

  /**
   * 绘制关内底部任务/对话框（CFR j.java `c(Graphics)`，子状态 {@link LevelSubState.MissionDialog} 下由 {@link render} 调）。
   * 在屏幕底部画 32px 对话条，用 HUD 字模 {@link LevelScene.hudFont} 画边框/说话人头像（坐标按 {@link LevelScene.dialogState} 的对话框样式选取），
   * 再折行绘制文本，并把"本段是否到末/本框是否满"两标志写回 {@link dialogAdvancePressed}/{@link dialogPagePressed} 供 {@link runDialogChoice} 推进，末尾清按键。
   */
  // private void c(Graphics);  → c_G
  private renderDialogBar(graphics: Graphics): void {
    const nArray: number[] = [14, 134, 134, 134];
    const nArray2: number[] = [36, 14, 14, 14];
    const nArray3: number[] = [14, 15, 16, 17];
    graphics.setColor(17408);
    graphics.setClip(0, 172, 176, 32);
    graphics.fillRect(0, 172, 176, 32);
    LevelScene.hudFont.drawCell(graphics, 0, 172, 30, 0, 0);
    LevelScene.hudFont.drawCell(graphics, 159, 172, 31, 0, 0);
    LevelScene.hudFont.drawCell(graphics, 12, 172, 32, 0, 0);
    LevelScene.hudFont.drawCell(graphics, 12, 202, 33, 0, 0);
    LevelScene.hudFont.drawCell(graphics, nArray[LevelScene.dialogState[1]], 170, nArray3[LevelScene.dialogState[1]], 0, 0);
    graphics.setColor(65280);
    graphics.setClip(0, 172, 176, 32);
    this.dialogAdvancePressed = this.canvas.selectParagraph(GameCanvas.briefingLineState[0]);
    this.dialogPagePressed = this.canvas.drawTypesetText(graphics, GameCanvas.briefingLineState[1], GameCanvas.briefingLineState[2], nArray2[LevelScene.dialogState[1]], 178, 90, 19);
    this.canvas.inputAction = 0;
  }

  /**
   * 切换场景子状态机 {@link subState}（CFR j.java `a(int)`）。
   * 保存返回态到 {@link prevSubState}，复位剧情计步 {@link LevelScene.cutsceneStep}/{@link LevelScene.cutsceneSubStep}；
   * 进入过渡（TransitionOut）时清黑幕高度，进入任务对话（MissionDialog）时初始化对话/按键状态。
   * @param n 目标子状态，取 {@link LevelSubState} 之一。
   */
  // public final void a(int);  → a_I
  setSubState(n: number): void {
    switch (n) {
      case LevelSubState.TransitionOut: {
        this.transitionMaskHeight = 0;
        break;
      }
      case LevelSubState.MissionDialog: {
        this.dialogAdvancePressed = false;
        this.dialogPagePressed = false;
        this.canvas.inputAction = 0;
        GameCanvas.briefingLineState[0] = LevelScene.dialogState[0];
        GameCanvas.briefingLineState[1] = 0;
        GameCanvas.briefingLineState[2] = 1;
        GameCanvas.briefingLineState[3] = 60;
      }
    }
    this.prevSubState = this.subState;
    this.subState = n;
    LevelScene.cutsceneStep = 0;
    LevelScene.cutsceneSubStep = 0;
  }

  /**
   * 绘制关内 HUD（CFR j.java `b(Graphics)`）。由 {@link render} 在常规/战斗/剧情/过渡子状态下调用。
   * 用 HUD 字模 {@link LevelScene.hudFont} 画血格（按 {@link PlayerActor} 血量）、雷数、当前武器弹药/备弹数字（{@link LevelScene.drawNumber}），
   * 并闪烁高亮当前选中武器框（按 {@link GameCanvas.globalFrame} 取模实现闪烁）。
   */
  // public final void b(Graphics);  → b_G
  renderHud(graphics: Graphics): void {
    const player: PlayerActor = this.canvas.player!;
    LevelScene.hudFont.drawCell(graphics, 0, 172, 0, 0, 0);
    LevelScene.hudFont.drawCell(graphics, 12, 164, 14, 0, 0);
    const healthCells: number = Math.max(0, player.health);
    let i: number = 0;
    while (i < healthCells) {
      LevelScene.hudFont.drawCell(graphics, 14 + i * 4, 199 - LevelScene.hudFont.cellHeight[18 + i], 18 + i, 0, 0);
      ++i;
    }
    i = 0;
    while (i < PlayerActor.ammoCurrent[2]) {
      LevelScene.hudFont.drawCell(graphics, 127 + i * 9, 181, 12, 0, 0);
      ++i;
    }
    LevelScene.drawNumber(graphics, 84, 179, PlayerActor.ammoCurrent[0 + player.currentWeaponIndex], false, true);
    LevelScene.hudFont.drawCell(graphics, 86, 179, 11, 0, 0);
    LevelScene.drawNumber(graphics, 112, 179, PlayerActor.ammoReserve[0 + player.currentWeaponIndex], false, true);
    if (this.canvas.globalFrame % 4 > 1) {
      graphics.setColor(65280);
      graphics.setClip(0, 0, 176, 204);
      graphics.drawRect(65 + player.currentWeaponIndex * 27, 192, 23, 8);
      LevelScene.hudFont.drawCell(graphics, 0, 195, 13, 0, 0);
    }
  }

  /**
   * 在屏幕指定纵向区间填黑（CFR j.java `a(Graphics,int,int,int)`）。过渡子状态的卷帘黑幕即用此绘制。
   * @param maskHeight 原始参数（CFR 中传入但实际未用于绘制，按位级保真保留）。
   * @param bandY 黑带起始 y。
   * @param bandHeight 黑带高度。
   */
  // public static final void a(Graphics,int,int,int);  → a_GIII
  static fillBlackBand(graphics: Graphics, maskHeight: number, bandY: number, bandHeight: number): void {
    graphics.setColor(0);
    graphics.setClip(0, bandY, 176, bandHeight);
    graphics.fillRect(0, bandY, 176, bandHeight);
  }

  /**
   * 用 HUD 字模 {@link LevelScene.hudFont} 右对齐绘制十进制数字（CFR j.java `a(Graphics,int,int,int,boolean,boolean)`）。
   * 从右往左逐位（最多 5 位，每位宽 8px）画字符格。
   * @param x   右边界 x（绘制从此处向左推进）。
   * @param y   y 坐标。
   * @param value 要显示的数值（负数按 0 处理）。
   * @param showPrefix true 时在数字左侧追加一个前缀格（字符 38）。
   * @param padLeadingZero true 时个位为 0 仍补一位前导 0。
   * @returns 绘制后剩余的左边界 x。
   */
  // public static final int a(Graphics,int,int,int,boolean,boolean);  → a_GIIIZZ
  static drawNumber(graphics: Graphics, x: number, y: number, value: number, showPrefix: boolean, padLeadingZero: boolean): number {
    let digit: number = 0;
    const unusedFlag: boolean = false; // 原版未使用，保留以对照
    void unusedFlag;
    value = Math.max(0, value);
    let i: number = 0;
    while (i < 5) {
      digit = value % 10;
      LevelScene.hudFont.drawCell(graphics, x -= 8, y, 1 + digit, 0, 0);
      if ((value = (value / 10) | 0) === 0) {
        if (i !== 0 || !padLeadingZero) break;
        LevelScene.hudFont.drawCell(graphics, x -= 8, y, 1, 0, 0);
        break;
      }
      ++i;
    }
    if (showPrefix) {
      LevelScene.hudFont.drawCell(graphics, x - 8, y, 38, 0, 0);
    }
    graphics.setClip(0, 0, 176, 208);
    return x;
  }

  /**
   * 进入/重置某分屏格（CFR j.java `a(int,int)`，对应文档"进入新场景/重置"）。
   * 复位波刷计数、子状态回 Normal，清触发器命中/已触发标志、清活动 actor 表与 actor 池存活位，
   * 然后生成全局常驻 actor（{@link globalActors}，含主角）与本格的常驻 actor（{@link cellActors}），
   * 设当前格号 {@link currentCell}、相机对焦、复位编队状态，并据关号判定是否纵向卷屏关。
   * @param n  目标格的地图像素 x。
   * @param n2 目标格的地图像素 y。
   */
  // public final void a(int,int);  → a_II
  loadCell(n: number, n2: number): void {
    this.waveSpawnCount = 0;
    this.reservedD = 0;
    this.subState = LevelSubState.Normal;
    const n3: number = ((n2 / this.cellHeight) | 0) * ((LevelScene.camera.getMapWidth() / this.cellWidth) | 0) + ((n / this.cellWidth) | 0);
    let n4: number = 0;
    while (n4 < this.triggerHitFlags.length) {
      this.triggerHitFlags[n4] = false;
      ++n4;
    }
    n4 = 0;
    while (n4 < this.triggerFiredFlags.length) {
      this.triggerFiredFlags[n4] = false;
      ++n4;
    }
    n4 = 0;
    while (n4 < LevelScene.activeActors.length) {
      LevelScene.activeActors[n4] = null;
      ++n4;
    }
    n4 = 0;
    while (n4 < LevelScene.actorPool.length) {
      if (LevelScene.actorPool[n4] != null) {
        let n5: number = 0;
        while (n5 < LevelScene.actorPool[n4].length) {
          LevelScene.actorPool[n4][n5]!.alive = false;
          ++n5;
        }
      }
      ++n4;
    }
    n4 = 0;
    while (n4 < this.globalActors.length) {
      this.spawnActor(-1, this.globalActors[n4]);
      ++n4;
    }
    n4 = 0;
    while (this.cellActors[n3] != null && n4 < this.cellActors[n3]!.length) {
      this.spawnActor(-1, this.cellActors[n3]![n4]);
      ++n4;
    }
    this.currentCell = n3;
    LevelScene.camera.resetDrawnBounds();
    LevelScene.camera.setCameraPosition(n, n2);
    this.verticalScrollY = 0;
    LevelScene.formationState[0] = -1;
    this.isVerticalScrollLevel = this.canvas.levelIndex === 6;
  }

  /**
   * 处理单个触发器（CFR j.java `b(int)`）。由 {@link buildDrawList} 对当前格触发器列表逐个调用。
   * 已触发（{@link triggerFiredFlags}）则跳过；否则从 {@link triggerTable} 读 AABB 区域，
   * 判定玩家是否命中后转 {@link fireTrigger}（命中传 true，否则 false）。
   * @param n 触发器索引。
   */
  // public final void b(int);  → b_I
  runTrigger(n: number): void {
    let n2: number;
    let n3: number;
    let n4: number;
    if (this.triggerFiredFlags[n]) {
      return;
    }
    const n5: number = GameMIDlet.readIntLE(this.triggerTable[n]!, 10, 2);
    if (this.canvas.player!.intersectsRect(n5, n4 = GameMIDlet.readIntLE(this.triggerTable[n]!, 12, 2), n3 = GameMIDlet.readIntLE(this.triggerTable[n]!, 14, 2), n2 = GameMIDlet.readIntLE(this.triggerTable[n]!, 16, 2))) {
      this.fireTrigger(n, true);
      return;
    }
    this.fireTrigger(n, false);
  }

  /**
   * 相机跨格时的屏块切换（CFR j.java `b(int,int)`）。由 {@link tick} 末尾按相机像素坐标调用。
   * 算出目标格号，若与 {@link currentCell} 不同则做差分：对比旧格/新格的常驻 actor 列表（{@link cellActors}），
   * 离开旧格的 actor（远离玩家的近距敌人会被回收）销毁，进入新格的 actor 经 {@link spawnActor} 生成，最后更新 {@link currentCell}。
   * @param n  相机的地图像素 x。
   * @param n2 相机的地图像素 y。
   */
  // public final void b(int,int);  → b_II
  switchCell(n: number, n2: number): void {
    let by: number;
    const n3: number = ((n2 / this.cellHeight) | 0) * ((LevelScene.camera.getMapWidth() / this.cellWidth) | 0) + ((n / this.cellWidth) | 0);
    if (n3 === this.currentCell) {
      return;
    }
    let n4: number = 0;
    let n5: number = 0;
    let by2: number = 0;
    while (this.cellActors[this.currentCell] != null && this.cellActors[n3] != null && n4 < this.cellActors[this.currentCell]!.length && n5 < this.cellActors[n3]!.length) {
      by = this.cellActors[this.currentCell]![n4];
      const by3: number = this.cellActors[n3]![n5];
      if (by < by3) {
        if (LevelScene.activeActors[by] != null) {
          if (pkg(LevelScene.activeActors[by]!).typeId >= ActorType.RiflemanGrunt && pkg(LevelScene.activeActors[by]!).typeId <= ActorType.TurretEmplacement) {
            if (Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.posX - this.canvas.player!.posX) >= px(176) || Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.posY - this.canvas.player!.posY) >= px(176)) {
              LevelScene.activeActors[by]!.kill();
              LevelScene.activeActors[by] = null;
            }
          } else {
            LevelScene.activeActors[by]!.kill();
            LevelScene.activeActors[by] = null;
          }
        }
        ++n4;
        continue;
      }
      if (by > by3) {
        LevelScene.cellSpawnBuffer[by2++] = this.cellActors[n3]![n5++];
        continue;
      }
      ++n4;
      ++n5;
      if (LevelScene.activeActors[by] == null || LevelScene.activeActors[by]!.alive) continue;
      if (pkg(LevelScene.activeActors[by]!).typeId >= ActorType.RiflemanGrunt && pkg(LevelScene.activeActors[by]!).typeId <= ActorType.TurretEmplacement) {
        if (Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.posX - this.canvas.player!.posX) < px(176) && Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.posY - this.canvas.player!.posY) < px(176)) continue;
        LevelScene.activeActors[by] = null;
        continue;
      }
      LevelScene.activeActors[by] = null;
    }
    while (this.cellActors[this.currentCell] != null && n4 < this.cellActors[this.currentCell]!.length) {
      if (LevelScene.activeActors[this.cellActors[this.currentCell]![n4]] != null) {
        if (pkg(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!).typeId >= ActorType.RiflemanGrunt && pkg(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!).typeId <= ActorType.TurretEmplacement) {
          if (Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.posX - this.canvas.player!.posX) >= px(176) || Math.abs(LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.posY - this.canvas.player!.posY) >= px(176)) {
            LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.kill();
            LevelScene.activeActors[this.cellActors[this.currentCell]![n4]] = null;
          }
        } else {
          LevelScene.activeActors[this.cellActors[this.currentCell]![n4]]!.kill();
          LevelScene.activeActors[this.cellActors[this.currentCell]![n4]] = null;
        }
      }
      ++n4;
    }
    while (this.cellActors[n3] != null && n5 < this.cellActors[n3]!.length) {
      if (this.cellActors[n3]![n5] !== 0) {
        LevelScene.cellSpawnBuffer[by2++] = this.cellActors[n3]![n5];
      }
      ++n5;
    }
    by = 0;
    while (by < by2) {
      if (LevelScene.activeActors[LevelScene.cellSpawnBuffer[by]] == null) {
        this.spawnActor(-1, LevelScene.cellSpawnBuffer[by]);
      }
      ++by;
    }
    this.currentCell = n3;
  }

  /**
   * 从 actor 池生成一个 actor 并登记到活动表（CFR j.java `c(int,int)`，全场生成的统一入口）。
   * 在类型 `n` 的对象池里找空闲槽复用（对象池模式，无 GC 压力）。
   * @param n  actor 类型；传 <0 时表示按实例索引生成，类型从 {@link actorInstanceTable}[n2][0] 读取。
   * @param n2 实例槽索引；>=0 时从 {@link actorInstanceTable} 反序列化实例（{@link ActorBase.spawnFromBytes}）并占用固定槽；
   *           <0 时分配到 {@link residentActorSlots} 之后的动态槽段并按类型设绘制层。
   * @returns 生成的 actor；池满或反序列化失败返回 null。
   */
  // public final tjge.h c(int,int);  → c_II
  spawnActor(n: number, n2: number): ActorBase | null {
    if (n < 0) {
      n = this.actorInstanceTable[n2]![0];
    }
    let n3: number = 0;
    while (n3 < LevelScene.actorPool[n].length) {
      const h2: ActorBase = LevelScene.actorPool[n][n3]!;
      if (!h2.alive) {
        if (n2 >= 0) {
          h2.slotIndex = n2;
          if (!h2.spawnFromBytes(this.actorInstanceTable[n2]!)) {
            return null;
          }
          h2.alive = true;
          LevelScene.activeActors[n2] = h2;
          return h2;
        }
        let n4: number = this.residentActorSlots;
        while (n4 < LevelScene.activeActors.length) {
          if (LevelScene.activeActors[n4] == null) {
            h2.slotIndex = n4;
            h2.alive = true;
            LevelScene.activeActors[n4] = h2;
            h2.layer = LevelScene.actorDrawLayer[n];
            return h2;
          }
          ++n4;
        }
      }
      ++n3;
    }
    return null;
  }

  /**
   * 执行触发器动作（CFR j.java `a(int,boolean)`）。由 {@link runTrigger} 调用，从 {@link triggerTable}[n] 读类型与参数。
   * 触发器类型：0=相机点（设玩家开关）、1=战斗波（填 {@link LevelScene.triggerParams} 并切到 BattleWave）、
   * 2=剧情演出（填 {@link LevelScene.cutsceneState} 并切到 BossScript）、3=多段机关（生成成组 actor 并记入 {@link LevelScene.formationState}）。
   * @param n  触发器索引。
   * @param bl 是否命中：命中（true）走对应类型分支；未命中（false）用于类型 3 的离开/清理逻辑。
   */
  // public final void a(int,boolean);  → a_IZ
  fireTrigger(n: number, bl: boolean): void {
    const n2: number = GameMIDlet.readIntLE(this.triggerTable[n]!, 0, 1);
    if (bl) {
      switch (n2) {
        case 0: {
          LevelScene.triggerParams[0] = GameMIDlet.readIntLE(this.triggerTable[n]!, 18, 1);
          LevelScene.triggerParams[1] = GameMIDlet.readIntLE(this.triggerTable[n]!, 19, 1);
          if (LevelScene.triggerParams[0] < 0) {
            LevelScene.triggerParams[0] = LevelScene.triggerParams[0] + 256;
          }
          if (LevelScene.triggerParams[1] < 0) {
            LevelScene.triggerParams[1] = LevelScene.triggerParams[1] + 256;
          }
          this.canvas.player!.triggerSwitch(true);
          break;
        }
        case 1: {
          this.triggerFiredFlags[n] = true;
          this.cameraTargetCacheX = GameMIDlet.readIntLE(this.triggerTable[n]!, 18, 1);
          this.cameraTargetCacheY = GameMIDlet.readIntLE(this.triggerTable[n]!, 19, 1);
          if (this.cameraTargetCacheX < 0) {
            this.cameraTargetCacheX += 256;
          }
          if (this.cameraTargetCacheY < 0) {
            this.cameraTargetCacheY += 256;
          }
          this.cameraTargetCacheX <<= 14;
          this.cameraTargetCacheY <<= 14;
          LevelScene.triggerParams[0] = GameMIDlet.readIntLE(this.triggerTable[n]!, 20, 1);
          LevelScene.triggerParams[1] = GameMIDlet.readIntLE(this.triggerTable[n]!, 21, 1);
          LevelScene.triggerParams[2] = GameMIDlet.readIntLE(this.triggerTable[n]!, 22, 1);
          LevelScene.triggerParams[3] = GameMIDlet.readIntLE(this.triggerTable[n]!, 23, 1);
          LevelScene.triggerParams[4] = GameMIDlet.readIntLE(this.triggerTable[n]!, 24, 1);
          LevelScene.triggerParams[5] = GameMIDlet.readIntLE(this.triggerTable[n]!, 25, 1);
          LevelScene.triggerParams[6] = LevelScene.triggerParams[5];
          this.setSubState(LevelSubState.BattleWave);
          break;
        }
        case 2: {
          if (this.canvas.levelIndex === 5 && (this.canvas.player!.reserved & 1) === 0) {
            return;
          }
          LevelScene.cutsceneState[3] = GameMIDlet.readIntLE(this.triggerTable[n]!, 19, 1);
          if (LevelScene.cutsceneState[3] > 0 && LevelScene.activeActors[LevelScene.cutsceneState[3]] != null) {
            LevelScene.cutsceneState[4] = LevelScene.activeActors[LevelScene.cutsceneState[3]]!.posX >> 14;
            if (pkg(LevelScene.activeActors[LevelScene.cutsceneState[3]]!).isAlive()) {
              return;
            }
          }
          this.triggerFiredFlags[n] = true;
          LevelScene.cutsceneState[0] = GameMIDlet.readIntLE(this.triggerTable[n]!, 18, 1);
          LevelScene.cutsceneState[2] = GameMIDlet.readIntLE(this.triggerTable[n]!, 20, 1);
          this.cameraTargetCacheX = GameMIDlet.readIntLE(this.triggerTable[n]!, 14, 2);
          this.cameraTargetCacheX <<= 10;
          this.cameraTargetCacheX -= this.canvas.viewportWidth;
          if (this.cameraTargetCacheX < 0) {
            this.cameraTargetCacheX = 0;
          }
          this.cameraTargetCacheY = this.canvas.cameraY;
          LevelScene.cutsceneState[1] = LevelScene.cutsceneState[0] % 10;
          LevelScene.cutsceneState[0] = (LevelScene.cutsceneState[0] / 10) | 0;
          this.setSubState(LevelSubState.BossScript);
          break;
        }
        case 3: {
          if (LevelScene.formationState[0] !== -1) {
            return;
          }
          let n3: number = GameMIDlet.readIntLE(this.triggerTable[n]!, 18, 1);
          let n4: number = GameMIDlet.readIntLE(this.triggerTable[n]!, 19, 1);
          n3 <<= 14;
          n4 <<= 14;
          const n5: number = GameMIDlet.readIntLE(this.triggerTable[n]!, 20, 1);
          LevelScene.formationState[0] = n;
          let n6: number = 0;
          while (n6 < n5) {
            const h2: ActorBase | null = this.spawnActor(ActorType.GrappleMarker, -1);
            if (h2 != null) {
              h2.posX = n3 + n6 * px(16);
              h2.posY = n4;
              h2.setAction(GameMIDlet.readIntLE(this.triggerTable[n]!, 21 + n6, 1));
              LevelScene.formationState[n6 + 1] = h2.slotIndex;
            }
            ++n6;
          }
          break;
        }
      }
      return;
    }
    if (n2 === 3 && n === LevelScene.formationState[0]) {
      const n7: number = GameMIDlet.readIntLE(this.triggerTable[n]!, 20, 1);
      let n8: number = 0;
      while (n8 < n7) {
        if (LevelScene.activeActors[LevelScene.formationState[n8 + 1]] != null) {
          LevelScene.activeActors[LevelScene.formationState[n8 + 1]]!.kill();
        }
        ++n8;
      }
      LevelScene.formationState[0] = -1;
    }
  }

  /**
   * 生成一波敌人（CFR j.java `c()`）。由 {@link tick} 在 {@link LevelSubState.BattleWave} 子状态下调用。
   * 据 {@link LevelScene.triggerParams}（敌型/数量/编队，0 时随机）决定本波敌人类型、数量与入场方式
   * （左侧涌入 / 右侧涌入 / 斜向交替，由 {@link diagonalFormationToggle} 切换），逐个经 {@link spawnActor} 生成、
   * 用临时缓冲 {@link LevelScene.spawnBytes} 反序列化定位，并累加 {@link waveSpawnCount}、递减剩余刷怪数。
   */
  // public final void c();  → c_
  spawnWave(): void {
    const n: number = LevelScene.triggerParams[2] << 4;
    let n2: number = 0;
    let n3: number = LevelScene.triggerParams[3];
    let n4: number = LevelScene.triggerParams[4];
    let n5: number = 0;
    if (n4 === 0) {
      n4 = 1 + GameMIDlet.randomBelow(3);
    }
    n5 = 1 + GameMIDlet.randomBelow(3);
    if (n3 === 0) {
      const nArray: number[] = [1, 3, 4];
      n3 = nArray[GameMIDlet.randomBelow(3)];
    }
    let n6: number = 0;
    let n7: number = 0;
    let n8: number = 0;
    let n9: number = 0;
    this.waveSpawnCount = 0;
    while (n2 < n4) {
      const f2: EnemyActor = this.spawnActor(n3, -1) as unknown as EnemyActor; // Java 向下转型 (h)→f
      if (f2 != null) {
        let n10: number;
        if (n5 === 3) {
          if (this.diagonalFormationToggle > 0) {
            n10 = 1;
            this.diagonalFormationToggle = 0;
          } else {
            n10 = 2;
            this.diagonalFormationToggle = 1;
          }
        } else {
          n10 = n5;
        }
        if (n10 === 1) {
          n6 = this.canvas.cameraX - ++n8 * px(15);
          n7 = 0;
        } else if (n10 === 2) {
          n6 = this.canvas.cameraX + this.canvas.viewportWidth + ++n9 * 15060;
          n7 = -128;
        }
        LevelScene.spawnBytes[0] = n3 & 0xff; // (byte)n3
        LevelScene.spawnBytes[1] = (n6 = n6 >> 10) & 0xff; // (byte)(n6 >>= 10)
        LevelScene.spawnBytes[2] = (n6 >> 8) & 0xff; // (byte)(n6 >> 8)
        LevelScene.spawnBytes[3] = n & 0xff; // (byte)n
        LevelScene.spawnBytes[4] = (n >> 8) & 0xff; // (byte)(n >> 8)
        LevelScene.spawnBytes[5] = (0 | n7) & 0xff; // (byte)(0 | n7)
        LevelScene.spawnBytes[6] = 1;
        LevelScene.spawnBytes[7] = 60;
        LevelScene.spawnBytes[8] = 22;
        LevelScene.spawnBytes[9] = GameMIDlet.randomBelow(3) & 0xff; // (byte)GameMIDlet.a(3)
        if (f2.spawnFromBytes(LevelScene.spawnBytes)) {
          ++this.waveSpawnCount;
          if (LevelScene.triggerParams[6] > 0 && LevelScene.triggerParams[6] < 100) {
            LevelScene.triggerParams[5] = LevelScene.triggerParams[5] - 1;
          }
        }
      }
      ++n2;
    }
  }

  /**
   * 卸载整个场景（CFR j.java `d()`）。退出关卡 / 加载下一关前由 GameCanvas 调用。
   * 释放地图 {@link LevelScene.camera}、对话 actor、活动 actor 表、本格/实例/触发器表与临时文本引用（全部置 null 以便 GC）。
   * 必要偏差：原版末尾的 `System.gc()` 已按移植规约删除并在原位置注释。
   */
  // public final void d();  → d_
  dispose(): void {
    if (LevelScene.camera != null) {
      LevelScene.camera.dispose();
      LevelScene.camera = null as unknown as TileMap;
    }
    if (this.dialogActor != null) {
      this.dialogActor.kill();
      this.dialogActor = null;
    }
    let n: number = 0;
    while (n < LevelScene.activeActors.length) {
      LevelScene.activeActors[n] = null;
      ++n;
    }
    LevelScene.activeActors = null as unknown as (ActorBase | null)[];
    let n2: number = 0;
    while (n2 < this.cellActors.length) {
      this.cellActors[n2] = null;
      ++n2;
    }
    this.cellActors = null as unknown as (Int8Array | null)[];
    let n3: number = 0;
    while (n3 < this.actorInstanceTable.length) {
      this.actorInstanceTable[n3] = null;
      ++n3;
    }
    this.actorInstanceTable = null as unknown as (Int8Array | null)[];
    let n4: number = 0;
    while (n4 < this.triggerTable.length) {
      this.triggerTable[n4] = null;
      ++n4;
    }
    this.triggerTable = null as unknown as (Int8Array | null)[];
    this.triggerFiredFlags = null as unknown as boolean[];
    GameMIDlet.tempText1 = null as unknown as string;
    GameMIDlet.tempText2 = null as unknown as string;
    // System.gc();  // 原位置 System.gc()，按规约删除
  }

  /**
   * 为某 actor 类型分配对象池（CFR j.java `a(tjge.a,int,int)`）。
   * 若该类型池已存在则跳过；否则预创建 n2 个该类型 actor 实例填入 {@link LevelScene.actorPool}[n]，供 {@link spawnActor} 复用。
   * @param a2 当前 GameCanvas（用于经 {@link GameCanvas.createActor} 创建 actor）。
   * @param n  actor 类型。
   * @param n2 池容量（该类型同屏最大并发数）。
   */
  // public static final void a(tjge.a,int,int);  → a_TaII
  static allocActorPool(a2: GameCanvas, n: number, n2: number): void {
    if (LevelScene.actorPool[n] != null) {
      return;
    }
    LevelScene.actorPool[n] = new Array<ActorBase | null>(n2).fill(null);
    let n3: number = 0;
    while (n3 < n2) {
      LevelScene.actorPool[n][n3] = a2.createActor(n, LevelScene.actorDefs[n]!);
      ++n3;
    }
  }

  /**
   * 按需加载某 actor 类型的精灵定义（CFR j.java `c(int)`）。
   * 若 {@link LevelScene.actorDefs}[n] 未加载则经 {@link SpriteDef.loadFromArchive} 解码，并置好加载标志。
   * @param n actor 类型。
   */
  // public static final void c(int);  → c_I
  static loadActorDef(n: number): void {
    if (LevelScene.actorDefs[n] == null) {
      LevelScene.actorDefs[n] = SpriteDef.loadFromArchive(n);
    }
    LevelScene.actorDefLoaded[n] = true;
    SpriteDef.loadedFlags[SpriteDef.idMap[n]] = true;
  }

  /**
   * 分步加载资源（CFR j.java `a(tjge.a,int)`）。加载进度由调用方递增 n 驱动，用于关卡加载进度条/分帧加载。
   * 按 {@link LevelScene.resourceLoadTable} 前 n 项依次加载 actor 精灵定义（{@link loadActorDef}）并分配对象池（{@link allocActorPool}）；
   * 当 n===3 时额外加载 HUD 字模 {@link LevelScene.hudFont}。
   * @param a2 当前 GameCanvas。
   * @param n  本次加载到第几项（步进游标）。
   * @returns 是否已加载完整张资源表（全部完成时为 true）。
   */
  // public static final boolean a(tjge.a,int);  → a_TaI
  static loadResourcesUpTo(a2: GameCanvas, n: number): boolean {
    let n2: number = 0;
    n2 = 0;
    while (n2 < n && n2 < LevelScene.resourceLoadTable.length) {
      LevelScene.loadActorDef(LevelScene.resourceLoadTable[n2][0]);
      LevelScene.allocActorPool(a2, LevelScene.resourceLoadTable[n2][0], LevelScene.resourceLoadTable[n2][1]);
      ++n2;
    }
    if (n === 3) {
      LevelScene.hudFont = TileSheet.loadFromBin(6)!; // a_I 在 TS 返回 i|null；原版直接赋值（运行时非空）
    }
    return n2 >= LevelScene.resourceLoadTable.length;
  }

  /**
   * 场景工厂：从 /res/s.bin 第 n 条加载并装配一个完整 LevelScene（CFR j.java `b(tjge.a,int)`）。
   * 这是创建关卡运行时的唯一入口（构造函数私有）。流程：建 {@link TileMap}（地图/相机）、读 actor 类型表并分配对象池、
   * 读触发器表 {@link triggerTable}、actor 实例表 {@link actorInstanceTable}、分屏触发器 {@link cellTriggers}、
   * 全局常驻 actor {@link globalActors} 与各分屏常驻 actor {@link cellActors}；非 0/2 关额外载入剧情字符串。
   * 解析全程经 {@link GameMIDlet} 的小端字节读取保持位级一致；任何异常返回 null。
   * @param a2 当前 GameCanvas（场景持有它以访问玩家/输入/相机）。
   * @param n  关卡号（s.bin 中的条目索引，0~6）。
   * @returns 装配好的场景实例；加载失败返回 null。
   */
  // public static final tjge.j b(tjge.a,int);  → b_TaI
  static loadLevel(a2: GameCanvas, n: number): LevelScene | null {
    const j2: LevelScene = new LevelScene();
    try {
      let n2: number;
      let n3: number;
      let n4: number;
      let by: number;
      const inputStream: InputStream = GameMIDlet.openEntryStream("/res/s.bin", n)!;
      j2.cellWidth = GameMIDlet.readShortLE(inputStream);
      j2.cellHeight = GameMIDlet.readShortLE(inputStream);
      const by2: number = GameMIDlet.readByte(inputStream);
      let by3: number = 0;
      const bl: boolean = false; // 原版局部变量，未使用
      void bl;
      if (by2 === 2) {
        GameMIDlet.readByte(inputStream);
        by3 = GameMIDlet.readByte(inputStream);
      }
      GameMIDlet.readByte(inputStream);
      const by4: number = GameMIDlet.readByte(inputStream);
      LevelScene.camera = new TileMap(176, 172);
      LevelScene.camera.load(by4, by3, by2);
      const bl2: boolean = false; // 原版局部变量，未使用
      void bl2;
      const n5: number = inputStream.read1(); // 原 InputStream.read()（无参）
      let n6: number = 0;
      while (n6 < n5) {
        by = GameMIDlet.readByte(inputStream);
        LevelScene.loadActorDef(by);
        GameMIDlet.readByte(inputStream);
        n4 = GameMIDlet.readByte(inputStream);
        LevelScene.allocActorPool(a2, by, n4);
        ++n6;
      }
      by = GameMIDlet.readByte(inputStream);
      j2.triggerTable = new Array<Int8Array | null>(by).fill(null);
      j2.triggerFiredFlags = new Array<boolean>(by).fill(false);
      n4 = 0;
      while (n4 < by) {
        n3 = GameMIDlet.readByte(inputStream);
        j2.triggerTable[n4] = new Int8Array(n3 += 18);
        inputStream.read(j2.triggerTable[n4]!);
        ++n4;
      }
      j2.residentActorSlots = n3 = inputStream.read1(); // 原 InputStream.read()（无参）
      j2.actorInstanceTable = new Array<Int8Array | null>(n3).fill(null);
      j2.triggerHitFlags = new Array<boolean>(n3).fill(false);
      LevelScene.activeActors = new Array<ActorBase | null>(n3 + 30).fill(null);
      let n7: number = 0;
      while (n7 < n3) {
        j2.triggerHitFlags[n7] = false;
        n2 = GameMIDlet.readByte(inputStream);
        j2.actorInstanceTable[n7] = new Int8Array(n2 += 7);
        inputStream.read(j2.actorInstanceTable[n7]!);
        ++n7;
      }
      j2.cellCount = ((LevelScene.camera.getMapHeight() / j2.cellHeight) | 0) * ((LevelScene.camera.getMapWidth() / j2.cellWidth) | 0);
      j2.cellTriggers = new Array<Int8Array | null>(j2.cellCount).fill(null);
      n2 = 0;
      while (n2 < j2.cellCount) {
        const by5: number = GameMIDlet.readByte(inputStream);
        n3 = by5;
        if (by5 > 0) {
          j2.cellTriggers[n2] = new Int8Array(n3);
          inputStream.read(j2.cellTriggers[n2]!);
        }
        ++n2;
      }
      j2.globalActorCount = GameMIDlet.readByte(inputStream);
      j2.globalActors = new Int8Array(j2.globalActorCount);
      inputStream.read(j2.globalActors);
      j2.cellActors = new Array<Int8Array | null>(j2.cellCount).fill(null);
      let n8: number = 0;
      while (n8 < j2.cellCount) {
        n3 = inputStream.read1(); // 原 InputStream.read()（无参）
        j2.cellActors[n8] = new Int8Array(n3);
        inputStream.read(j2.cellActors[n8]!);
        ++n8;
      }
      inputStream.close();
      j2.mapWidth = LevelScene.camera.getMapWidth();
      j2.mapHeight = LevelScene.camera.getMapHeight();
      j2.canvas = a2;
      if (n !== 0 && n !== 2) {
        GameMIDlet.loadTextEntry(n, "/res/string.bin");
      }
      LevelScene.currentLevel = n;
    } catch (exception) {
      return null;
    }
    return j2;
  }

  // static {};  静态初始化块
  // 注：h 与 O 为 static final，已在声明处内联初始化（见上）。
  static {
    LevelScene.actorDefs = new Array<SpriteDef | null>(28).fill(null);
    LevelScene.actorPool = new Array<(ActorBase | null)[]>(28).fill(null as unknown as (ActorBase | null)[]); // new h[28][]：各槽初始 null
    LevelScene.cellSpawnBuffer = new Int8Array(28);
    LevelScene.actorDefLoaded = new Array<boolean>(28).fill(false);
    LevelScene.drawList = new Array<ActorBase | null>(40).fill(null);
    LevelScene.triggerParams = new Int32Array(7);
    LevelScene.spawnBytes = new Int8Array(11);
    LevelScene.cutsceneState = new Int32Array(5);
    LevelScene.dialogState = new Int32Array(3);
    LevelScene.formationState = new Int32Array(4);
    LevelScene.currentLevel = -1;
  }
}

// 类 j 定义完成后注入延迟引用（供 h 经 jref() 取用，打破 h→j 循环依赖）
setJ(LevelScene);
