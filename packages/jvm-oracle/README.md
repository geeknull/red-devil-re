# jvm-oracle —— 用「原版游戏本身」当自动验收参照

在无头 JVM 上**直接运行原版 `.class` 字节码**（`reverse/game{1,2}/1-jar-unpacked/tjge/*.class`），
逐帧驱动 `paint()` 并抓取 **J2ME `Graphics` 语义级 draw-op 序列**。

> ⚠️ **精确表述（2026-07-17 起）**：不再是「**未经任何修改**」。为修「两侧不共享时钟」这个洞
> （见下「已知边界」③），`patch-clock.mjs` 会把 `tjge/*.class` 常量池里
> `Methodref(System, currentTimeMillis:()J)` 的 class_index 重指向 `harness/VClock`
> ——**仅此一处，且不动任何一条字节码指令**。
> **这意味着信任根变成了「原版字节码 + 本补丁」，补丁自己就是个必须被验证的「中间物」。**
> 故 `--verify` 用 `javap` 逐行对拍**机器验证其最小性**（非预期差异一律拒绝出结论）。
> 把这句话写清楚，是因为本项目栽过的跟头恰恰是「**标签替人做了本该由测量做的认知工作**」。

目的：让「我的 TS 移植和原版行为是否一致」成为**机器可判定**的问题——
同一份输入脚本驱动两侧，逐帧对拍绘制调用序列，红/绿自动出。

## 为什么对拍「绘制调用」而不是「像素」

本项目的 TS port **有意**与原版像素不同（字体点阵 vs sans-serif、MIDI 方波 vs GM 音色、
alpha 分级、rot270——见 `docs/` 与记忆 `fidelity-gaps`）。所以最终像素 diff 对**忠实**的
port 也会大量假阳性。

而「游戏逻辑决定画什么」这一层（`drawString(str,x,y,anchor)` / `drawImage(id,...)` /
`fillRect(x,y,w,h)`）是两侧**同构**的：字体字形、alpha 合成、音色都落在这层**之下**，
天然被绕开。这才是忠实性对拍该在的层。

## 用法

```bash
./run.sh 1          # game1，默认 176x208（对齐 TS port）
./run.sh 2          # game2，默认 176x204

SCREEN_W=240 SCREEN_H=320 ./run.sh 1        # 覆盖分辨率
# 逐 op 原文输出（供跨端差分）：
#   -Doracle.dumpOps=true
```

输出两种模式：
- 默认：逐帧 `F<n> s=<状态> ops=<数> opsHash=<哈希> rngDraws=<数> rngRoll=<累计哈希>`
- `oracle.dumpOps=true`：逐 op 原文 `F<n>\t<op>`

## 覆盖断言（`coverage/*.cover`）—— 「绿」必须携带信息量

**绿而没走到目标路径 = 没意义。** `diff.sh` 第 5 步按 `coverage/<场景>.cover` 断言必达路径，
把「本场景覆盖了什么」从**偶然**变成**机器断言的不变量**：

```
op    <最少次数> <op 子串（可含空格）> | <说明>
state <状态号>                        | <说明>
```

断言取 **oracle 侧**（信任根＝原版字节码）。失败 → **exit 4**。无 `.cover` → 明说「该绿灯不含覆盖信息」，
**不假装有**。删条目 = 公开承认放弃该覆盖，**必须写清理由**（豁免只能收紧不能放宽）。

为什么需要它：`game2-level` 一直在画 game2 换色帧（586 条 drawRegion），但这是**偶然**的——
若有人改动 scenario 致其不再被画，差分会**继续绿**，退化成空洞绿灯且无人察觉。详见
`docs/jvm-oracle-保真审计.md`。

## 输入脚本格式（`--script` / 夹具 / 模糊器同一份）

```
# 注释
seed=<long>          # RNG 种子
frames=<int>         # 帧数
save=<b0,b1,…>       # 可选：注入 RMS 存档（跳关，覆盖深层路径）
<帧>,<键码>,<按下1|抬起0>
```

**`save=` 头**——注入 RMS 存档字节，用来**跳关**覆盖靠正常游玩够不到的深层渲染路径
（如 `game1-level-scroll` 夹具：默认存档只解锁关卡 0，任务选择屏被 `saveData[0]` 封顶，
故没有任何输入能到关卡 7 的卷动过场；注入 `save=7,7,1` 才走得到）。
- **两侧字节对称**：oracle 往 RMS 桩 `addRecord`、port 往 localStorage 桩 `setItem`，库名独立取自
  原版字节码（`TGS_CT` / `REDDEVIL2`）。`diff.sh` 的 SAVE 前置条件断言会核验两侧一致，不一致 exit 3。
- **必须在首帧读存档之前种好**（原版首帧就读，且 `Q = getRecord()` 整体替换数组引用 → 直写字段会被覆盖）。
- ⚠️ 存档注入**只能把你送进目标关卡的开头**，送不到关卡**终点**——结算/通关类状态仍须真打到 goal，
  随机输入与存档注入都省不掉（见 `docs/jvm-oracle-保真审计.md` 的覆盖缺口清单）。

## 差分模糊测试（状态覆盖引导）

```bash
node --experimental-transform-types packages/jvm-oracle/fuzz.ts <1|2> [轮数] [起始种子] [帧数]
#   fuzz.ts 1 200            game1 跑 200 轮（默认 800 帧/轮）
#   fuzz.ts 2 300 1 3000     game2 跑 300 轮、种子从 1 起、每轮 3000 帧（探深层路径）
```

随机生成输入脚本 → 同脚本同时驱动原版字节码与 port → 逐帧对拍 op。**任何分歧 = 真 bug。**

**状态覆盖引导**：用 oracle 自己吐的 `[oracle] statesSeen=`（信任根＝原版字节码的真实状态机）当覆盖
度量，**保留能达到新状态的脚本进语料库**，后续在其上变异/延长 → 逐步深入。引导段**不再写死一条**
（v1 只有「主菜单直进新游戏」→ 菜单分支永远够不到），改为若干变体由覆盖引导自己筛。

**报告必须给出实际达到的状态集合 + 未达到的状态** —— 绿而没走到 = 没意义。

**三种结局，别混为一谈**：
- `✅ 一致` —— 该轮 op 逐字节相同。
- `❌ 分歧` —— **真 bug**，必须逐个定性到根因（port 错 / CFR 错 / oracle 盲区 / 已知偏差）。
- `🟡 不可判定` —— 撞上**已知 oracle 盲区**（game2 由 `substringWidth` 驱动的自动换行）。
  **既不算绿也不算 bug**：该轮首个失配之后的 op **全部未被判定**，别当已验证。
  签名刻意**收紧**（同帧 + 两侧都是 drawStr + 一侧文本是另一侧的严格前缀），其它形态一律当真 bug 报
  ——**假阴性比假阳性危险得多**。
  ⚠️ **为什么不把两侧字体度量对齐了事**：那等于让 oracle 抄 port 的实现 → 差分就成了「用它自己验它自己」，
  对字体相关缺陷**永远盲**。宁可留着这个不可判定。

## ⚠️ 两个 JVM 参数是必须的（JDK 9+ 模块系统坑）

```
--patch-module java.base=<含 res/ 的目录>
--add-opens java.base/res=ALL-UNNAMED
```

原版用 `String.class.getResourceAsStream("/res/image.bin")` 读资源。`String` 属于
**`java.base` 具名模块**——Java 9+ 对具名模块内的类只在**该模块内**查找资源，**恒返回 null**
（Java 8 才会搜 classpath）。

**不加这两个参数的后果极其隐蔽**：资源全部加载失败 → 图像字段为 `null` →
菜单 `paint` 撞 `drawImage(null)` 抛 NPE → **被游戏自身的外层 `try/catch` 静默吞掉** →
游戏永远卡在主菜单、RNG 一次都不抽，但表面上「跑满了 N 帧、抓到了 draw-op、没有任何报错」。

实测对比（game1，330 帧同一脚本）：

| | draw-op | RNG 抽数 | 能达状态 |
|---|---|---|---|
| 不加参数（**看起来在跑，实则死的**） | 879 | **0** | `[1, 4]` 卡在菜单 |
| 加参数 | 12709 | 1176 | `[1,4,2,22,14,10]` 进到 Playing |

这与 `docs/复盘-语义化改名静默崩溃.md` 是**同一失效模式**：静默 `try/catch` 让坏掉的状态
看起来活着。**判断 oracle 是否真的在跑，永远要看地面真值（状态链 / RNG 抽数 / 图像字段是否 null），
不能看「它有没有打印 op」。**

`run.sh` 已把这两个参数封好；它会把 `res/` 拷进 `out/.respatch<game>/`
（只能含 `res/`，不能把 `tjge/` 也塞进 `java.base`）。

## 分辨率

游戏对分辨率的处理**两者不同**（已对 CFR 核实）：

- **game1 自适应**：`a.java:113-114` `a = this.getWidth(); b = this.getHeight() - 32;`
  → oracle 必须设成与 port 相同的 **176x208**，否则每个坐标都不同、差分全红。
- **game2 定分辨率**：`setFullScreenMode(true)` 但从不读 canvas 尺寸，绘制里**硬编码**
  `176x204` / `176x208`（如 `a.java:135,156,167`）→ oracle 的 canvas 尺寸对它无影响。
  （game2 硬编码的值恰是 port 所配 176x204，反向印证了 port 分辨率配置正确。）

由 `ScreenConfig`（`-Doracle.width/-Doracle.height`）注入。

## 确定性

- **种子**：`GameMIDlet.c`（`public static java.util.Random`，全游戏唯一随机源，
  只经 `a(n)=abs(c.nextInt())%n` 取数）被 harness 用**记录型子类**整体替换并固定种子，
  同时记录每一次抽数。
- **时钟**：原版 `run()` 线程只做 `sleep`/`System.gc()`/`repaint()`，**不改任何游戏状态**
  （全部逻辑在 `paint()` 内）；shim 的 `repaint()` 只是计数器、不派发 `paint`。
  故 harness 直接按固定帧预算调 `paint()` 与该线程**零竞争**。

  > 🔴 **但「所以无需虚拟化时钟」这个推论是错的**（2026-07-16 被差分模糊器实证推翻，见下「已知边界」③）。
  > **`paint()` 自己会读墙钟**（`javap tjge.a`：`System.currentTimeMillis()` 有 **3 处在 `paint()` 内**），
  > 且该值**直接驱动绘制**（关卡耗时 mm:ss）。
  >
  > **失效模式值得记**：**前提是真的，推论是假的**。「run() 不改状态」✅ 被认真核实过，
  > 但真正该问的是「**有没有东西读时钟**」——那只需一句 `grep currentTimeMillis`。
  > **核实了前提，却没核实推论本身。** 而它长期没被发现，是因为**没有任何 scenario 走到会显示耗时的界面**
  > ——又一次印证：**覆盖之外的断言，等于没被检验的断言**。

**实测**：两游戏同输入各连跑 3 次，逐帧 trace（状态 / op 哈希 / RNG 抽数与累计哈希）
**逐字节一致**——且 game1 的 1176 次 RNG 抽数发生在**真实战斗**中（F199 起 state=10）。

## 已知边界（oracle 不是万能参照）

shim 是**我方自写**的 MIDP/Nokia 桩——**若 shim 错，oracle 会自信地说谎**。已核实项：

- ✅ `translate()` / `clipRect()` / `Image.getRGB()`：两游戏**均未调用** → 桩为 no-op 无害。
- 🔴 ① **`Font` 度量是编造的**（`stringWidth = len*6`、`getHeight()=13`）。真机字模我们没有。
  而 **game2 `a.java:967` 真的用 `getFont().substringWidth(...)` 参与坐标计算** →
  **该处坐标 oracle 无权威性**，跨端对拍须显式豁免。
- 🔴 ② 音频只到「调用了哪个音效/曲目」层面；**音色不可判**。
- ✅ ③ **两侧不共享时钟 —— 已根治**（2026-07-16 由差分模糊器发现、2026-07-17 修复；
  **它推翻了本文原先「无需虚拟化时钟」的断言**）：
  `System.currentTimeMillis()` **有 3 处在 `tjge.a.paint()` 内**（game2 亦然），
  且该值**直接驱动绘制**——`paint()` bci 1655 打点、bci 3078 算 `D = now - D`、
  bci 2246/3202 经 mm:ss 格式化后 `drawString(s,36,105,20)`（关卡耗时）。
  - **oracle harness 无虚拟时钟**、全速直调 paint（2127 帧只花 <1s 墙钟）→ 显示 `0:00`；
    port 的 behavior-net harness **有假时钟**（每帧 +100ms）→ 显示 `3:06`。
  - **真机 10FPS 跑 1860 帧就是 186s → `3:06` 才对，即 port 对、oracle 错**
    （帧周期 100ms 独立取自原版字节码：`tjge.a.<init>` `ldc2_w long 100l → putfield W:J`）。
  - **这是两侧 harness 的差异，不是两侧实现的差异。**
  - **✅ 修法**：`patch-clock.mjs` + `harness/VClock.java` —— **只改常量池、不动任何一条字节码指令**
    （把 `Methodref(System, currentTimeMillis:()J)` 的 class_index 重指向 `harness/VClock`，
    方法名与描述符一字未改 → 无需遍历指令流）。步长 W **独立取自原版字节码**（100/80ms），
    **不是抄 port** → 不构成「用它自己验它自己」。`diff.sh` / `run.sh` 已自动构建并前置到 classpath。
  - ⚠️ **代价（诚实标注）**：oracle 从此跑的是「原版字节码 **+ 本补丁**」，
    **补丁自己成了一个「中间物」**——正是 CFR 当年的位置。故 `--verify` 用 `javap` 逐行对拍
    **机器验证补丁最小性**（唯一允许的差异就是那一处重定向，其余一律 exit 1）。
    **别信「我写得很小心」，去测。**
  - **实证**：修前 `s70080` → `< 0:00` vs `> 3:06`；修后**同一脚本 130932 op 逐字节一致**，
    oracle 显示 `3:06`。豁免已删除，**同样 200 个种子（原有 28 轮需豁免）→ 200/200 全绿、豁免为零**。

完整审计见任务 B（`docs/` 待补）。
