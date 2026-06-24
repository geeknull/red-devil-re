# 红魔特种兵 (game1) — 符号词典 (SYMBOLS)

> **派生文档，非权威。** 逻辑以 `2-decompiled-cfr/tjge/*.java` 为准；本表只是把混淆后的单字母
> 类名/方法名/字段名映射到有意义的名字，用于阅读与后续生成 `3-readable/`（本目录） 可读副本。
> 命名约定：演员类（继承 ActorBase 者）统一为 `*Actor` 后缀（BossActor/EffectActor/PlayerActor/ActorBase/EnemyActor/PickupActor/ProjectileActor）；引擎/资源/屏幕/入口类沿用各自语义名（GameScreen/TileMap/SpriteDef/SpriteAtlas/LevelLoader/GameMIDlet）。源：CFR 反编译 + TS 移植头注 + 保真审计结论。

## 类总览

| 原 | 友好类名 | 继承 | 职责 |
|---|---|---|---|
| `GameMIDlet` | **GameMIDlet** | MIDlet | MIDlet 入口，持有主 Canvas/Display/全局 Random，提供资源流定位、小端读取、随机数与 3 字节存档等静态工具及菜单文案表 |
| `a` | **GameScreen** | com.nokia.mid.ui.FullCanvas | 主 Canvas + 主循环 Runnable，持有地图/精灵库/主角/敌阵/Boss/绘制队列与状态机字段 p，驱动输入、更新与绘制（最核心类） |
| `b` | **TileMap** | java.lang.Object | 瓦片地图引擎：解析 f.bin（RLE 行数据），用离屏缓冲做增量滚动重绘并绘制瓦片地图 |
| `c` | **BossActor** | ActorBase | Boss 演员，继承 Actor 基类 g，含多段子状态机与受击闪烁/禁用等标志位 |
| `d` | **SpriteDef** |  | 精灵帧定义：解析 a.bin（pose 拼帧 + sequence 序列 + 碰撞箱），提供按 pose 逐块拼帧绘制 |
| `e` | **EffectActor** | ActorBase | 特效/通用交互演员，继承 g，按类型 id 扮演炸弹/手雷/触发器/感应器/可破坏物等 |
| `f` | **PlayerActor** | ActorBase | 玩家演员，继承 g：移动/跳跃/重力物理、3 把武器与弹药/换弹、输入响应与动作状态机 |
| `g` | **ActorBase** | java.lang.Object | 演员基类（被 c/e/f/h/k/l 继承）：定点坐标/速度/加速度/上限与帧动画，提供可覆写的更新/绘制/物理步进/落地检测 |
| `h` | **EnemyActor** | ActorBase | 敌人演员，继承 g：巡逻/瞄准/攻击 AI、血量与受击闪烁、刷怪与命数管理 |
| `i` | **SpriteAtlas** |  | 精灵图集：解析 t.bin（小图表 + RGB4444 调色板 + 4bit packed 像素），按翻转/旋转贴出单张小图 |
| `j` | **LevelLoader** | java.lang.Object | 关卡加载器/屏块流式管理：解析 s.bin（敌人类型表/精灵布置表/屏块表），按摄像机屏块逐帧加载卸载演员并维护精灵定义引用计数 |
| `k` | **PickupActor** | ActorBase | 道具/拾取物演员，继承 g：拾取后闪烁倒计时与升空特效，按子类型区分行为 |
| `l` | **ProjectileActor** | ActorBase | 子弹/抛射物实体，继承 g：弹道推进、与敌人/地形/玩家碰撞检测、命中伤害与特效触发 |

---

## GameMIDlet  （原 `tjge.GameMIDlet`, extends MIDlet）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `GameMIDlet` | `()V` | `GameMIDlet` | Constructor: creates the global Random and seeds it with the current system time. |
| `pauseApp` | `()V` | `pauseApp` | MIDlet lifecycle pause hook: if the screen is in the in-level playing state (p==10), resets the menu selection (y=0), clears the input queue (f()/clearInputQueue, body `an=0;ao=0` at a.java:1788), then transitions the screen into the paused state (p=13). No audio is saved or stopped. |
| `startApp` | `()V` | `startApp` | MIDlet lifecycle start hook: sets the GameScreen as the current displayable. |
| `destroyApp` | `(Z)V` | `destroyApp` | MIDlet lifecycle destroy hook: clears the current displayable (sets it to null). |
| `a` | `(I)I` | `nextRandomMod` | Returns a non-negative pseudo-random int in [0, n): takes abs(Random.nextInt()) modulo n. |
| `a` | `(Ljava/io/InputStream;)S` | `readU16Le` | Reads a little-endian 16-bit value (low byte unsigned, high byte signed) from the stream and returns it as a short. |
| `b` | `(Ljava/io/InputStream;)B` | `readByte` | Reads a single signed byte from the stream. |
| `c` | `(Ljava/io/InputStream;)I` | `readI32Le` | Reads a little-endian 32-bit integer from the stream using the shared 4-byte buffer. |
| `a` | `(Ljava/lang/String;I)Ljava/io/InputStream;` | `openArchiveEntryStream` | Opens the named resource as a .bin archive and returns a stream positioned at the start of entry n by reading the entry-count and offset table; returns null on failure. |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `screen` | GameScreen | The main game Canvas/screen instance (tjge.a), constructed with this MIDlet; drives all rendering, input and game-state. |
| `b` | `display` | Display | The LCDUI Display obtained for this MIDlet, used to set the current displayable. |
| `c` | `random` | Random | Static global pseudo-random number generator, seeded from system time at construction; shared across the game. |
| `d` | `readBuffer` | byte[] | Static shared 4-byte scratch buffer used by the little-endian read helpers and archive seeking. |
| `e` | `menuTexts` | String[] | Static menu/UI text table (Chinese): new game / continue / select mission / sound on / help / about / quit / sound off / return to game / menu. |

## GameScreen  （原 `tjge.a`, extends com.nokia.mid.ui.FullCanvas）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `(Ltjge/GameMIDlet;)V` | `constructor` | 构造：保存 MIDlet、读取屏幕宽高、置初始状态 p=1、启动主循环线程、分配像素缓冲 J[3600] |
| `a` | `(ILtjge/d;)Ltjge/g;` | `createActor` | 工厂：按精灵类型 id 与精灵定义 SpriteDef 创建对应 actor（PlayerActor/ProjectileActor/EnemyActor/EffectActor/PickupActor/BossActor/ActorBase） |
| `paint` | `(Ljavax/microedition/lcdui/Graphics;)V` | `paint` | 框架绘制+状态机主分发：依 p 渲染 logo/菜单/载入/简报/过场/游戏中/结算/片尾/暂停/帮助/死亡各状态 |
| `a` | `()V` | `updateWorld` | 每帧逻辑更新：重建绘制队列、对所有 actor 调 e()/a() 更新、推进摄像机滚动 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;)V` | `renderWorld` | 渲染游戏世界：画地图层、绘制队列里的 actor、HUD（血条/武器/弹数/计分等） |
| `b` | `()V` | `initCamera` | 关卡开始时按主角出生点初始化摄像机 r/s 偏移并夹紧到地图边界 |
| `c` | `()V` | `updateCamera` | 按当前关卡 x 的脚本推进摄像机/触发剧情点（强制滚动、触发 Boss、空降增援等），并夹紧边界 |
| `d` | `()V` | `initGameResources` | 首次初始化：分配绘制队列 k[40] 与子弹池 l[5][]，加载精灵库、音效、读存档 |
| `a` | `(I)V` | `loadLevelStep` | 分步关卡加载状态机（w 计数）：逐步加载地图、各类子弹/敌兵/Boss 池并初始化主角与关卡变量 |
| `run` | `()V` | `run` | 主循环线程：按步长 W 限帧、System.gc、repaint |
| `h` | `(I)I` | `keyCodeToAction` | 把物理键码映射为动作位掩码（上下左右/确认/返回/开火/换武器等），随当前状态 p 区分游戏内外含义 |
| `keyPressed` | `(I)V` | `keyPressed` | 框架按键按下：处理软键进暂停/简报/返回，其余转 keyCodeToAction 后入队 |
| `keyReleased` | `(I)V` | `keyReleased` | 框架按键抬起：清除当前持续按键标记 q |
| `a` | `(IIIIII)Ltjge/l;` | `spawnProjectile` | 从对应子弹池取一个空闲 Projectile 并按类型/坐标/方向/朝向激活，返回该子弹 |
| `e` | `()V` | `releaseLevel` | 释放当前关资源：清绘制队列、销毁敌兵阵/Boss/主角载具引用、释放精灵库、gc |
| `b` | `(I)Z` | `isPickupType` | 判断给定精灵类型是否为拾取物（3/8/11/13），用于绘制队列排序优先级 |
| `b` | `(IIIIII)Z` | `spawnEnemyWave` | 生成一波敌兵：从敌兵阵取空闲槽，按编队模式(n6)布置位置/动作/挂载阴影特效，返回是否填满请求数量 |
| `a` | `(II)Z` | `spawnBossAttack` | 触发 Boss 投弹攻击：激活 Boss 及其子弹 actor 并设定坐标/朝向/速度 |
| `h` | `()I` | `pollInputAction` | 从输入环形队列出队一个动作码（队空返回0） |
| `a` | `(IZ)V` | `enqueueInputAction` | 把一个动作码（可带 INT_MIN 标志位）压入输入环形队列，处理满队覆盖 |
| `f` | `()V` | `clearInputQueue` | 清空输入环形队列读写指针 an/ao |
| `i` | `()V` | `spawnAirdropWave` | 第4关空降增援逻辑：按节奏 A 生成空降敌兵波并投放降落伞 Boss 子弹 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;I)V` | `fillScreenColor` | 用单色（由帧号 n 解码的 RGB4444）填满整屏的过场/闪屏效果 |
| `b` | `(Ljavax/microedition/lcdui/Graphics;)V` | `blitPixelBuffer` | 把像素缓冲 J 经 DirectGraphics.drawPixels 分 13 条贴满整屏 |
| `c` | `(I)V` | `accessSaveData` | RMS 存档读写：n=0 写、n=1 读 3 字节存档 Q（最高关/当前关/音效开关） |
| `b` | `(Ljavax/microedition/lcdui/Graphics;IIIII)Z` | `drawBriefingAnim` | 播放结算/简报动画帧：按帧索引绘制指定精灵帧，返回该序列是否播放到末帧 |
| `j` | `()V` | `resetSpawnPools` | 重置所有子弹池与敌兵阵的存活标志 p=false（关卡复位） |
| `b` | `(Ljavax/microedition/lcdui/Graphics;I)V` | `drawBriefingScreen` | 绘制任务简报界面：标题、注意事项、相关插画与文本框（依关卡 x 选内容） |
| `d` | `(I)Z` | `isScrollLevel` | 静态：判断给定精灵类型是否随地图滚动（1/2/8/10/15/16/20/21） |
| `a` | `(J)Ljava/lang/String;` | `formatTime` | 静态：把毫秒时长格式化为 分:秒 字符串（用于结算用时显示） |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIZZ)V` | `drawNumber` | 用 HUD 数字图块绘制多位整数（可选高亮色与前导图标） |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIII)V` | `fillRectClipped` | 静态：设裁剪+设色+填充矩形的便捷封装 |
| `e` | `(I)V` | `spawnExplosionScatter` | 在摄像机视野内随机散布两处爆炸特效并播放音效（炸弹/地雷场景） |
| `c` | `(Ljavax/microedition/lcdui/Graphics;)V` | `drawReturnHint` | 在帮助/关于界面底部闪烁绘制"按任意键返回"提示 |
| `k` | `()V` | `animateCursorExpand` | 菜单光标横线的呼吸式伸缩动画推进（aj 在 48~64 间往返） |
| `l` | `()V` | `resetCursorAnim` | 重置菜单光标动画状态（aj=42、向外扩张） |
| `f` | `(I)Ljavax/microedition/lcdui/Image;` | `loadImageFromBin` | 静态：从 /res/image.bin 归档按索引 n 解出一张 Image |
| `hideNotify` | `()V` | `hideNotify` | 框架：失去焦点时若在游戏中则自动进暂停菜单 |
| `g` | `()V` | `loadSounds` | 静态：从 /res/sound.bin 归档加载全部音效到 S[] |
| `a` | `(III)V` | `playSound` | 静态：按索引播放音效（受音效开关 Q[2] 与忙判定约束，设增益） |
| `g` | `(I)V` | `loadTextFromBin` | 从 /res/x.bin 归档按索引 n 解出 UTF 文本到静态 U（简报/帮助文案） |
| `a` | `(Ljavax/microedition/lcdui/Graphics;III)V` | `drawWrappedText` | 从首行起按回车(13)逐行绘制文本 U（行距 n3） |
| `b` | `(Ljavax/microedition/lcdui/Graphics;III)V` | `drawTextLine` | 绘制文本 U 中第 n 行（按回车分隔）单行 |
| `<clinit>` | `()V` | `staticInit` | 静态初始化块：设输入队列容量 P=4、存档 Q={0,0,1}、音效数 R=6、任务编号汉字串 V |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `screenWidth` | int | 静态：屏幕宽度（像素，运行时由 getWidth 覆盖，初值176） |
| `b` | `playHeight` | int | 静态：可玩区高度（屏高减32的HUD条，初值176） |
| `c` | `viewWidthFx` | int | 静态：定点制屏宽（屏宽<<10，用于摄像机定点运算，初值180224） |
| `d` | `screenHeight` | int | 静态：屏幕全高（含HUD，初值208） |
| `e` | `instance` | GameScreen | 静态：本类单例引用 |
| `W` | `frameStepMs` | long | 主循环每帧目标步长（毫秒，100） |
| `X` | `running` | boolean | 主循环运行标志（true 才 repaint） |
| `Y` | `painting` | boolean | paint 进行中标志（防重入，paint 中跳过主循环 repaint） |
| `Z` | `levelLoaded` | boolean | 关卡分步加载完成标志（载入态据此切到简报态） |
| `aa` | `loopThread` | Thread | 主循环线程对象 |
| `ab` | `midlet` | GameMIDlet | 所属 MIDlet 引用（用于 notifyDestroyed） |
| `f` | `tileMap` | TileMap | 当前关卡地图（protected） |
| `g` | `levelLoader` | LevelLoader | 当前关精灵/关卡装载器（protected） |
| `h` | `hudImage` | Image | HUD/通用图块图像（数字、血条等贴图源，也复用作 logo 临时图） |
| `i` | `menuImage` | Image | 菜单/logo/闪屏临时图像 |
| `j` | `player` | PlayerActor | 主角 actor |
| `k` | `drawQueue` | ActorBase[] | 本帧绘制/更新队列（容量40） |
| `l` | `projectilePools` | ProjectileActor[][] | 按类型分组的子弹/特效对象池（5组） |
| `m` | `enemyGrid` | EnemyActor[][] | 敌兵编队池（2行×3列） |
| `n` | `boss` | BossActor | 当前 Boss actor（仅部分关卡） |
| `o` | `frameCounter` | int | 全局帧计数（paint 每帧自增，用于动画相位） |
| `p` | `state` | int | 状态机当前状态（1开机/4菜单/2载入/22简报/10游戏中/16完成/18失败/15片尾/13暂停/3帮助/6关于/20死亡等） |
| `q` | `heldKeyAction` | int | 当前按住的动作码（keyReleased 清零，用于状态跳出判定） |
| `r` | `cameraX` | int | 摄像机X偏移（定点 <<10） |
| `s` | `cameraY` | int | 摄像机Y偏移（定点 <<10） |
| `t` | `cameraVelX` | int | 摄像机X滚动速度（定点） |
| `u` | `cameraVelY` | int | 摄像机Y滚动速度（定点） |
| `v` | `drawQueueCount` | int | 本帧绘制队列实际元素数 |
| `w` | `stateTimer` | int | 当前状态内的帧/步计数器（各状态语义不同） |
| `x` | `levelIndex` | int | 当前关卡编号（0..7） |
| `y` | `menuSelection` | int | 当前菜单/列表选中项索引 |
| `z` | `enemyAliveCount` | int | 存活敌兵计数（含编队/Boss子单位） |
| `A` | `airdropWaveCount` | int | 已生成空降增援波次计数（第4关节奏控制） |
| `B` | `reinforceBudget` | int | 剩余增援/补给投放配额 |
| `C` | `killCount` | int | 本关击毙敌人数（结算显示） |
| `D` | `levelStartMs` | long | 关卡开始时间戳/用时（结算时转为耗时） |
| `E` | `flagE` | boolean | 关卡事件/解谜闸门：loadLevelStep case9 置 false（a.java:1415），由拾取物 type13（PickupActor）触碰置 true（k.java:97），并被 PickupActor 读取（k.java:99）、type12 特效演员 EffectActor 的 update（e.java:87）与 paint（e.java:208）读取以门控其逻辑/绘制。GameScreen.paint 本身不读取，但 EffectActor/PickupActor 会读取——非遗留字段。 |
| `F` | `taskSelectIndex` | int | 调试任务选择子菜单的当前任务索引（ae 模式下） |
| `G` | `hudBlinkCounter` | int | HUD/光标/提示闪烁与刷新计数（多处复用作高亮相位） |
| `H` | `menuVisibleMax` | int | 主菜单当前可见/动画展开到的项索引上界 |
| `I` | `animFrameIndex` | int | 结算/简报动画当前帧索引 |
| `J` | `pixelBuffer` | short[] | RGB4444 像素缓冲（3600，用于整屏换色/闪屏与暂停马赛克） |
| `K` | `directGraphics` | com.nokia.mid.ui.DirectGraphics | DirectGraphics 句柄（drawPixels 贴像素缓冲用） |
| `L` | `scriptFlagL` | boolean | 关卡脚本阶段标志（摄像机/剧情触发的第一段是否已激活） |
| `M` | `showIndicator` | boolean | 是否显示屏边方向/距离指示器（updateCamera 中按关卡置位） |
| `N` | `indicatorToggle` | boolean | 指示器左右抖动/交替方向开关 |
| `O` | `indicatorValue` | int | 指示器显示的数值（剩余敌数/距离等） |
| `ac` | `scriptStageAc` | int | 关卡脚本子阶段计数（部分关用作触发计数/目标摄像机X） |
| `ad` | `bossTriggerX` | int | 第7关追逐：Boss 追击触发/推进的世界X基准 |
| `ae` | `inTaskSelectMenu` | boolean | 是否处于调试任务选择子菜单 |
| `af` | `isCutsceneEntry` | boolean | 进入关卡是否走过场入场（影响载入后切到过场态14） |
| `ag` | `levelResourcesReady` | boolean | 关卡资源已就绪标志（避免重复加载/触发资源释放） |
| `ah` | `menuActive` | boolean | 主菜单是否已展开并可交互（菜单项滚出动画完成后置 true） |
| `ai` | `cursorExpanding` | boolean | 菜单光标呼吸动画方向（扩张/收缩） |
| `aj` | `cursorWidth` | int | 菜单光标横线当前宽度（动画值） |
| `ak` | `creditScrollX` | int | 片尾滚动元素X位置（初值-176） |
| `al` | `creditScrollX2` | int | 片尾第二滚动元素X位置（初值-20） |
| `P` | `inputQueueCap` | int | 静态：输入环形队列容量（4） |
| `am` | `inputQueue` | int[] | 静态：输入动作环形队列存储 |
| `an` | `inputWriteIndex` | int | 静态：输入队列写指针 |
| `ao` | `inputReadIndex` | int | 静态：输入队列读指针 |
| `Q` | `saveData` | byte[] | 静态：3字节存档[最高解锁关, 当前关, 音效开关]（初值{0,0,1}） |
| `R` | `soundCount` | int | 静态：音效数量（6） |
| `S` | `sounds` | com.nokia.mid.sound.Sound[] | 静态：已加载音效数组 |
| `T` | `currentSoundIndex` | int | 静态：当前正在播放的音效索引（-1为无） |
| `U` | `currentText` | String | 静态：当前从 x.bin 解出的文本（简报/帮助文案） |
| `V` | `taskNumberChars` | String | 静态：任务编号汉字串"一二三四五六七八" |

## TileMap  （原 `tjge.b`, extends java.lang.Object）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>(II)V` | `private b(int n, int n2)` | `constructor` | Private constructor; stores viewport width/height (a,b) and sets scale divisor i to 1. |
| `a(II)V` | `public final void a(int n, int n2)` | `setViewportOrigin` | Sets current viewport top-left (j,k) from pixel coords divided by scale divisor i. |
| `a()I` | `public final int a()` | `getPixelWidth` | Returns total map pixel width = tileWidth(g) * mapColumns(e). |
| `b()I` | `public final int b()` | `getPixelHeight` | Returns total map pixel height = tileHeight(h) * mapRows(f). |
| `a(Ljavax/microedition/lcdui/Graphics;)V` | `public final void a(Graphics graphics)` | `draw` | Draws the map at the current viewport origin (j,k) using viewport size (a,b). |
| `a(IIZ)I` | `public final int a(int n, int n2, boolean bl)` | `queryColumnTileAt` | Looks up the RLE-encoded tile/collision value at cell index n within column n2; out-of-range returns 0/1/3 depending on solidFlag bl. |
| `b(II)I` | `protected final int b(int n, int n2) throws Exception` | `resolveTileIndex` | Resolves the block-index-table tile id for pixel position (n,n2), wrapping by block dimensions; throws on negative index. |
| `c()V` | `public final void c()` | `invalidateBuffer` | Marks the off-screen buffer's drawn-window as invalid by resetting y,z to -1. |
| `a(ZII)V` | `private void a(boolean bl, int n, int n2)` | `setupOffscreenBuffer` | Allocates (or clears) the static off-screen buffer u sized to cover viewport plus one tile margin, then invalidates it; bl=false frees the buffer. |
| `a(Ljavax/microedition/lcdui/Graphics;IIIIII)V` | `protected final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6)` | `renderTileRegion` | Renders the tile region from (n,n2) to (n3,n4) into a buffer of size (n5,n6), wrapping coordinates and blitting tiles from atlas t. |
| `b(Ljavax/microedition/lcdui/Graphics;IIIIII)V` | `protected final void b(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6)` | `blitBufferRegion` | Clips to (n5,n6,n3,n4) and blits a sub-region of off-screen buffer u to the destination, offset by (n,n2). |
| `a(Ljavax/microedition/lcdui/Graphics;IIII)V` | `protected final void a(Graphics graphics, int n, int n2, int n3, int n4)` | `drawViewport` | Incrementally redraws only newly-scrolled rows/cols into the off-screen buffer, then blits the (wrapped) viewport rectangle (n,n2,n3,n4) to graphics. |
| `d()V` | `public final void d()` | `dispose` | Frees the per-column RLE data array d and the block index table s. |
| `a(III)Ltjge/b;` | `public static final b a(int n, int n2, int n3)` | `loadFromBin` | Static factory: reads map header and RLE column data from /res/f.bin entry n, loads the tile atlas, allocates buffers, and returns a TileMap (or null on error). |
| `a(I)V` | `public final void a(int n)` | `reloadColumnData` | Reloads only the per-column RLE data from /res/f.bin entry n into existing array d, skipping the header and block index table. |
| `c(II)Z` | `public final boolean c(int n, int n2)` | `clearTileAt` | Like queryColumnTileAt but destructive: locates the RLE run for cell n in column n2 and zeroes its tile value, returning success. |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `viewportWidth` | int | Viewport width in pixels (public). |
| `b` | `viewportHeight` | int | Viewport height in pixels (public). |
| `d` | `columnRleData` | byte[][] | Per-column RLE-encoded tile/collision data; d[col][0] is the run type marker (0/1/2). |
| `e` | `mapColumns` | int | Map width in tiles (columns). |
| `f` | `mapRows` | int | Map height in tiles (rows). |
| `g` | `tileWidthPx` | int | Tile width in pixels (copied from n). |
| `h` | `tileHeightPx` | int | Tile height in pixels (copied from o). |
| `i` | `scaleDivisor` | int | Scale divisor used to convert pixel coords to viewport origin; fixed at 1. |
| `j` | `viewportOriginX` | int | Current viewport top-left X coordinate. |
| `k` | `viewportOriginY` | int | Current viewport top-left Y coordinate. |
| `l` | `mapTileWidth` | int | Map width in tiles (from header; used in allocation/skip math). |
| `m` | `mapTileHeight` | int | Map height in tiles (from header; used in allocation/skip math). |
| `n` | `tileWidth` | int | Tile width in pixels (from header). |
| `o` | `tileHeight` | int | Tile height in pixels (from header). |
| `p` | `blockColumns` | int | Number of block columns (horizontal block division of the map). |
| `q` | `blockRows` | int | Number of block rows (vertical block division of the map). |
| `r` | `atlasTilesPerRow` | int | Tiles per row in the atlas image = atlas width / tileWidth. |
| `s` | `blockIndexTable` | byte[] | Flat block-index table mapping block cells to atlas tile ids. |
| `t` | `atlasImage` | javax.microedition.lcdui.Image | Static shared tile atlas image loaded from image.bin[atlasId+4]. |
| `c` | `loadedAtlasId` | int | Static id of the currently loaded atlas (initialized to -1). |
| `u` | `offscreenBuffer` | javax.microedition.lcdui.Image | Static off-screen scroll buffer image. |
| `v` | `offscreenWidth` | int | Static off-screen buffer width in pixels. |
| `w` | `offscreenHeight` | int | Static off-screen buffer height in pixels. |
| `x` | `offscreenGraphics` | javax.microedition.lcdui.Graphics | Static Graphics context for drawing into the off-screen buffer. |
| `y` | `bufferDrawnLeft` | int | Tile-aligned left edge of the region already drawn into the off-screen buffer (-1 = invalid). |
| `z` | `bufferDrawnTop` | int | Tile-aligned top edge of the region already drawn into the off-screen buffer (-1 = invalid). |
| `A` | `bufferDrawnRight` | int | Tile-aligned right edge of the region already drawn into the off-screen buffer. |
| `B` | `bufferDrawnBottom` | int | Tile-aligned bottom edge of the region already drawn into the off-screen buffer. |

## BossActor  （原 `tjge.c`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `c` | `(ILtjge/d;Ltjge/a;)V` | `constructor` | 构造器：以类型ID、精灵定义(SpriteDef)、所属主控(GameScreen)初始化，默认可绘制(n=true)、无关联小兵(o=null)。 |
| `a` | `(III[BZ)Z` | `spawnAt` | 重置/初始化（覆写基类）：按类型ID(q=14/8/17)装配各自的状态机初值与子状态、读入字节参数、注册到主控相应槽位并进入起始动画。 |
| `a` | `()V` | `update` | 每帧更新主逻辑：依 q 分派（14=可破坏物、8=Boss本体多阶段攻防、17=俯冲/突进），驱动子状态机、生成弹幕、处理受击与死亡。 |
| `a` | `(Ltjge/l;)V` | `onProjectileHit` | 被弹丸(Projectile)命中时的伤害结算：按弹丸类型扣减血量(f)、反弹/销毁弹丸、触发受击闪烁(l)。 |
| `f` | `()V` | `spawnDeathBurst` | 私有：在当前位置附近随机散布生成数枚爆炸特效并播放音效（死亡/爆裂表现）。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `paint` | 绘制（覆写基类）：仅当可见标志 n 为真时调用父类绘制。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `screen` | GameScreen | 所属主控游戏屏(GameScreen)，用于访问玩家、关卡状态与生成实体。 |
| `b` | `delayTimer` | int | 通用倒计时/延迟计数器（各阶段复用：出场延迟、攻击前摇、可破坏物存活计时等）。 |
| `c` | `phase` | int | 主状态机阶段编号（q=8 时 0..3 的攻防子阶段；q=14 时 0/1 标记是否已被击破）。 |
| `d` | `subTimer` | int | 子状态计时/步进计数器（控制阶段内节奏：开火间隔、突进倒计时等）。 |
| `e` | `attackMode` | int | 攻击模式开关（0/1，决定 phase=1 时发射哪种弹幕分支）。 |
| `f` | `health` | int | 当前血量/耐久值，受击递减；归零后推进至下一轮或死亡处理。 |
| `g` | `waveCount` | int | 剩余攻击波次/回合计数（每轮血量耗尽后递减，影响伤害输出与死亡判定）。 |
| `h` | `flashCounter` | int | 受击闪烁帧计数（l 为真时累加，超阈值复位坐标并结束闪烁）；q=17 时用作存储的子计时初值。 |
| `i` | `homeX` | int | 记录的基准 X 坐标（定点<<10），用于闪烁抖动复位与归位。 |
| `j` | `homeY` | int | 记录的基准 Y 坐标（定点<<10），用于 q=17 突进后归位。 |
| `k` | `disabled` | boolean | 是否被禁用（由初始化字节参数决定；为真则不参与攻防逻辑，仅登记到主控槽位）。 |
| `l` | `hitFlashing` | boolean | 受击闪烁中标志（命中后置真，触发坐标抖动与帧计数）。 |
| `m` | `phaseTriggered` | boolean | 某攻防段是否已触发的一次性标志（防止接触伤害分支重复触发）。 |
| `n` | `visible` | boolean | 是否绘制/可见（false 时 paint 跳过父类绘制，用于死亡淡出隐藏）。 |
| `o` | `minion` | EnemyActor | 关联的小兵/同伴实体(EnemyActor)，q=8 且 x=4 分支据其状态联动驱动 Boss 行为。 |

## SpriteDef  （原 `tjge.d`）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `()V` | `constructor` | 私有构造函数，仅供静态工厂 b(int) 内部创建实例。 |
| `a` | `()S` | `getSequenceCount` | 返回 sequence（动画序列）数量 r。 |
| `a` | `(I)S` | `getSequenceFrameCount` | 返回第 n 个 sequence 的帧数 s[n]。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIIII)V` | `paintSequenceFrame` | 按 sequence 索引(高2位为水平/垂直翻转标志)与帧索引，把对应 pose 的各模块帧逐块拼到 Graphics 上绘制。 |
| `b` | `()V` | `dispose` | 释放本精灵持有的所有 pose/sequence/碰撞箱数组与图集引用。 |
| `c` | `()V` | `refreshLoadedAtlasFlags` | 静态：依据 GameScreen.d(int) 刷新各资源索引对应图集的已加载标志表 b。 |
| `b` | `(I)Ltjge/d;` | `loadFromBin` | 静态工厂：从 /res/a.bin 第 n 条目解析出 SpriteDef（pose 拼帧 + sequence 序列 + 碰撞箱），失败返回 null。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `atlasTable` | SpriteAtlas[] | 静态：图集(i/SpriteAtlas)表，按图集 id 索引，容量 32，懒加载缓存。 |
| `b` | `atlasLoadedFlags` | boolean[] | 静态：各图集 id 的已加载标志表，容量 32；索引 0 在静态块中置 true。 |
| `c` | `resourceToAtlasId` | int[] | 静态：资源条目索引 → 图集 id 的映射表，容量 32。 |
| `o` | `poseCount` | short | pose（拼帧姿态）数量。 |
| `p` | `poseModuleCounts` | short[] | 每个 pose 的模块(分块)数量。 |
| `q` | `poseModuleFrames` | short[][] | 每个 pose 各模块在图集中的帧索引(0..255，读取时负值+256还原)。 |
| `d` | `poseModuleOffsetX` | byte[][] | 每个 pose 各模块的 x 偏移。 |
| `e` | `poseModuleOffsetY` | byte[][] | 每个 pose 各模块的 y 偏移。 |
| `r` | `sequenceCount` | short | sequence（动画序列）数量。 |
| `s` | `sequenceFrameCounts` | short[] | 每个 sequence 的帧数。 |
| `t` | `sequencePoseIndices` | short[][] | 每个 sequence 的逐帧 pose 索引序列(读取时负值+256还原)。 |
| `f` | `collisionBoxX` | byte[] | 每个 sequence 的碰撞箱 x。 |
| `g` | `collisionBoxY` | byte[] | 每个 sequence 的碰撞箱 y。 |
| `h` | `collisionBoxWidth` | byte[] | 每个 sequence 的碰撞箱宽 w。 |
| `i` | `collisionBoxHeight` | byte[] | 每个 sequence 的碰撞箱高 h。 |
| `j` | `boundsX` | short | 整体边界 x。 |
| `k` | `boundsY` | short | 整体边界 y。 |
| `l` | `boundsWidth` | short | 整体边界宽。 |
| `m` | `boundsHeight` | short | 整体边界高。 |
| `n` | `atlasId` | short | 图集 id（临时字段：解析时读入并用于关联图集，末尾被清零）。 |
| `u` | `atlas` | SpriteAtlas | 本精灵关联的图集(i/SpriteAtlas)，绘制时调用其拼块绘制。 |

## EffectActor  （原 `tjge.e`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `(ILtjge/d;Ltjge/a;)V` | `constructor` | 构造特效/可交互 Actor，传入类型 id、精灵定义 SpriteDef 与所属游戏世界 GameScreen |
| `a` | `(III[BZ)Z` | `spawnAt` | 覆写 g 的初始化：按类型 q 设置初始状态字段（触发器/感应器/可破坏物/手雷等）；bl 为 true 时不创建返回 false |
| `a` | `()V` | `update` | 每帧更新：按类型 q 分派感应区检测、爆炸触发、关卡解谜逻辑与可破坏物销毁等行为 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `paint` | 覆写 g 的绘制：类型 12 且世界标志 E 未置位时跳过，否则委托父类绘制 |
| `a` | `(Ltjge/l;)V` | `onProjectileHit` | 处理被弹丸/单位 Projectile 命中：依本体类型与弹丸类型扣血、击退、生成爆炸特效并放音效 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `destroyedFlag` | int | 销毁/触发状态标志：case 4/5 初始化为 0，被打爆或感应触发时置 1，用于推进关卡状态（i.p=19/20） |
| `b` | `anchorX` | int | 锚点/目标格 X：case 22 存目标瓦片列（byArray[0]），case 7/9 存重生锚点 C（横坐标） |
| `c` | `anchorY` | int | 锚点/目标格 Y：case 22 存目标瓦片行（byArray[1]），case 7/9 存重生锚点 D（纵坐标） |
| `d` | `hitPoints` | int | 耐久/命中计数：可破坏物初始 3 或 9，感应器 case5 初始 4；被命中时递减，决定动画帧与销毁判定 |
| `e` | `shakeTick` | int | 受击抖动动画计时：被命中时清 0，每帧自增并与 5 比较，控制横向晃动后复位 |
| `f` | `tintBits` | int | 缓存的高位颜色/alpha 通道位（t & 0xFF000000），用于重设动画帧时保留染色 |
| `g` | `regenTimer` | int | 再生/恢复计时：仅 case 9 使用，自增并与 40 比较，超时后回升耐久档位 |
| `h` | `activated` | boolean | 激活/触发标志：感应区命中、被弹丸击中或满足解谜条件时置 true |
| `i` | `world` | GameScreen | 所属游戏世界 GameScreen 引用，用于访问玩家焦点单位 j、地图 f、关卡数据 g 及生成特效/音效 |

## PlayerActor  （原 `tjge.f`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `f` | `(ILtjge/d;Ltjge/a;)V` | `constructor` | 构造函数：以图块索引、SpriteDef、GameScreen 主控创建玩家并保存主控引用。 |
| `c` | `(Ltjge/b;)Z` | `collideGround` | 落地/侧壁碰撞检测，依朝向 d 调整位置与速度，命中地面返回 true。 |
| `e` | `(Ltjge/b;)Z` | `checkLedgeTop` | 爬升时检测头顶上方三格是否撞到实心瓦片。 |
| `f` | `(Ltjge/b;)Z` | `checkWallAhead` | 检测面朝方向前方一格是否贴墙（瓦片值为1）。 |
| `a` | `(Ltjge/b;Z)Z` | `checkLadderTile` | 检测当前/指定位置是否为梯子瓦片(值2)并吸附到梯子中线。 |
| `a` | `(III[BZ)Z` | `spawnAt` | 初始化玩家：调用基类初始化后设满血10、复位标志与重力。 |
| `f` | `()V` | `resetForLevel` | 进入关卡/复位：设满血、清子状态、初始化朝向标志与计数。 |
| `e` | `()V` | `stepPhysics` | 物理步进：按模式 p 累积速度/加速度并推进坐标、处理碰撞与相机。 |
| `a` | `()V` | `update` | 每帧更新：刷新朝向，跑状态机 g 与输入处理 h，血量耗尽则触发死亡帧。 |
| `g` | `()V` | `runActionStateMachine` | 动作状态机：按当前动作 id c 与子状态 o 切换动画/物理（跳/落/攀爬/换弹等）。 |
| `h` | `()V` | `handleInput` | 输入处理：依输入位掩码 q 驱动左右移动、跳跃、射击、换弹（含多层跳转）。 |
| `b` | `(I)V` | `startLeapLeft` | 向左跳跃/落地动作分支：按子状态 o 选帧、设竖直速度 n 并起跳。 |
| `c` | `(I)V` | `startLeapRight` | 向右跳跃/落地动作分支：按子状态 o 选帧、设竖直速度 n 并起跳。 |
| `i` | `()V` | `land` | 着地复位：清横移/重力、置着地位 bit0 并切回站立帧。 |
| `j` | `()V` | `beginFall` | 离地坠落：在可坠落动作下清着地位、施加重力并切坠落帧。 |
| `k` | `()V` | `walkLeft` | 向左行走：设左向横移速度并切左行走帧。 |
| `l` | `()V` | `walkRight` | 向右行走：设右向横移速度并切右行走帧。 |
| `d` | `(I)V` | `fireWeapon` | 开火/投掷：按武器类型 n 生成对应 Projectile（子弹/手雷/火箭）并消耗弹药。 |
| `e` | `(I)V` | `takeDamage` | 受击：扣血 n、设无敌计时 R 并进入受击动作帧。 |
| `g` | `(Ltjge/b;)Z` | `checkClimbable` | 攀爬检测：扫描前方瓦片得攀爬类型写入 n 并记录落点 S/T。 |
| `o` | `()V` | `handleVehicleInput` | x==4 载具/特殊场景下的输入处理（移动/射击/换弹的简化分支）。 |
| `a` | `(Ltjge/b;I)Z` | `checkWallLeft` | 向左侧地形碰撞：偏移 n（100=忽略方向限制），命中实墙吸附并返回 true。 |
| `b` | `(Ltjge/b;I)Z` | `checkWallRight` | 向右侧地形碰撞：偏移 n（100=忽略方向限制），命中实墙吸附并返回 true。 |
| `a` | `(Ltjge/l;)V` | `onProjectileHit` | 被 Projectile 命中处理：按其类型 q 反弹朝向、扣血或触发爆炸效果。 |
| `f` | `(I)V` | `switchOrReloadWeapon` | 切换/换弹：按上下文 n（32=切武器）选择有弹药的武器索引 k 并切换帧。 |
| `m` | `()V` | `fullAmmoInit` | 弹药满装初始化：复位当前武器并装满三种备弹与当前弹匣。 |
| `n` | `()V` | `reloadFromReserve` | 换弹回收：将当前弹匣余弹按武器类型从备弹池补满。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `stateFlags` | int | 状态位掩码：bit0=着地，bit13(0x2000)=梯子/攀爬态。 |
| `b` | `movingFlag` | int | 移动标志：1=正在主动移动/跳跃中，0=静止（用于步进时是否归零横移）。 |
| `c` | `actionId` | int | 当前动作 id（= t & 0xFFFFFF），状态机分支键。 |
| `d` | `facingFlag` | int | 朝向标志（= t & 0xFF000000）：非0=左（MIN_VALUE 位）。 |
| `e` | `health` | int | 生命值，初始 10，<=0 触发死亡。 |
| `f` | `lastInputDir` | int | 上次水平输入计数/方向标记（1/2/4/8/64/128 对应各输入位）。 |
| `g` | `inputHoldCount` | int | 输入按住帧计数（用于判定起跳/连射阈值）。 |
| `h` | `ammoReserveB` | int | 武器1（k==1）备弹数，初始 6。 |
| `i` | `ammoReserveC` | int | 武器2（k==2）备弹数，初始 3。 |
| `j` | `grenadeCount` | int | 手雷数量，初始 3。 |
| `k` | `weaponIndex` | int | 当前武器索引（0/1/2）。 |
| `l` | `magazineAmmo` | int | 当前弹匣余弹数。 |
| `m` | `frameTimer` | int | 通用帧计数器（状态延时/受击计时）。 |
| `n` | `climbResult` | int | 攀爬检测结果类型（0=无,1/2/3/4=不同攀爬高度）。 |
| `o` | `subState` | int | 子状态/动作阶段编号（状态机内细分）。 |
| `O` | `spareO` | int | 未使用计数字段 O（CFR 中无引用，保留占位）。 |
| `P` | `spareP` | int | 未使用计数字段 P（CFR 中无引用，保留占位）。 |
| `Q` | `climbAnimState` | int | 攀爬/翻越动画状态轮转值（18→24→25→26→18）。 |
| `R` | `invulnTimer` | int | 受击无敌计时，每帧递减，>0 时免伤。 |
| `S` | `climbTargetX` | int | 攀爬落点 X 坐标（定点 <<10）。 |
| `T` | `climbTargetY` | int | 攀爬落点 Y 坐标（定点 <<10/<<14）。 |
| `U` | `facingLeft` | boolean | 朝向是否向左（= facingFlag 非0）。 |
| `V` | `actionFlag` | boolean | 动作布尔标志（攀爬/交互相关，f_ 中清空）。 |
| `W` | `canClimb` | boolean | 是否允许攀爬/翻越（着地后置 true，跳出时清 false）。 |
| `X` | `climbAdvance` | boolean | 攀爬动画推进触发标志（每帧推进一阶）。 |
| `Y` | `ledgeGrabFlag` | boolean | 悬崖抓取/翻越方向标志（决定 case27 翻上还是放手）。 |
| `Z` | `linkedEnemy` | EffectActor | 关联的 EffectActor/敌人引用（近战交互目标）。 |
| `aa` | `linkedBoss` | BossActor | 关联的 BossActor 引用（x==4 载具/Boss 场景跟随）。 |
| `ab` | `screen` | GameScreen | 主控 GameScreen 引用（读输入 q、模式 p、生成实体等）。 |

## ActorBase  （原 `tjge.g`, extends java.lang.Object）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `g(int, tjge.d)` | `g(int q, d r)` | `constructor` | Constructor: stores the type id and sprite definition, marks the actor inactive (p=false) and animation looping (s=true). |
| `a(int, int, int, byte[], boolean)` | `boolean a(int frameIndex, int tileX, int tileY, byte[] params, boolean flag)` | `spawnAt` | Initializes/spawns the actor: sets the animation frame, places it at tile (x,y) as fixed-point world coords (<<10), and zeroes velocity/acceleration while setting default speed caps and orientation. |
| `b()` | `void b()` | `deactivate` | Deactivates the actor by clearing the active flag (p=false). |
| `a(int)` | `void a(int frameIndex)` | `setFrame` | Sets the current animation frame index (with horizontal/vertical flip flag bits): loads the frame's bounding box from the sprite def, applies flips and the 270-degree orientation swap, and resets the frame counter. |
| `c()` | `void c()` | `advanceAnimation` | Advances the animation by one tick; on reaching the last frame, loops back to 0 (if looping) or holds the last frame, and sets the animation-finished flag. |
| `d()` | `boolean d()` | `isAnimationDone` | Returns whether the current animation has finished playing (the u flag). |
| `e()` | `void e()` | `stepPhysics` | Per-tick physics step: advances animation, applies acceleration to velocity clamped to speed caps, then integrates velocity into the fixed-point position. Overridable by subclasses. |
| `a()` | `void a()` | `update` | Per-tick logic update hook; empty in the base class, overridden by subclasses. |
| `a(tjge.l)` | `void a(l projectile)` | `onProjectileHit` | Interaction hook for a projectile/bullet striking this actor; empty in the base class, overridden by subclasses. |
| `a(javax.microedition.lcdui.Graphics, int, int)` | `void a(Graphics g, int cameraX, int cameraY)` | `paint` | Draws the actor relative to the camera origin, with frustum/off-screen culling against the screen bounds using the sprite def's draw extents; delegates to the sprite def's draw routine. Overridable by subclasses. |
| `a(tjge.g)` | `boolean a(g other)` | `intersectsActor` | Axis-aligned bounding-box overlap test between this actor and another actor (using each actor's frame bounding box offset by its world position). |
| `a(tjge.b)` | `boolean a(b tileMap)` | `collideLeftWall` | Resolves leftward (negative-X) collision against solid map tiles: scans the tile column at the left edge, and on a hit zeroes horizontal velocity and snaps the X position flush against the wall. |
| `b(tjge.b)` | `boolean b(b tileMap)` | `collideRightWall` | Resolves rightward (positive-X) collision against solid map tiles: scans the tile column at the right edge, and on a hit zeroes horizontal velocity and snaps the X position flush against the wall. |
| `c(tjge.b)` | `boolean c(b tileMap)` | `collideGround` | Resolves downward (falling) collision against solid map tiles below the actor's feet: on a hit, zeroes vertical velocity/acceleration and snaps the actor to rest on top of the tile. Overridable by subclasses. |
| `d(tjge.b)` | `boolean d(b tileMap)` | `collideCeiling` | Resolves upward (rising/jumping) collision against a solid map tile above the actor's head: on a hit, zeroes upward velocity, snaps below the tile, and applies downward acceleration (gravity). |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `p` | `active` | boolean | Whether the actor is currently active/alive in the world. Public; toggled false on deactivate(). |
| `q` | `typeId` | int | The actor's type/class identifier, supplied at construction. |
| `r` | `spriteDef` | d (SpriteDef) | Reference to the sprite definition (animation/frame data) used to render and bound this actor. |
| `s` | `loopAnimation` | boolean | Whether the animation loops (true) or holds the last frame when finished. Defaults true. |
| `t` | `frameIndex` | int | Current animation frame index, whose high bits (0x80000000, 0x40000000) encode horizontal/vertical flip flags. |
| `u` | `animationDone` | boolean | Set true when the current animation reaches its final frame. |
| `v` | `currentFrame` | int | Current frame counter within the active animation (0-based), advanced each tick. |
| `w` | `frameCount` | short | Total number of frames in the active animation, queried from the sprite def. |
| `x` | `boundsLeft` | int | Horizontal bounding-box left offset for the current frame (flipped/swapped by flags and orientation). |
| `y` | `boundsRight` | int | Horizontal bounding-box right offset for the current frame (flipped/swapped by flags and orientation). |
| `z` | `boundsTop` | int | Vertical bounding-box top offset for the current frame (flipped/swapped by flags and orientation). |
| `A` | `boundsBottom` | int | Vertical bounding-box bottom offset for the current frame (flipped/swapped by flags and orientation). |
| `B` | `extra` | int | General-purpose public int field (unused in the base class; left for subclass use). |
| `C` | `posX` | int | World X position in fixed-point (pixels << 10). |
| `D` | `posY` | int | World Y position in fixed-point (pixels << 10). |
| `E` | `velX` | int | Current horizontal velocity (fixed-point), latched from accelX-driven velocity each physics step. |
| `F` | `velY` | int | Current vertical velocity (fixed-point), latched from accelY-driven velocity each physics step. |
| `G` | `targetVelX` | int | Horizontal velocity accumulator that acceleration is applied to and clamped against the speed cap. |
| `H` | `targetVelY` | int | Vertical velocity accumulator that acceleration is applied to and clamped against the speed cap. |
| `I` | `accelX` | int | Horizontal acceleration applied to targetVelX each physics step. |
| `J` | `accelY` | int | Vertical acceleration (gravity) applied to targetVelY each physics step. |
| `K` | `maxVelX` | int | Horizontal speed cap that targetVelX is clamped to (default 12288). |
| `L` | `maxVelY` | int | Vertical speed cap that targetVelY is clamped to (default 12288). |
| `M` | `orientation` | int | Orientation angle in degrees; value 270 triggers an axis swap of the frame bounding box, also passed to the draw routine as rotation. |
| `N` | `drawParam` | int | Auxiliary draw parameter (palette/variant) passed through to the sprite def's draw routine. |

## EnemyActor  （原 `tjge.h`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `h` | `(ILtjge/d;Ltjge/a;)V` | `constructor` | 构造敌人 Actor：调用父类构造并保存所属 GameScreen 主控（W）。 |
| `a` | `(III[BZ)Z` | `spawnAt` | 敌人生成/初始化：重置 AI 状态、设朝向与巡逻边界、按类型与生成参数字节配置血量与可攻击垂直区间。 |
| `a` | `()V` | `update` | 每帧主更新：处理被击退、近战触碰玩家，并按类型分派到 patrolUpdate/airUpdate/bossUpdate。 |
| `f` | `()V` | `patrolUpdate` | 地面巡逻型敌人（type 1/2）的 AI 状态机：巡逻、瞄准、近战/远程攻击、死亡与坠落。 |
| `g` | `()V` | `airUpdate` | 空中/降落型敌人的 AI 状态机：追踪玩家水平位置、降落、攻击、出屏回收。 |
| `h` | `()V` | `bossUpdate` | Boss（type 18）的 AI 状态机：来回移动、冲撞、召唤、受击进入下一阶段。 |
| `i` | `()V` | `spawnMeleeHitbox` | 在玩家上方生成近战攻击判定弹体（type 20）并设其朝向，播放攻击动作。 |
| `b` | `(I)Ltjge/l;` | `fireProjectile` | 按朝向在身前生成远程子弹（type 21），返回生成的弹体或 null。 |
| `j` | `()V` | `killTrailEffect` | 若存在伴随特效（X）则将其销毁/释放。 |
| `a` | `(Ltjge/l;)V` | `onProjectileHit` | 被弹体命中处理：按弹体类型扣命/即死，触发受击/死亡状态与音效。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `paint` | 绘制覆写：受击闪烁计时期间隔帧跳过绘制，否则调用父类绘制。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `timerA` | int | 通用计时/计数器（如延迟生效计数、airUpdate 中按 60 帧节拍的横移随机触发计数）。 |
| `b` | `timerB` | int | 通用计时/计数器（动作节拍、瞄准/攻击/死亡阶段的帧计数）。 |
| `c` | `patrolBaseX` | int | 巡逻基准 x（定点，生成时取当前 C），用于计算左右边界。 |
| `d` | `patrolRange` | int | 巡逻范围（格数；由生成参数 byArray[1] 给出，左移 10 转定点距离）。 |
| `e` | `patrolDir` | int | 初始巡逻/朝向方向（生成参数 byArray[0]，0=向左基准、非0=向右基准）。 |
| `f` | `attackRangeUpper` | int | 可攻击的垂直上界偏移（定点；由生成参数 byArray[3] 选档）。 |
| `g` | `attackRangeLower` | int | 可攻击的垂直下界偏移（定点；由生成参数 byArray[3] 选档，为负值）。 |
| `h` | `hitPoints` | int | 血量/连击数（巡逻型取 byArray[2]，Boss 为 0；>0 时启用连击攻击分支）。 |
| `i` | `patrolLeftBound` | int | 巡逻左边界（定点 x）。 |
| `j` | `patrolRightBound` | int | 巡逻右边界（定点 x）。 |
| `k` | `facingFlag` | int | 朝向标志位：0 或 Integer.MIN_VALUE（最高位），与动作低位或运算生成镜像动作。 |
| `l` | `rhythmThreshold` | int | 节奏/冷却阈值（攻击或切换的帧计数上限，随血量调整）。 |
| `m` | `lives` | int | 剩余命数（初始为 hitPoints+1，被命中递减，<=0 进入死亡）。 |
| `n` | `actionLow24` | int | 当前动作 ID 的低 24 位（t & 0xFFFFFF，去掉朝向位后的纯动作号）。 |
| `o` | `aiState` | int | AI 子状态机当前状态（巡逻=0、转身=1、行走=3、攻击=5/8、受击=9、死亡=4 等）。 |
| `O` | `attackMode` | int | 攻击模式标志（0=远程/常规攻击分支，1=近战推挤分支）。 |
| `P` | `hurtBlinkTimer` | int | 受击/死亡闪烁与延迟计时（>0 时 paint 隔帧跳过，并门控死亡回收）。 |
| `Q` | `comboToggle` | boolean | 连击切换标志（在普通攻击与连击攻击之间交替）。 |
| `R` | `knockedBack` | boolean | 被击退中标志（玩家近战互动触发，等待玩家动作结束）。 |
| `S` | `aiming` | boolean | 已进入瞄准标志（在攻击距离内锁定玩家，准备出招）。 |
| `T` | `isPatroller` | boolean | 巡逻模式标志（type 1/2 为 true，走 patrolUpdate；否则走 airUpdate）。 |
| `U` | `fromSpawner` | boolean | 由刷怪点产生标志（影响死亡时是否回写关卡标记与递减计数）。 |
| `V` | `target` | PlayerActor | AI 追踪/攻击目标，即玩家（取自 W.j，Player）。 |
| `W` | `screen` | GameScreen | 所属 GameScreen 主控（提供玩家、关卡、相机边界、计数器、生成弹体/实体接口）。 |
| `X` | `trailEffect` | EffectActor | 关联的伴随特效 EffectActor（跟随本体位置，可为 null）。 |

## SpriteAtlas  （原 `tjge.i`）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `<init>` | `()V` | `constructor` | 私有无参构造，仅由静态工厂 a(int) 内部实例化空图集对象 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;IIIII)V` | `drawSprite` | 绘制第 n3 张小图：从 4bit packed 像素按调色板组解码拼到缓冲 f，再经 Nokia drawPixels(4444) 带翻转/旋转贴到屏幕(x=n,y=n2,palette=n4,manip=n5) |
| `a` | `(I)Ltjge/i;` | `load` | 静态工厂：从 /res/t.bin 第 n 条目解析整张图集（小图表+调色板+像素），异常返回 null |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `flipHorizontalBit` | int | 静态：水平翻转请求位掩码(Integer.MIN_VALUE/0x80000000)，编码在小图索引高字节中 |
| `b` | `flipVerticalBit` | int | 静态：垂直翻转请求位掩码(0x40000000)，编码在小图索引高字节中 |
| `c` | `pixelBufferCapacity` | int | 静态：拼像素临时缓冲 f 的容量(4096) |
| `g` | `spriteCount` | short | 小图(子图)数量 |
| `h` | `rowOffsets` | short[] | 每张小图在像素图中的行内偏移(列偏移，用于奇偶对齐与 4bit 半字节定位) |
| `i` | `startRows` | short[] | 每张小图的起始行号 |
| `d` | `widths` | short[] | 每张小图的像素宽(0..255，负数解析时 +256，public) |
| `e` | `heights` | short[] | 每张小图的像素高(0..255，负数解析时 +256，public) |
| `j` | `paletteBaseIndices` | byte[] | 每张小图的调色板基址索引（使用时 <<4 得到组内色基偏移） |
| `k` | `bytesPerRow` | int | 像素图每行的字节数（解析时已 /2） |
| `l` | `totalRows` | int | 像素图总行数 |
| `m` | `packedPixels` | byte[] | 4bit packed 像素数据(每字节 2 个调色板索引)，长度 bytesPerRow*totalRows |
| `n` | `palettes` | short[][] | 调色板表[组][色]=ARGB4444 颜色值 |
| `o` | `paletteCount` | int | 调色板组数 |
| `f` | `pixelBuffer` | short[] | 静态：拼像素临时缓冲(容量 c)，按 ARGB4444 逐像素填充后交给 drawPixels |

## LevelLoader  （原 `tjge.j`, extends java.lang.Object）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `a(II)V` | `public final void a(int n, int n2)` | `activateScreenAt` | Jump-load the screen block at world pixel (n,n2): reset spawn flags, free all actor-pool slots, then spawn every actor listed for that block into the active array; records it as the current block. |
| `b(II)V` | `public final void b(int n, int n2)` | `streamScreenTransitionTo` | Incremental scroll update to the block at world pixel (n,n2): diff the current block's actor list against the new one, despawn actors that left and spawn newcomers via the diff buffer; no-op if same block. |
| `a(I)Ltjge/g;` | `public final g a(int n)` | `spawnActor` | Spawn actor index n by finding a free instance in its type pool, assigning its id, initializing it with its x/y/extra-data/flag, marking it in-use, and returning it (or null on failure). |
| `a(Ltjge/a;II)V` | `public static final void a(a a2, int n, int n2)` | `buildActorPool` | Static: build the type-n actor object pool of size n2 by asking the GameScreen to instantiate n2 actors from sprite definition b[n] (skips if already built). |
| `a()V` | `public static final void a()` | `releaseUnusedSpriteDefs` | Static: release sprite definitions 1..29 not marked as retained (calls dispose and nulls them out). Original trailing System.gc() omitted per port contract. |
| `b()V` | `public static final void b()` | `refreshRetainFlags` | Static: recompute the retain flag for sprite definitions 1..29 from GameScreen.d(int), then invoke SpriteDef.c() cleanup. |
| `b(I)V` | `public static final void b(int n)` | `retainSpriteDef` | Static: ensure sprite definition n is loaded (lazy-create via SpriteDef.b(n)), mark it retained, and flag its backing image as in-use in SpriteDef's static tables. |
| `c()V` | `public final void c()` | `disposeLevel` | Tear down the whole level: dispose the tile map, refresh retain flags, null the active-actor array and all actor pools, and release the per-actor screen/x/y/extra-data/type tables. |
| `a(Ltjge/a;)V` | `public static final void a(a a2)` | `initBootSprites` | Static: bootstrap the boot/common sprites — load sprite def 0, build its single-actor pool on the GameScreen, and retain sprite def 8. |
| `a(Ltjge/a;I)Ltjge/j;` | `public static final j a(a a2, int n)` | `loadLevel` | Static factory: parse /res/s.bin entry n — header, enemy-type table, per-actor spawn table (type/x/y/extra-data), and the screen-block-to-actor-index table — building the tile map and a fully populated LevelLoader (null on failure). |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `tileMap` | TileMap | Static. The current level's tile map instance (class b). Built by loadLevel and torn down by disposeLevel. |
| `b` | `spriteDefPool` | SpriteDef[] | Static, length 30. Pool of sprite definitions (class d) indexed by sprite type id; entries are lazily loaded and nulled when unused. |
| `c` | `spriteDefRetained` | boolean[] | Static, length 30. Per-sprite-type retain flag; true means the corresponding spriteDefPool entry must be kept loaded. |
| `d` | `actorPools` | ActorBase[][] | Static, length 30. Object pools of reusable actors (class g) per type id; the inner array is the preallocated instances for that type. |
| `e` | `activeActors` | ActorBase[] | Static. Currently active/spawned actors indexed by actor index; entries set on spawn and nulled on despawn. |
| `m` | `spawnDiffBuffer` | byte[] | Private static, length 40. Scratch buffer holding actor indices that newly entered the visible block during streamScreenTransitionTo, processed for spawning afterward. |
| `f` | `blockActorIndices` | byte[][] | Instance. Screen-block to actor-index table: blockActorIndices[block] is the sorted list of actor indices belonging to that screen block. |
| `g` | `currentBlock` | int | Instance. Index of the screen block the camera currently occupies. |
| `h` | `actorSpawnX` | short[] | Instance. Per-actor initial spawn X coordinate (indexed by actor index). |
| `i` | `actorSpawnY` | short[] | Instance. Per-actor initial spawn Y coordinate (indexed by actor index). |
| `j` | `actorTypeId` | int[] | Instance. Per-actor type id mapping actor index to its sprite/pool type (used to pick the pool in spawnActor). |
| `k` | `actorSpawned` | boolean[] | Instance. Per-actor already-spawned flag passed into actor init; reset at the start of activateScreenAt. |
| `l` | `actorExtraData` | byte[][] | Instance. Per-actor extra/parameter byte payload passed to actor initialization (may be null when empty). |
| `n` | `blockCount` | int | Private instance. Total number of screen blocks, computed as (mapHeight/blockHeight)*(mapWidth/blockWidth). |
| `o` | `blockWidth` | int | Private instance. Screen-block width in pixels (set to 176). |
| `p` | `blockHeight` | int | Private instance. Screen-block height in pixels (set to 176). |
| `q` | `emptySlotMarker` | int | Private instance. Sentinel value (0) marking empty/skip slots in the block actor-index lists during streaming diff. |

## PickupActor  （原 `tjge.k`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `k` | `(ILtjge/d;Ltjge/a;)V` | `constructor` | 构造函数：以类型 n、精灵定义 d2 和所属 GameScreen a2 初始化道具（调用 super(n,d2)） |
| `a` | `(III[BZ)Z` | `spawnAt` | 生成/初始化道具实例：bl 为真直接返回 false 不生成；否则置位置与动画、清空闪烁计时与拾取标志，并按 q 类型从 byArray[0] 读取子类型与升空贴图，返回是否成功 |
| `a` | `()V` | `update` | 逐帧逻辑：处理拾取闪烁计时；按 q 类型（3=道具加成 11=补血 13=触发关卡事件）检测与玩家碰撞并施加效果，标记已拾取 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `paint` | 绘制：拾取后按奇偶帧闪烁地绘制本体，并在 q 为 3/11 时在道具上方绘制逐帧上升的拾取特效贴图 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `screen` | GameScreen | 所属主画布/游戏屏幕（GameScreen），用于访问玩家 j、敌人组 g 及相机/状态等 |
| `b` | `subType` | int | 道具子类型（q==3 时读自 byArray[0]）：决定加成方向（0/3 加 h，2/5 加 i，1/4 置 j），并决定升空贴图 d 取 6 还是 3 |
| `c` | `pickupFlashTimer` | int | 拾取后闪烁/特效倒计时；>0 期间锁定 H=0 并按奇偶帧闪烁绘制本体与上升特效，归零后道具消失 |
| `d` | `riseEffectTile` | int | 升空拾取特效的贴图索引/数值（q==3 由 subType 推得 6 或 3；q==11 直接取自 byArray[0]，同时作为补血量） |
| `e` | `pickedUp` | boolean | 已被拾取标志；置位后下一帧调用 b() 使道具失活 |

## ProjectileActor  （原 `tjge.l`, extends ActorBase）

### 方法

| 原 | 签名 | 友好名 | 用途 |
|---|---|---|---|
| `l` | `(ILtjge/d;Ltjge/a;)V` | `constructor` | 构造函数：以类型 id 和精灵定义构造抛射物，并绑定所属 GameScreen 世界。 |
| `a` | `()V` | `update` | 每帧逻辑推进：按抛射物类型(q=15/21/10/20/16)处理弹道飞行、与敌人/玩家/地形碰撞、命中触发特效与销毁。 |
| `a` | `(Ljavax/microedition/lcdui/Graphics;II)V` | `paint` | 框架绘制方法：定时弹(q=20)前两帧不可见，其余委托父类绘制。 |
| `f` | `()V` | `computeHomingTrajectory` | 计算朝最近目标的追踪/抛物弹道：选最近敌人，依据重力和水平距离求出竖直速度分量 H。 |
| `a` | `(Z)Z` | `advanceAndCollide` | 沿给定水平方向(bl)推进一步，检测与可命中敌人及地形格子的碰撞，命中返回 true。 |
| `b` | `(I)V` | `launchArc` | 依据与玩家的水平距离初始化抛物轨迹参数(初速、加速度、生命计时)，n 决定水平朝向。 |
| `c` | `(I)Z` | `isEffectType` | 判断给定类型 id 是否为可被命中的特效类敌人(7 或 9)。 |
| `d` | `(I)Z` | `isHomingTarget` | 判断给定类型 id 是否为追踪弹道的有效目标(2 或 1)。 |
| `a` | `(III[BZ)Z` | `spawnAt` | 重置/生成抛射物：从字节参数读取延迟、循环帧与子类型，初始化投掷类(q=10)的状态。 |

### 字段

| 原 | 友好名 | 类型 | 含义 |
|---|---|---|---|
| `a` | `world` | GameScreen | 所属 GameScreen 世界引用，用于访问敌人数组 k、玩家 f、地图 f、相机 r、计时 t 等。 |
| `b` | `frameCounter` | int | 多用计数器：投掷/弧线类(q=10/15/21)作存活帧倒数；定时弹(q=20)作上膛/可见帧累加(<2 时绘制隐藏)。 |
| `c` | `launchOriginX` | int | 发射时的水平原点坐标，用于按最大射程(\|C-c\|>204800)判定子弹销毁。 |
| `d` | `mode` | int | 模式/变体标记(如 d==1、d==2)，并作为命中特效工厂 a(16,...) 的第 6 个参数传入。 |
| `e` | `lifeTimer` | int | 生命周期计时器：弧线发射时由 launchArc 设置，定时弹(q=20)中递减至 <0 触发落地结算。 |
| `f` | `armingDelay` | int | 投掷类(q=10)的起爆/激活延迟倒数，源自 spawn 的 byArray[0]，归零前阻止后续逻辑。 |
| `g` | `loopFrames` | int | 投掷类(q=10)阶段切换时重置 frameCounter 用的循环帧数，源自 spawn 的 byArray[1]。 |
| `h` | `subType` | int | 投掷类(q=10)子类型标记，源自 spawn 的 byArray[2]：控制旋转角 M 及销毁分支(h==1 走 MIN_VALUE)。 |

