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

## ✅ oracle 查出的第一个真缺陷：port 的 Nokia rot90/270 映射是反的（**已裁决并修复**）

**这是 oracle 的第一份产出，也正是行为网**永远**抓不到的那类缺陷**——因为 behavior-net 的
golden 是**从 port 自己录的**，port 一直错、golden 就一直把错的当基准。只有引入「原版」这个
外部参照才能发现。

`fidelity-gaps` 早已挂着一条待办：「game1 rot270+flip transform：纯镜像已位级一致；
**rot270 仅火箭弹触发，是经验映射未对拍**」。本次用 **FreeJ2ME**（第三方 J2ME 模拟器，
`tools/emulator/freej2me-v1.52/freej2me.jar`，CFR 反编译）作**独立参照**，把它裁决了：

| Nokia `manipulation` | FreeJ2ME `manipulateImage` → | TS port `manipulationToTransform` → | |
|---|---|---|---|
| `0` | TRANS_NONE(0) | 同 | ✅ |
| `8192` 水平翻转 | TRANS_MIRROR(2) | 同 | ✅ |
| `16384` 垂直翻转 | TRANS_MIRROR_ROT180(1) | 同 | ✅ |
| `24576` 双翻转 | TRANS_ROT180(3) | 同 | ✅ |
| `180` | TRANS_ROT180(3) | 同 | ✅ |
| **`90`** | **TRANS_ROT270(6)** | **TRANS_ROT90(5)** | ❌ **反了** |
| **`270`** | **TRANS_ROT90(5)** | **TRANS_ROT270(6)** | ❌ **反了** |

**根因**：Nokia DirectGraphics 的 `manipulation` 旋转是**逆时针**，MIDP Sprite 的 `TRANS_ROT90`
是**顺时针** → **Nokia 90° ≡ Sprite ROT270**。port 作者按字面直译（90→ROT90）故而反了。

**FreeJ2ME 语义已逐像素核对**（`PlatformImage.transformImage`）：
- `case 5`：`src(x,y) → dst(h-1-y, x)` = 顺时针 90° = TRANS_ROT90 ✓
- `case 6`：`src(x,y) → dst(y, w-1-x)` = 270° = TRANS_ROT270 ✓

**当前是潜伏缺陷、非活缺陷**：实测 `game1-level` 只出现 `m=0`（1811 次）与 `m=8192`（849 次），
**无任何 90/180/270 旋转** —— 与 `fidelity-gaps` 记的「rot270 仅火箭弹触发」吻合。故本场景差分
**无法裁决它**（两种映射在 0/8192 上一致）。

**已裁决（2026-07-16）**：查到 **Nokia UI API 官方文档**，直接一锤定音——
> ROTATE_90 … rotating an image **90 degrees counter-clockwise**；
> to rotate 90 degrees clockwise, **ROTATE_270** would be used。
（<https://nikita36078.github.io/J2ME_Docs/docs/Nokia_UI_API_1_1/com/nokia/mid/ui/DirectGraphics.html>）

而 MIDP Sprite `TRANS_ROT90` 是**顺时针** → **Nokia 90° ≡ Sprite ROT270**。**三个独立信源一致**
（官方规范 / FreeJ2ME 实现 / 对 FreeJ2ME transformImage 的逐像素核对）→ **port 确证有误，已修**。

**缺陷范围比预想更精确**：逐一比对全 16 种组合发现，**只有「纯旋转无翻转」的 90 与 270 两项错**；
8 种纯翻转/180 组合、以及 6 种「翻转+旋转」组合**当年反而都推导对了**（内部自相矛盾，典型手工
推导缺陷）。修复即把两处 `return` 对调（`SpriteAtlas.manipulationToTransform`）。

**已锚定**：`packages/j2me-shim/test/nokia-manip.verify.ts` 按官方规范表锁定全 16 种组合，
已并入 `pnpm test:shim`。**该测试已验证能抓到旧缺陷**（回退修复→精确报出 90/270 两项不符→恢复回绿）。

**修复确证为潜伏（未触及任何已覆盖路径）**：修复后 `test:behavior` 6/6 golden **完全不变**、
两个跨引擎差分**仍绿**——与「game1-level 只出 m=0/m=8192」的实测吻合。

**剩余待办**：找到该路径的**实际触发场景**（唯一设 orientation=270 处是 `ProjectileActor.spawnAt`
的 `typeId=10 PlayerBounceShot 且 byArray[2]==2`，属**关卡数据放置**的弹反/地雷物，非玩家武器
——`spawnProjectile` 不设 orientation），以便差分也在 in-situ 覆盖它。探针见
`packages/jvm-oracle/src/harness/ProbeRot.java`（含已踩的两个坑）。

> ⚠️ **方法论要点**：`jvm-oracle` 侧的映射表（`com/nokia/mid/ui/NokiaManip.java`）**独立取自
> FreeJ2ME，绝不能抄 port 的 `manipulationToTransform`**——否则差分就是「用它自己验它自己」，
> 对映射错误永远盲。这正是它能查出本缺陷的原因。

## 🔴🔴 oracle 的第二份产出：**CFR 反编译出错，port 忠实照抄 → 真 bug**

**这条比 rot90/270 更重要：它动摇了「CFR = 权威基准」这个前提。**

差分模糊测试器（seed=110/111）捞出：玩家手雷的纵向速度两侧不同——原版近乎平飞（y 每帧 -1142
定点 ≈ -1px），移植每帧 -29696（≈ -29px）、**三帧就飞出屏幕消失**。

**定位过程**（每步都排除到底，未靠猜）：
1. 逐帧 dump 两侧 drawQueue → **队列逐字节相同**，只有手雷（typeId 15）分歧 → 排除敌人 AI/相机。
2. dump 速度字段 → `ay=0 mvy=0` 两侧皆是 → `launchArc` **未被调用**；两侧**生成 y 完全相同**
   （95114+1142 = 66560+29696 = 96256）→ 排除生成逻辑。
3. 分歧**纯在 `targetVelY`**（-1142 vs -29696），它来自 `computeHomingTrajectory`。
4. 按 CFR 手算：目标只能是 ACTOR0（typeId 1, y=81920）→ `bestDist=|96256-81920+15360|=29696`；
   `targetTop=61440`，手雷 `posY=96256 > 61440` → 走 `-bestDist` → **应得 -29696**。
   **port 得到的正是 -29696（符合 CFR），而跑真字节码的 oracle 得到 -1142。**
5. → 反推：**CFR 错了**。`javap tjge.l.f()` 尾部裁决：

```
214: iload 4     // n4 (bestDist)
216: iload_1     // n  (horizDist)
217: idiv
218: istore 4    // n4 = n4/n     ← ★ 无条件执行，在分支之前
226: if_icmple 235
229: iload 4 ; 231: ineg          ← 加载的是【已除过的】n4
235: iload 4                      ← 也是【已除过的】n4
237: putfield H
```

| | 语义 |
|---|---|
| **真字节码** | `n4 /= n;  this.H = this.D > n3 ? -n4 : n4;` |
| **CFR 产出（错）** | `this.H = this.D > n3 ? -n4 : (n4 /= n);` ← 把除法**沉进了 false 分支** |

算术印证：`29696/26 = 1142` → 真机 **-1142**（oracle ✓）；照抄 CFR → **-29696**（port ✓）。

**修复**：`packages/game1/src/ProjectileActor.ts` `computeHomingTrajectory` 末两行改为无条件先除
再进三元（行内注释已附字节码证据，防未来「照 CFR 改回去」）。

**方法论冲击（重要）**：
- **CFR 不是绝对权威**。项目一直把 `reverse/*/2-decompiled-cfr/` 当「权威反编译基准」，人工逐行
  移植也是对照它做的——**所以人工审查在原理上抓不到这类缺陷**（审查者与被审查者用的是同一个
  错误参照）。行为网同样抓不到（golden 从 port 自己录）。**只有跑真字节码能发现。**
- 今后遇到「port 与 oracle 分歧、但 port 看起来完全符合 CFR」时，**优先怀疑 CFR**，用
  `javap -c -p` 裁决，勿默认 port 错。
- CFR 的高危模式：**复合赋值/自增混在三元或复杂表达式里**（`(n4 /= n)`、`(segCursor -= 2)` 之类）。
  这类地方 CFR 可能把「无条件的副作用」错误地沉进某个分支。**该文件其余同类写法值得复查。**

**锚定**：`packages/jvm-oracle/regress/game1-grenade-homing.txt`（由捞出它的 fuzz seed=110 固化）+
`./diff.sh --script regress/game1-grenade-homing.txt 1`。**已证该夹具能抓旧缺陷**（回退→红且精确
复现 `<d=74,83` vs `>d=74,56`→恢复回绿）。⚠️ 现有 behavior-net golden **覆盖不到此路径**
（既有场景只开武器0=导弹，不走 computeHomingTrajectory），故修复后 golden 完全不变——
**必须靠本夹具锚定，否则重构再踩没人拦**。

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
