# 红魔特种兵 二次开发可读性改造 Backlog（v2）

> 只读盘点产物。v2 在 v1 基础上**补审 6 个"曾因 API 报错漏审"文件**并整合落点：`game1/GameScreen.ts`(2405)、`game1/PlayerActor.ts`(1506)、`game1/ActorBase.ts`(295)、`game1/EnemyActor.ts`(657)、`game1/ProjectileActor.ts`(244)、`game2/GameMIDlet.ts`(272)。结构/优先级/推荐执行顺序均保留 v1，仅做增补与订正。
> 所有 file:line 基于 29+6 份单文件审计 + 抽样对照验证（已确认：`test:shim` 回归脚本存在于根 `package.json:9`；镜像位 `0x80000000` 跨 19+ 个文件；`shim/Graphics.ts:11-27` 已导出 `TOP/LEFT/HCENTER/TRANS_*`；`game1/SpriteAtlas.ts:48-49` 已有 `flipHorizontalBit/flipVerticalBit`；game1 `state` 魔法值经 GameScreen 补审升至 **~70 落点**、game2 `subState` 60+ 落点）。
> **永久对照基准**：`reverse/game{1,2}/2-decompiled-cfr/tjge/*.java`。**回归兜底**：`pnpm test:shim`。**语义来源**：`docs/game{1,2}-*/`、`reverse/*/3-readable/SYMBOLS.md`、`tools/rename-map.game*.json`。

---

## 0. 总览

### 整体可读性评分分布（35 文件，1=天书 / 5=清晰）

> v2 新增 6 文件评分：GameScreen=38/100(≈分档2)、PlayerActor(game1)=4/100(分档1·全仓最低)、EnemyActor(game1)=4/100(分档1)、GameMIDlet(game2)=8/100(分档1)、ActorBase(game1)=62/100(分档3)、ProjectileActor(game1)=62/100(分档3)。**百分制 readabilityScore 与 1-5 分档换算**：<10→1，10-45→2，46-65→3，66-85→4。

| 分档 | 文件数 | 文件 |
|---|---|---|
| **1（天书）** | 3 | **game1/PlayerActor(4)**、**game1/EnemyActor(4)**、**game2/GameMIDlet(8)** |
| **2（严重）** | 10 | game2/LevelScene、game2/PlayerActor、game2/GameCanvas、game2/BossActor、game2/TileMap、game2/ProjectileActor、game1/BossActor、game1/EffectActor、game1/LevelLoader、**game1/GameScreen(38)** |
| **3（中等）** | 14 | game1/TileMap、game1/SpriteDef、game1/SpriteAtlas、game1/PickupActor、**game1/ActorBase(62)**、**game1/ProjectileActor(62)**、game2/SpriteDef、game2/ItemActor、game2/EnemyActor、game2/ActorBase、game2/TileSheet、game2/Midi |
| **4（较好）** | 8 | shim/Font、shim/Graphics、shim/Image、shim/Random、shim/Resource、shim/Runtime、shim/Sound、shim/keys、web/main |

**结论**：可读性债务高度集中在两款游戏的 `src/`（评分 1-3 全部在此），j2me-shim 与 web 壳层（评分 4）基本健康、只需补常量与 JSDoc。**补审后最严峻发现**：game1 的 `PlayerActor`(4) 与 `EnemyActor`(4) 是**全仓可读性最差的两个文件**，比此前已知的 game2 同名文件更深——巨型方法 + 标号 break 网 + 多处有意 fall-through + 反编译级局部全员到齐。**核心矛盾**：移植期目标是"逐行对应 CFR + 位级一致"，因此**局部变量名（n2/by3/bArr）、巨型方法（switch 一镜到底）、负数魔法常量（-2147483648）被刻意保留**——这些恰是二次开发的最大阅读障碍。

### 债务热点文件 Top5（按 LOC×低分×反编译局部数加权，v2 重排）

> v1 的 #2 GameScreen 仅占位；v2 补审后它升至 **#1**（LOC 全仓最大 2405 + 状态机宿主 + paint 722 行 + ~140 反编译局部）。game1/PlayerActor 以 score=4 + handleInput 345 行 + 标号 break 网杀入 #3。

| 排名 | 文件 | LOC | 分(/100) | 反编译级局部 | 巨型方法 |
|---|---|---|---|---|---|
| 1 | **game1/GameScreen.ts** | 2405 | 38 | ~140 | paint(722行)/updateCamera(199)/loadLevelStep(145)/renderWorld(91)/drawBriefingScreen(76) |
| 2 | **game2/LevelScene.ts** | 1443 | 2 | 90 | runCutscene(418行)/fireTrigger(102)/loadLevel(92) |
| 3 | **game1/PlayerActor.ts** | 1506 | 4 | 95 | handleInput(345行·CFR'无法结构化')/runActionStateMachine(232)/stepPhysics(136)/collideGround(77) |
| 4 | **game2/PlayerActor.ts** | 1236 | 2 | 120 | handleInput(307行)/runActionStateMachine(162)/probeVault(64) |
| 5 | **game2/GameCanvas.ts** | 1061 | 2 | 60 | paint(426行) |

> 紧随其后（次级热点）：game1/EnemyActor(657, score=4, patrolUpdate 214 行 + 误导名 bossUpdate)、game2/EnemyActor(607, 3)、game1/BossActor、game2/BossActor。

### 关键矛盾：行号忠实 vs 可读

- **故意保留、改了会破保真的东西**（拆方法/改名时必须保住）：
  - case fall-through：game1/EffectActor case9→7、game2/BossActor onHitBy case11→21、game2/PlayerActor case24 落穿；**v2 新增**：game1/GameScreen `case 14→case 10`（paint，CFR a.java:454 GOTO lbl254，"5 sources"验证）、game1/PlayerActor handleInput 两处 fall-through(814 lbl138、868 lbl178) + runActionStateMachine case17 sub0→sub6(452)、game1/EnemyActor patrolUpdate case7 落空 / airUpdate case4 落空 / onProjectileHit case15/20 落穿、game1/ActorBase setFrame L106 自赋值链 `boundsTop=boundsLeft=boundsTop`、game1/ProjectileActor update 三处 fall-through(type15/21 case1、type10 case0 末 deactivate、type16)。
  - 死代码守卫：game2/ProjectileActor `(typeId as number)===6`；**v2 新增**：game1/EnemyActor airUpdate:413 `const n=(this.targetVelX=…)`(删 n 须留赋值副作用)、game1/ProjectileActor update type20 的 n3 死值链(写 targetVelX) / advanceAndCollide:174 `e2=null;void e2`、game1/PlayerActor 多处 `const bl=false;void bl`(81-83…) 与 `void n`(483,1065…前有副作用赋值)、game1/ActorBase spawnAt 形参 byArray/bl 基类不用但子类用(勿删)。
  - `<<24>>24`/`<<16>>16` 的 Java 截断模拟、catch 静默吞异常（docs/06 移植规约）；**v2 新增** game1/GameScreen drawPixels 2387-2397 / fillScreenColor 1896-1897 的 RGB4444 解码位运算、game2/GameMIDlet readShortLE 的 `<<16>>16` short 符号扩展。
  - **break-vs-return 语义差异**（拆方法时不可混淆）：game1/PlayerActor stepPhysics case10 内 `break`(288,293,358)=继续算相机 vs `return`(265,292,295,361)=本帧结束；game1/EnemyActor patrolUpdate 多处 `if(...)break` 跳帧守卫。
- **可安全改造的东西**（行为不变换）：同值抽常量、局部改名、不改逻辑拆方法、收紧类型/补 JSDoc。

---

## P0 —— 零行为变化（枚举/常量/JSDoc，最高 ROI、最低风险）

> 全部为"同值替换 + 注释"，`test:shim` 即可证明位级一致。**这是二次开发动手前应先铺的地基**。

### P0-1 · 镜像/翻转/帧掩码位 → 全局共享位标志常量

- **价值**：`-2147483648` / `0x40000000` / `0xffffff` / `0xff000000` 是全仓最高频、最易误读为"任意大数"的魔法常量，跨 **19+ 个文件**。统一后所有 `setFrame(MIRROR_FLAG | BossFrame.X)` 自解释。
- **风险**：极低（同值，`SpriteAtlas.ts:48-49` 与 `shim` 已有现成常量可复用）。**行为不变换**：是。**工作量**：M（落点多但机械）。
- **建议名 + 来源**：`MIRROR_FLAG=0x80000000`(=Integer.MIN_VALUE，水平镜像/朝左)、`FLIP_VERTICAL_BIT=0x40000000`、`FRAME_INDEX_MASK / SEQUENCE_ID_MASK =0xffffff`(低24位动画序号)、`FRAME_TINT_MASK / FACING_MASK =0xff000000`。来源：`SYMBOLS.md:513-514`、`类清单与职责.md:324`。
- **关键落点**：
  - game1（v1 已列）: `BossActor.ts:86,142,187,199,202,210,213,217,222,238,242 / 109,322` ; `SpriteDef.ts:67-69,95` ; `SpriteAtlas.ts:48-49`(复用源) ; `EffectActor.ts:88,202,216-217,219,238,272,279`。
  - **game1 v2 新增**：
    - `GameScreen.ts`：paintSequenceFrame frame 参数 256-257（`n|INT_MIN` 表朝左）、spawnEnemyWave setFrame 1756、spawnBossAttack 1828、case 15 的 639；`INT_MIN` 常量已定义于 51（缺语义名）；-2147483646 = INT_MIN|2。
    - `PlayerActor.ts`：setFrame(-2147483xxx) 裸字面量 681,691,694,712,722,725,796,850,977,979,981,993,995,997,1391（1391 已有 `// Integer.MIN_VALUE` 注释）；frameIndex 位域 240-241,378,380（`0xff000000` 掩朝向 / `0xffffff` 掩 actionId）。
    - `ActorBase.ts`：setFrame L85(`n&=0xffffff` 取序列ID)、L88/L96(判翻转位)、paint L163/L164(n5/n6 取翻转位)。**建议同源命名 `FrameFlipFlag.FLIP_HORIZONTAL=0x80000000 / FLIP_VERTICAL=0x40000000 / SEQUENCE_MASK=0x00FFFFFF`**。
    - `EnemyActor.ts`：spawnAt 126-127、update 137-138、patrolUpdate 187/252、airUpdate 405-406、bossUpdate 533-534/558、fireProjectile 517（`FACE_LEFT=Integer.MIN_VALUE / FACING_MASK=0xff000000 / ACTION_MASK=0xffffff`）。建议 `type FacingFlag = 0 | -2147483648` + 具名 `FACE_RIGHT/FACE_LEFT` 三处共用。
    - `ProjectileActor.ts`：update `frameIndex & 0xffffff`(剥翻转得逻辑帧)、type10 case1 setFrame(-2147483648)（`FACE_LEFT_FLAG`）。
  - game2（v1 已列）: `BossActor / EnemyActor / PlayerActor / ItemActor / SpriteDef / TileSheet(bit31^bit15 异或) / ActorBase / ProjectileActor`。
- **执行注意**：先在共享模块定义常量（建议 `packages/game{1,2}/src/constants.ts` 或复用 `SpriteAtlas`），各文件 import。**TileSheet 的 `>>31/>>15` 异或语义需保留位运算，仅给 bit 编号命名**。

### P0-2 · 游戏主状态机 GameState/ScreenState → 共享枚举（game1）

- **价值**：`state===1/10/13/19/20/21…` 是跨 `GameMIDlet`/`GameScreen`/各 Actor 的耦合魔法数（**~70 落点**，补审 GameScreen 后翻倍），最易误读、改一处漏一处。引入 const enum 还能让 paint 的 14-way switch 启用穷尽性检查。
- **风险**：低（docs 全 14 态表已确证，逐 case 行号已锚定）。**行为不变换**：是。**工作量**：M。
- **建议名（全量，来源 `docs/game1/游戏状态机.md §1` 已逐 case 确证）**：
  `BOOT_LOGO=1, LOADING=2, ABOUT=3, MAIN_MENU=4, HELP=6, PLAYING=10, PAUSE_MENU=13, LEVEL_ENTRY_ANIM=14, CREDITS=15, MISSION_COMPLETE=16, MISSION_FAILED=18, REACH_END_CUTSCENE=19, CAPTURE_CUTSCENE=20, SCROLL_CUTSCENE=21, BRIEFING=22`。字段名 `state` 已由 `tools/rename-map.game1.json p->state` 提供。
- **关键落点**：
  - 其它文件（v1 已列）：`GameMIDlet.ts:35,38` ; `EffectActor.ts:112,137,138,197,209`(=19/20) ; `BossActor.ts:155`(=19) ; `PickupActor.ts:116`(=21)。
  - **GameScreen.ts（v2 新增，落点最密处，~70 处字面量）**：
    - 字段声明 `state`(line 76)。
    - paint 顶层 `switch(this.state)` 全部 case：1(199)/4(253)/2(380)/22(399)/21(445)/14(485)/10(504)/18(509)/15(583)/16(659)/19(708)/13(773)/3+6(855)/20(884)。
    - 状态转移：keyPressed 1585-1612；keyCodeToAction 守卫 1542,1559,1568,1579；updateCamera 1184,1238-1239,1257,1263,1289；renderWorld 1043；hideNotify 2245。
  - **EnemyActor.ts（v2 新增）**：update:134 `if(state===21)return`、bossUpdate:597 `state=19`。
  - **PlayerActor.ts（v2 新增）**：`GameScreenState` 同枚举子集——stepPhysics switch(screen.state) 260-262,267；handleInput 守卫 636；takeDamage 1164；runActionStateMachine case13/16 写 `state=20`(539,616)。建议引 `IN_LEVEL_PLAY=10` 等。

### P0-3 · 场景子状态机 SubState → 共享枚举（game2）

- **价值**：`subState` 0-6 在 `LevelScene`/`PlayerActor`/`GameCanvas` 裸用 **60+ 次**，状态机全靠 docs 才能读。
- **风险**：低。**行为不变换**：是。**工作量**：M。
- **建议名 + 落点**（来源 `docs/game2/游戏状态机.md §4`）：`NORMAL=0, CUTSCENE=1, TRANSITION_OUT=2, TRANSITION_IN=3, MISSION_DIALOG=4, BATTLE_WAVE=5, BOSS_SCRIPT=6`。
  - `LevelScene.ts:98-99,187-244,834-854` 及 `195-242,368,426,467,483,507,561,576,620,675,687,704,1123,1149` ; `PlayerActor.ts:199,234,262,854` ; `GameCanvas.ts`(UiState 另算，见 P0-4)。

### P0-4 · UI 状态机 UiState + 输入位掩码 InputAction → 枚举（game2）

- **价值**：`paint`/`keyToAction`/`keyPressed` 遍布裸 `3/1/4/10/22…`(状态) 与 `16/32768/16384…`(键位)；memory `key-action-map.md` 已对抗验证全部语义（high 置信）。
- **风险**：低。**行为不变换**：是。**工作量**：M。
- **建议名**（来源 `docs/game2/游戏状态机.md §1` + `主循环与渲染.md §6` + memory）：
  - `UiState`: `SPLASH=3, LOADING=1, MAIN_MENU=4, NO_SAVE=100, LEVEL_LOADING=2, CUTSCENE_INTRO=20, MISSION_BRIEF=22, IN_GAME=10, FAILED=18, CLEAR=16, COMPLETE=21, HELP=6, ABOUT=19`。
    - 落点（v1）：`GameCanvas.ts:50,108,161(switch),591,595,599,603,611,840,900,909-916`。
    - **GameMIDlet.ts（v2 新增）**：pauseApp `uiState===10 → uiState=4`(@65-68)、`inputAction=0`(@66 = `PlayerInputAction.NONE`)。来源 `docs/game2/类清单与职责.md:69` + `SYMBOLS.md:107-108`。
  - `InputAction`: `LEFT=1,RIGHT=2,UP=4,DOWN=8,FIRE=16,CLIMB_UP=32,JUMP_LEFT=64,JUMP_RIGHT=128,GRENADE=1024,RELOAD=2048,SWITCH=4096,SOFT_LEFT=16384,SOFT_RIGHT=32768`。落点：`GameCanvas.ts:833-904(keyToAction)` 及全 paint 读取点。
- **game1 对应（v2 关联，见 GameScreen 专章 §6.2）**：game1 自有一套 `InputAction` 位掩码（`UP=4,DOWN=8,LEFT=1,RIGHT=2,CONFIRM=16,JUMP=32,GRENADE=1024,RELOAD=2048,CLEAR=4096`），落点在 GameScreen.keyCodeToAction(1522-1579) 与 PlayerActor.handleInput——见 P0-5 game1 段与 §6。

### P0-5 · ActorType / ProjectileType / EnemyType → 共享类型 id 枚举（两游戏）

- **价值**：actor 工厂分派 id 在 `createActor`/各 Actor 的 `spawnAt`/`update`/`onHit` switch 中裸用，是理解整个对象系统的钥匙。穷尽 const enum 还能让 switch 暴露遗漏 case（如 game2/EnemyActor 无 case3）。
- **风险**：低。**行为不变换**：是。**工作量**：M（跨多文件，但 docs 工厂表权威）。
- **关键落点 + 来源**：
  - **game1 `ActorTypeId`（v2 新增，来源 `玩法与数值.md §2.4/§3` + `类清单与职责.md` actor 继承表）**：`PLAYER=0, ENEMY_A=1, ENEMY_B=2, PICKUP_PROP=3, EFFECT(4/5/6/7/9/12/19/22), BOSS(8/14/17), PROJECTILE_GUIDED=10, PICKUP_11/13`；spawn-type ids `21(guided)/10(direct)/20(falling-grenade)/15(launcher)/16(barrage)`。
    - `GameScreen.ts`：createActor switch 154-187、spawnProjectile switch 1622-1647、isPickupType 1708-1715、isScrollLevel 2106-2116、loadLevelStep retainSpriteDef 1374-1469、spawnEnemyWave/spawnBossAttack。
  - **game1 `EnemyType`（v2 新增，来源 `玩法与数值.md §5` + `SYMBOLS.md:19/451`）**：`SCOUT=1(侦察兵/远程制导), BOMBER=2(轰炸机/俯冲投弹+近战), SCROLL_CHASER=18(关卡7卷轴追逼兵)`。落点 `EnemyActor.ts` spawnAt:102-113、update:154/165-178、各 update 变体分派。
  - **game1 `EnemyAiState`（v2 新增，来源 `SYMBOLS.md:487` + `玩法与数值.md §5`）**：`PATROL_IDLE=0, TURN_PAUSE=1, PATROL_MOVE=3, DEATH_SETTLE=4, ATTACK=5, KNOCKBACK_RETREAT=7, COMBO_ATTACK=8, SHOT_DOWN_FALL=9, BOSS_RETURN=10, RECOIL=11`。落点 `EnemyActor.ts` 全文 switch(aiState)（patrolUpdate 186/191/231-394、airUpdate 403/437/445/453-497、bossUpdate 529-603、update 139/149/153、onProjectileHit 608/637）。建议 as const + 联合类型。
  - **game1 `EnemyAttackMode`（v2 新增，来源 `SYMBOLS.md:488`）**：`RANGED=0, MELEE_PUSH=1`。落点 `EnemyActor.ts` patrolUpdate:193/290-351。
  - **game1 `ProjectileTypeId`（v2 扩充，来源 `玩法与数值.md §4` + `类清单与职责.md:385/497`）**：`GRENADE_ARC/MISSILE 共用 case 15|21, EXPLOSION=16, BOMB=20, MINE_OR_TIMED=10, DIRECT_10, RIFLE_21`。
    - `ProjectileActor.ts`：update switch(typeId) case 15/21/10/20/16、paint typeId===20、spawnAt typeId===10、spawnProjectile(16,…)(57/116)。另有 `HomingTargetTypeId`(isHomingTarget→{1,2})、`EffectTypeId`(isEffectType→{7,9})、`ProjectileMode`(mode 字段 1=FALLING/2=ARMED_PROXIMITY)。
    - `EnemyActor.ts`：onProjectileHit switch(l2.typeId) 612-632、spawnMeleeHitbox:502(type20)、fireProjectile:517(type21)。
    - `PlayerActor.ts`：fireWeapon(1080,1084,1114,1141,1151)、onProjectileHit case(1386,1399,1406)。
    - 其它（v1）：game1/BossActor 118,194,205,337,360,320-341 / EffectActor 148-153,236-291。
  - **game1 `WeaponIndex`（v2 新增，来源 `玩法与数值.md §3` 武器系统表）**：`PISTOL/RIFLE=0, WEAPON_B=1, WEAPON_C=2`。落点 `GameScreen.ts` renderWorld weaponIndex switch 1049-1061 + HUD drawRect 1063；`PlayerActor.ts` fireWeapon(1077,1102)、handleInput switch(906,923)、switchOrReloadWeapon(1416-1449)、reloadFromReserve(1477-1502)、fullAmmoInit(1463)。建议收紧字段 `weaponIndex: 0|1|2`。
  - **game1 `MenuItem`（v2 新增，来源 `游戏状态机.md §1` 脚注，menuTexts 10 条已解码）**：`NEW_GAME=0, CONTINUE=1, SELECT_TASK=2, SOUND_ON=3, HELP=4, ABOUT=5, QUIT=6, SOUND_OFF=7, RESUME=8, MENU=9`。落点 `GameScreen.ts` case4 menuSelection switch 293-332、case13 792-818、case18 538-548、drawString GameMIDlet.menuTexts[idx] 355,568,570,849。
  - **game1 `ClimbResult`（v2 新增，来源 `SYMBOLS.md` climbResult 行 + CFR f.java g_Tb）**：`NONE=0, LOW=1, FULL_LEDGE=2, MID_LEDGE=3, TOO_HIGH=4`。落点 `PlayerActor.ts` checkClimbable(1198,1204,1209,1214)、runActionStateMachine case3(394,414)/case17(448)、handleInput(802,856)。
  - **game1 `PlayerAction`（v2 新增，actionId = frameIndex & 0xFFFFFF，来源 `玩法与数值.md:52-53` + `SYMBOLS.md`）**：`IDLE/RUN_START=0/2, LAND_RELOAD=1, DASH_LEFT=3, DASH_RIGHT=4, RUN=5, FIRE_*=6-11, ENTER_MENU=13, HIT/HIT_END=15/16, JUMP=17, CLIMB_*=18/24/25/26, LAND_ACTION=19, TRANSITION=20/21, DASH_JUMP=22, DEATH=23, LEDGE_GRAB=27, …`。落点 `PlayerActor.ts` runActionStateMachine 各 case(389-618)、update(382)、handleInput 守卫(641-648,790,844) 及 60+ 处 `actionId===` 比较；`EnemyActor.ts` 引 PlayerActor.actionId 比较(update 139/149/161/145、patrolUpdate 192)。
  - game2（v1 已列）：`ActorType / BossTypeId(11/13/17/19/21) / EnemyTypeId(1-5) / AiSubState / ThreatCode`。
- **建议**：穷尽性 const enum 暴露遗漏 case；game1/EnemyActor 把误导名 `bossUpdate` 一并改为 `scrollChaserUpdate`（见 P1-2）。

### P0-6 · 定点数 FP 体系 → `FP_SHIFT=10` / `FP_ONE=1024` + 派生常量（两游戏）

- **价值**：`<<10/>>10`(像素↔定点)、`<<14`(脚本网格/瓦片→定点)、`>>3`/`<<3`(8px瓦片)、`>>4/<<4`(16px瓦片)、各速度/偏移大数是密度最高的魔法数簇，几乎每个 Actor 都有。
- **风险**：低（来源 `玩法与数值.md` / `主循环与渲染.md` "1024=1px" 已确认）。**行为不变换**：是。**工作量**：L（落点极多，建议分文件渐进）。
- **建议名 + 来源**：`FP_SHIFT=10, FP_ONE=1024, TILE_SHIFT=3/4(按游戏), GRAVITY=4096, DEFAULT_MAX_VEL=15360, WALK_SPEED=8192`…；速度/距离用 `px(n)=n<<10` helper 或具名常量。**同值不同义必须分名**。
- **关键落点**：
  - game1 其它（v1）：`ActorBase.ts:64-65` / `BossActor.ts:174,178,183,196,237…` / `EffectActor.ts:148-153,176,208`。
  - **game1/GameScreen.ts（v2 新增）**：
    - `FIXED_SHIFT(10)/FIXED_ONE(1024)`：initCamera 1107-1133、updateCamera 1138-1141/1264-1265、updateWorld 1004-1005、renderWorld 1015-1016、case 20 902-905、spawn* 等 30+ 处（来源 `主循环与渲染.md:12,151` + `SYMBOLS.md`）。
    - **`SCRIPT_CELL_SHIFT(14)`**（相机脚本触发判定，与渲染 `>>10` 并存，**勿统一**）：updateCamera case0(1149)/case1(1172-1173)/case3(1206-1210)/case6(1247-1248)（来源 `主循环与渲染.md:12,158`，"两套基准并存属确认事实"）。
    - `VIEW_WIDTH_FX=180224(=176<<10)` + 派生 90112(88px)/81920(80px)：viewWidthFx static(57)、updateCamera 1186/1309-1313、case19 752、spawnEnemyWave 1752/1790、spawnAirdropWave 1882-1887（来源 `SYMBOLS.md:110`）。
    - `HUD_BAR_HEIGHT=32`（屏高208-32=可玩176）：constructor playHeight(142)、drawNumber y-32(2140,2151)、renderWorld setClip(0,176,…,32)(1023)（来源 `主循环与渲染.md:11`）。
    - `PIXEL_BUFFER_LEN=3600`：constructor(149)、fillScreenColor/case1/case13 loop(231,777,1899)。
    - `PAUSE_MASK_RGB4444=24603(0x601B)`：case13 pixelBuffer fill(778)。
    - RGB4444 解码 helpers（0xf nibble masks / `<<4|x` / `<<12`）：drawPixels(2387-2397)、fillScreenColor s<<12(1896-1897)、case1(232-234)。
    - **`4096` 三义必须分名**：case22 cameraX=4096(1px 起始偏移,432) vs keyCodeToAction CLEAR=4096(掩码,1547) vs PlayerActor GRAVITY=4096——各自命名勿复用。
    - 帧时刻常量：case1 logo 分帧 12/22/32/42(211,221,229,242)、case22 简报帧上限 70/71(401,406,411) → `BOOT_LOGO_FRAME_* / BRIEFING_FRAME_MAX`。
  - **game1/PlayerActor.ts（v2 新增，来源 `玩法与数值.md:22/24/35-50/52`）**：
    - 物理：`GRAVITY_ACCEL=4096`(151,218,233…)、`JUMP_VEL_UP=10240`、`WALK_SPEED=±8192`、`WALLJUMP_VEL=-15360`(688,719,817,821,871,875,1034)。
    - 攀爬/翻越偏移：`CLIMB_OFFSET_Y=36864 / CLIMB_OFFSET_X=10240 / LEAP_X=12288 / LEDGE_LIFT_Y=25600 / LADDER_STEP_Y=30720`(395-396,415-417,470-472,591,764)。
    - 枪口偏移：`MUZZLE_OFFSET_Y_*`(-20480/-23552/-35840/-18432) / `MUZZLE_OFFSET_X_*`(±25/±35/±40 <<10)(fireWeapon 1078-1090,1114,1140-1141)。
    - 弹药/伤害：`INVULN_FRAMES=5`(1172)、`DMG_BULLET=1`(1395)/`DMG_EXPLOSION=3`(1407)、`INIT_AMMO_*`/`MAG_CAP_*`(fullAmmoInit 1464-1467、reloadFromReserve 1479/1483/1494)。
    - 相机推进：`CAMERA_FOLLOW_*`(14336/-4096/8192) / 边距 20480/10240(stepPhysics 276,300,366,369,371,289,294,353,359)。
    - 状态位：`STATE_GROUNDED=bit0`(清位 0xfffffffe/-2)、`STATE_CLIMBING=0x2000=8192`(**0x2000 与 8192 混写须统一**，清位 0xffffdfff/-8193)——见 P0-7 收口。
  - **game1/ActorBase.ts（v2 新增，来源 `玩法与数值.md:22/24/31`）**：`GRAVITY_ACCEL_FX=4096`(collideCeiling L289)、`DEFAULT_SPEED_CAP_FX=12288`(spawnAt L72/73)、`FIXED_POINT_FRACTION_CLEAR_MASK=0xfffffc00(-1024)`(collideLeftWall L219/collideRightWall L246)、`TILE_PX_MAX=15`(L220,L288)。**`collideCeiling` 用合并 `>>14`(=10+4) 而其它 collide* 用分步 `>>10`再`>>4`——刻意差异，须注释勿统一**（`主循环与渲染.md:158`）。
  - **game1/EnemyActor.ts（v2 新增，来源 `玩法与数值.md §5` 已解码）**：`PX(40)=40960 / PX(80)=81920`(攻击竖直窗口)、`MELEE_RANGE_X=30720 / MELEE_RANGE_Y=10240`、`RANGED_TRIGGER_X=143360(140px,已局部命名 n)`、`KNOCKBACK_DX=8192`、`PATROL_SPEED=3072 / RETREAT_SPEED=4096 / CHASER_PATROL_SPEED=2560`、`PROJECTILE_PUSH_VX=12288`、`PROJECTILE_SPAWN_DX=29696`、`AIR_DRIFT_PERIOD=60 / AIR_DRIFT_VX_HI=9216 / VX_LO=7168`、`CHASER_SENSE_X=131072(128px) / GROUND_DROP=71680 / VERT_WINDOW=61440 / OFFSCREEN_MARGIN=20480 / WAVE_SPAWN_Y=327680`、冷却 `COOLDOWN_NO_HP=15 / COOLDOWN_HP=12`、音量 `SFX_VOL_200/220`。**陷阱：fireProjectile 入参 n(14/28/32) 是 Y 偏移瓦数(n<<10) 非子弹 type**（`玩法与数值.md §5` 专门警示，签名处加注）。
  - **game1/ProjectileActor.ts（v2 新增）**：`PROJECTILE_MAX_RANGE_FX=204800(200px)`(update type15/21)、`BOSS_LEVEL_BOMB_GROUND_OFFSET_FX=30720`(type20)、`HOMING_TARGET_AIM_HEIGHT_FX=20480 / HOMING_Y_DEADBAND_FX=10240 / HOMING_HORIZONTAL_ACCEL_FX=12288`(computeHomingTrajectory)、`LAUNCH_MIN_HORIZONTAL_DIST_FX=40960 / LAUNCH_DIST_PER_FRAME_FX=5120`(launchArc)。**`15360` 两处不同义须拆**：`HOMING_Y_TARGET_BIAS_FX`(computeHomingTrajectory) vs `LAUNCH_VY_CAP_FX`(launchArc)。`LevelIndex.BOSS_DEMO_LEVEL=4`(world.levelIndex 比较)。`SoundId.EXPLOSION=5`(playSound(5,1,220))。
  - game2（v1）：`ActorBase.ts:97-98,190-191,239-254,263-266,317-328,388` / `PlayerActor` / `BossActor` / `EnemyActor` 全身。

### P0-7 · 字节/截断/无符号还原 + 状态位写法统一 → 具名 helper / 取反式（j2me-shim + 两游戏）

- **价值**：`if(v<0)v+=256`、`(x<<16)>>16`、`(x<<24)>>24`、`(x+256)<<16>>16` 在十几处逐字重复；**v2 新增**：game1/PlayerActor 的状态位清位用补码十进制(-2/-5/-17/-33/-1025/-2049/-8193) 与十六进制(0xfffffffe/0xffffdfff/0xfffffc00) 混写、`0x2000` 与 `8192` 同义混用，是位掩码歧义重灾区。
- **风险**：低。**行为不变换**：是（helper 内保留原位运算）。**工作量**：S-M。
- **建议**：
  - `toUnsignedByte(x)` / `toInt16(x)` / `toSignedByte(x)`，JSDoc 标"等价 Java (short)/(byte) 强转"。
  - **状态位取反式**：把 `stateFlags &= -8193 / 0xffffdfff` 统一为 `stateFlags &= ~STATE_CLIMBING`；`0x2000` 与 `8192` 全部替换为单一具名 `STATE_CLIMBING`；bit0 替换为 `STATE_GROUNDED`（清位 `&= ~STATE_GROUNDED`）。
- **关键落点**：
  - 字节截断（v1）：game1 `GameMIDlet.ts:62-64,82` / `TileMap.ts:103-104,119-120,313-314,346-349,380-381` / `SpriteDef.ts:79,83,166-169,199-202` ; game2 `TileMap / TileSheet / SpriteDef` ; shim `Resource.ts:26,38,44` / `Sound`。
  - **GameScreen.ts（v2 新增）**：saveData 字节读写 `(x<<24)>>24` @288,693-695；drawPixels/fillScreenColor 的 `(s<<12)<<16>>16` @2382-2397,1896-1897 → 抽 toShort()/toByte()。
  - **PlayerActor.ts（v2 新增·状态位收口重点）**：`STATE_CLIMBING` 落点 199,297,322,330,592,646,654,662,684,696,715,727,743,744,748,759,771,899,1173,1322,1358（0x2000/8192/0xffffdfff/-8193 混写）；`STATE_GROUNDED` 落点 113,137,219,308,313,325,340,406,457,599,671,684,702,733,776,783,985,1001,1007,1012,1032（1/0xfffffffe/-2）；清位补码 696(-8193),840,918(-17),942(-33),951(-2049),961(-1025);定点对齐 98,1336,1372(0xfffffc00)。
  - **game2/GameMIDlet.ts（v2 新增）**：readShortLE 的 `<<16>>16`(short 符号扩展,@100-104)、readIntLE `&0xff` 去符号(@108-117)、readByte 有符号 byte——signedness 易错点，各加一句注释（`docs/04-验证方法-位级一致.md` 关注此类）。
  - **ActorBase.ts（v2 新增）**：collideLeftWall L219/collideRightWall L246 的 `posX &= 0xfffffc00`(已有行内注释，与 FIXED_POINT_SHIFT 同源命名)。
  - shim（v1）：`Resource.ts:26,38,44` / `Sound`（PCM16 常量）。

### P0-8 · J2ME 锚点 / 变换码 → 复用 shim 已导出常量

- **价值**：`drawImage/drawString` 末参裸 `20/17/24/33/36/40`(锚点)与 `transformTable` 裸 `0-7`(变换)，shim 已 export `TOP/LEFT/HCENTER/...` 与 `TRANS_*`（已验证 `Graphics.ts:11-27`）。
- **风险**：极低（值完全一致）。**行为不变换**：是。**工作量**：S。
- **关键落点**：
  - game1（v1）：`TileMap.ts:173,197`(=20)。
  - **GameScreen.ts（v2 新增·锚点最密处，40+ 处）**：`GraphicsAnchor.TOP_LEFT=20 / TOP_HCENTER=17`——每个 drawImage/drawString/drawNumber/paintSequenceFrame 末参：202,205,213,216,224,226,340,355,376,389,393 … 2402（来源 J2ME `Graphics` 常量 TOP=16/LEFT=4/HCENTER=1；`主循环与渲染.md` 记 setClip+drawImage anchor 20）。
  - game2（v1）：`TileMap.ts:202,211,229`(=20) / `TileSheet.ts:49-54,111` / `GameCanvas.ts`(约40处) / `SpriteDef.ts` ; shim `Image.ts:103`(JSDoc 误引 transform，应改指 `TRANS_NONE`)。
- **特别**：`Graphics.ts:20-27` 的 `SpriteTransform` 数值顺序被 `applyTransform` 的 `>= TRANS_ROT90` 隐式依赖——抽 `as const` 联合类型 + `transformSwapsWH()` 谓词消除脆弱顺序耦合。

### P0-9 · 方法级 JSDoc 补全（全仓系统性缺口）

- **价值**：几乎所有文件**类级 JSDoc 优秀**（game1/PlayerActor 1-29、game1/ActorBase 1-20 是全仓标杆），但**方法级 JSDoc 几乎全缺**（仅一行 `// a()→update` 契约注释）。
- **风险**：零。**行为不变换**：是。**工作量**：L（随其他改造顺带补）。
- **最高优先补全点**：
  - 解析入口（v1）：game1 `LevelLoader.loadLevel`、game2 `LevelScene.loadLevel` / `TileMap.load` / 各 `SpriteDef.loadFromBin` / `TileSheet.loadFromBin`（贴 `资源映射.md`）。
  - 数学难点（v1）：game2 `EnemyActor.evaluateThreat` / `launchProjectile` / `BossActor.aimProjectile` / `PlayerActor.probeVault`。
  - 字节布局（v1）：所有 `spawnAt/spawnFromBytes` 的 `byArray[i]` 各下标语义。
  - **v2 新增高优先**：
    - **GameScreen.ts**：14 个 paint case 各补一行 JSDoc（尤其 **case14→case10 fall-through 必须改成醒目 `@fallthrough` 警告**，line 499 现仅有微弱注释；case20 自然 switch-exit）；updateCamera 0-7 各级相机脚本（引 `主循环与渲染.md:158` 的 `>>14` 触发格）；case1(12/22/32/42)/case22(70) 帧时刻常量；keyCodeToAction 引 `游戏状态机.md §4.2` 掩码表；drawNumber/drawBriefingAnim/drawTextLine 参数(n2-n9)；`painting` 重入守卫(331,816,914)语义；saveData[0/1/2]=[maxLevel,currentLevel,soundOn] 与 `(x<<24)>>24` 字节转换。
    - **PlayerActor.ts**：handleInput/runActionStateMachine 的 block88-95 标号网与 fall-through 跳转图；collideGround/checkWall*/checkClimbable 的子像素吸附阈(4/6/7/9/25)几何含义（16px 瓦片内子像素）；fireWeapon 枪口偏移回链 `玩法与数值.md:70`；climbAnimState 18→24→25→26→18 轮转语义落到 case18；字段声明(39-67)逐字段 `/** */` 下沉类头别名表。
    - **EnemyActor.ts**：patrolUpdate/airUpdate/`bossUpdate(实为关卡7追逼兵)` 各补方法级 JSDoc（敌人类型+分派条件，消除最大误导名）；aiState 取值内联；定点值单位注释；airUpdate:413 死局部标"反编译产物·删 n 留赋值"；fireProjectile 入参 n="Y偏移瓦数非子弹type"陷阱注。
    - **ProjectileActor.ts**：8 个方法全缺 JSDoc——update 总纲(扫描→守卫→按 typeId 推进+各 case fall-through)、computeHomingTrajectory(type21 追踪算法)、advanceAndCollide(bl)/launchArc(n) 的形参朝向语义、spawnAt byArray 三槽、paint type20 frameCounter<2 隐身意图；7 个弹型字段(launchOriginX/lifeTimer/armingDelay/loopFrames/subType/mode/frameCounter)行内注释。
    - **ActorBase.ts**：setFrame(frameIndex 位域 + orientation===270 碰撞箱交换 + L106 自赋值陷阱)、stepPhysics(L136-138 负加速"抬升到 maxVelX"反直觉守卫非 bug)、4 个 collide*(返回 1=SOLID + collideCeiling >>14 刻意差异)、spawnAt(params/flag 基类不用但子类用·勿删)、paint(两处出屏 early-return + short 截断)。引 `SYMBOLS.md:399-417` + g.java 行号。
    - **GameMIDlet.ts(game2)**：accessSaveRecord 0读/1写/2清头两字节模式；saveRecord 5 字节布局([0]关/[1]继续数/[2]声音/[3]进度/[4]储备弹，`玩法与数值.md:281-285`)；playSound `_n2` 死参"保留匹配原签名"；readEntryBytes "读 n+1 条 offset 求长度依赖 bin EOF 哨兵"(`01-bin资源格式.md`)；tickSoundTimeout soundTimeout=2→<0 释放时序；readShortLE/readByte 有符号语义。
  - 公共 API（v1）：shim 各文件 getter/工厂、`spawnProjectile` 6 参语义。

---

## P1 —— 行为不变换的结构改造（局部改名 + 不改逻辑拆方法）

> 有 `test:shim` 兜底但触碰代码结构，风险中等。**先做 P0 让常量到位，再拆方法可读性更高**。

### P1-1 · 反编译级局部变量改名（按热点文件优先）

- **价值**：补审后全仓反编译级局部升至 **700+** 个 `n2/n3/by3/bArr/s2/k2`。**纯改名、零逻辑、`test:shim` 全覆盖**。
- **风险**：低-中（易漏，需逐方法回归）。**行为不变换**：是。**工作量**：L。
- **优先顺序（按反编译局部密度，v2 重排）**：
  1. **game1/GameScreen(~140)** — updateWorld(n/n2/n3/n4/n5/nArray/gfg/en，n2/n3 跨 5 循环复用)、renderWorld(n5 同时表 ammo-value 与 digit、n 持 4 义)、paint case15(var5_10..var10_20 信用滚动 6 个编号局部)、updateCamera(n2..n13,n12b boss 散射数学)、spawnEnemyWave(n7/n8/n10/n11)、drawNumber(n4..n9 数位提取)、keyCodeToAction(n2=action mask)、drawBriefingScreen(n2..n5)。
  2. **game1/PlayerActor(95)** — checkWallLeft/Right 的 **n3 三重语义复用(boundsTop调整→像素Y→tile值，最危险)**、collideGround(n=tileY/n2=左下tileX/n3=右下tileX/bl3,bl4=左右命中)、checkClimbable(三个废 bl false 局部 + n/n2/n3/n4/n5)、fireWeapon(l2=projectile,n2/n3/n4=枪口X偏移)、handleInput 多处复用 n。
  3. game2/PlayerActor(120) — `probeVault`(nNN→scanDir/colStart/hitHeight)、`handleInput`/collide* 瓦片坐标、形参 `h2→other,e2→item,k2→projectile`。
  4. game2/LevelScene(90) — `spawnWave`(n3→enemyType,n4→spawnCount,n8/n9→leftCount/rightCount)、`switchCell`(by/by3)、`runTrigger` AABB 倒置赋值。
  5. **game1/EnemyActor(38·重复 `const n` 复用)** — `const n=143360/327680`(140px阈/波次Y/死局部)分别命名 RANGED_TRIGGER_X/WAVE_SPAWN_Y；`l2`→projectile/spawned；fireProjectile 形参 n→muzzleYTiles、n2→spawnDx；spawnAt 形参 n/n2/n3/byArray/bl；paint 形参 n/n2→屏幕x/y。
  6. game2/TileMap(60)/GameCanvas(60) — `sampleCollision`(n/n2 原地复算覆盖)、`renderViewport`(n5-n16)、`drawTypesetText`(n3-n11)。
  7. game1/TileMap(62)/SpriteDef(22)/SpriteAtlas(22) — `drawViewport`(n5-n14→tileLeft/Top/srcX…)、`paintSequenceFrame`(删冗余副本 by3/by4)。
  8. **game1/ActorBase(45)** — intersectsActor(n..n8→thisLeft/Right/Top/Bottom+otherLeft..)、paint(s/s2/s3/s4→drawLeft/Right/Top/Bottom)、collide* 循环复用 n(Y像素+tile值拆两个)、形参 spawnAt(frameIndex,tileX,tileY,params,flag)/构造器(typeId,spriteDef)/intersectsActor(other)/onProjectileHit(projectile)/collide*(tileMap)/setFrame(frameIndex)（`SYMBOLS.md:406` 已给）。
  9. **game1/ProjectileActor(22)** — computeHomingTrajectory(n/n2/n3/n4/n5→horizDist/yBias/targetAimY/bestYDist/loopIdx)、advanceAndCollide(n2..n7→tileColX/tileColAdj/pixelRowY/tileRowTop/tileRowBottom/rowIdx + e2→hitEffect)、launchArc(n2..n7→launchVy/dist/frames/halfFrames/triSum/accel/loopIdx)、update(n2→logicalFrame,n3→死值,f2→player)。**改名须对照 CFR l.java 保证 `n4/=n`、`n4=n4/n` 副作用语义等价**。
  10. game2/EnemyActor(38)/BossActor(34)/ProjectileActor(14)、game1/BossActor(18)、game2/GameMIDlet(24，readIntLE/readShortLE/openEntryStream/readEntryBytes 的 n/n2..n5/byArray/cArray→startOffset/byteCount/entryCount/result/i/entryBytes)。
- **顺带删除赋值后未用的死局部**：game1/BossActor `n3(136)`,`bl2(68)` ; game2/ProjectileActor `bl(82)` ; game2/LevelScene `void n12(409)` ; **v2 新增** game1/EnemyActor airUpdate `n(413)`(留赋值) ; game1/ProjectileActor advanceAndCollide `e2(174-175)` ; game1/PlayerActor `bl/bl2(81-83)`+`void bl`(182-184,1182-1184,1319,1357)、`void n`(483,1065,1158,1472，**前置赋值有副作用须留**)。

### P1-2 · 拆解巨型 switch 方法（按 typeId/state 分派）

- **价值**：单方法 76-722 行、三重嵌套 switch、圈复杂度极高，是二次开发改单一 Actor 行为时的最大障碍。
- **风险**：中（必须保住 fall-through 与读写顺序，逐段对照 CFR + `test:shim`）。**行为不变换**：是。**工作量**：L。
- **拆解清单（含必须保住的 fall-through，v2 大幅扩充）**：

  | 文件 | 方法 | 行 | 拆法与必保点 |
  |---|---|---|---|
  | **game1/GameScreen** | **paint** | **722 (194-915)** | **见专章 §3**——按 14 个 state 各抽 `paintBootLogo/paintMainMenu/…`；**必保 case14 落入 case10（CFR a.java:454 lbl254"5 sources"，extracted paintEntryAnim 后仍须跑 updateWorld+renderWorld，勿加 early return）**；case20 自然 switch-exit 保留；外层 try/catch(913)+painting=false(914) 留给宿主，提取方法不得自持该 flag |
  | **game1/GameScreen** | **updateCamera** | **199 (1137-1335)** | switch(levelIndex)0-7 各级相机脚本(1147-1304)+共享 clamp(1305-1334)，抽 cameraScriptLevel0..7 + clampCameraToBounds()；**必保 cases 2/4/7 early return(1202,1244,1302) 跳过共享 clamp**；isCutsceneEntry 顶部短路(1143-1146)；case7 嵌 state10/19 vs 21 |
  | **game1/GameScreen** | renderWorld | 91 (1013-1103) | 顺序 HUD 合成：drawHealthBar/drawGrenadeIcon/drawIndicator/drawWeaponBoxAndAmmo/drawReloadIcon/drawRainSnowParticles；**先命名 n/n5/n6/n7 再拆**(n5 既 ammo 又 digit) |
  | **game1/GameScreen** | loadLevelStep | 145 (1347-1491) | switch(stateTimer)0-9 增量加载器，已 step 化；可选抽 loadStep3..8；case8 嵌 switch(levelIndex)（低优先）|
  | **game1/GameScreen** | drawBriefingScreen | 76 (2027-2102) | switch(levelIndex) 设 n2-n5 + 共享 draw；**主需求是命名 n2-n5**，保结构 |
  | **game1/PlayerActor** | **handleInput** | **345 (627-971)** | **最大债务·CFR 注"无法完全结构化"**。可拆 handleLeftPress(670-700)/handleRightPress(701-731)/handleUpPress(732-755)/handleDownPress(756-789)/handleClingLeft(790-841)/handleClingRight(844-896)/handleFireSwitchReloadGrenade(898-963)，外层按 heldKeyAction 分派。**必保**：两处 fall-through(814 lbl138/868 lbl178，subState 1/4 落入 case3 起跳)、block89/93 汇合点 `if(stateFlags&8192){accelY=0;targetVelY=0}` 不可内联、派生 64/128 改写(667)须在主分派前；**标号 break 网整体迁移，不可逐个独立提取** |
  | **game1/PlayerActor** | **runActionStateMachine** | **232 (388-619)** | 二级 switch(actionId){switch(subState)}。每顶层 case 抽 stepAction_dash/jump/climbRotate/reload/fireRecover/hit/death，主体退化为 dispatch；climbAnimState 轮转(563-579 18→24→25→26→18)抽 advanceClimbFrame()。**必保 case17 sub0→sub6 fall-through(452)、case3 sub4/case4 隐式 break 缺失靠 return 收尾(424,440,478,490)** |
  | **game1/PlayerActor** | stepPhysics | 136 (239-374) | 覆写基类物理。可拆 integrateVelocityWithCaps(244-259)/stepVehicleLevel(关卡4,270-296)/stepNormalLevel(297-336)/applyCameraFollow(363-371)。**必保 case10 内 break(288,293,358)=继续算相机 vs return(265,292,295,361)=本帧结束，语义不可混淆** |
  | **game1/PlayerActor** | collideGround | 77 (77-153) | facingFlag!=0/==0 两镜像分支(102-150)抽 resolveSlopeStep(side) 消重；**镜像内 magic 偏移(7/9/25/16/+4/+6,106,116,130,140)逐分支保留**；顶部 bl/bl2=false+void(81-83) 死代码可删 |
  | **game1/EnemyActor** | **patrolUpdate** | **214 (182-395)** | 拆 (1)过场冷却早退(183-185)(2)重瞄翻向(186-190)(3)攻击触发判定(191-230)(4)大 switch(aiState)(231-394)。**必保 case5/8 共享体末尾统一 return(352)、case7(386-393)无 break/return 有意落空、多处 if(...)break 跳帧守卫(233/235/256/271/277/355/374/379)** |
  | **game1/EnemyActor** | airUpdate | 101 (398-498) | 拆 trail/state0/出屏销毁/压顶落地/撞近战盒/switch(aiState)。**必保 case4(493-496)无 return 有意落空、413 死局部 n(留 targetVelX 赋值)** |
  | **game1/EnemyActor** | **bossUpdate→scrollChaserUpdate** | **77 (528-604)** | **强误导名·实为 q=18 关卡7卷轴追逼兵非 Boss(docs 已订正)，建议改名 scrollChaserUpdate + 补 JSDoc**。拆索敌/switch(aiState)；**必保 case4/9 共享体(591-602)两 if(...)break + 早 return** |
  | **game1/EnemyActor** | onProjectileHit | 42 (607-648) | switch(typeId) 各 case 抽小方法；**必保 case21 if(...)break 提前退(613-619)、case15/20 末尾无 break 落穿方法尾(626-632，需注释标"有意")** |
  | **game1/EnemyActor** | update | 47 (133-179) | 拆 state21 早退/帧拆朝向动作/玩家终点撞击/knockback/switch(typeId)。case18(175-177)落空(安全) |
  | **game1/ProjectileActor** | update | 97 (33-129) | 按弹型拆 updateGrenadeOrMissile/updateMineTimed/updateBomb/updateExplosion，外层留扫描+active 守卫+switch。**必保 3 处 fall-through(type15/21 case1 69-72、type10 case0 末 deactivate 95-103、type16 124-127)、type20 n3 死值链(写 targetVelX)、65-67"出视野销毁"在 case0 内但在 if(levelIndex!==4)外·勿误并入** |
  | **game1/ProjectileActor** | computeHomingTrajectory | 25 (138-162) | 拆 findNearestHomingTarget+applyHomingVelocity；**161 行 n4 三元再赋值是 CFR `n4/=n` 副作用，须等价保留** |
  | **game1/ProjectileActor** | advanceAndCollide | 26 (164-189) | 拆 hitsEffectActor+hitsTileColumn；e2=null;void e2 死代码守卫(174-175) |
  | **game1/ActorBase** | setFrame | 32 (83-114) | 拆越界校验(85-87,用 `>` 非 `>=`)/读碰撞箱(88-102)/orientation===270 交换(103-110)；**必保 L106 自赋值链(右侧先求值,boundsTop 不变)，勿化简为对称 swap** |
  | **game1/ActorBase** | paint | 31 (156-186) | 拆相机相对坐标/水平视锥剔除(含 172 出屏 return)/垂直视锥剔除(含 182 出屏 return)；**两 early-return 顺序方向不可换，short 截断 `((-x)<<16)>>16` 连带保留** |
  | **game1/ActorBase** | stepPhysics | 21 (128-148) | 抽 clampToward(vel,accel,cap) 复用 X/Y；**必保 L136-138 负加速"抬到 maxVelX"非对称比较(maxVelX 此处当下限)·非 bug** |
  | game2/GameCanvas | paint | 426 | 按 UiState 每 case 抽 paintSplash/paintMainMenu/...，外壳退化分派 |
  | game2/LevelScene | runCutscene | 418 | 按 cutsceneState[0] 拆 7 剧情方法；case5 再按 [1] 子拆；抽 setupThrowQueue |
  | game2/PlayerActor | handleInput | 307 | 按输入掩码每键一方法 |
  | game2/PlayerActor | runActionStateMachine | 162 | 按动作族拆叶子（**保 case24→8 落穿**）|
  | game2/BossActor | update | 294 | 按 typeId 拆 5 方法，type19 再拆 |
  | game1/BossActor | update | 207 | 按 typeId 拆 3 方法 + phase 0-3 子步 |
  | game1/EffectActor | update | 137 | 按 typeId 拆（**保 case9→7 落穿**，补 `// falls through`）|
  | game2/EnemyActor | updateWalkerAi | 146 | 拆 handleIdle/handleFire/handleHit…（**保 onHitBy case11→21 落穿**）|

> **game2/GameMIDlet** 审计无巨型方法（giantMethods 空），P1-2 不涉及；其债务集中在 P0-4/P0-7/P0-9 与 P2-1。createActor(GameScreen 153-189) 是干净 type-id 分派，**不拆**，仅以 ActorTypeId 枚举背书。

### P1-3 · 消除重复逻辑块（提取共用私有方法）

- **价值**：同一算法逐字重复是维护负担（改一处忘另一处）。
- **风险**：中。**行为不变换**：是。**工作量**：M。
- **关键重复块**：
  - game1/TileMap（v1）：`queryColumnTileAt(98-108)`↔`clearTileAt(375-385)` RLE 展开 → 抽 `rleScanToCell`；`loadFromBin(300-321)`↔`reloadColumnData(337-354)` → 抽 `readOneRleRow`。
  - game2/TileMap（v1）：`renderViewport` 拆 `computeAlignedBounds/reconcileScroll/blitWrapped`；`load` 拆 `loadGrid/loadTilesetAndCollision`。
  - game2/TileSheet（v1）：`loadFromBin(129-144)`↔`a_PaletteFrames(202-216)` → 抽 `parseSheetHeader`。
  - game1/PickupActor（v1）：3 处拾取尾部三连 → 抽 `markPickedUp()`。
  - 通用（v1）：4 处 VLQ 读取（shim/Midi）→ `readVariableLengthQuantity`。
  - **v2 新增**：
    - game1/ActorBase：collideLeftWall/collideRightWall 镜像（仅左右偏移符号不同）+ collideGround/collideCeiling 共享 `>>4` tile 取列 → 评估抽公共瓦片探测 helper（保 collideCeiling 的 `>>14` 刻意差异）。
    - game1/PlayerActor：collideGround 左右镜像 → resolveSlopeStep(side)（见 P1-2）。
    - game2/GameMIDlet：loadSounds:140 的 `new Uint8Array(bytes.buffer,...)` 重复样板 → 抽 `toUint8(int8)`（非 hack 级，低优先）。

---

## P2 —— 收紧类型 / 封装 / 消除访问 hack（更高风险，按需）

> 部分会改类型签名或封装边界，可能牵动多文件、偏离"位级忠实"，二次开发**确需时**再做。

### P2-1 · 消除 `as unknown as` / 双重断言类型擦除（docs/06 静默崩溃同源）

- **价值**：擦除点会吞掉成员改名/类型漂移，是未来重构盲区。
- **风险**：中-高（改字段类型牵动调用方）。**行为不变换**：基本是（仅类型）。**工作量**：M。
- **关键落点**：
  - game2/LevelScene `pkg()` 结构视图（60-62 + 全文）→ ActorBase 提供包内只读访问器。
  - game2/EnemyActor `activeActors[by] as unknown as BossActor (134)` → `getVehicleAt(by):BossActor|null`。
  - 各 `dispose()` 的 `null as unknown as T`（game1/TileMap:267-268、SpriteDef:102-124、LevelLoader:216-243 ; game2/LevelScene:1258-1287、TileMap:304-308）→ 字段类型改 `T|null`。
  - shim/Image `ctx as unknown as CanvasRenderingContext2D (20)`、`canvas:any (13,36)` → 联合类型。
  - **v2 新增**：
    - **game1/GameScreen** `as unknown as {...}` 跨类私有访问：updateWorld:935(`activeActors[n] as unknown as {active;typeId}`)、spawnProjectile:1659(`li as unknown as {loopAnimation}`)、spawnEnemyWave:1737(同)→ 引 typed read-only `ActorView` 接口 / internal setter（934 已有注释解释"复现 Java 包内可见"，应编码为类型而非 cast）；releaseLevel:1701 `null as unknown as LevelLoader` → `levelLoader: LevelLoader|null`。
    - **game1/ProjectileActor** advanceAndCollide `as EffectActor` 强制下转(无运行期校验，依赖 isEffectType 守卫) → 补 JSDoc 显式不变量。
    - **game2/GameMIDlet** destroyApp:81 `null as unknown as GameCanvas["mainThread"]` → `GameCanvas.mainThread: Thread|null`（低风险去 hack）。

### P2-2 · 收敛满屏 `!` 非空断言 → 入口一次性守卫

- **价值**：`activeActors[n]!`/`tileMap!`/`minion!` 等散落上百处，掩盖 null 风险。
- **风险**：中。**行为不变换**：是（不改控制流，仅提取局部判空）。**工作量**：M。
- **关键落点**：
  - game2/LevelScene(switchCell/buildDrawList)、game1/LevelLoader(streamScreenTransitionTo)、game1/BossActor(`minion!` 256-266 连续7处)、game2/TileMap(renderViewport 入口加守卫)。
  - **v2 新增**：
    - **game1/GameScreen**：`enemyGrid![][]!`(953-967)、`projectilePools[]![]!`(984-986,1650-1665)、`hudImage!/menuImage!`(202,213,255,1024…)、`spriteDefPool[]!`(256,1379,2080) → 加 `assertLevelLoaded` 窄化助手或 JSDoc 标注状态机不变量。
    - **game1/PlayerActor**：~40 处 `screen.tileMap!`（stepPhysics 298-327、handleInput 全程、runActionStateMachine 393/413/447）→ 在 state===10 分支入口一次性 `const tileMap=this.screen.tileMap; if(!tileMap)return;`；`boss!/linkedBoss!`(279-294) 关卡4 入口断言一次。
    - **game1/EnemyActor**：`tileMap!`(345)、`levelLoader!`(361)、`linkedBoss!`(445，尤危险，PlayerActor.linkedBoss 可 null)、`target!`(字段 55，spawnAt 后才赋值)→ 入口集中守卫或文档化生命周期不变量。
    - **game1/ProjectileActor**：统一 `player!`(computeHomingTrajectory 与他处不一致)的非空策略。

### P2-3 · 收紧封装边界（跨类裸字段直写 → 意图方法）

- **价值**：Actor 直写宿主屏幕/玩家状态，双向耦合，二次开发牵一发动全身。
- **风险**：中（改封装会偏离 CFR 位级，需评估）。**工作量**：M。
- **关键落点**：
  - game1/BossActor(screen 多字段回写:78-81,135-136,155)、`LevelLoader.markActorSpawned()` 替代 `actorSpawned[extra]=true`、game2/ProjectileActor(`player.killByGrenade()` 封装:206-207)、game2/EnemyActor(scene 计数直写:299,302,391)。
  - **v2 新增**：
    - **game1/PlayerActor↔GameScreen 双向耦合**：直接读写 `screen.heldKeyAction(&=-5/-17…)`、`screen.cameraVelX/Y`、`screen.reinforceBudget--`、`screen.state=20`(840,894,918,942,951,961,276,363,539,616) → 引事件/返回值替代直接 mutate（**属行为变换，须 test:shim 守门**）；忠实移植下先加"写回 GameScreen 状态"副作用注释。
    - **game1/EnemyActor→GameScreen**：`screen.killCount++/enemyAliveCount--/state=19/levelLoader.actorSpawned[extra]=true`、代玩家写 `target.frameTimer/targetVelX/movingFlag/posX/setFrame`(140-145) → 封装 `screen.reportEnemyKilled()/markSpawnConsumed(extra)`、`PlayerActor.applyKnockback()`；文档化 `extra`(屏块→actor 索引)与 actorSpawned 的隐式刷怪去重协议(patrolUpdate:361)。
    - **game1/ActorBase**：字段全 public(L28-53)是 Java 包内可见的忠实移植——**勿加 private/readonly**(intersectsActor 跨实例读 other.bounds*、子类覆写物理字段依赖之)；仅可加 `@internal` 区分引擎内部字段(frameIndex/bounds*)与物理字段(posX/velX)。
    - **game2/GameMIDlet→GameCanvas**：pauseApp 直写 uiState/inputAction/menuStartItem/menuSelection(65-69) → 可封装 `GameCanvas.returnToMenuFromGame()`(忠实移植下可选)。

### P2-4 · 语义纠偏（命名与 docs 字节验证冲突，动手前必须核实）

- **价值**：少数 TS 字段名与 docs 字节级验证结论相悖，**误导性比反编译名更危险**。
- **风险**：高（改错破语义）。**工作量**：S（但需先核字节验证）。
- **关键落点**：
  - game2/SpriteDef：`o/p/q/d/e` 现名应为 `frameCount/partsPerFrame/framePartCellIndices…`、`actionParamA..D` 实为 `actionBBoxLeft/Right/Top/Bottom`（`类清单.md:290-293`）。改名同步 `tools/rename-map.game2.json` + `test:shim`。
  - game1/SpriteAtlas：`rowOffsets/startRows` 与 `资源映射.md` 的 `height/colOffset` 存在分歧——据字节验证再决定。
  - web/main.ts:42-43：行内注释"52→换弹、54→手雷"与 CFR(`a.java:1446-1512`)相反（52→bit1024手雷、54→bit2048换弹），**纯注释纠错，零风险，应立即修**。
  - **v2 新增**：
    - **game1/EnemyActor `bossUpdate`**（方法名）：实为 q=18 关卡7卷轴追逼兵 AI，**非 Boss**（docs 已订正）→ 改名 `scrollChaserUpdate`（同时归属 P1-2）。这是补审发现的**最强误导名**。
    - **game1/PlayerActor `subState`**（在某些上下文）：写入 `subState=climbResult`(802,856) 时其值域是 ClimbResult 枚举非通用 subState——核实后以 ClimbResult 类型标注。

### P2-5 · shim 层小型收尾（评分4文件，低优先）

- shim/Sound：`SOUND_FORMAT_TONE/WAV` 实为 gain 档误命名 → `gainTier`；`this.type` write-only 死字段。
- shim/keys：`getGameAction` 全仓零调用（死代码）→ 标 `@deprecated`。
- shim/Random：`absMod`/`nextBoolean` 死代码，可复用替代 GameMIDlet(game1) 两份重复内联。
- shim/Resource/Runtime/Font/Image：补 P0-9 JSDoc + 少量常量。

---

## 3. game1/GameScreen.ts 专章（2405 行 · Top1 债务 · 状态机+paint 宿主）

> v1 仅占位。本章为 v2 补审产物：它是 GameState(P0-2) 落点最密处、paint 状态机宿主、~140 反编译局部。readabilityScore=38/100。CFR 对照基准 `reverse/game1/2-decompiled-cfr/tjge/a.java`。

### §3.1 巨型方法清单（行段）

| 方法 | 行段 | LOC | 性质 |
|---|---|---|---|
| **paint** | 194-915 | 722 | 14-way `switch(state)`，每帧渲染 + 纯 UI 态按键导航总入口；外层 try/catch(913) 吞所有错误 + painting=false(914) |
| **updateCamera** | 1137-1335 | 199 | `switch(levelIndex)` 0-7 逐关相机脚本 + 共享 clamp |
| **loadLevelStep** | 1347-1491 | 145 | `switch(stateTimer)` 0-9 增量加载机；case8 嵌 switch(levelIndex) |
| **renderWorld** | 1013-1103 | 91 | 顺序 HUD 合成器 |
| **drawBriefingScreen** | 2027-2102 | 76 | `switch(levelIndex)` 设局部 + 共享绘制 |
| createActor | 153-189 | 37 | 干净 type-id 分派（**不拆**，仅以 ActorTypeId 背书）|

### §3.2 paint 状态机 switch 落点（14 个 case，逐段，含拆分接缝）

顶层 `switch(this.state)`（line 198）→ 每 state 抽一个私有 paint 方法，外壳退化为分派：

| state | 含义(P0-2) | case 行段 | 抽取方法名 |
|---|---|---|---|
| 1 | BOOT_LOGO | 199-252 | paintBootLogo（含 12/22/32/42 分帧时刻 211,221,229,242）|
| 4 | MAIN_MENU | 253-379 | paintMainMenu（内嵌 menuSelection switch 293-332；选择任务子界面）|
| 2 | LOADING | 380-398 | paintLoading |
| 22 | BRIEFING | 399-444 | paintBriefing（帧上限 70/71 @401,406,411）|
| 21 | SCROLL_CUTSCENE | 445-484 | paintScrollCutscene（内 switch(levelIndex) 446-484）|
| 14 | LEVEL_ENTRY_ANIM | 485-503 | **paintEntryAnim — ⚠️ 必落入 case 10** |
| 10 | PLAYING | 504-508 | inline updateWorld+renderWorld |
| 18 | MISSION_FAILED | 509-582 | paintMissionFailed（内 menuSelection switch 538-548）|
| 15 | CREDITS | 583-658 | paintCredits（内 switch(var10_20) 614-647，信用滚动）|
| 16 | MISSION_COMPLETE | 659-707 | paintMissionComplete |
| 19 | REACH_END_CUTSCENE | 708-772 | paintReachEnd（内 switch(levelIndex) 716-771）|
| 13 | PAUSE_MENU | 773-854 | paintPauseMenu（pixelBuffer 0x601B fill @778；内 menuSelection switch 792-818）|
| 3/6 | ABOUT/HELP | 855-883 | paintHelpAbout |
| 20 | CAPTURE_CUTSCENE | 884-911 | paintCaptureCutscene（最后 case，自然 switch-exit）|

**两条最关键保真守卫**（拆 paint 时绝不可破）：
1. **case 14 → case 10 fall-through**（line 499 现有微弱注释 → 须升级为醒目 `@fallthrough`）：CFR `a.java:454` GOTO lbl254，"5 sources"验证。提取的 `paintEntryAnim` 跑完入场动画块后**必须继续执行 updateWorld+renderWorld**，**不得加 early return**。
2. **case 20 自然 switch-exit**（CFR a.java:828-853）：它是最后 case，自然退出 switch，保留。
3. **外层 try{}catch(v1){}(913) + painting=false(914)** 留给宿主路径；早返回 331(case4)/816(case13) 已把 painting 交回调用方——**提取方法不得自持 painting flag**。

### §3.3 其它 switch 落点（非 paint）

- createActor `switch(n)`(154，typeId 分派 0/1/2/3/4-7-9-12-19-22/3-11-13/8-14-17/10)。
- renderWorld `switch(player.weaponIndex)`(1049-1061，0/1/2 → WeaponIndex)。
- updateCamera `switch(levelIndex)`(1147，0/1/2/3/4/6/7 逐关脚本；cases 2/4/7 early return 跳过共享 clamp)。
- drawBriefingScreen / loadLevelStep case8 内嵌 switch(levelIndex)。
- spawnProjectile switch(1622-1647，spawn-type 21/10/20/15/16)。

### §3.4 最该拆 / 改名的部分（优先级）

1. **拆 paint(722 行)** — 最大可读性收益、最高保真风险。**逐 case 抽取，每抽一个 case 跑 `pnpm test:shim` 并对照 a.java**；先把 case14/case20 两守卫标注成醒目注释再动手。
2. **拆 updateCamera(199 行)** — 抽 cameraScriptLevel0..7 + clampCameraToBounds()；保 cases 2/4/7 early return 与 isCutsceneEntry 顶部短路。
3. **改名 renderWorld 局部** — n5（同时表 ammo-value 与 digit）、n（持 4 义）必须先命名再拆 HUD 合成接缝。
4. **改名 updateWorld / paint case15 / updateCamera 局部** — 见 P1-1 #1。
5. **GameState/ActorTypeId/WeaponIndex/MenuItem/InputAction 枚举** — 见 P0-2/P0-5；引入后 paint 的 14-way switch 获得穷尽性检查。
6. **定点常量 FIXED_SHIFT/SCRIPT_CELL_SHIFT 分名** — 见 P0-6（**`>>14` 与 `>>10` 两套基准并存属确认事实，勿统一**）；`4096` 三义分名(case22 偏移 / CLEAR 掩码 / 重力)。
7. **消除跨类 cast/断言** — 见 P2-1(updateWorld:935 等)、P2-2(enemyGrid/projectilePools/hudImage 等)。

### §3.5 GameScreen 静态单例说明（非改造项，仅文档化）

静态可变单例（125-135 static block + instance/inputQueue/saveData/currentText），从实例方法变更——忠实于 Java statics，应在类 JSDoc 标注"module-global, single-instance only"，避免二次开发误判多实例安全。

---

## 推荐执行顺序

**统一兜底**：每完成一个 initiative 跑 `pnpm test:shim`；改名/拆方法另以 `reverse/game{1,2}/2-decompiled-cfr/tjge/*.java` 逐段肉眼对照。**绝不在一次提交里混合"同值改造"与"逻辑改动"**——前者靠 test:shim 自证，后者需人工对照。

1. **先铺常量地基（P0-1 → P0-8）**：P0-1 镜像位 → P0-8 锚点/变换（复用现成 shim 常量，风险最低）→ P0-2/P0-3/P0-4 状态枚举（跨文件耦合解除，**GameScreen 是 P0-2 落点最密处**）→ P0-5 类型 id 枚举（含 game1 新增 ActorTypeId/EnemyType/AiState/PlayerAction/ClimbResult/WeaponIndex/MenuItem）→ P0-6 定点体系（落点最多，分文件渐进）→ P0-7 字节 helper + **状态位写法统一（game1/PlayerActor 0x2000↔8192 收口）**。**每抽一组常量立即 `test:shim`**。
2. **顺带补 JSDoc（P0-9）**：抽常量时同步补该文件方法级 JSDoc。
3. **再做改名（P1-1）**：按 v2 重排热点顺序（GameScreen→game1/PlayerActor→game2/PlayerActor→game2/LevelScene→game1/EnemyActor…）逐文件改，**每方法改完即回归**；优先治理 game1/PlayerActor `checkWall* n3 三重复用`、GameScreen `renderWorld n5/n`、game1/ProjectileActor 含副作用的三元再赋值。
4. **然后拆方法（P1-2 / P1-3）**：常量+改名后拆方法可读性最高；**务必先标记并保住所有 fall-through / break-vs-return / 死代码守卫**（清单见 P1-2 表与 §3.2），拆完逐段对照 CFR。game1/PlayerActor handleInput 的标号 break 网**整体迁移不可逐个独立提取**。
5. **最后按需做 P2**：类型/封装改造牵动多文件且可能偏离位级忠实，**仅在二次开发确需扩展该模块时**进行；P2-4 注释纠错（web/main.ts:42-43 即修；game1/EnemyActor `bossUpdate→scrollChaserUpdate` 误导名优先纠）。
6. **game1/GameScreen.ts** 已由 §3 专章补足同粒度盘点（不再需要单独立项）；它是全仓 Top1 债务 + P0-2 落点最密处，**拆 paint 必逐 case 对照 a.java + test:shim**。

---

集成后的完整 backlog 全文如上（写于此回复正文，未落盘——遵循只读约束）。关键变更摘要：6 个补审文件的 file:line 已分别落入 P0-1/P0-2/P0-5/P0-6/P0-7/P0-8/P0-9、P1-1/P1-2/P1-3、P2-1/P2-2/P2-3/P2-4；新增 §3 GameScreen 专章（巨型方法 5 项行段、paint 14-case 状态机 switch 表、case14→case10 与 case20 两守卫、最该拆/改名优先级）；总览评分分布扩到 35 文件并新增"分档1（天书）"行（game1/PlayerActor=4、game1/EnemyActor=4、game2/GameMIDlet=8），债务热点 Top5 重排（GameScreen 升 #1、game1/PlayerActor 入 #3）。