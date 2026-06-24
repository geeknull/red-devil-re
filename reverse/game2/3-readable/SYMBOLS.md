# 红魔特种兵2-深海战舰 (game2) — 符号词典 (SYMBOLS)

> **派生文档，非权威。** 逻辑以 `2-decompiled-cfr/tjge/*.java` 为准；本表只是把混淆后的单字母
> 类名/方法名/字段名映射到有意义的名字，用于阅读与后续生成 `3-readable/`（本目录） 可读副本。
> 实体/Actor 类统一为 `*Actor` 后缀风格（非 actor 类沿用各自语义名）。源：CFR 反编译 + TS 移植头注 + 保真审计结论。

## 类总览

| 原 | 友好类名 | 继承 | 职责 |
|---|---|---|---|
| `GameMIDlet` | **GameMIDlet** | MIDlet | MIDlet 入口：持有主 Canvas、全局 Random/读缓冲、MIDI 音频空实现、RMS "REDDEVIL2" 5 字节存档与全部菜单/过场/任务/关卡文案表。 |
| `a` | **GameCanvas** | Canvas | 主画布 + 主循环 Runnable：全屏 176×204、80ms 帧率，驱动 UI 状态机 b（logo/载入/菜单/游戏中/结算），持有玩家 g 与当前场景 j。 |
| `b` | **TileMap** |  | 瓦片地图层：解析 m/p/b.bin（网格索引/调色碰撞/背景层），增量重绘到离屏缓冲再按相机位置 blit 到目标 Graphics。 |
| `c` | **BossActor** | ActorBase | Boss / 机关 / 触发器 Actor（继承 h）：管理血量、攻击节奏、巡逻范围、阶段切换、击退与休眠，并维护当前最终 Boss 实例。 |
| `d` | **SpriteDef** |  | 动作/动画定义（SpriteDef）：解析 a.bin 精灵帧库，按动作位标志（含水平/垂直镜像）把多个图块拼帧绘制。 |
| `e` | **ItemActor** | ActorBase | 道具 / 特殊单位 Actor（继承 h）：处理巡逻边界与计时计数（道具弹药数量、转向倒计时等）。 |
| `f` | **EnemyActor** | ActorBase | 普通敌人 / 步兵 Actor（继承 h）：含巡逻、瞄准、转向、连射等 AI 子状态机及攻击/发射偏移参数表。 |
| `g` | **PlayerActor** | ActorBase | 玩家 Actor（继承 h，最大 Actor）：移动/跳跃/重力/翻越判定、武器与弹药、输入处理与动作状态机。 |
| `h` | **ActorBase** |  | 所有实体的 Actor 基类：封装定点坐标/速度、动画帧推进、AABB 与地图瓦片碰撞检测及碰撞回调框架，被 g/f/e/k/c 继承。 |
| `i` | **TileSheet** |  | 图块切片表 / PNG 贴图（TileSheet）：加载 t.bin 切片表 + actorPng.bin 主图，用 drawRegion 切图贴出（含换色帧支持）。 |
| `j` | **LevelScene** |  | 场景/关卡运行时（最大类）：解析 s.bin（actor 类型/触发器/实例/分屏 spawn 表），驱动相机、actor 调度与剧情对话推进。 |
| `k` | **ProjectileActor** | ActorBase | 子弹 / 投射物 / 手雷 Actor（继承 h）：管理飞行计时、碰撞掩码、命中爆炸、撞墙与出界回收，并静态生成投射物。 |

---

## GameMIDlet  （原 `tjge.GameMIDlet`, extends MIDlet）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `()V` | `GameMIDlet` | 构造函数：初始化全局 Random 并以当前时间设种子。 |
| `pauseApp` | `()V` | `pauseApp` | MIDlet 暂停回调：若画布处于关卡态(b==10)则切回菜单态并清相关计数。 |
| `startApp` | `()V` | `startApp` | MIDlet 启动回调：将 GameCanvas 设为当前可显示对象。 |
| `destroyApp` | `(Z)V` | `destroyApp` | MIDlet 销毁回调：持久化存档、清空显示与画布引用并通知销毁。 |
| `a` | `(I)I` | `randomBelow` | 返回 [0,n) 区间的随机整数（取随机数绝对值后取模）。 |
| `a` | `(Ljava/io/InputStream;)B` | `readByte` | 从输入流读 1 字节并返回（有符号）。 |
| `b` | `(Ljava/io/InputStream;)S` | `readShortLE` | 从输入流读小端 16 位 short。 |
| `a` | `([BII)I` | `readIntLE` | 从字节数组按小端读取 n2 字节组成 int（最高字节有符号）。 |
| `a` | `()V` | `tickSoundTimeout` | 声音超时回收：倒计时 g 到期且曲终则反分配当前音轨。 |
| `b` | `()V` | `loadSounds` | 加载 sound.bin 中的各条 MIDI 创建 Player 数组并设音量。 |
| `a` | `(II)V` | `playSound` | 按声音开关(k[2])单次播放第 n 条音轨并设回收倒计时。 |
| `c` | `()V` | `stopSound` | 停止当前正在播放的音轨。 |
| `b` | `(I)V` | `accessSaveRecord` | RMS 存档读写：n=0 读取/n=1 写入/n=2 清零前两字节(REDDEVIL2,5字节)。 |
| `a` | `(ILjava/lang/String;)V` | `loadTextEntry` | 从归档第 n 条读 UTF-16 文本，存入临时串 l(<7) 或 n(>=7)。 |
| `a` | `(Ljava/lang/String;I)Ljavax/microedition/lcdui/Image;` | `loadImage` | 从归档第 n 条取 PNG 字节并创建 Image。 |
| `b` | `(Ljava/lang/String;I)Ljava/io/InputStream;` | `openEntryStream` | 返回定位到归档第 n 条目起始偏移的输入流。 |
| `c` | `(Ljava/lang/String;I)[B` | `readEntryBytes` | 读取归档第 n 条目的完整字节切片。 |
| `<clinit>` | `()V` | `staticInit` | 静态初始化：建读缓冲、音轨数/数组、默认存档及全部文案表。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `canvas` | GameCanvas | 主游戏画布（实例），承载所有渲染与状态机。 |
| `b` | `display` | Display | LCDUI 显示管理器（实例）。 |
| `c` | `random` | Random | 全局随机数发生器（静态）。 |
| `d` | `byteBuf1` | byte[] | 1 字节读缓冲（静态）。 |
| `e` | `byteBuf2` | byte[] | 2 字节读缓冲（静态）。 |
| `f` | `byteBuf4` | byte[] | 4 字节读缓冲（静态），用于归档表项偏移读取。 |
| `g` | `soundTimeout` | int | 音轨回收倒计时计数（静态）。 |
| `h` | `soundTrackCount` | int | 音轨数量（静态，=2）。 |
| `i` | `soundPlayers` | Player[] | MIDI 播放器数组（静态）。 |
| `j` | `currentSoundIndex` | int | 当前播放的音轨索引，-1 表示无（静态）。 |
| `k` | `saveRecord` | byte[] | 5 字节存档记录（静态），k[2]=声音开关，默认[0,0,1,0,6]。 |
| `l` | `tempText1` | String | 临时文本串 1（静态），载入条目 <7 时写入。 |
| `m` | `tempText2` | String | 临时文本串 2（静态）。 |
| `n` | `tempText3` | String | 临时文本串 3（静态），载入条目 >=7 时写入。 |
| `o` | `menuTexts` | String[] | 菜单文案表（静态）：返回游戏/新游戏/继续/声音 开/帮助/关于/退出/声音 关。 |
| `p` | `interludeTexts` | String[] | 过场/结算文案表（静态）。 |
| `q` | `missionTexts` | String[] | 任务目标文案表（静态）。 |
| `r` | `numeralTexts` | String[] | 关卡序号文案表（静态）：一~十。 |

## GameCanvas  （原 `tjge.a`, extends Canvas）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `a(GameMIDlet)` | `a(Ltjge/GameMIDlet;)V` | `GameCanvas` | Constructor: full-screen canvas, store singleton + MIDlet, set initial state b=3 (logo), spawn and start the main-loop thread. |
| `a` | `(ILtjge/d;)Ltjge/h;` | `createActor` | Actor factory: map a type id n + sprite-def to the right ActorBase subclass (0=Player, 1-5=Enemy, 11/13/17/19/21=Boss, 6/7/14/15/18/20/22=Item, 9/10/12/16=Projectile, else ActorBase). |
| `paint` | `(Ljavax/microedition/lcdui/Graphics;)V` | `paint` | Framework render hook driven by the UI state machine b: logo sequence, loading bar, main menu, no-save prompt, level load, briefing, in-game, fail/clear results, ending, help, about. |
| `a` | `(Z)V` | `showResult` | Enter the results screen: compute elapsed seconds; true → mission-clear (state 16), false → mission-fail (state 18). |
| `hideNotify` | `()V` | `hideNotify` | Framework hook: if in-game (10) or briefing (22) when hidden, fall back to the main menu (state 4). |
| `a` | `()V` | `enterBriefing` | Enter the mission-briefing screen (state 22), resetting the animation progress and the scene's intro counter. |
| `a` | `(Ljavax/microedition/lcdui/Graphics;)V` | `paintLevelIntro` | Render the level-load transition and briefing open animation (the staged expanding-frame / line-by-line text reveal driven by e and the static C/D/E/F). |
| `b` | `()V` | `initCamera` | Initialise viewport size and camera, placing it on the player's spawn point read from the scene's map data, then clamp to scene bounds. |
| `a` | `(II)V` | `followCamera` | Smoothly scroll the camera toward target (n,n2) with per-axis speed limits, apply screen-shake, and clamp to scene bounds. |
| `a` | `(I)V` | `loadLevel` | Level-load state machine (j sub-state): unload old scene → create new scene for level n → init camera and flag load complete (M). |
| `run` | `()V` | `run` | Runnable main loop: while alive and active, throttle to ~80ms per frame and repaint. |
| `d` | `(I)I` | `keyToAction` | Map a raw key code (incl. negative game-action codes and number keys) to a game action bit-flag, also setting the held-direction field d. |
| `keyPressed` | `(I)V` | `keyPressed` | Framework key-down hook: handle left/right soft-key state transitions (back to menu, open briefing) then store the decoded action bits in c. |
| `keyReleased` | `(I)V` | `keyReleased` | Framework key-up hook: clear the current action bits and mark held-direction as released (-1). |
| `b` | `(I)V` | `startShake` | Trigger a screen-shake lasting n frames (no-op if a shake is already running). |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIIIIIIZ)V` | `drawExpandingFrame` | Static transition primitive: draw a single/double-stroked rectangle that shrinks from (n,n2) toward (n3,n4) by progress n6/n5, optionally filled and with an inner highlight border. |
| `a` | `(Ljavax/microedition/lcdui/Graphics;Ljava/lang/String;IIIII)V` | `drawWrappedLines` | Draw a carriage-return-delimited string line by line, starting at line n4 and drawing up to n5 lines. |
| `c` | `(I)Z` | `selectParagraph` | Extract the n-th CR-delimited segment of GameMIDlet.l into GameMIDlet.m; return whether it was the last segment. |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIIII)Z` | `drawTypesetText` | Word-wrap GameMIDlet.m by pixel width and draw it from line n for up to n2 lines; return true once the whole string is consumed. |
| `e` | `(I)V` | `startUnderline` | Start the menu-underline grow/shrink animation with target width n (resets current width to 48, direction to grow). |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `drawUnderline` | Advance and draw the selected-menu-item underline as a horizontal line centred at (n,n2). |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `instance` | GameCanvas (static) | Static singleton reference to the canvas (set in constructor). |
| `b` | `uiState` | int | UI state machine: 3=logo seq, 1=loading bar, 4=main menu, 100=no-save prompt, 2=load level, 20=in-game init, 22=briefing, 10=in-game, 18=mission-fail result, 16=mission-clear result, 21=game over (all cleared), 6=help, 19=about. |
| `c` | `inputAction` | int | Current frame's input action bit-flags (decoded from the last key press). |
| `d` | `heldAction` | int | Held-direction action bit (set on key down, -1 on release). |
| `e` | `transitionProgress` | int | Cut-scene / transition animation progress counter. |
| `f` | `levelStartTime` | long | Timestamp (ms) when the level started, used for elapsed-time calc. |
| `g` | `elapsedSeconds` | long | Elapsed play time in seconds, shown on results screens. |
| `h` | `menuStartItem` | int | First selectable menu item index (controls which items are reachable). |
| `G` | `resultAnimFrame` | int (private) | Result-screen animation parameter (sprite frame for the clear/fail flourish). |
| `H` | `resultAnimCounter` | int (private) | Result-screen animation parameter (sub-frame / repeat counter). |
| `i` | `globalFrame` | int | Global frame counter, incremented every paint. |
| `j` | `subState` | int | Sub-state / timer counter within the current UI state. |
| `k` | `levelIndex` | int | Current level number. |
| `l` | `menuSelection` | int | Currently selected menu item index. |
| `m` | `cameraX` | int | Camera anchor X position (fixed-point). |
| `n` | `cameraY` | int | Camera anchor Y position (fixed-point). |
| `o` | `cameraVelX` | int | Camera X velocity for this frame (fixed-point). |
| `p` | `cameraVelY` | int | Camera Y velocity for this frame (fixed-point). |
| `q` | `viewportWidth` | int | Viewport width (fixed-point). |
| `r` | `viewportHeight` | int | Viewport height (fixed-point). |
| `I` | `sceneWidth` | int (private) | Scene width in fixed-point (tile width << 10). |
| `J` | `sceneHeight` | int (private) | Scene height in fixed-point (tile height << 10). |
| `K` | `shakeCounter` | int (private) | Remaining screen-shake frames. |
| `L` | `shaking` | boolean (private) | Whether a screen-shake is currently active. |
| `M` | `loadComplete` | boolean (private) | Flag set when level loading has finished. |
| `s` | `running` | boolean (protected) | Main-loop active flag (loop repaints only when true). |
| `t` | `painting` | boolean (protected) | True while paint() is executing (loop waits for it to clear). |
| `N` | `underlineTargetWidth` | int (private) | Menu-underline animation target width. |
| `O` | `underlineWidth` | int (private) | Menu-underline animation current width. |
| `P` | `underlineDir` | int (private) | Menu-underline animation direction (1=growing, 0=shrinking). |
| `u` | `logoImageMain` | Image | Logo main image (also used as menu/title background). |
| `v` | `logoImageSub` | Image | Logo secondary image drawn below the main one. |
| `w` | `mainThread` | Thread (protected) | Main-loop thread running run(). |
| `x` | `midlet` | GameMIDlet (protected) | Owning MIDlet. |
| `y` | `player` | PlayerActor | The player actor instance. |
| `z` | `scene` | LevelScene | The current level scene. |
| `Q` | `logoTempImage1` | Image (private) | Temporary logo-sequence image (logo.bin index 1). |
| `R` | `logoTempImage2` | Image (private) | Temporary logo-sequence image (logo.bin index 2). |
| `S` | `logoTempImage3` | Image (private) | Temporary logo-sequence image (logo.bin index 3). |
| `T` | `logoTempImage4` | Image (private) | Temporary logo-sequence image (logo.bin index 4). |
| `A` | `briefingNumberX` | int[] (static final) | Briefing-screen number X coordinate table {17,46} (fixed-point layout). |
| `B` | `briefingNumberY` | int[] (static final) | Briefing-screen number Y coordinate table {29,106} (fixed-point layout). |
| `C` | `briefingAnimC` | int (static) | Briefing open-animation state value C (first expand phase progress). |
| `D` | `briefingAnimD` | int (static) | Briefing open-animation state value D (second expand phase progress). |
| `E` | `briefingAnimE` | int (static) | Briefing open-animation phase selector E (0/1/2 drives which frames draw). |
| `F` | `briefingLineState` | int[] (static) | Briefing line-by-line reveal state [lineOffset, y, step, timer] (length 4). |

## TileMap  （原 `tjge.b`）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `(II)V` | `constructor` | 构造瓦片地图层，传入相机视口宽 a、高 b |
| `a` | `(II)V` | `setCameraPosition` | 设置相机左上角坐标 c、d |
| `a` | `()V` | `resetDrawnBounds` | 复位离屏缓冲已绘制区域边界（B=C=-1），强制下次全量重绘 |
| `b` | `()I` | `getMapWidth` | 返回地图总像素宽（瓦片宽 p × 单元横向瓦片数 h × 网格列数 j） |
| `c` | `()I` | `getMapHeight` | 返回地图总像素高（瓦片高 q × 单元纵向瓦片数 i × 网格行数 k） |
| `a` | `(Ljavax/microedition/lcdui/Graphics;)V` | `render` | 按当前相机位置 c/d 把地图层绘制到目标 Graphics |
| `e` | `(II)I` | `sampleGridIndex` | 由像素坐标采样网格索引数组 l，得到该单元的瓦片块编号（含无符号修正） |
| `b` | `(II)I` | `sampleCollision` | 采样像素坐标处的碰撞/属性值（越界返 0，按行 RLE 表 m 解码） |
| `c` | `(II)I` | `sampleForegroundTile` | 采样像素坐标处的前景瓦片索引（来自 p.bin 的 t 数组，越界抛异常） |
| `d` | `(II)I` | `sampleBackgroundTile` | 采样像素坐标处的背景块索引（来自 b.bin 的 A 数组，越界抛异常） |
| `f` | `(II)V` | `ensureOffscreenBuffer` | 惰性创建静态离屏缓冲 F 及其 Graphics G，并复位绘制边界 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIIII)V` | `drawTileRegion` | 把指定瓦片范围（含背景层）绘制到给定 Graphics，处理环绕裁剪 |
| `b` | `(Ljavax/microedition/lcdui/Graphics;IIIIII)V` | `blitBufferRegion` | 将离屏缓冲 F 的一块区域 blit 到目标 Graphics |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIII)V` | `renderViewport` | 按相机矩形增量重绘离屏缓冲并 blit 到屏幕（核心可见区渲染） |
| `d` | `()V` | `dispose` | 释放所有数组与图像资源并回收（原 System.gc） |
| `a` | `(III)V` | `load` | 加载关卡地图：解析 m.bin/p.bin/b.bin 与前景/背景图，n=网格资源号、n2=背景资源号、n3=图层模式 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `viewportWidth` | int | 相机视口宽（构造入参） |
| `b` | `viewportHeight` | int | 相机视口高（构造入参） |
| `c` | `cameraX` | int | 相机左上角 X 坐标 |
| `d` | `cameraY` | int | 相机左上角 Y 坐标 |
| `h` | `cellTilesX` | int | 每个网格单元横向覆盖的瓦片数 |
| `i` | `cellTilesY` | int | 每个网格单元纵向覆盖的瓦片数 |
| `j` | `gridCols` | int | 网格列数 |
| `k` | `gridRows` | int | 网格行数 |
| `l` | `gridIndices` | byte[] | 网格索引数组（来自 m.bin），每单元一个块编号 |
| `m` | `collisionRows` | byte[][] | 每行碰撞/属性表（RLE 编码，来自 p.bin 解析） |
| `e` | `collisionStepX` | int | 碰撞采样横向步长 |
| `f` | `collisionStepY` | int | 碰撞采样纵向步长 |
| `n` | `foregroundPaletteWidth` | int | 前景瓦片调色板像素列数（来自 p.bin） |
| `o` | `foregroundPaletteHeight` | int | 前景瓦片调色板像素行数（来自 p.bin） |
| `p` | `tileWidth` | int | 前景瓦片像素宽 |
| `q` | `tileHeight` | int | 前景瓦片像素高 |
| `r` | `foregroundImage` | Image | 前景瓦片图（fpng.bin） |
| `s` | `foregroundTilesPerRow` | int | 前景图每行瓦片数（图宽/p） |
| `t` | `foregroundTileIndices` | byte[] | 前景瓦片索引数组（来自 p.bin） |
| `u` | `backgroundPaletteCols` | int | 背景调色板列数（来自 b.bin） |
| `v` | `backgroundPaletteRows` | int | 背景调色板行数（来自 b.bin） |
| `w` | `backgroundBlockWidth` | int | 背景块像素宽 |
| `x` | `backgroundBlockHeight` | int | 背景块像素高 |
| `y` | `backgroundImage` | Image | 背景图（bpng.bin） |
| `z` | `backgroundBlocksPerRow` | int | 背景图每行块数（图宽/w） |
| `A` | `backgroundIndices` | byte[] | 背景块索引数组（来自 b.bin） |
| `g` | `layerMode` | int | 图层模式（2=含独立背景层） |
| `B` | `drawnLeft` | int | 离屏缓冲已绘制区域左边界（瓦片对齐，-1=未绘） |
| `C` | `drawnTop` | int | 离屏缓冲已绘制区域上边界（瓦片对齐） |
| `D` | `drawnRight` | int | 离屏缓冲已绘制区域右边界（瓦片对齐） |
| `E` | `drawnBottom` | int | 离屏缓冲已绘制区域下边界（瓦片对齐） |
| `F` | `offscreenBuffer` | Image | 静态离屏缓冲图像（所有实例共享） |
| `G` | `offscreenGraphics` | Graphics | 离屏缓冲 F 的 Graphics（静态） |

## BossActor  （原 `tjge.c`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `(ILtjge/d;)V` | `BossActor` | 构造器：以类型ID与精灵定义初始化 Boss/机关 Actor，转交父类 |
| `a` | `([B)Z` | `spawnFromBytes` | 从关卡字节数据初始化各类型 Boss/机关的血量、攻击节奏与移动范围 |
| `a` | `()V` | `resetBoss` | 重置最终 Boss(类型19)状态到初始入场位与参数 |
| `b` | `()V` | `update` | 逐帧 AI 更新：按类型ID分派各 Boss/机关的移动、开火与受击死亡逻辑 |
| `c` | `()Z` | `requestFire` | 触发开火请求：若可触发且未待触发则置位待触发标志 |
| `a` | `(Ltjge/h;)Z` | `onHitBy` | 受击碰撞回调：玩家子弹命中时按类型扣血、击退或死亡爆炸 |
| `d` | `()Z` | `isAlive` | 是否参与碰撞/存活判定（覆写基类）：类型21机关仅在血量>0时可碰撞 |
| `a` | `(Ltjge/k;)V` | `aimProjectile` | 按与玩家的水平距离计算抛射弹道的初速、重力与水平速度 |

> 以下为 BossActor 调用到的、继承自 ActorBase(`h`) 的方法（完整定义见 ActorBase 一节）；此处仅列字母对应：
> `m`=`getDamage`、`h`=`isAnimationDone`、`e`=`kill`、`f`=`killAndMarkSpawned`、`b(I)`=`hasCollisionFlag`、
> `b(tjge.h)`=`collidesWith`、`d(tjge.h)`=`isNewContact`（注意 `d()` 与 `d(tjge.h)` 是两个重载：前者 `isAlive`，后者 `isNewContact`）。

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `BULLET_PARAMS_T11` | int[][] | 静态：类型11 Boss 的子弹参数表（偏移x/y、动画、动作、速度x/y） |
| `b` | `BULLET_PARAMS_T17` | int[][] | 静态：类型17 Boss 的子弹参数表（偏移、动画、动作、速度、动作上限列） |
| `f` | `instance` | tjge.c (BossActor) | 静态：当前最终 Boss(类型19)单例引用 |
| `c` | `health` | int | 血量/计时器（不同类型复用：血量、爆炸倒计时等） |
| `N` | `idCounter` | int | 继承自基类 ActorBase 的影子字段；BossActor 复用作锚定 x 坐标/动作循环计数（击退归位/帧序号）。TS port 中因与基类同名而实写为 `cN`。 |
| `O` | `uniqueId` | int | 继承自基类的影子字段；复用作攻击节奏基准（开火冷却的重置值）。TS port 实写为 `cO`。 |
| `P` | `lastContactId` | int | 继承自基类的影子字段；复用作攻击节奏计数（递减到触发开火）。TS port 实写为 `cP`。 |
| `Q` | `rangeMin` | int | 移动范围下界（定点坐标，按 S 轴为 x 或 y） |
| `R` | `rangeMax` | int | 移动范围上界（定点坐标，按 S 轴为 x 或 y） |
| `S` | `axisOrPhase` | int | 移动轴(0=水平,1=垂直)或阶段标志 |
| `T` | `randomMoveTimer` | int | 随机移动计时器（累加触发随机水平速度） |
| `U` | `patrolCountdown` | int | 巡逻倒计时（最终 Boss 入场阶段计时） |
| `V` | `phaseIndex` | int | 阶段/序号（最终 Boss 子状态机阶段、发射点序号） |
| `d` | `knockedBack` | boolean | 被击退中标志 |
| `W` | `pendingFire` | boolean | 待触发开火标志 |
| `X` | `fireable` | boolean | 可触发开火标志 |
| `e` | `dormant` | boolean | 休眠/不激活标志 |
| `Y` | `attachedEntity` | tjge.h (ActorBase) | 关联从属实体（类型21机关的附属 Actor） |

## SpriteDef  （原 `tjge.d`）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `()V` | `SpriteDef` | 私有无参构造器，仅由静态工厂 loadFromArchive 内部 new 出实例 |
| `a` | `()S` | `getActionCount` | 返回动作总数 r（actionCount） |
| `a` | `(I)S` | `getFrameCount` | 返回第 n 个动作的帧数 s[n]（该动作有多少帧） |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIIII)V` | `drawFrame` | 按动作号(含 0x80000000 水平镜像/0x40000000 垂直镜像高位标志)与帧号，把该帧引用的一组图块逐个加偏移并镜像后绘制到图集 tileSheet 上 |
| `b` | `(I)Ltjge/d;` | `loadFromArchive` | 静态工厂：从归档 /res/a.bin 第 n 条读取并解析一份精灵动作定义，建立图集映射并返回实例，失败返回 null |
| `<clinit>` | `()V` | `staticInit` | 静态初始化块：将 0 号图集标记为已加载（loadedFlags[0]=true） |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `tileSheets` | i[] | 静态：每个内部 id 对应的图集 TileSheet 数组[32]（懒加载，跨实例共享） |
| `b` | `loadedFlags` | boolean[] | 静态：各图集是否已加载的标志数组[32] |
| `c` | `idMap` | int[] | 静态：外部 id → 内部图集 id 的映射表[32] |
| `o` | `tileGroupCount` | short | 图块组数（每组是一帧拼图所用的一批子图） |
| `p` | `tilesPerGroup` | short[] | 每个图块组包含的图块数[tileGroupCount] |
| `q` | `groupTileIndices` | short[][] | 每组各图块引用的子图(tile)索引[tileGroupCount][tilesPerGroup] |
| `d` | `groupTileOffsetX` | byte[][] | 每组各图块的 x 偏移[tileGroupCount][]（byte，可负；水平镜像时取反） |
| `e` | `groupTileOffsetY` | byte[][] | 每组各图块的 y 偏移[tileGroupCount][]（byte，可负；垂直镜像时取反） |
| `r` | `actionCount` | short | 动作总数 |
| `s` | `framesPerAction` | short[] | 每个动作的帧数[actionCount] |
| `t` | `actionFrameGroups` | short[][] | 每个动作各帧引用的图块组索引[actionCount][framesPerAction]（读取时负值 +256 归一为无符号） |
| `f` | `actionParamA` | byte[] | 每个动作的 byte 参数表 A[actionCount] |
| `g` | `actionParamB` | byte[] | 每个动作的 byte 参数表 B[actionCount] |
| `h` | `actionParamC` | byte[] | 每个动作的 byte 参数表 C[actionCount] |
| `i` | `actionParamD` | byte[] | 每个动作的 byte 参数表 D[actionCount] |
| `j` | `paramJ` | short | 全局 short 参数 J（动作定义末尾的 4 个 short 之一） |
| `k` | `paramK` | short | 全局 short 参数 K |
| `l` | `paramL` | short | 全局 short 参数 L |
| `m` | `paramM` | short | 全局 short 参数 M |
| `n` | `sheetId` | short | 本定义所属图集的内部 id（用于索引静态 tileSheets/loadedFlags） |
| `u` | `tileSheet` | TileSheet | 本定义实际使用的图集 TileSheet 实例（= tileSheets[sheetId]） |

## ItemActor  （原 `tjge.e`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `(ILtjge/d;)V` | `ItemActor` | 构造函数：以类型ID和精灵定义(SpriteDef)初始化，转调父类 h(int,d)。 |
| `a` | `([B)Z` | `spawnFromBytes` | 从关卡字节流生成本单位：先调 super，再按类型ID(h)初始化巡逻边界(case15)或道具数量(case7)。 |
| `b` | `()V` | `update` | 每帧AI/行为更新：按类型ID分派——巡逻摆动(15)、动画结束自移除(18/20)、被玩家拾取计时(7)、上浮回收(14)、朝向追玩家(6)。 |
| `c` | `(I)V` | `applyCommand` | 外部命令钩子：n=0时吸附到玩家位置上方，n=1时按当前朝向设置动作。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `paint` | 绘制：先调 super 绘制精灵，类型7且拾取计时中时在头顶用静态数字绘制弹出的数量。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `patrolMinX` | int | 水平巡逻左边界(定点 <<10)。case15 中向左巡逻时由 u 减去 (n<<10) 算出。 |
| `b` | `patrolMaxX` | int | 水平巡逻右边界(定点 <<10)。case15 中向右巡逻时由 u 加上 (n<<10) 算出。 |
| `c` | `patrolMinY` | int | 垂直巡逻上边界(定点)，= v - 10240。 |
| `d` | `patrolMaxY` | int | 垂直巡逻下边界(定点)，= v + 10240。 |
| `e` | `counter` | int | 多用途计时/计数：case15 为转向倒计时(初始10)，case7 为道具/弹药数量(用于头顶数字绘制)。 |

## EnemyActor  （原 `tjge.f`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `f` | `(ILtjge/d;)V` | `EnemyActor` | 构造函数：调用父类 (id, SpriteDef) 并设置碰撞掩码 K=1 |
| `a` | `([B)Z` | `spawnFromBytes` | 从关卡字节数组初始化敌人：按类型(h)读取巡逻范围/类型/连射/出生参数，绑定玩家与关联载具 |
| `b` | `()V` | `update` | 每帧主更新：按类型分派到步行/炮台 AI，并处理被玩家载具(l==23)碾压逻辑 |
| `a` | `()V` | `updateWalkerAi` | 步行/伞兵类(h=1/3/4)的 AI 状态机：巡逻、瞄准、开火、受击、死亡 |
| `c` | `()V` | `updateTurretAi` | 炮台/固定类(h=2/5)的 AI 状态机：瞄准、发射、受击、死亡 |
| `o` | `()I` | `evaluateThreat` | 评估玩家相对位置返回 AI 判定码(0=无/1=普通/2=上/3=下/4=近战) |
| `a` | `(Ltjge/h;)Z` | `onHitBy` | 被其它 Actor 命中时的回调：校验碰撞掩码与相交并据来源类型扣血 |
| `b` | `(II)V` | `applyDamage` | 扣减血量(damage, fromDir)并按类型切到受击/死亡状态、生成爆炸特效 |
| `a` | `(Ltjge/k;)V` | `launchProjectile` | 为传入投射物计算抛物线初速/加速度等弹道参数 |
| `p` | `()V` | `aimAndFire` | 瞄准子状态：根据判定码选择并播放瞄准/开火动作，递减巡逻次数 |
| `m` | `()I` | `getDamage` | 返回本敌人造成的伤害值(开火帧 l==7 时为1，否则0) |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `af` | `fireOffsetTable` | int[][] | 静态：步兵(h=1)开火偏移/速度参数表[dx,dy,vx,vz,flag] |
| `ag` | `throwOffsetTable` | int[][] | 静态：投掷类(h=3)发射点偏移表[dx,dy] |
| `ah` | `turretShotParams` | int[] | 静态：炮台(h=5)发射参数[dx,dy,actionFlag,vx] |
| `a` | `hp` | int | 当前血量/命数（死亡判定 a<=0） |
| `b` | `facingSign` | int | 朝向系数：H==0 为 +1，否则 -1（用于乘速度/偏移） |
| `c` | `timer` | int | 通用倒计时（攻击节奏/巡逻停顿/受击等待） |
| `d` | `patrolRange` | int | 出生参数：巡逻半径（瓦格，<<10 转定点边界） |
| `e` | `enemyVariant` | int | 出生参数：敌人变体/子类型（22=特殊空降） |
| `f` | `burstCount` | int | 出生参数：连射/动作变体数（影响初始 hp 与开火动作选择） |
| `Q` | `threatCode` | int | 本帧 AI 判定码（evaluateThreat 的返回） |
| `R` | `prevThreatCode` | int | 上帧 AI 判定码（用于检测判定变化以重置瞄准） |
| `S` | `spawnParam` | int | 出生参数：发射节奏/冷却(炮台 c 的重置值) |
| `T` | `initialFacing` | int | 初始朝向标志位备份（巡逻归位用） |
| `U` | `preHitSubState` | int | 受击前的 AI 子状态(G)备份，受击结束后恢复 |
| `V` | `attackRhythm` | int | 攻击节奏阈值（瞄准计时基准值） |
| `W` | `patrolRemaining` | int | 剩余巡逻次数（耗尽后转为主动出击 G=5） |
| `X` | `hasFired` | boolean | 本轮已开火标记 |
| `Y` | `patrolLeftBound` | int | 巡逻左边界(定点坐标)；炮台类复用为发射计数 |
| `Z` | `patrolRightBound` | int | 巡逻右边界(定点坐标) |
| `aa` | `reactionFactor` | int | 反应速度系数(1+rand(3))，越大瞄准距离越窄 |
| `ab` | `needTurn` | boolean | 需要转向面对玩家 |
| `ac` | `isAiming` | boolean | 已进入瞄准状态 |
| `ad` | `player` | PlayerActor | 玩家 Actor 引用(PlayerActor，取自 L.y) |
| `ae` | `linkedVehicle` | BossActor | 关联载具/炮台(BossActor，h=2 时从 LevelScene.e[] 取)，可为 null |

## PlayerActor  （原 `tjge.g`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `(ILtjge/d;)V` | `constructor` | 构造玩家 Actor：调用父类构造并将阵营位 K 设为 2 |
| `a` | `([B)Z` | `spawnFromBytes` | 从字节定义初始化玩家：重置弹药/标志/血量，按 byte[7] 决定是否附加入场特效 |
| `a` | `()V` | `spawnEntryEffect` | 向场景请求 18 号伴随特效实体并进入入场动作状态(0x19) |
| `i` | `()V` | `step` | 每帧物理推进：重力/速度上限/天花板与地面碰撞/翻越/边界夹取/同步特效（覆写基类 step） |
| `c` | `()V` | `advanceEffectFrame` | 推进伴随特效到其下一帧(c_I(1)) |
| `o` | `()Z` | `isDead` | 返回私有死亡标志 an |
| `b` | `()V` | `update` | 主逻辑帧：执行动作状态机，按关卡相位处理胜利/死亡/开关，超时血量为零时进入死亡 |
| `r` | `()V` | `runActionStateMachine` | 动作状态机：按当前动作 l 在播放完毕时迁移到下一动作（射击/跳跃/翻越/受击/死亡等） |
| `p` | `()I` | `stepThrowQueue` | 推进投掷物冷却队列 Q，到期触发对应输入并返回完成的槽位索引 |
| `c` | `(I)V` | `handleInput` | 处理一次输入指令位(移动/跳跃/蹲/射击/手雷/换弹等)，驱动状态与速度 |
| `s` | `()Z` | `reloadCurrentWeapon` | 用备用弹药 f 给当前武器 U 补满弹匣 e，成功返回 true |
| `a` | `(Ltjge/h;)Z` | `onHitBy` | 被另一 Actor 命中时的回调：判定伤害并施加击退/扣血 |
| `c` | `(Ltjge/h;)V` | `onCollide` | 与另一 Actor 接触时的回调：处理格挡反击与位置贴靠对齐 |
| `c` | `(II)V` | `takeDamage` | 扣血并按当前状态(站立/蹲/空中)切换受击/格挡/死亡动作；血量归零触发败北 |
| `t` | `()I` | `probeVault` | 向前方扫描瓦片判定翻越类型并记录翻越目标坐标 X/Y，返回翻越类别码 |
| `u` | `()V` | `updateVaultMotion` | 空中跳跃时驱动翻越：对齐到翻越目标点并锁定 Z，或落地转蹲伏 |
| `d` | `(I)Z` | `snapToLedge` | 检测并贴靠到 4 号边沿瓦片(攀爬/抓边)，成功对齐则返回 true |
| `l` | `()Z` | `collideDown` | 向下碰撞检测（覆写基类）：落地时清零垂直速度并夹取位置，返回是否落地 |
| `q` | `()Z` | `checkFloorCollision` | 向下扫描地面探测：落地时清零垂直速度并夹取位置，返回是否落地（PlayerActor 自有方法，与基类 collideDown 区分） |
| `j` | `()Z` | `collideLeft` | 向左碰撞检测（覆写基类）：撞左墙时清零水平速度并夹取位置，返回是否撞墙 |
| `k` | `()Z` | `collideRight` | 向右碰撞检测（覆写基类）：撞右墙时清零水平速度并夹取位置，返回是否撞墙 |
| `v` | `()Z` | `canAcceptInput` | 判定当前动作 l 是否处于可接受玩家输入的状态(存活且非锁死) |
| `a` | `([[III)I` | `computeSpawnCoord` | 按偏移表与朝向 H 计算投掷物/弹丸的发射世界坐标(定点) |
| `m` | `()I` | `getDamage` | 返回当前动作造成的近战伤害值(动作24为10，其余0) |
| `w` | `()Z` | `isFootOnGround` | 脚下三格瓦片探测：判定是否站立在实体地面上 |
| `x` | `()Z` | `isVaultBlocked` | 翻越落点下方瓦片探测：判定翻越目标是否被阻挡 |
| `a` | `(Z)Z` | `triggerSwitch` | 开关交互：传 true 标记待触发，传 false 在站立时释放触发并通知场景 |
| `b` | `(II)V` | `setTilePosition` | 按瓦片坐标设置玩家定点位置、重置为站立动作并重置摄像机 |
| `y` | `()V` | `resetVaultState` | 重置翻越/跳跃相关状态(X/Y/ad/Z/aa/W) |
| `a` | `(Ltjge/e;)V` | `applyPickup` | 应用拾取物效果：按道具类型增加备用弹药/手雷/血量并夹取上限 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `jumpVelocityX` | int[] | 静态常量：各翻越/跳跃类型的水平初速表(定点)，索引为翻越类型 W |
| `b` | `jumpVelocityY` | int[] | 静态常量：各翻越/跳跃类型的垂直初速表(定点)，索引为翻越类型 W |
| `c` | `ammoInitTable` | int[] | 静态常量：三种武器的弹匣初始/满弹值表 {10,1,3} |
| `d` | `reserveInitTable` | int[] | 静态常量：三种武器的备用弹药初始/上限表 {99,6,3} |
| `e` | `ammoCurrent` | int[] | 静态：三种武器当前弹匣弹药量(发射递减，换弹补充) |
| `f` | `ammoReserve` | int[] | 静态：三种武器备用弹药量(换弹时消耗，拾取时增加) |
| `Q` | `throwCooldownQueue` | int[][] | 静态：投掷物冷却队列 4x3，每槽 {指令码, 倒计时, 重复次数} |
| `ak` | `bulletSpawnOffsets` | int[][] | 静态常量：四种射击姿态的弹丸发射偏移表 {{-2,-56},...} |
| `al` | `grenadeSpawnOffsets` | int[][] | 静态常量：手雷投掷的发射偏移表 {{0,-32},{0,-24}} |
| `am` | `fireActionTable` | int[][][] | 静态常量：按武器与姿态索引的射击动作三元组表 {开始动作,射后动作,空弹动作} |
| `R` | `knockbackTimer` | int | 被击退/空中惯性计时，递减到负数后清零水平速度 |
| `S` | `actionSubTimer` | int | 动作子计时(用于翻滚/特殊动作的帧节拍判定) |
| `T` | `health` | int | 玩家血量(初始 10，归零进入死亡) |
| `U` | `currentWeaponIndex` | int | 当前选用武器索引(0/1/2) |
| `V` | `inputCounter` | int | 输入/投掷计数器(用于充能投掷的节流判定) |
| `W` | `vaultType` | int | 当前翻越类型码(由 probeVault 返回，索引跳跃速度表) |
| `X` | `vaultTargetX` | int | 翻越目标水平坐标(定点，-1 表示无) |
| `Y` | `vaultTargetY` | int | 翻越目标垂直坐标(定点，-1 表示无) |
| `Z` | `vaultLocked` | boolean | 翻越锁定中(正贴靠到翻越目标点) |
| `aa` | `canJump` | boolean | 可起跳/可翻越标志 |
| `ab` | `switchPending` | boolean | 开关已触发待释放标志 |
| `ac` | `ceilingBlocked` | boolean | 攀爬时被天花板顶住标志 |
| `ad` | `airborneJumping` | boolean | 空中跳跃/翻越进行中标志 |
| `ae` | `levelCleared` | boolean | 已完成(到达终点)标志 |
| `af` | `actionLocked` | boolean | 动作锁死中(禁止开火等输入)标志 |
| `an` | `dead` | boolean | 私有死亡标志(由 isDead 暴露) |
| `ag` | `publicFlagA` | boolean | 公共状态标志 A(供外部读取的玩家状态位) |
| `ah` | `publicFlagB` | boolean | 公共状态标志 B(影响 Boss 战相机夹取的状态位) |
| `ai` | `publicFlagC` | boolean | 公共状态标志 C(Boss 战坠落死亡时置位) |
| `aj` | `companionEffect` | ItemActor | 伴随特效实体(ItemActor，入场/同步用，可为 null) |

## ActorBase  （原 `tjge.h`）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `(ILtjge/d;)V` | `constructor` | 构造：设类型ID、精灵数据，初始化循环标志、所属画布与唯一ID计数器。 |
| `a` | `([B)Z` | `spawnFromBytes` | 从7字节生成记录初始化实体（动作码、坐标、调色板、速度/上限），返回是否成功。 |
| `e` | `()V` | `kill` | 标记死亡：清存活标志并从场景实体槽位移除。 |
| `f` | `()V` | `killAndMarkSpawned` | kill 后在画布生成位图标记该槽位已生成，防止重复刷出。 |
| `a` | `(I)V` | `setAction` | 设置完整动作码：拆出朝向/翻转位、按翻转取碰撞盒、查帧数并复位动画。 |
| `g` | `()V` | `advanceFrame` | 推进一帧：到组尾时按循环标志回绕或停尾，并置播完标志。 |
| `h` | `()Z` | `isAnimationDone` | 返回当前动画组是否已播放完毕。 |
| `i` | `()V` | `step` | 每帧步进：推帧并按加速度逼近目标速度（带上限钳制），再积分坐标。 |
| `b` | `()V` | `update` | 每帧逻辑钩子，基类空实现，由子类重写。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `paint` | 绘制：处理隔帧/受击闪烁与屏外裁剪后委托精灵数据绘制当前帧。 |
| `a` | `(IIII)Z` | `intersectsRect` | 本实体世界碰撞盒与给定矩形(左上右下)是否相交。 |
| `b` | `(Ltjge/h;)Z` | `collidesWith` | 两实体碰撞盒是否相交（任一盒退化为零宽/高则不碰）。 |
| `j` | `()Z` | `collideLeft` | 向左移动时检测与实心瓦片碰撞，命中则贴边并停止水平速度。 |
| `k` | `()Z` | `collideRight` | 向右移动时检测与实心瓦片碰撞，命中则贴边并停止水平速度。 |
| `l` | `()Z` | `collideDown` | 向下移动时检测与实心瓦片碰撞（落地），命中则贴边并停止垂直速度。 |
| `b` | `(I)Z` | `hasCollisionFlag` | 测试碰撞类型掩码是否含给定位。 |
| `m` | `()I` | `getDamage` | 返回伤害值，基类返回0，由子类重写。 |
| `a` | `(Ltjge/h;)Z` | `onHitBy` | 被另一实体命中时的判定钩子，基类返回false，由子类重写。 |
| `c` | `(Ltjge/h;)V` | `onCollide` | 与另一实体确认碰撞后的回调，基类空实现，由子类重写。 |
| `d` | `()Z` | `isAlive` | 存活/有效判定钩子，基类返回true，由子类重写。 |
| `n` | `()V` | `checkCollisions` | 遍历场景全部活动实体，对相交且互相确认的对象触发碰撞回调。 |
| `d` | `(Ltjge/h;)Z` | `isNewContact` | 用唯一ID去重：若与给定实体的本次接触尚未记录则记录并返回true。 |
| `a` | `(II)I` | `tileAt` | 按瓦片网格坐标查询地图瓦片碰撞值（折算为像素后查询）。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `g` | `alive` | boolean | 存活标志；false 表示已死亡/未激活。 |
| `h` | `typeId` | int | 实体类型ID（决定层级、刷出特例等）。 |
| `i` | `spriteDef` | SpriteDef | 动画/精灵数据 tjge.d，提供碰撞盒、帧数与绘制。 |
| `j` | `animLoop` | boolean | 当前动画组是否循环播放。 |
| `k` | `actionCode` | int | 完整动作码（含朝向/翻转高位）。 |
| `l` | `frameGroupIndex` | int | 动作码低24位，帧组索引。 |
| `m` | `animDone` | boolean | 本动画组是否已播完。 |
| `n` | `frameIndex` | int | 当前帧序号。 |
| `o` | `frameCount` | short | 本动画组的帧数。 |
| `p` | `boxLeft` | int | 碰撞盒左边界（相对坐标，像素）。 |
| `q` | `boxRight` | int | 碰撞盒右边界（相对坐标，像素）。 |
| `r` | `boxTop` | int | 碰撞盒上边界（相对坐标，像素）。 |
| `s` | `boxBottom` | int | 碰撞盒下边界（相对坐标，像素）。 |
| `t` | `slotIndex` | int | 实体在场景中的槽位索引。 |
| `u` | `posX` | int | 定点世界坐标 X（<<10 定点）。 |
| `v` | `posY` | int | 定点世界坐标 Y（<<10 定点）。 |
| `w` | `velX` | int | 本帧实际位移速度 X。 |
| `x` | `velY` | int | 本帧实际位移速度 Y。 |
| `y` | `targetVelX` | int | 目标速度 X（加速度逼近的目标）。 |
| `z` | `targetVelY` | int | 目标速度 Y。 |
| `A` | `accelX` | int | 加速度 X。 |
| `B` | `accelY` | int | 加速度 Y。 |
| `C` | `maxVelX` | int | 速度上限 X（默认15360）。 |
| `D` | `maxVelY` | int | 速度上限 Y（默认15360）。 |
| `E` | `drawAlpha` | int | 绘制透明度/特效参数。 |
| `F` | `palette` | int | 绘制调色板/颜色组索引。 |
| `G` | `reserved` | int | 保留字段，未在本类使用。 |
| `H` | `actionHighByte` | int | 动作码高字节（0xFF000000 掩码部分）。 |
| `I` | `layer` | int | 渲染层级（取自 LevelScene.h[typeId]）。 |
| `J` | `hitFlashTimer` | int | 受击闪烁计时（控制隔帧绘制）。 |
| `K` | `collisionTypeMask` | int | 碰撞类型位掩码；0 表示不参与碰撞遍历。（与 ProjectileActor 的实例字段 `collisionMask` 区分） |
| `L` | `canvas` | GameCanvas | 所属主控画布 tjge.a。 |
| `M` | `drawThisFrame` | boolean | 本帧是否绘制（隔帧绘制开关，默认true）。 |
| `N` | `idCounter` | int | 静态唯一ID计数器（每实例步进1000000）。 |
| `O` | `uniqueId` | int | 本实体唯一ID（动作变更时自增，用于接触去重）。 |
| `P` | `lastContactId` | int | 上次记录的接触对象唯一ID。 |

## TileSheet  （原 `tjge.i`）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `()V` | `constructor` | 私有无参构造，仅由静态工厂 a(int) 内部 new 出空实例 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIII)V` | `drawCell` | 绘制第 n3 张 cell：依据高位的翻转(a/b)与 0x3000 旋转码查 f 表得 transform，setClip 后用 drawRegion 从 d[n4] 切图贴出 |
| `a` | `(I)Ltjge/i;` | `loadFromBin` | 静态工厂：从 /res/t.bin 第 n 条解析 cell 切片表(源XY/宽/高)并加载 actorPng 主图(含换色帧)，失败返回 null |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `flipHorizontalBit` | int | 静态：水平翻转请求位掩码 = Integer.MIN_VALUE (0x80000000)，与 cell 索引高位按位与判定是否水平翻转并左移目标 x |
| `b` | `flipVerticalBit` | int | 静态：垂直翻转请求位掩码 = 0x40000000，判定是否垂直翻转并上移目标 y |
| `f` | `transformTable` | int[][] | 静态 final int[4][4]：旋转码(0x3000 的四档)×翻转状态(n7=0..3) → drawRegion transform 常量映射表 |
| `g` | `cellCount` | short | cell(切片)数量，决定 h/i/j/c 四个数组的长度 |
| `h` | `cellSrcX` | short[] | 每个 cell 在 PNG 主图上的源 X 坐标 |
| `i` | `cellSrcY` | short[] | 每个 cell 在 PNG 主图上的源 Y 坐标 |
| `j` | `cellWidth` | short[] | 每个 cell 的宽(0..255，读字节后负值补 256) |
| `c` | `cellHeight` | short[] | public：每个 cell 的高(0..255，读字节后负值补 256) |
| `d` | `imageFrames` | javax.microedition.lcdui.Image[] | public：PNG 图像帧数组；n5>1 时含换色帧(由 PLTE 段补丁生成的多配色帧) |
| `e` | `currentImage` | javax.microedition.lcdui.Image | public：当前绘制所用图像，drawCell 中临时赋为 d[n4] 再传给 drawRegion |

## LevelScene  （原 `tjge.j`）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `()V` | `LevelScene` | 私有无参构造器，仅由静态工厂 b(a,int) 创建实例。 |
| `a` | `()V` | `buildDrawList` | 每帧重建绘制列表：触发当前屏的 spawn 触发器，收集活动 actor 到 f[]，再调用各 actor 的 i()/b() 步进。 |
| `a` | `(Z)V` | `updateCameraTarget` | 按布尔参数计算相机目标 E/F：true 跟随玩家（带前导偏移），false 回到缓存目标 A/B。 |
| `b` | `()V` | `tick` | 主每帧逻辑：设置相机目标、跑子状态机 w(0-6)、推进相机与卷屏并切屏。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;)V` | `render` | 每帧绘制：按层(I)对 f[] 冒泡排序、绘制所有 actor、绘制 HUD/过场遮罩。 |
| `e` | `()V` | `runCutscene` | 剧情对话子状态机，按 i[0]/i[1]/M/N 推进 Boss 出场、对白、编队脚本等。 |
| `f` | `()V` | `runDialogChoice` | 对话翻页/选项结算（状态 4）：按计时与玩家输入 H/I 推进对话分支并跳转。 |
| `c` | `(Ljavax/microedition/lcdui/Graphics;)V` | `renderDialogBar` | 绘制底部对话框 HUD（边框、按钮、对话文本），并采集本帧的翻页/选项输入。 |
| `a` | `(I)V` | `setSubState` | 切换子状态 w 并记录上一态 x、重置内部计步 M/N；状态 2/4 含进入初始化。 |
| `b` | `(Ljavax/microedition/lcdui/Graphics;)V` | `renderHud` | 绘制主 HUD：血条、生命数、当前武器编号/弹药数及选中武器框。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;III)V` | `fillBlackBand` | 静态：在指定 y 区域填充黑色横条（过场遮罩）。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIZZ)I` | `drawNumber` | 静态：用字模右对齐绘制最多 5 位十进制数（可带前导符与零填充），返回左端 x。 |
| `a` | `(II)V` | `loadCell` | 切到给定地图坐标所在的分屏单元，重置触发器/标志、清 actor 池、spawn 该屏常驻 actor 并复位相机。 |
| `b` | `(I)V` | `runTrigger` | 测试编号 n 的触发器：若玩家进入其矩形区域则以 true 触发，否则以 false。 |
| `b` | `(II)V` | `switchCell` | 卷屏跨单元时差量更新常驻 actor：回收离屏 actor、spawn 新进屏 actor。 |
| `c` | `(II)Ltjge/h;` | `spawnActor` | 从 actor 池取空闲槽生成一个 actor：n2>=0 用实例数据，n2<0 用动态槽位并设绘制层。 |
| `a` | `(IZ)V` | `fireTrigger` | 执行编号 n 的触发器动作（按子类型 0-3：设朝向/弹幕波次/剧情/编队），bl=false 处理退出。 |
| `c` | `()V` | `spawnWave` | 按 Q[] 弹幕参数生成一波敌机：随机数量/类型/方向，逐个写 R[] spawn 缓冲并入场。 |
| `d` | `()V` | `dispose` | 释放关卡：销毁相机、对话 actor、清空 actor/触发器/实例表并置空引用。 |
| `a` | `(Ltjge/a;II)V` | `allocActorPool` | 静态：为类型 n 分配 n2 个 actor 实例的对象池（若已分配则跳过）。 |
| `c` | `(I)V` | `loadActorDef` | 静态：加载类型 n 的 SpriteDef 并标记已加载、置位 TileSheet 引用标志。 |
| `a` | `(Ltjge/a;I)Z` | `loadResourcesUpTo` | 静态：按 O[] 表分批加载前 n 项的 actor 定义与对象池；n==3 时加载 HUD 字模，返回是否全部加载完。 |
| `b` | `(Ltjge/a;I)Ltjge/j;` | `loadLevel` | 静态工厂：从 /res/s.bin 第 n 关解析相机/触发器/实例/分屏 spawn 表，构造 LevelScene 实例。 |
| `<clinit>` | `()V` | `staticInit` | 静态初始化块：分配 h/b/d/P/c/f/Q/R/i/j/k/O 数组、置 z=-1（h 与 O 在 j.java 中亦于本块内赋值——j.java:31/72 为裸声明、j.java:1349/1361 在 static 块内赋值；TS port LevelScene.ts 则把它们内联到声明处）。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `camera` | TileMap | 静态：当前关卡相机/视口（tjge.b）。 |
| `b` | `actorDefs` | SpriteDef[] | 静态：actor 类型→精灵动作集（tjge.d[]，长度 28）。 |
| `c` | `actorDefLoaded` | boolean[] | 静态：actor 类型已加载标志（长度 28）。 |
| `d` | `actorPool` | ActorBase[][] | 静态：actor 对象池[类型][槽位]（tjge.h[][]，外层长 28）。 |
| `e` | `activeActors` | ActorBase[] | 静态：活动 actor 槽位表（tjge.h[]，常驻槽 + 30 动态槽）。 |
| `P` | `cellSpawnBuffer` | byte[] | 静态私有：切屏时新进屏 actor 实例索引临时缓冲（长度 28）。 |
| `f` | `drawList` | ActorBase[] | 静态：本帧绘制列表（tjge.h[]，长度 40）。 |
| `g` | `drawCount` | int | 静态：本帧绘制列表中的 actor 数。 |
| `h` | `actorDrawLayer` | int[] | 静态 final：actor 类型→绘制层(I) 映射表。 |
| `Q` | `triggerParams` | int[] | 静态私有：触发器/弹幕波次参数缓冲（长度 7）。 |
| `R` | `spawnBytes` | byte[] | 静态私有：spawn 一个 actor 的字节参数缓冲（长度 11）。 |
| `i` | `cutsceneState` | int[] | 静态：剧情/对话状态数组（长度 5）。 |
| `j` | `dialogState` | int[] | 静态：对话结算/翻页状态数组（长度 3）。 |
| `k` | `formationState` | int[] | 静态：编队/护卫机状态数组（长度 4）。 |
| `l` | `triggerTable` | byte[][] | 触发器记录表（每条触发器的字节数据）。 |
| `m` | `actorInstanceTable` | byte[][] | actor 实例记录表（每个常驻实例的字节数据）。 |
| `n` | `triggerHitFlags` | boolean[] | 触发器一次性命中标志（与 l 对应）。 |
| `o` | `triggerFiredFlags` | boolean[] | 触发器已执行标志（一次性触发器置位后不再触发）。 |
| `S` | `cellWidth` | int | 私有：分屏单元宽度（用于坐标→单元索引换算）。 |
| `T` | `cellHeight` | int | 私有：分屏单元高度。 |
| `p` | `cellTriggers` | byte[][] | 每个分屏单元的 spawn 触发器索引列表。 |
| `q` | `cellActors` | byte[][] | 每个分屏单元的常驻 actor 实例索引列表。 |
| `U` | `cellCount` | int | 私有：分屏单元总数。 |
| `r` | `currentCell` | int | 当前所在分屏单元索引。 |
| `V` | `globalActorCount` | int | 私有：全局常驻 actor 索引表长度。 |
| `s` | `residentActorSlots` | int | 常驻 actor 槽位数（动态槽起点）。 |
| `t` | `globalActors` | byte[] | 全局常驻 actor 实例索引列表（进关即 spawn）。 |
| `u` | `mapWidth` | int | 地图像素宽度。 |
| `v` | `mapHeight` | int | 地图像素高度。 |
| `w` | `subState` | int | 当前子状态机状态（0-6）。 |
| `x` | `prevSubState` | int | 上一子状态（用于状态返回）。 |
| `y` | `transitionMaskHeight` | int | 过场遮罩高度（状态 2/3 渐入渐出）。 |
| `z` | `currentLevel` | int | 静态：当前关卡号（初始 -1）。 |
| `W` | `verticalScrollY` | int | 私有：纵向卷屏的相机 y。 |
| `A` | `cameraTargetCacheX` | int | 相机目标缓存 x（脚本临时锚点）。 |
| `B` | `cameraTargetCacheY` | int | 相机目标缓存 y。 |
| `C` | `waveSpawnCount` | int | 本波生成的敌机数。 |
| `D` | `reservedD` | int | 保留字段（loadCell 中清零，未见其他使用）。 |
| `E` | `cameraTargetX` | int | 本帧相机目标 x。 |
| `F` | `cameraTargetY` | int | 本帧相机目标 y。 |
| `G` | `diagonalFormationToggle` | int | 斜向编队左右交替切换标志。 |
| `H` | `dialogAdvancePressed` | boolean | 对话推进（确认）输入标志。 |
| `I` | `dialogPagePressed` | boolean | 对话翻页（选项切换）输入标志。 |
| `J` | `isVerticalScrollLevel` | boolean | 当前关是否为纵向卷屏关（L.k==6）。 |
| `X` | `dialogActor` | BossActor | 私有：对话/特效 actor（tjge.c）。 |
| `K` | `hudFont` | TileSheet | 静态：HUD 字模/图标表（tjge.i）。 |
| `L` | `canvas` | GameCanvas | 主控/画布（tjge.a），持有玩家 y、相机 m/n、视口 q/r 等。 |
| `M` | `cutsceneStep` | int | 静态：子状态内部计步器（主）。 |
| `N` | `cutsceneSubStep` | int | 静态：子状态内部计步器（次/辅助）。 |
| `O` | `resourceLoadTable` | int[][] | 静态 final：关卡资源加载表[类型, 实例数]。 |

## ProjectileActor  （原 `tjge.k`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `k` | `(ILtjge/d;)V` | `constructor` | 构造投射物 Actor，转交类型 ID 与精灵定义给基类 h(int, d) |
| `b` | `()V` | `update` | 每帧更新：按类型(子弹/手雷/追踪弹)推进运动、检测撞墙/命中/出界，触发爆炸或回收 |
| `c` | `(Ltjge/h;)V` | `onCollide` | 与另一 Actor 碰撞时回调：依对方类型置撞墙标志或命中标志 |
| `a` | `(IIIII[I)Ltjge/k;` | `spawnProjectile` | 静态工厂：从主控对象池取一个投射物实例并按坐标/动作/碰撞掩码初始化后返回 |
| `m` | `()I` | `getDamage` | 返回当前伤害/碰撞层掩码：子弹/手雷查表，类型12返3，类型9返2，否则0 |
| `a` | `()Z` | `checkFloorCollision` | 向下扫描瓦片检测是否撞到地面，命中则归零垂直速度并修正位移（ProjectileActor 自有方法，与基类 collideDown(l()) 区分） |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `collisionMaskTable` | int[] | 静态表：子弹动作索引(l)→碰撞层掩码(1=子弹,3=手雷,0=无碰撞)，供 m() 查表 |
| `b` | `timer` | int | 计数/计时器：手雷倒计时、追踪弹的追踪计数(=8 时锁定玩家方向) |
| `f` | `frameTicks` | int | 帧计时器，每帧自增，超过 30 触发超时回收 |
| `c` | `collisionMask` | int | 当前生效的碰撞层掩码(默认 3，撞墙判定时与瓦片属性按位与) |
| `Q` | `exploded` | boolean | 命中/爆炸触发标志 |
| `d` | `hitWall` | boolean | 撞墙标志 |
| `R` | `expired` | boolean | 出界/超时回收标志 |
| `e` | `isSpecialGrenade` | boolean | 特殊手雷标志：为真时启用对玩家的直接命中判定与受击反馈 |

