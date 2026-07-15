# jvm-oracle —— 用「原版游戏本身」当自动验收参照

在无头 JVM 上**直接运行原版 `.class` 字节码**（`reverse/game{1,2}/1-jar-unpacked/tjge/*.class`，
未经任何修改），逐帧驱动 `paint()` 并抓取 **J2ME `Graphics` 语义级 draw-op 序列**。

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
  （已对 CFR 核实：全部逻辑在 `paint()` 内）；shim 的 `repaint()` 只是计数器、不派发 `paint`。
  故 harness 直接按固定帧预算调 `paint()` 与该线程**零竞争**，无需虚拟化时钟。

**实测**：两游戏同输入各连跑 3 次，逐帧 trace（状态 / op 哈希 / RNG 抽数与累计哈希）
**逐字节一致**——且 game1 的 1176 次 RNG 抽数发生在**真实战斗**中（F199 起 state=10）。

## 已知边界（oracle 不是万能参照）

shim 是**我方自写**的 MIDP/Nokia 桩——**若 shim 错，oracle 会自信地说谎**。已核实项：

- ✅ `translate()` / `clipRect()` / `Image.getRGB()`：两游戏**均未调用** → 桩为 no-op 无害。
- 🔴 **`Font` 度量是编造的**（`stringWidth = len*6`、`getHeight()=13`）。真机字模我们没有。
  而 **game2 `a.java:967` 真的用 `getFont().substringWidth(...)` 参与坐标计算** →
  **该处坐标 oracle 无权威性**，跨端对拍须显式豁免。
- 音频只到「调用了哪个音效/曲目」层面；**音色不可判**。

完整审计见任务 B（`docs/` 待补）。
