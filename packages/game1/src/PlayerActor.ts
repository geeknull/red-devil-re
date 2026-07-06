/**
 * 游戏1《红魔特种兵》玩家 Actor 类 f，继承 g。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/f.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 职责：玩家角色。移动/跳跃/重力(重力 J=4096，跳跃 H=-10240，横移 G=±8192)、
 *   武器系统(3 把武器，k=当前武器，h/i/j=弹药，l=当前弹匣，换弹 n_())、
 *   输入响应 h_()（依据 ab.q 输入位掩码）、状态机 g_()（依据 c=动作 id）。
 *
 * 字段别名（混淆名沿用原版）：
 *   a=状态位掩码(bit0=着地, bit13=0x2000=梯子态), b=移动标志, c=动作 id(t&0xFFFFFF),
 *   d=朝向标志(t&0xFF000000), e=生命, f/g=输入计数, h/i/j=三种弹药数, k=当前武器索引,
 *   l=当前弹匣, m=帧计数, n=爬升检测结果, o=子状态, O/P/Q/R/S/T=各类计数/坐标,
 *   U=朝向(true=左), V/W/X/Y=布尔标志, Z=关联 e(敌人), aa=关联 c(Boss), ab=主控 a。
 *   基类 g 字段：t=动作位标志, C/D=定点坐标(<<10), E/F=速度, G/H=目标速度,
 *   I/J=加速度, K/L=速度上限, z=帧水平包围盒下界。
 *
 * 跨类方法名按契约表：
 *   ab(tjge.a): a_IIIIII(...)→生成 tjge.l 并返回, a_III(...)→静态音效（音频后续接入，调用保留），
 *     字段 x/p/q/r/t/u/n/f/B/L；静态字段 a.a=屏幕宽, a.c=关卡像素宽。
 *   b(tjge.b): a_IIZ(x,y,b)→查询地图瓦片碰撞值, a_()→关卡像素宽。
 *   aa(tjge.c): a_Tg(g)→包围盒相交（继承自 g）。
 *   l(tjge.l): a_Z(bool)、a_I(n)、b_()、f_()、字段 C/D/G/H/J/L。
 *   基类 g：a_I(n)=a(int)切帧, c_()=步进, a_IIIAYZ=初始化, d_()=动画完毕,
 *     d_Tb=顶部碰撞。
 *
 * 必要偏差：本类无资源/像素管线直接调用；tjge.a.a_III 为静态音效播放
 * （音频后续接入，调用保留，详见规约 new Sound 暂静音）。
 */
import { ActorType, GameState, MIRROR_FLAG, SEQUENCE_MASK, FACING_MASK, px } from "./constants.ts";
import { GameScreen } from "./GameScreen.ts";
import { TileMap } from "./TileMap.ts";
import { BossActor } from "./BossActor.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { EffectActor } from "./EffectActor.ts";
import { ActorBase } from "./ActorBase.ts";
import { ProjectileActor } from "./ProjectileActor.ts";

export class PlayerActor extends ActorBase {
  stateFlags: number = 0;
  movingFlag: number = 0;
  actionId: number = 0;
  facingFlag: number = 0;
  health: number = 0;
  lastInputDir: number = 0;
  inputHoldCount: number = 0;
  ammoReserveB: number = 0;
  ammoReserveC: number = 0;
  grenadeCount: number = 0;
  weaponIndex: number = 0;
  magazineAmmo: number = 0;
  frameTimer: number = 0;
  climbResult: number = 0;
  subState: number = 0;
  spareO: number = 0;
  spareP: number = 0;
  climbAnimState: number = 0;
  invulnTimer: number = 0;
  climbTargetX: number = 0;
  climbTargetY: number = 0;
  facingLeft: boolean = false;
  actionFlag: boolean = false;
  canClimb: boolean = false;
  climbAdvance: boolean = false;
  ledgeGrabFlag: boolean = false;
  linkedEnemy: EffectActor | null;
  linkedBoss: BossActor | null;
  screen: GameScreen;

  /**
   * 构造玩家对象。对应 CFR tjge/f.java `f(int,d,a)`（SYMBOLS: constructor）。
   * @param n     图块/精灵索引（透传给基类 ActorBase 作精灵帧来源）
   * @param d2    精灵定义 SpriteDef（帧/动画数据）
   * @param a2    所属主控 GameScreen（保存为 this.screen，用于访问关卡/地图/敌人/生成实体）
   * 仅保存主控引用并将关联敌人 linkedEnemy / Boss linkedBoss 置空；满血/重力等初始化在 spawnAt() 里完成。
   */
  constructor(n: number, d2: SpriteDef, a2: GameScreen) {
    super(n, d2);
    this.screen = a2;
    this.linkedEnemy = null;
    this.linkedBoss = null;
  }

  // c(tjge.b) → c_Tb（覆写基类 c_Tb：玩家专用落地/侧壁检测）
  collideGround(tileMap: TileMap): boolean {
    if (this.velY < 0) {
      return false;
    }
    const groundTileY = (this.posY + this.velY) >> 14;
    const leftFootTileX = (((this.posX + this.velX) >> 10) + -5) >> 4;
    const rightFootTileX = (((this.posX + this.velX) >> 10) + 5) >> 4;
    let leftHit = false;
    let rightHit = false;
    if (tileMap.queryColumnTileAt(leftFootTileX, groundTileY, true) === 1) {
      leftHit = true;
    }
    if (tileMap.queryColumnTileAt(rightFootTileX, groundTileY, true) === 1) {
      rightHit = true;
    }
    if (leftHit && rightHit) {
      this.targetVelY = 0;
      this.posY &= 0xfffffc00;
      this.velY = (groundTileY << 14) - this.posY;
      return true;
    }
    // edgeDist：脚像素到瓦片边沿的水平距（坡步阈值），各分支独立块作用域，忠实保留原偏移。
    if (this.facingFlag !== 0 && (leftHit || rightHit)) {
      if (leftHit && !rightHit) {
        const edgeDist = (leftFootTileX << 4) + 16 - (((this.posX + this.velX) >> 10) + -5);
        this.targetVelX = 0;
        if (edgeDist > 6 || (edgeDist >= 4 && (this.actionId === 4 || this.actionId === 3))) {
          this.targetVelY = 0;
          this.velX = (((leftFootTileX << 4) + 7) << 10) - this.posX;
          this.velY = (groundTileY << 14) - this.posY;
          return true;
        }
        this.velX = (((leftFootTileX << 4) + 25) << 10) - this.posX;
      } else if (!leftHit && rightHit && (this.stateFlags & 1) === 0) {
        const edgeDist = (rightFootTileX << 4) - (((this.posX + this.velX) >> 10) + -5);
        this.targetVelX = 0;
        if (edgeDist < 7) {
          this.targetVelY = 0;
          this.velX = (((rightFootTileX << 4) + 7) << 10) - this.posX;
          this.velY = (groundTileY << 14) - this.posY;
          return true;
        }
        this.velX = (((rightFootTileX << 4) - 9) << 10) - this.posX;
      } else if (!leftHit && rightHit) {
        this.velY = px(2);
      }
    } else if (this.facingFlag === 0 && (rightHit || leftHit)) {
      if (rightHit && !leftHit) {
        const edgeDist = ((this.posX + this.velX) >> 10) + 5 - (rightFootTileX << 4);
        this.targetVelX = 0;
        if (edgeDist > 6 || (edgeDist >= 4 && (this.actionId === 4 || this.actionId === 3))) {
          this.targetVelY = 0;
          this.velX = (((rightFootTileX << 4) + 7) << 10) - this.posX;
          this.velY = (groundTileY << 14) - this.posY;
          return true;
        }
        this.velX = (((rightFootTileX << 4) - 9) << 10) - this.posX;
      } else if (!rightHit && leftHit && (this.stateFlags & 1) === 0) {
        // CFR 反编译特性：本(左命中)分支 edgeDist 用 rightFootTileX，而 velX 用 leftFootTileX，忠实保留。
        const edgeDist = ((this.posX + this.velX) >> 10) + 5 - (rightFootTileX << 4);
        this.targetVelX = 0;
        if (edgeDist < 7) {
          this.targetVelY = 0;
          this.velX = (((leftFootTileX << 4) + 9) << 10) - this.posX;
          this.velY = (groundTileY << 14) - this.posY;
          return true;
        }
        this.velX = (((leftFootTileX << 4) + 25) << 10) - this.posX;
      } else if (!rightHit && leftHit) {
        this.velY = px(2);
      }
    }
    this.accelY = px(4);
    return false;
  }

  // e(tjge.b) → e_Tb（爬升顶部碰撞检测）
  checkLedgeTop(tileMap: TileMap): boolean {
    if (this.velY < 0) {
      return false;
    }
    const scanTileX = (this.posX + this.velX) >> 14;
    const topRow = (this.posY - px(10)) >> 14;
    let rowOffset = 0;
    while (rowOffset < 3) {
      if (tileMap.queryColumnTileAt(scanTileX, topRow + rowOffset, true) === 1) {
        return true;
      }
      ++rowOffset;
    }
    return false;
  }

  // f(tjge.b) → f_Tb（前方贴墙检测）
  checkWallAhead(tileMap: TileMap): boolean {
    // n 双义拆分：先定点像素X(前方±px(2))，再 >>14 得瓦片列。
    const probeFx = this.facingLeft ? this.posX - px(2) : this.posX + px(2);
    const row = ((this.posY >> 10) - 34) >> 4;
    return tileMap.queryColumnTileAt(probeFx >> 14, row, true) === 1;
  }

  // a(tjge.b,boolean) → a_TbZ（侧向墙体/梯子瓦片检测；probeAbove=true 探头顶上方）
  checkLadderTile(tileMap: TileMap, probeAbove: boolean): boolean {
    // n 双义：先是探测行(瓦片Y)，末尾梯子态里复用为定点Y位置写回 posY。
    let probeRow = probeAbove
      ? (this.posY - px(30)) >> 14
      : (this.stateFlags & 0x2000) !== 0
        ? (this.posY + this.velY) >> 14
        : (this.posY + this.velY + px(20)) >> 14;
    const leftCol = ((this.posX >> 10) - 3) >> 4;
    const rightCol = ((this.posX >> 10) + 3) >> 4;
    let col = leftCol;
    while (col <= rightCol) {
      const tileValue = tileMap.queryColumnTileAt(col, probeRow, true);
      if (tileValue === 2) {
        this.posX = ((col << 4) + 8) << 10;
        this.velX = 0;
        this.targetVelX = 0;
        return true;
      }
      ++col;
    }
    if ((this.stateFlags & 0x2000) !== 0) {
      if (probeAbove) {
        ++probeRow;
        this.posY = (probeRow << 14) + px(10);
      } else {
        this.posY = probeRow << 14;
      }
      this.targetVelY = 0;
    }
    return false;
  }

  /**
   * 玩家初始化/落位（覆写基类 spawnAt）。对应 CFR `a(int,int,int,byte[],boolean)` → 契约 a_IIIAYZ。
   * 先调基类初始化精灵/坐标，再设满血 health=10、复位移动标志、清关联敌人/Boss、
   * 恢复重力 accelY=4096、置着地态 stateFlags=1（bit0）。二开调它来生成/复位玩家实体。
   */
  // a(int,int,int,byte[],boolean) → a_IIIAYZ（初始化）
  spawnAt(n: number, n2: number, n3: number, byArray: Int8Array, bl: boolean): boolean {
    super.spawnAt(n, n2, n3, byArray, bl);
    this.health = 10;
    this.movingFlag = 0;
    this.linkedEnemy = null;
    this.linkedBoss = null;
    this.accelY = px(4);
    this.stateFlags = 1;
    return true;
  }

  /**
   * 进入关卡/关卡内复位时调用。对应 CFR `f()` → 契约 f_。
   * 复位状态位（关卡4 仅清着地位，其余关重置为 1=着地态）、满血 10、清子状态/帧计时/移动标志，
   * 允许攀爬 canClimb=true、清动作标志 actionFlag、攀爬动画状态回到 18、停竖直加速/速度。
   * 注意：与 spawnAt() 区别在于不重置坐标、不重设备弹（弹药由 fullAmmoInit() 单独管理）。
   */
  // f() → f_（进入关卡/复位时调用）
  resetForLevel(): void {
    this.stateFlags = this.screen.levelIndex === 4 ? (this.stateFlags &= 0xfffffffe) : 1;
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

  /**
   * 每帧物理步进（覆写基类 stepPhysics）。对应 CFR `e()` → 契约 e_。
   * 主循环 GameScreen.update 对渲染队列每个 actor 先调本方法（物理）再调 update()（行为）。
   * 流程：刷新 actionId/facingFlag、递减无敌计时、推进动画、按加速度/上限积分速度，
   * 再按 screen.state 分支推进位置——LevelEnter/GoalCutscene 直接平移；Playing 态下做
   * 天花板 collideCeiling / 落地 collideGround / 侧壁检测、登梯转换（actionId 18 + 置 0x2000）、
   * 8 像素对齐吸附、脚本钳制相机边界，并据玩家位置设相机滚动速度 cameraVelX/Y。
   * 关卡4 走载具专属推进（reinforceBudget 驱动横移、与 Boss 包围盒互推）。
   */
  // e() → e_（物理步进，覆写基类 e_）
  stepPhysics(): void {
    this.actionId = this.frameIndex & SEQUENCE_MASK;
    this.facingFlag = this.frameIndex & FACING_MASK;
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
      case GameState.LevelEnter:
      case GameState.GoalCutscene: {
        this.posX += this.velX;
        this.posY += this.velY;
        return;
      }
      case GameState.Playing: {
        // n 的两处复用拆名：wallHit(墙体命中0/1) 与 alignOffset(posX%px(8) 8px对齐余量)。
        let alignOffset: number;
        const viewWidthFx = GameScreen.viewWidthFx;
        if (this.screen.levelIndex === 4) {
          if (this.screen.reinforceBudget-- > 25) {
            this.targetVelX = 0;
          } else if (this.screen.reinforceBudget > 12) {
            this.targetVelX = px(10);
          } else if (this.screen.reinforceBudget <= 12) {
            this.screen.cameraVelX = px(8);
          }
          if (
            this.screen.boss!.active &&
            this.linkedBoss!.intersectsActor(this.screen.boss!) &&
            ((this.linkedBoss!.posX < this.screen.boss!.posX && this.targetVelX > this.screen.cameraVelX) ||
              (this.linkedBoss!.posX > this.screen.boss!.posX && this.targetVelX < this.screen.cameraVelX))
          ) {
            this.targetVelX = this.screen.cameraVelX;
            this.velX = this.screen.cameraVelX;
          }
          this.posX += this.velX;
          if (this.screen.cameraVelX <= 0) break;
          if (this.posX < this.screen.cameraX + px(20)) {
            this.posX = this.screen.cameraX + px(20);
            return;
          }
          if (this.posX - this.screen.cameraX <= viewWidthFx - px(20)) break;
          this.posX = this.screen.cameraX + viewWidthFx - px(20);
          return;
        }
        if ((this.stateFlags & 0x2000) === 0) {
          if (this.collideCeiling(this.screen.tileMap!)) {
            if (!this.collideGround(this.screen.tileMap!)) {
              this.targetVelY = px(5);
              this.beginFall();
            } else {
              this.setFrame(5 | this.facingFlag);
            }
          } else {
            if (this.facingFlag !== 0) {
              const wallHit = this.checkWallLeft(this.screen.tileMap!, 0) ? 1 : 0;
              if (wallHit !== 0 && (this.stateFlags & 1) !== 0 && this.actionId !== 19 && this.actionId !== 0 && this.actionId !== 5) {
                this.setFrame(0 | this.facingFlag);
              }
            } else {
              const wallHit = this.checkWallRight(this.screen.tileMap!, 0) ? 1 : 0;
              if (wallHit !== 0 && (this.stateFlags & 1) !== 0 && this.actionId !== 19 && this.actionId !== 0 && this.actionId !== 5) {
                this.setFrame(0);
              }
            }
            if (this.collideGround(this.screen.tileMap!)) {
              this.land();
            } else {
              this.beginFall();
            }
          }
          if (
            (this.actionId === 3 || this.actionId === 4 || this.actionId === 17) &&
            (this.stateFlags & 1) === 0 &&
            this.subState !== 5 &&
            this.checkLadderTile(this.screen.tileMap!, true)
          ) {
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
        if (
          (this.stateFlags & 1) !== 0 &&
          (this.actionId === 2 || this.actionId === 0) &&
          (alignOffset = this.posX % px(8)) > px(2) &&
          alignOffset < px(6)
        ) {
          if (alignOffset > px(4)) {
            alignOffset = px(8) - alignOffset;
            this.posX += alignOffset;
          } else {
            this.posX -= alignOffset;
          }
        }
        if (this.screen.scriptFlagL && this.screen.levelIndex !== 7 && this.screen.levelIndex !== 2) {
          if (this.posX < this.screen.cameraX + px(10)) {
            this.posX = this.screen.cameraX + px(10);
            this.targetVelX = 0;
            return;
          }
          if (this.posX <= this.screen.cameraX + viewWidthFx - px(10)) break;
          this.posX = this.screen.cameraX + viewWidthFx - px(10);
          this.targetVelX = 0;
          return;
        }
        this.screen.cameraVelX =
          this.facingFlag === 0
            ? this.posX > (((GameScreen.screenWidth / 5) | 0) << 10)
              ? this.targetVelX + px(14)
              : 0
            : this.posX < ((this.screen.tileMap!.getPixelWidth() - ((GameScreen.screenWidth / 5) | 0)) << 10)
              ? this.targetVelX + px(-14)
              : 0;
        this.screen.cameraVelY = px(-4);
      }
    }
  }

  /**
   * 每帧行为更新（覆写基类 update）。对应 CFR `a()` → 契约 a_（SYMBOLS: update）。
   * 在 stepPhysics() 之后被主循环调用：刷新朝向 facingLeft、跑动作状态机 runActionStateMachine()、
   * 重读 actionId、处理输入 handleInput()，最后若已死血（health<=0）且未处于死亡/被捕动作则切到死亡帧 0x17。
   */
  // a() → a_（每帧更新，覆写基类 a_）
  update(): void {
    this.facingLeft = (this.frameIndex & FACING_MASK) !== 0;
    this.runActionStateMachine();
    this.actionId = this.frameIndex & SEQUENCE_MASK;
    this.handleInput();
    if (this.health <= 0 && this.actionId !== 23 && this.actionId !== 15 && this.actionId !== 16) {
      this.setFrame(0x17 | this.facingFlag);
    }
  }

  /**
   * 动作状态机（SYMBOLS: runActionStateMachine）。对应 CFR `g()` → 契约 g_。
   * 按当前动作 id（actionId=c）与子状态 subState（o）切换动画帧与物理：
   * 跳跃/坠落（3/4/22）、攀爬翻越（17/18/24/25/26/27）、换弹（1/28）、各类开火回中（6/7/8/9/10/11/29/30）、
   * 翻滚/突进（19/20/21）、被捕/死亡（13/15/16/23）等。每个动作 id 是一组分支，子状态推进动画阶段。
   * 与 handleInput() 配合：输入设动作 id，本方法据 id 推进对应动画/状态收尾。
   */
  // g() → g_（动作状态机分派器：按 actionId 分派到各 stepAction* 私有方法）
  // 拆法：外层 switch(actionId) 每 case body 抽为 helper；原退出外层 switch 的 break→helper 内 return；
  // 内层 switch 的 break、case17 sub0→sub2/3/4 落穿、case22 void n 副作用均随体迁入 helper 原样保留。
  runActionStateMachine(): void {
    switch (this.actionId) {
      case 3:
        this.stepDashLeft();
        return;
      case 4:
        this.stepDashRight();
        return;
      case 17:
        this.stepJumpClimbMount();
        return;
      case 22:
        this.stepDashJump();
        return;
      case 1:
      case 28:
        this.stepReloadFinish();
        return;
      case 6:
      case 8:
      case 29:
        this.stepFireToIdle();
        return;
      case 7:
        this.stepFireToAim();
        return;
      case 9:
      case 11:
      case 30:
        this.stepFireToRun();
        return;
      case 10:
        this.stepFireRecover10();
        return;
      case 20:
        this.stepTransition20();
        return;
      case 21:
        this.stepTransition21();
        return;
      case 13:
        this.stepEnterCapture();
        return;
      case 19:
        this.stepLandAction();
        return;
      case 18:
      case 24:
      case 25:
      case 26:
        this.stepClimbRotate();
        return;
      case 27:
        this.stepLedgeGrab();
        return;
      case 23:
        this.stepDeathSettle();
        return;
      case 15:
        this.stepHitStagger();
        return;
      case 16:
        this.stepHitToCapture();
        return;
    }
  }

  // actionId 3 (DASH_LEFT)：CFR g case 3——左冲刺/跳跃空中态，探测攀爬（内层 break 保留=跳出 subState switch）
  private stepDashLeft(): void {
    switch (this.subState) {
      case 0: {
        this.checkClimbable(this.screen.tileMap!);
        if (this.climbResult === 2 && this.canClimb) {
          this.posX = this.facingLeft ? this.climbTargetX + px(10) : this.climbTargetX - px(10);
          this.posY = this.climbTargetY + px(36);
          this.subState = 3;
          this.setFrame(0x16 | this.facingFlag);
          return;
        }
        if (this.targetVelY <= -3120) break;
        this.setFrame(4 | this.facingFlag);
        break;
      }
      case 1: {
        if ((this.stateFlags & 1) === 0) break;
        this.accelY = 0;
        this.targetVelX = 0;
        this.setFrame(0 | this.facingFlag);
        break;
      }
      case 3: {
        this.checkClimbable(this.screen.tileMap!);
        if (this.climbResult !== 2 || !this.canClimb) break;
        this.posX = this.facingLeft ? this.climbTargetX + px(10) : this.climbTargetX - px(10);
        this.posY = this.climbTargetY + px(36);
        this.setFrame(0x16 | this.facingFlag);
        break;
      }
      case 4: {
        if (this.targetVelY <= 3120) break;
        this.setFrame(0x11 | this.facingFlag);
      }
    }
  }

  // actionId 4 (DASH_RIGHT)：CFR g case 4
  private stepDashRight(): void {
    switch (this.subState) {
      case 0: {
        if (this.targetVelY <= 3120) break;
        this.setFrame(0x11 | this.facingFlag);
        break;
      }
      case 2:
      case 3: {
        if (this.posY >= this.climbTargetY) break;
        this.targetVelX =
          this.subState === 3 ? (this.facingLeft ? px(-8) : px(8)) : this.facingLeft ? px(-4) : px(4);
        this.setFrame(0x11 | this.facingFlag);
      }
    }
  }

  // actionId 17 (JUMP)：CFR g case 17——起跳/翻越登顶；sub0 命中攀爬后有意落穿 sub2/3/4（保留 // fall through）
  private stepJumpClimbMount(): void {
    switch (this.subState) {
      case 0: {
        this.checkClimbable(this.screen.tileMap!);
        if (this.climbResult === 2 && !this.checkLedgeTop(this.screen.tileMap!) && this.canClimb) {
          this.subState = 6;
          return;
        }
        // fall through
      }
      case 2:
      case 3:
      case 4: {
        if ((this.stateFlags & 1) === 0) break;
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
        this.posX = this.facingLeft ? this.climbTargetX + px(10) : this.climbTargetX - px(10);
        this.posY = this.climbTargetY + px(36);
        this.targetVelY = px(-4);
        this.subState = 3;
        this.setFrame(0x16 | this.facingFlag);
      }
    }
  }

  // actionId 22 (DASH_JUMP)：CFR g case 22——原退出外层 switch 的 break→return；const n 空壳保留 targetVelX 赋值副作用
  private stepDashJump(): void {
    if (this.subState !== 2 && this.subState !== 3) return;
    this.canClimb = false;
    this.accelY = px(4);
    const n = (this.targetVelX = this.facingLeft ? px(-4) : px(4));
    void n;
    if (this.subState === 3) {
      this.targetVelY = px(-15);
    }
    this.setFrame(4 | this.facingFlag);
  }

  // actionId 1/28 (LAND_RELOAD / 攀爬换弹)：CFR g case 1/28
  private stepReloadFinish(): void {
    if (!this.isAnimationDone()) return;
    this.reloadFromReserve();
    if (this.actionId === 1) {
      this.setFrame(0 | this.facingFlag);
      return;
    }
    this.setFrame(5 | this.facingFlag);
  }

  // actionId 6/8/29 (FIRE_* 回中→站立帧0)：CFR g case 6/8/29
  private stepFireToIdle(): void {
    if (!this.isAnimationDone()) return;
    this.setFrame(0 | this.facingFlag);
  }

  // actionId 7 (FIRE 回中→瞄准帧8)：CFR g case 7
  private stepFireToAim(): void {
    if (!this.isAnimationDone()) return;
    this.setFrame(8 | this.facingFlag);
  }

  // actionId 9/11/30 (FIRE 回中→奔跑帧5)：CFR g case 9/11/30
  private stepFireToRun(): void {
    if (!this.isAnimationDone()) return;
    this.setFrame(5 | this.facingFlag);
  }

  // actionId 10 (FIRE 回中→帧0xb)：CFR g case 10
  private stepFireRecover10(): void {
    if (!this.isAnimationDone()) return;
    this.setFrame(0xb | this.facingFlag);
  }

  // actionId 20 (TRANSITION→帧0x15)：CFR g case 20
  private stepTransition20(): void {
    if (this.frameTimer++ <= 1) return;
    this.frameTimer = 0;
    this.setFrame(0x15 | this.facingFlag);
  }

  // actionId 21 (TRANSITION→帧0)：CFR g case 21
  private stepTransition21(): void {
    if (this.frameTimer++ <= 1) return;
    this.frameTimer = 0;
    this.setFrame(0 | this.facingFlag);
  }

  // actionId 13：CFR g case 13——切到被捕过场
  private stepEnterCapture(): void {
    this.screen.state = GameState.CaptureCutscene;
  }

  // actionId 19 (LAND_ACTION)：CFR g case 19
  private stepLandAction(): void {
    if (this.frameTimer++ <= 5) return;
    if (this.checkWallAhead(this.screen.tileMap!)) {
      this.setFrame(5 | this.facingFlag);
    } else {
      this.setFrame(0 | this.facingFlag);
    }
    this.movingFlag = 0;
    this.frameTimer = 0;
    this.targetVelX = 0;
    this.lastInputDir = 0;
    this.inputHoldCount = 0;
  }

  // actionId 18/24/25/26 (CLIMB_*)：CFR g case 18/24/25/26——攀爬动画帧轮转
  // 内层 climbAnimState switch 的 break 保留；原退出外层 switch 的 break(帧==23)→return
  private stepClimbRotate(): void {
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
    if ((this.frameIndex & SEQUENCE_MASK) === 23) return;
    this.setFrame(this.climbAnimState | this.facingFlag);
  }

  // actionId 27 (LEDGE_GRAB)：CFR g case 27
  private stepLedgeGrab(): void {
    if (!this.ledgeGrabFlag) {
      this.climbAnimState = 24;
      this.setFrame(this.climbAnimState | this.facingFlag);
    } else {
      this.accelY = px(4);
      this.posY -= px(25);
      this.stateFlags &= 0xffffdfff;
      this.setFrame(0 | this.facingFlag);
    }
    this.climbAdvance = false;
  }

  // actionId 23 (DEATH)：CFR g case 23——原退出外层 switch 的 break(关卡!=4且未着地)→return
  private stepDeathSettle(): void {
    if (this.screen.levelIndex !== 4 && (this.stateFlags & 1) === 0) return;
    if (this.health <= 0) {
      this.setFrame(0xf | this.facingFlag);
      GameScreen.playSound(4, 1, 200);
      return;
    }
    this.setFrame(0 | this.facingFlag);
  }

  // actionId 15 (HIT)：CFR g case 15
  private stepHitStagger(): void {
    if (this.frameTimer++ <= 2) return;
    this.setFrame(0x10 | this.facingFlag);
  }

  // actionId 16 (HIT_END)：CFR g case 16——原为末 case 自然退出 switch（无 break/return），helper 内自然结束
  private stepHitToCapture(): void {
    if (this.frameTimer++ <= 4) return;
    this.frameTimer = 0;
    this.screen.state = GameState.CaptureCutscene;
  }

  /**
   * 输入处理（SYMBOLS: handleInput）。对应 CFR `h()` → 契约 h_。
   * 据主控 screen.heldKeyAction 输入位掩码（左1/右2/上4/下8/开火16/切武器32/换弹2048/手雷1024/
   * 左跳64/右跳128 等）驱动移动、跳跃、攀爬上下、登梯、射击、换弹与切武器。
   * 仅在 Playing 态且处于可接受输入的动作时生效；关卡4 转交 handleVehicleInput()。
   * 实现按 CFR 字节码顺序逐行移植，详见下方 “Unable to fully structure code” 说明：多层 blockNN
   * 标号 break 复刻 Java 无法结构化的跳转，二开调整键位逻辑须保持这些跳转拓扑不变。
   */
  /*
   * Unable to fully structure code（CFR 原注：无法完全结构化；
   * 以下 block88..block95 跳转逻辑严格按 CFR 字节码顺序逐行移植，
   * 用标号 break 复刻 Java 的多层 block 跳出。）
   */
  // h() → h_（输入处理：依据 ab.q 输入位掩码驱动移动/跳跃/射击/换弹）
  handleInput(): void {
    block92: {
      block95: {
        block93: {
          block94: {
            block88: {
              block91: {
                block89: {
                  block90: {
                    if (this.screen.state !== GameState.Playing) {
                      return;
                    }
                    if (
                      this.actionId === 23 ||
                      (this.actionId !== 0 &&
                        this.actionId !== 5 &&
                        this.actionId !== 2 &&
                        this.actionId !== 1 &&
                        this.actionId !== 28 &&
                        (this.stateFlags & 8192) === 0)
                    ) {
                      return;
                    }
                    if (this.screen.levelIndex === 4) {
                      this.handleVehicleInput();
                      return;
                    }
                    if ((this.stateFlags & 8192) !== 0) {
                      this.targetVelY = 0;
                      this.accelY = 0;
                    }
                    if (
                      this.screen.heldKeyAction === 4 &&
                      this.actionId !== 5 &&
                      !this.actionFlag &&
                      (this.stateFlags & 8192) === 0 &&
                      !this.checkLadderTile(this.screen.tileMap!, true)
                    ) {
                      this.screen.heldKeyAction &= -5;
                      if (this.inputHoldCount > 0) {
                        this.screen.heldKeyAction = this.facingLeft !== false ? 64 : 128;
                      }
                    }
                    if (this.screen.heldKeyAction === 1) {
                      if ((this.stateFlags & 1) !== 0) {
                        if (this.actionId !== 2) {
                          if (this.facingLeft) {
                            if (this.actionId === 5 && this.checkWallAhead(this.screen.tileMap!)) {
                              return;
                            }
                            if (!this.checkWallLeft(this.screen.tileMap!, 2)) {
                              this.walkLeft();
                            }
                          } else {
                            this.setFrame(this.actionId | MIRROR_FLAG);
                          }
                        }
                      } else if ((this.stateFlags & 8192) !== 0 && !this.checkWallLeft(this.screen.tileMap!, 14)) {
                        if (this.checkLadderTile(this.screen.tileMap!, false)) {
                          this.frameTimer = 0;
                          this.movingFlag = 1;
                          this.targetVelY = px(10);
                          this.targetVelX = px(-8);
                          this.subState = 5;
                          this.setFrame(-2147483631);
                        } else {
                          this.velY = px(4);
                          this.setFrame(MIRROR_FLAG);
                        }
                        this.stateFlags &= -8193;
                      }
                      this.lastInputDir = 1;
                      return;
                    }
                    if (this.screen.heldKeyAction === 2) {
                      if ((this.stateFlags & 1) !== 0) {
                        if (this.actionId !== 2) {
                          if (!this.facingLeft) {
                            if (this.actionId === 5 && this.checkWallAhead(this.screen.tileMap!)) {
                              return;
                            }
                            if (!this.checkWallRight(this.screen.tileMap!, 2)) {
                              this.walkRight();
                            }
                          } else {
                            this.setFrame(this.actionId);
                          }
                        }
                      } else if ((this.stateFlags & 8192) !== 0 && !this.checkWallRight(this.screen.tileMap!, 14)) {
                        if (this.checkLadderTile(this.screen.tileMap!, false)) {
                          this.frameTimer = 0;
                          this.movingFlag = 1;
                          this.targetVelY = px(10);
                          this.targetVelX = px(8);
                          this.subState = 5;
                          this.setFrame(17);
                        } else {
                          this.velY = px(4);
                          this.setFrame(0);
                        }
                        this.stateFlags &= -8193;
                      }
                      this.lastInputDir = 2;
                      return;
                    }
                    if (this.screen.heldKeyAction === 4) {
                      if (this.actionFlag && (this.stateFlags & 1) !== 0) {
                        if (this.linkedEnemy !== null) {
                          this.setFrame(13 | this.facingFlag);
                        }
                      } else if (this.actionId === 5) {
                        if (!this.checkWallAhead(this.screen.tileMap!)) {
                          this.setFrame(0 | this.facingFlag);
                        }
                      } else if (this.checkLadderTile(this.screen.tileMap!, true)) {
                        this.climbAdvance = true;
                        this.stateFlags &= -2;
                        this.stateFlags |= 8192;
                        this.targetVelY = px(-5);
                        this.movingFlag = 0;
                        this.setFrame(this.climbAnimState | this.facingFlag);
                      } else if ((this.stateFlags & 8192) !== 0) {
                        this.ledgeGrabFlag = true;
                        this.setFrame(27 | this.facingFlag);
                      }
                      this.lastInputDir = 4;
                      this.inputHoldCount = 0;
                      return;
                    }
                    if (this.screen.heldKeyAction === 8) {
                      this.targetVelX = 0;
                      if (this.checkLadderTile(this.screen.tileMap!, false)) {
                        if ((this.stateFlags & 8192) === 0) {
                          this.stateFlags &= -2;
                          this.stateFlags |= 8192;
                          this.movingFlag = 0;
                          this.ledgeGrabFlag = false;
                          this.posY += px(30);
                          this.setFrame(27 | this.facingFlag);
                        } else {
                          this.setFrame(this.climbAnimState | this.facingFlag);
                        }
                        this.targetVelY = px(5);
                        this.climbAdvance = true;
                      } else if ((this.stateFlags & 8192) !== 0) {
                        this.stateFlags &= -8193;
                        this.velY = px(4);
                        this.setFrame(0 | this.facingFlag);
                      } else if (
                        (this.stateFlags & 1) !== 0 &&
                        ((this.inputHoldCount > 0 && this.inputHoldCount < 3 && this.lastInputDir === 8) ||
                          (this.actionId === 5 && this.inputHoldCount > 0))
                      ) {
                        this.movingFlag = 1;
                        this.targetVelX = this.facingLeft === false ? px(8) : px(-8);
                        this.setFrame(19 | this.facingFlag);
                      } else if ((this.stateFlags & 1) !== 0 && this.inputHoldCount > 0) {
                        this.setFrame(5 | this.facingFlag);
                      }
                      this.lastInputDir = 8;
                      this.inputHoldCount = 0;
                      return;
                    }
                    if (this.screen.heldKeyAction !== 64) break block88;
                    if ((this.stateFlags & 1) === 0) break block89;
                    if (this.actionId === 5 && this.checkWallAhead(this.screen.tileMap!)) {
                      return;
                    }
                    if (!this.facingLeft) {
                      this.setFrame(this.actionId | MIRROR_FLAG);
                      return;
                    }
                    this.velY = 0;
                    this.velX = 0;
                    if (!this.checkClimbable(this.screen.tileMap!)) break block90;
                    this.subState = this.climbResult;
                    switch (this.subState) {
                      case 1:
                      case 4: {
                        if (this.subState === 4) {
                          if (!this.checkWallLeft(this.screen.tileMap!, 2)) {
                            this.subState = 0;
                            this.targetVelX = px(-8);
                          }
                        } else if (this.subState === 1) {
                          this.targetVelX = px(-4);
                        }
                        // fall through (lbl138)
                      }
                      case 3: {
                        this.startLeapLeft(px(-10));
                        break;
                      }
                      case 2: {
                        this.startLeapLeft(px(-15));
                      }
                    }
                    break block91;
                  }
                  // block90:
                  this.subState = 0;
                  this.startLeapLeft(px(-10));
                  this.targetVelX = px(-8);
                  break block91;
                }
                // block89:
                if ((this.stateFlags & 8192) !== 0) {
                  this.accelY = 0;
                  this.targetVelY = 0;
                }
              }
              // block91:
              this.lastInputDir = 64;
              this.screen.heldKeyAction = 0;
              return;
            }
            // block88:
            if (this.screen.heldKeyAction !== 128) break block92;
            if ((this.stateFlags & 1) === 0) break block93;
            if (this.actionId === 5 && this.checkWallAhead(this.screen.tileMap!)) {
              return;
            }
            if (this.facingLeft) {
              this.setFrame(this.actionId);
              return;
            }
            this.velY = 0;
            this.velX = 0;
            if (!this.checkClimbable(this.screen.tileMap!)) break block94;
            this.subState = this.climbResult;
            switch (this.subState) {
              case 1:
              case 4: {
                if (this.subState === 4) {
                  if (!this.checkWallRight(this.screen.tileMap!, 2)) {
                    this.subState = 0;
                    this.targetVelX = px(8);
                  }
                } else if (this.subState === 1) {
                  this.targetVelX = px(4);
                }
                // fall through (lbl178)
              }
              case 3: {
                this.startLeapRight(px(-10));
                break;
              }
              case 2: {
                this.startLeapRight(px(-15));
              }
            }
            break block95;
          }
          // block94:
          this.subState = 0;
          this.startLeapRight(px(-10));
          this.targetVelX = px(8);
          break block95;
        }
        // block93:
        if ((this.stateFlags & 8192) !== 0) {
          this.accelY = 0;
          this.targetVelY = 0;
        }
      }
      // block95:
      this.lastInputDir = 128;
      this.screen.heldKeyAction = 0;
      return;
    }
    // block92:
    if (this.screen.heldKeyAction === 16) {
      if ((this.stateFlags & 8192) !== 0) {
        return;
      }
      if (this.inputHoldCount === 0) {
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
    if (this.screen.heldKeyAction === 32) {
      if ((this.stateFlags & 8192) === 0 && this.inputHoldCount > 1) {
        switch (this.weaponIndex) {
          case 0: {
            if (this.ammoReserveB !== 0 || this.ammoReserveC !== 0) break;
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
    if (this.screen.heldKeyAction === 2048) {
      if (this.actionId !== 1 && this.actionId !== 28 && (this.stateFlags & 8192) === 0 && this.inputHoldCount > 1) {
        this.switchOrReloadWeapon(2048);
        this.inputHoldCount = 0;
      }
      this.targetVelX = 0;
      this.screen.heldKeyAction &= -2049;
      return;
    }
    if (this.screen.heldKeyAction === 1024) {
      if ((this.stateFlags & 8192) !== 0 || this.inputHoldCount === 0) {
        return;
      }
      this.fireWeapon(20);
      this.inputHoldCount = 0;
      this.targetVelX = 0;
      this.screen.heldKeyAction &= -1025;
      return;
    }
    ++this.inputHoldCount;
    if (this.movingFlag === 0) {
      this.targetVelX = 0;
    }
    if (this.actionId === 2 && (this.stateFlags & 1) !== 0) {
      this.setFrame(0 | this.facingFlag);
    }
  }

  /**
   * 向左跳跃/翻越起跳（SYMBOLS: startLeapLeft）。对应 CFR `b(int)` → 契约 b_I。
   * @param n 起跳竖直速度（向上为负，定点；如 -10240 普通跳、-15360 高跳）
   * 按子状态 subState 选起跳动画帧，置竖直速度 n、恢复重力 accelY=4096、清着地位、标记移动中。
   */
  // b(int) → b_I（向左跳跃/落地动作分支设定）
  startLeapLeft(jumpVelY: number): void {
    if (this.subState === 2) {
      this.posX = this.climbTargetX + px(12);
      this.setFrame(-2147483626);
    } else if (this.subState === 5) {
      this.setFrame(-2147483631);
    } else {
      this.setFrame(-2147483645);
    }
    this.targetVelY = jumpVelY;
    this.accelY = px(4);
    this.stateFlags &= 0xfffffffe;
    this.movingFlag = 1;
  }

  /**
   * 向右跳跃/翻越起跳（SYMBOLS: startLeapRight）。对应 CFR `c(int)` → 契约 c_I。
   * 与 startLeapLeft() 镜像，@param n 同义（向上为负）。
   */
  // c(int) → c_I（向右跳跃/落地动作分支设定）
  startLeapRight(jumpVelY: number): void {
    if (this.subState === 2) {
      this.posX = this.climbTargetX - px(12);
      this.setFrame(22);
    } else if (this.subState === 5) {
      this.setFrame(17);
    } else {
      this.setFrame(3);
    }
    this.targetVelY = jumpVelY;
    this.accelY = px(4);
    this.stateFlags &= 0xfffffffe;
    this.movingFlag = 1;
  }

  /**
   * 着地复位。对应 CFR `i()` → 契约 i_。
   * 仅当此前未着地（stateFlags bit0==0）时执行：停横移、停竖直加速、清移动标志、
   * 允许攀爬、置着地位 bit0，并（非死亡动作时）回到站立帧 0。由 stepPhysics() 检测到落地时调用。
   */
  // i() → i_（着地复位）
  land(): void {
    if ((this.stateFlags & 1) === 0) {
      this.targetVelX = 0;
      this.accelY = 0;
      this.movingFlag = 0;
      this.canClimb = true;
      this.stateFlags |= 1;
      if (this.actionId !== 23) {
        this.setFrame(0 | this.facingFlag);
      }
    }
  }

  /**
   * 离地/进入坠落。对应 CFR `j()` → 契约 j_。
   * 关卡4 及部分动作（攀爬/跳/翻越/死亡 15/16/3/4/17/22）直接返回不触发。
   * 否则清着地位；当向下坠落（velY>0）或死亡态时设坠落速度/重力/上限，进入坠落子状态并切坠落帧。
   * 由 stepPhysics() 在脚下无地面时调用，使玩家自然下坠。
   */
  // j() → j_（离地起跳/坠落）
  beginFall(): void {
    if (
      this.screen.levelIndex === 4 ||
      this.actionId === 15 ||
      this.actionId === 16 ||
      this.actionId === 3 ||
      this.actionId === 4 ||
      this.actionId === 17 ||
      this.actionId === 22
    ) {
      return;
    }
    this.stateFlags &= 0xfffffffe;
    if (this.actionId === 23 || this.velY > 0) {
      this.targetVelY = px(10);
      this.accelY = px(4);
      this.maxVelY = px(12);
      this.frameTimer = 0;
      this.movingFlag = 1;
      if (this.actionId === 23) {
        this.targetVelX = 0;
        return;
      }
      this.subState = 5;
      this.targetVelX = this.facingLeft ? px(-8) : px(8);
      this.setFrame(0x11 | this.facingFlag);
    }
  }

  // k() → k_（向左移动）
  walkLeft(): void {
    this.targetVelX = px(-8);
    this.movingFlag = 0;
    this.setFrame(-2147483646);
  }

  // l() → l_（向右移动）
  walkRight(): void {
    this.targetVelX = px(8);
    this.movingFlag = 0;
    this.setFrame(2);
  }

  /**
   * 开火/投掷（SYMBOLS: fireWeapon）。对应 CFR `d(int)` → 契约 d_I。
   * @param n 武器/投射类型：10|21=步枪/手枪子弹（弹匣空则切空枪帧）、20=手雷、15=火箭（追踪弹）。
   * 据当前武器 weaponIndex 与朝向计算枪口偏移，调 screen.spawnProjectile() 生成对应 ProjectileActor，
   * 消耗弹匣 magazineAmmo / 手雷 grenadeCount，设射击动画帧；火箭命中地形则爆开特效。
   * 蹲姿（actionId==5）时调整弹体高度与射击帧。开火音效 GameScreen.playSound(3,...)。
   */
  // d(int) → d_I（开火/投掷，按武器/投射类型 weaponType 生成子弹/手雷）
  fireWeapon(weaponType: number): void {
    let projectile: ProjectileActor | null;
    switch (weaponType) {
      case 10:
      case 21: {
        if (this.magazineAmmo <= 0) {
          if (this.actionId === 5) {
            this.setFrame(0x1e | this.facingFlag);
            return;
          }
          this.setFrame(0x1d | this.facingFlag);
          return;
        }
        if (this.weaponIndex === 0) {
          let muzzleOffsetX = !this.facingLeft ? 25 : -25;
          muzzleOffsetX = muzzleOffsetX << 10;
          projectile = this.screen.spawnProjectile(ActorType.GuidedMissileProjectile, 0 | this.facingFlag, 0, this.posX + muzzleOffsetX, this.posY - px(20), 0);
        } else {
          let muzzleOffsetX = !this.facingLeft ? 35 : -35;
          muzzleOffsetX = muzzleOffsetX << 10;
          projectile = this.screen.spawnProjectile(
            ActorType.PlayerBounceShot,
            0 | (this.facingFlag === 0 ? MIRROR_FLAG : 0),
            1,
            this.posX + muzzleOffsetX,
            this.posY - px(23),
            0,
          );
        }
        if (projectile !== null) {
          if (this.actionId === 5) {
            projectile.posY += px(5);
            this.setFrame(9 | this.facingFlag);
          } else {
            this.setFrame(6 | this.facingFlag);
          }
          if (this.screen.levelIndex !== 4 && this.weaponIndex === 0 && projectile.advanceAndCollide(this.facingLeft)) {
            projectile.setFrame(1);
          } else if (this.weaponIndex === 0) {
            projectile.targetVelX = projectile.targetVelX + (!this.facingLeft ? px(12) : px(-12));
          }
          --this.magazineAmmo;
        }
        GameScreen.playSound(3, 1, 100);
        break;
      }
      case 20: {
        if (this.grenadeCount === 0 && this.screen.levelIndex !== 4) {
          return;
        }
        projectile = this.screen.spawnProjectile(ActorType.FallingBombProjectile, 0, 0, this.posX, this.posY - px(35), 0);
        if (projectile === null) break;
        if (--this.grenadeCount < 0) {
          this.grenadeCount = 0;
        }
        if (this.actionId === 5) {
          projectile.posY += px(4);
          this.setFrame(0xa | this.facingFlag);
        } else {
          this.setFrame(7 | this.facingFlag);
        }
        projectile.targetVelX = projectile.targetVelX + (!this.facingLeft ? px(8) : px(-8));
        projectile.targetVelY = -6656;
        projectile.accelY = 1128;
        projectile.maxVelY = px(15);
        break;
      }
      case 15: {
        if (this.magazineAmmo <= 0) {
          if (this.actionId === 5) {
            this.setFrame(0x1e | this.facingFlag);
            return;
          }
          this.setFrame(0x1d | this.facingFlag);
          return;
        }
        let muzzleOffsetX = !this.facingLeft ? 40 : -40;
        projectile = this.screen.spawnProjectile(ActorType.GrenadeProjectile, 0 | this.facingFlag, 0, this.posX + (muzzleOffsetX = muzzleOffsetX << 10), this.posY - px(18), 0);
        if (projectile === null) break;
        --this.magazineAmmo;
        if (this.actionId === 5) {
          projectile.posY += px(4);
          this.setFrame(9 | this.facingFlag);
        } else {
          this.setFrame(6 | this.facingFlag);
        }
        if (this.screen.levelIndex !== 4 && projectile.advanceAndCollide(this.facingLeft)) {
          this.screen.spawnProjectile(ActorType.ExplosionEffect, 0, 0, projectile.posX, projectile.posY, 0);
          projectile.deactivate();
          break;
        }
        projectile.computeHomingTrajectory();
      }
    }
    projectile = null;
    void projectile;
  }

  /**
   * 受击扣血。对应 CFR `e(int)` → 契约 e_I。
   * @param n 伤害值（如普通弹 1、火箭 3）。
   * 仅 Playing 态且未处于翻滚/被捕/死亡动作且无敌计时结束（invulnTimer<=0）时生效：
   * 扣血、重置帧计时、给 5 帧无敌、清梯子态、切受击帧 0x17（非关卡4 同时刹横移）。
   * 由 onProjectileHit() 等命中逻辑调用。
   */
  // e(int) → e_I（受击：扣血并进入受击动作）
  takeDamage(damage: number): void {
    if (this.screen.state !== GameState.Playing) {
      return;
    }
    if (this.actionId === 13 || this.actionId === 19 || this.actionId === 15 || this.actionId === 16 || this.invulnTimer > 0) {
      return;
    }
    this.health -= damage;
    this.frameTimer = 0;
    this.invulnTimer = 5;
    this.stateFlags &= 0xffffdfff;
    this.setFrame(0x17 | this.facingFlag);
    if (this.screen.levelIndex !== 4) {
      this.targetVelX = 0;
    }
  }

  /**
   * 攀爬/翻越检测（SYMBOLS: checkClimbable）。对应 CFR `g(tjge.b)` → 契约 g_Tb。
   * @param tileMap 当前关卡瓦片地图。
   * 扫描朝向前方一列瓦片，按命中高度把攀爬类型写入 climbResult（n：0=无,1/2/3/4=不同高度档），
   * 并记录落点 climbTargetX/Y（S/T）。返回是否可攀爬。供动作状态机与输入逻辑判定能否翻越/上爬。
   */
  // g(tjge.b) → g_Tb（爬升/攀爬检测，结果写入 n/S/T）
  checkClimbable(tileMap: TileMap): boolean {
    // 扫描列自上(-56)而下(-3)找可攀爬瓦片；scanTileX 由像素X±16(朝向)右移得列。
    const topRow = (((this.posY + this.velY) >> 10) + -56) >> 4;
    const bottomRow = (((this.posY + this.velY) >> 10) - 3) >> 4;
    const scanPixelX = ((this.posX + this.velX) >> 10) + (this.facingLeft ? -16 : 16);
    const scanTileX = scanPixelX >> 4;
    let row = topRow;
    while (row <= bottomRow) {
      const tileValue = tileMap.queryColumnTileAt(scanTileX, row, true);
      if (tileValue === 1) {
        if (row < topRow + 1) {
          this.climbResult = 4;
          return true;
        }
        if (row < topRow + 2 || row < topRow + 3) {
          this.climbTargetX = this.facingLeft ? ((scanTileX << 4) + 16) << 10 : scanTileX << 14;
          this.climbTargetY = row << 14;
          this.climbResult = row === topRow + 1 ? 3 : 2;
          return true;
        }
        if (row < topRow + 4) {
          this.climbResult = 1;
          return true;
        }
      }
      ++row;
    }
    this.climbResult = 0;
    return false;
  }

  // o() → o_（关卡 x==4 特殊载具/场景下的输入处理）
  private handleVehicleInput(): void {
    if (this.screen.heldKeyAction === 1) {
      if (!this.facingLeft) {
        this.setFrame(this.actionId | MIRROR_FLAG);
        return;
      }
      this.targetVelX = 0;
      return;
    }
    if (this.screen.heldKeyAction === 2) {
      if (this.facingLeft) {
        this.setFrame(this.actionId);
        return;
      }
      this.targetVelX = px(16);
      return;
    }
    if (this.screen.heldKeyAction === 4) {
      if (this.actionId !== 0) {
        this.setFrame(0 | this.facingFlag);
        return;
      }
    } else if (this.screen.heldKeyAction === 8) {
      if (this.actionId !== 5) {
        this.setFrame(5 | this.facingFlag);
        return;
      }
    } else {
      if (this.screen.heldKeyAction === 16) {
        if (this.inputHoldCount === 0) {
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
        this.screen.heldKeyAction &= 0xffffffef;
        return;
      }
      if (this.screen.heldKeyAction === 32) {
        if (this.inputHoldCount > 1) {
          switch (this.weaponIndex) {
            case 0: {
              if (this.ammoReserveB !== 0 || this.ammoReserveC !== 0) break;
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
      } else if (this.screen.heldKeyAction === 2048) {
        if (this.inputHoldCount > 1) {
          this.switchOrReloadWeapon(2048);
          this.inputHoldCount = 0;
          return;
        }
      } else if (this.screen.heldKeyAction === 1024) {
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

  // a(tjge.b,int) → a_TbI（向左侧地形碰撞，probeMargin=探测偏移；==100 表示忽略 E 方向限制）
  checkWallLeft(tileMap: TileMap, probeMargin: number): boolean {
    if (probeMargin !== 100) {
      if (this.velX > 0) {
        return false;
      }
    } else {
      probeMargin = 0;
    }
    // n2：碰撞箱上沿相对像素Y的偏移，梯子态(0x2000)固定为 -20（对应 CFR z 字段）
    let boxTopOffset = this.boundsTop;
    if ((this.stateFlags & 0x2000) !== 0) {
      boxTopOffset = -20;
    }
    // 拆 CFR 的 n3 双义：先是像素Y（算行范围），循环内复用为瓦片值。
    const pixelY = (this.posY + this.velY) >> 10;
    const wallTileX = (((this.posX + this.velX) >> 10) + -9 - probeMargin) >> 4;
    const topRow = (pixelY + boxTopOffset - 2) >> 4;
    const bottomRow = (pixelY - 10) >> 4;
    let row = topRow;
    while (row <= bottomRow) {
      let tileValue = tileMap.queryColumnTileAt(wallTileX, row, true);
      if (tileValue === 1) {
        tileValue = tileMap.queryColumnTileAt(wallTileX + 1, row, true);
        if (tileValue !== 1) {
          this.targetVelX = 0;
          this.posX &= 0xfffffc00;
          this.velX = (((wallTileX << 4) + 25) << 10) - this.posX;
        }
        return true;
      }
      ++row;
    }
    return false;
  }

  // b(tjge.b,int) → b_TbI（向右侧地形碰撞，probeMargin=探测偏移；==100 表示忽略 E 方向限制）
  checkWallRight(tileMap: TileMap, probeMargin: number): boolean {
    if (probeMargin !== 100) {
      if (this.velX < 0) {
        return false;
      }
    } else {
      probeMargin = 0;
    }
    // n2：碰撞箱上沿相对像素Y的偏移，梯子态(0x2000)固定为 -20（对应 CFR z 字段）
    let boxTopOffset = this.boundsTop;
    if ((this.stateFlags & 0x2000) !== 0) {
      boxTopOffset = -20;
    }
    // 拆 CFR 的 n3 双义：先是像素Y（算行范围），循环内复用为瓦片值。
    const pixelY = (this.posY + this.velY) >> 10;
    const wallTileX = (((this.posX + this.velX) >> 10) + 9 + probeMargin) >> 4;
    const topRow = (pixelY + boxTopOffset - 2) >> 4;
    const bottomRow = (pixelY - 10) >> 4;
    let row = topRow;
    while (row <= bottomRow) {
      let tileValue = tileMap.queryColumnTileAt(wallTileX, row, true);
      if (tileValue === 1) {
        tileValue = tileMap.queryColumnTileAt(wallTileX - 1, row, true);
        if (tileValue !== 1) {
          this.targetVelX = 0;
          this.posX &= 0xfffffc00;
          this.velX = (((wallTileX << 4) - 10) << 10) - this.posX;
        }
        return true;
      }
      ++row;
    }
    return false;
  }

  /**
   * 被投射物命中处理（覆写基类 onProjectileHit）。对应 CFR `a(tjge.l)` → 契约 a_Tl。
   * @param l2 命中玩家的投射物 ProjectileActor。
   * 非无敌动作时按弹型分派：21=敌方子弹（据弹向修正朝向，命中扣血 1 并回收弹体）、
   * 20=敌方近战判定（生成爆点特效 16、回收弹体、播音效）、16=爆点（扣血 3）。
   * 由 GameScreen 碰撞遍历在弹体击中玩家包围盒时调用。
   */
  // a(tjge.l) → a_Tl（被子弹/拾取物命中处理，覆写基类 a_Tl）
  onProjectileHit(projectile: ProjectileActor): void {
    if (this.actionId !== 19 && this.actionId !== 23 && this.actionId !== 15 && this.actionId !== 16) {
      switch (projectile.typeId) {
        case ActorType.GuidedMissileProjectile: {
          if (this.facingLeft && projectile.targetVelX < 0) {
            this.facingFlag = 0;
            this.facingLeft = false;
          } else if (!this.facingLeft && projectile.targetVelX > 0) {
            this.facingFlag = MIRROR_FLAG; // Integer.MIN_VALUE
            this.facingLeft = true;
          }
          if ((projectile.frameIndex & SEQUENCE_MASK) !== 0) break;
          this.takeDamage(1);
          projectile.deactivate();
          return;
        }
        case ActorType.FallingBombProjectile: {
          const spawnOffsetX = projectile.targetVelX > 0 ? px(8) : px(-8);
          this.screen.spawnProjectile(ActorType.ExplosionEffect, 0, 0, projectile.posX + spawnOffsetX, projectile.posY + px(8), projectile.mode);
          projectile.deactivate();
          GameScreen.playSound(5, 1, 220);
          return;
        }
        case ActorType.ExplosionEffect: {
          this.takeDamage(3);
        }
      }
    }
  }

  /**
   * 切换/换弹（SYMBOLS: switchOrReloadWeapon）。对应 CFR `f(int)` → 契约 f_I。
   * @param n 上下文：32=切换武器（跳过无备弹的武器索引 weaponIndex），其余=换弹判定。
   * 在三把武器（0/1/2）间轮转选出有弹药的一把，命中条件时切换换弹动画帧（蹲姿用 0x1c，站姿用 1）。
   * 备弹 ammoReserveB/C 与当前弹匣 magazineAmmo 由调用方在调用前后更新。
   */
  // f(int) → f_I（换弹/切换武器，triggerAction=触发键 32切换/其余换弹；k=当前武器，l=弹匣，h/i=备弹）
  switchOrReloadWeapon(triggerAction: number): void {
    let resolved = false;
    if (this.weaponIndex > 2) {
      this.weaponIndex = 0;
    }
    while (!resolved) {
      if (this.weaponIndex === 1) {
        if (triggerAction === 32) {
          if (this.ammoReserveB <= 0) {
            this.weaponIndex = 2;
          } else {
            resolved = true;
          }
        } else {
          if (this.magazineAmmo >= 3 || this.ammoReserveB <= 0) break;
          resolved = true;
        }
      }
      if (this.weaponIndex === 2) {
        if (triggerAction === 32) {
          if (this.ammoReserveC === 0) {
            this.weaponIndex = 0;
          } else {
            resolved = true;
          }
        } else {
          if (this.magazineAmmo >= 1 || this.ammoReserveC <= 0) break;
          resolved = true;
        }
      }
      if (this.weaponIndex !== 0) continue;
      if (triggerAction === 32) {
        resolved = true;
        continue;
      }
      if (this.magazineAmmo >= 10) break;
      resolved = true;
    }
    if (resolved) {
      if (this.actionId === 5 || this.actionId === 28) {
        this.setFrame(0x1c | this.facingFlag);
        return;
      }
      this.setFrame(1 | this.facingFlag);
    }
  }

  /**
   * 弹药满装初始化（SYMBOLS: fullAmmoInit）。对应 CFR `m()` → 契约 m_。
   * 复位当前武器为 0，并装满：武器1备弹 ammoReserveB=6、武器2备弹 ammoReserveC=3、
   * 手雷 grenadeCount=3、当前弹匣 magazineAmmo=10。新关/补给时调用。
   */
  // m() → m_（弹药满装初始化）
  fullAmmoInit(): void {
    this.weaponIndex = 0;
    this.ammoReserveB = 6;
    this.ammoReserveC = 3;
    this.grenadeCount = 3;
    this.magazineAmmo = 10;
  }

  /**
   * 换弹补满（SYMBOLS: reloadFromReserve）。对应 CFR `n()` → 契约 n_。
   * 按当前武器把弹匣 magazineAmmo 从备弹池补满：武器0 直接满 10；武器1 上限 3、从 ammoReserveB 取；
   * 武器2 上限 1、从 ammoReserveC 取；备弹不足则取尽并清零。换弹动画结束时由状态机调用。
   */
  // n() → n_（换弹回收：将当前弹匣余弹归还备弹池）
  reloadFromReserve(): void {
    let ammoNeeded = 0;
    void ammoNeeded; // 反编译产物：对应 CFR `int n = 0;` 声明，实值在 case1/2 重算后使用
    if (this.magazineAmmo < 0) {
      this.magazineAmmo = 0;
    }
    switch (this.weaponIndex) {
      case 0: {
        this.magazineAmmo = 10;
        return;
      }
      case 1: {
        ammoNeeded = 3 - this.magazineAmmo;
        if (this.ammoReserveB > ammoNeeded) {
          this.ammoReserveB -= ammoNeeded;
          this.magazineAmmo = 3;
          return;
        }
        this.magazineAmmo += this.ammoReserveB;
        this.ammoReserveB = 0;
        return;
      }
      case 2: {
        ammoNeeded = 1 - this.magazineAmmo;
        if (this.ammoReserveC > ammoNeeded) {
          this.ammoReserveC -= ammoNeeded;
          this.magazineAmmo = 1;
          return;
        }
        this.magazineAmmo += this.ammoReserveC;
        this.ammoReserveC = 0;
      }
    }
  }
}
