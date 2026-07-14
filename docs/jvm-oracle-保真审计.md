# jvm-oracle 保真审计 —— 「谁来验证验证者」

> oracle（`packages/jvm-oracle/`）跑的是**原版未修改的字节码**，但它依赖的 MIDP/Nokia 桩
> 是**我方自写**的。**若桩错，oracle 会自信地说谎**——这比没有 oracle 更危险。
> 本文是对该风险的机械审计：把原版实际调用的每一个平台 API 逐个定性，不留「未知」。

**审计日期**：2026-07-15 ｜ **对象**：`reverse/game{1,2}/1-jar-unpacked/tjge/*.class`

## 方法

用 `javap -c -p` 反汇编两游戏全部原版 `.class`，机械抽取所有对
`javax/microedition/*` 与 `com/nokia/*` 的引用（Method / InterfaceMethod / Field / class）：

```bash
javap -c -p -cp reverse/game$g/1-jar-unpacked $(cd reverse/game$g/1-jar-unpacked && \
  find tjge -name '*.class' | sed 's#/#.#g; s#\.class$##') \
  | grep -oE '// (Method|InterfaceMethod|Field|class) (javax/microedition|com/nokia)[^ ]*'
```

> ⚠️ **正则陷阱（已踩）**：`invokeinterface #272,  11` 带 `, 11`，若正则写成
> `invoke[a-z]+\s+#[0-9]+\s+//` 会**静默漏掉所有 invokeinterface**——首轮因此漏了 15 个
> API，其中包括 game1 精灵渲染命脉 `DirectGraphics.drawPixels`。抽取脚本本身也要复核。

**结果**：game1 = 39，game2 = 47，去重合计 **57 个 API**。API 面极小，可穷尽审计。

## 核心判据

> **只有「返回值会喂回游戏逻辑」的 API 才可能让 oracle 说谎。**

只记录、返回 void 的绘制调用**按构造即忠实**——我们不解释像素，只如实记下
「游戏要求画什么」。桩即使不渲染任何东西，op 序列依然是游戏真实意图的忠实转录。

## 分类结果（57/57，无未知项）

### 一类：只记录 / 无返回值 → 按构造忠实 ✅

`Graphics.{setClip, setColor(I), setColor(III), setFont, drawLine, drawRect, fillRect,
drawString, drawSubstring, drawImage, drawRegion}`、
`DirectGraphics.drawPixels([SZIIIIIIII)`（game1 4bit 精灵）、
`Canvas.{repaint, setFullScreenMode, <init>}`、`FullCanvas.<init>`、
`Display.{getDisplay, setCurrent}`、`MIDlet.{<init>, notifyDestroyed}`、
`Sound.{<init>, play, setGain}`、`Player.{realize, start, stop, deallocate, setLoopCount}`、
`Manager.createPlayer`、`Controllable.getControl`、`VolumeControl.setLevel`、
`RecordStore.{addRecord, setRecord, closeRecordStore, openRecordStore, enumerateRecords}`、
`RecordEnumeration.{destroy, hasNextElement, nextRecordId}`、
`Image.{getGraphics}`、`Font.getFont`、`Graphics.getFont`

### 二类：返回值喂回逻辑 → 已审计**正确** ✅

| API | 谁在用 | 实测取值 | 判定 |
|---|---|---|---|
| `Canvas.getWidth/getHeight` | **game1 自适应布局**（`a.java:113-114` `a=getWidth(); b=getHeight()-32`） | 176×208 / 176×204 | ✅ 经 `ScreenConfig` 对齐 TS port |
| `Image.createImage([BII)` → `Image.getWidth/getHeight` | 两游戏（如 `atlasTilesPerRow = atlasImage.getWidth()/tileWidth`；game2 `a.java:176` `drawImage(v, 0, u.getHeight()+2, 20)`） | **game1 8 张、game2 20 张，尺寸全部非零**（116×60 / 144×112 / 176×146 …） | ✅ image.bin 内是 PNG，ImageIO 解出**真实**尺寸 |

> 曾担心 game1 的 4bit 自研精灵格式让 ImageIO 解不动 → 实测证伪：4bit 精灵走的是
> `DirectGraphics.drawPixels(short[])`，**不经 `Image.createImage`**。两条路互不干扰。

### 三类：返回值喂回逻辑 **但 shim 是编造的** → 🔴 **oracle 盲区**

| API | 盲区成因 | 谁受影响 | 影响面（已逐点核实） |
|---|---|---|---|
| **`Font.substringWidth`** | shim 返回 `len*6`；`getHeight()=13`。**真机字模我们根本没有** | **game2 `a.java:967`**：`n10 = n3 + graphics.getFont().substringWidth(...)` **参与坐标计算** | 🔴 **该处坐标 oracle 无权威性 → 跨端差分必须显式豁免** |
| `Sound.getState` | shim 里 `play()`→PLAYING 后**永驻**（无物随时间回落） | game1 `a.java:2160`：`if (T>=0 && S[T].getState()==0) return;`（不打断正在放的音） | ⚠️ **仅音频**。已核实静态 `T` **只出现在 playSound 内**（1670/1698/1762 的 `h2.T` 是 actor 同名字段，非此物）→ **不外溢到玩法/绘制** |
| `Player.getState` | 同上，`start()`→STARTED(400) 永驻 | game2 `GameMIDlet:112` `!=400` 回收、`:158` `==400` 停止 | ⚠️ **仅 player 记账**，不触绘制 |

**结论**：oracle 的盲区被压缩到 **①字体度量（一处坐标）+ ②音频状态机（不触绘制）**。

### 四类：前置条件（非盲区，但两侧必须一致）⚠️

**RMS 存档会驱动绘制**——这不是桩的缺陷，而是差分的前提：

| 游戏 | 存档字段 | 驱动了什么 |
|---|---|---|
| game1 | `tjge.a.Q[0]` 最高关 / `Q[1]` 当前关 / `Q[2]` 音效开关 | `a.java:238,247,275` 关卡选择；**`:322` `Q[2]!=1 ? 7 : var4_7` 影响绘制取值** |
| game2 | `GameMIDlet.k[2]`、`k[3]` | **`a.java:218` `drawString(o[k[2]==0 ? 7 : 3], ...)` 直接决定画哪段文字**；`:252,259` 分支 |

**oracle 新档实测**：`game1 Q = [0,0,1]`（3 字节）、`game2 k = [0,0,1,0,6]`（5 字节）——
与 `docs`/记忆记载的 RMS 布局（TGS_CT 3 字节 / REDDEVIL2 5 字节）吻合。

TS port 侧在 behavior-net 中 `localStorage` 未定义 → 走同一「无存档」默认分支。

> **差分 runner（任务 E）必须显式断言两侧存档字节一致**，不能假设。

## 独立佐证：oracle 不是「自说自话」

除逐 API 审计外，有一条**独立**证据表明桩没有实质性写错：

原版在我们的 shim 里跑出的状态时间线，与 **TS port** 被 behavior-net 记录的行为**精确吻合**：

- `game2-level` 场景注释写「InGame@~133」「~166 帧插入 MissionBrief」
- oracle 实测：**F133 进 InGame(10)、F166 进 MissionBrief(22)** —— 逐帧命中
- `game1-level`：oracle 达到的 6 个状态 `[1,4,2,22,14,10]` = behavior-net golden 覆盖的同一组

两个**独立实现**（原版 Java 字节码 / TS 移植）在同一输入下走出同一条状态链——
若桩有实质错误，游戏根本走不到这里，更不会逐帧对上。

## 残余风险（诚实标注）

1. **字体度量**：oracle 与 port **都不是**真机字模。差分只能豁免该处，**无法判定谁对**。
   这是真机字模缺失的固有限制，不是工程可解的。
2. **音色**：oracle 只到「调用了哪个音效/曲目」，**音色不可判** —— 仍需人耳。
3. **音频触发时序**：因 Sound/Player 状态永驻，第一次之后的播放判定与真机有别 →
   **oracle 不能担保音效触发序列**（可担保「游戏在哪一帧请求了播放」这一层意图）。
4. **未覆盖路径**：审计只保证「被调用的 API」正确；覆盖面由 scenario 决定（任务 G）。
5. **原计划的「FreeJ2ME 像素交叉体检」未做**，须如实标注。理由：(a) `freej2me-lr` 的抓帧
   是对自由运行墙钟线程的**非确定性采样**（实测同输入两次跑，连去重后的规范序列长度都不同：
   13 帧 vs 14 帧），本身不构成稳定参照；(b) 它只能给**最终像素**，而 oracle 产出的是
   **绘制调用**，两者要对比需先把 op 渲染成像素——等于再造一个渲染器，那个渲染器又需要被验证。
   **本文改用「状态时间线与 TS port 独立吻合」作为替代佐证**（见上节）。若将来要更强的独立性，
   可考虑给 FreeJ2ME 的 `PlatformGraphics` 打 javaagent 插桩取其 op 流（机制已验证可行，
   见调研记录），与本 shim 的 op 流对拍——那才是真正同层的交叉验证。

## 复核方式（任何人可重跑）

```bash
cd packages/jvm-oracle
./run.sh 1          # 达 state=10、3 次运行逐帧逐字节一致
# 危险区 API 实测取值：
java --patch-module java.base=out/.respatch1 --add-opens java.base/res=ALL-UNNAMED \
     -Djava.awt.headless=true -Doracle.width=176 -Doracle.height=208 \
     -cp out:../../reverse/game1/1-jar-unpacked harness.Audit 1
```

`harness/Audit.java` 会 dump：Canvas 尺寸、全部 Image 的解码尺寸（**0 个为零**才算忠实）、
Font 编造值、RMS 存档字节。`Image.instances` 登记表是**纯观测**——加入前后
`traceHash` 不变（game1 `2e55301e6ae2` / game2 `17f1fb27ef52`）已验证。
