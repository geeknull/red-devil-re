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

## ✅ 第三份产出：game2 换色帧「零验证」是**记载失实**——它一直被验着，只是没人知道

**结论与预期相反，故必须显式记下来。** 待办里长期挂着「game2 换色帧（自创 PLTE 补丁 + 预解码）
**至今零验证**，没有任何 scenario 走到它」（`fidelity-gaps` 第 1 条、`behavior-net`「已知缺口」）。
**实测推翻**：`game2-level` 这条**既有**场景**一直**在画它——**586 条 `drawRegion`、跨 161 帧
（F134–F299，即进 InGame(F133) 的下一帧起）、两侧逐字节相同**。

| 图像身份 | 是什么 | game2-level 中出现次数 |
|---|---|---|
| `png:28fafafc267c` | t.bin 条目 0 **基础帧**（actorPng.bin 条目 0 原字节） | 1132 |
| `png:5498ccc2bbb4` | t.bin 条目 0 **换色帧 frame1**（PLTE 补丁后 PNG 字节） | **586** |

**为什么这个验证不是「自己验自己」**：两侧的补丁字节是**各自独立算出来**的——oracle 侧是
**原版字节码自己**在 `i.a(int)` 里 `System.arraycopy` 打补丁后喂给 `Image.createImage`（oracle 的
`Image.java:39` 对**入参字节**取 `png:<sha6>`）；port 侧是**自创**的 `TileSheet.a_PaletteFrames()`
离线**重算**同一段补丁字节。port 只要算错一位 → 哈希不同 → 红。

**已证该绿灯能抓旧缺陷**（变异测试）：把 `TileSheet.ts:170` 的 `getCachedImage(..., frame)` 改回
`getCachedImage(..., 0)`——即**精确复现** `fidelity-gaps` 第 1 条记载的历史缺陷「换色帧退化成基础色」
——差分**立刻红**，1246 行差异，**首个失配精确落在 F134**（换色 actor 首次绘制帧）：

```
< F134  drawRegion png:5498ccc2bbb4 src=0,17,22,15 t=2 d=140,157   ← 原版：换色帧
> F134  drawRegion png:28fafafc267c src=0,17,22,15 t=2 d=140,157   ← 变异体：退化成基础色
```
还原后回绿。**所以这个绿是挣来的，不是巧合。**

### 换色帧的真实语义（此前无记载）

- 全游戏**只有一个换色帧**：`/res/t.bin` 条目 0 的 frame 1（该条目 `imageCount=2`；其余 8 条均 ≤1）。
- t.bin 条目 0 = **人形共用图集**，被 9 个 SpriteDef 共享（def 0 玩家、1/2/3/4/5 步兵与炮台、
  7 拾取物、8 未命名、10 直射弹）。映射来源＝**a.bin 该条目的第 2 个字节**（字段 `n`，非硬编码表；
  已由 `javap tjge.d.b(int)` 裁决：`22: invokestatic a(InputStream)B / 25: i2s / 26: putfield n:S`）。
- **换色帧 = 敌兵的第二套制服配色**，由**关卡放置数据**挑中：`ActorBase.palette = byArray[6]`
  （`h.java:80`），绘制时当 imageFrame 传给 `i.a(Graphics,...)`（`h.java:206`）。
- **真字节码裁决 `tjge.h.F`（palette）全游戏只有 1 处 putfield（offset 142，取自 `byArray[6]`）
  + 1 处 getfield（offset 233，即绘制）**，无任何子类跨类写入（无 `Field tjge/h.F:I` 引用）
  → port 的「只在 spawnFromBytes 写一次」是忠实的，**没有漏掉写入点**。
- 实测 s.bin 全 7 关共 **96** 个 `palette=1` 实例（关 0..5 分别 15/12/19/17/17/16；关 6 Boss 关无），
  **无一例外全部落在 sheet 0 的类型上**，且只有类型 1/2/3/4/5。
  （`type 6 NavalOfficerNpc`「白制服人物」用的是 **sheet 4**，与换色帧无关，勿混淆。）

> **方法论教训（与 §「CFR 不是权威」同构）**：这次错的不是代码，是**记载**。
> 「零验证」这个标签和当年「CFR = 权威」一样，**一旦写下就不再被检验**——它替我们做了
> 本该由测量来做的认知工作。**代价是反的：那次让我们过度信任，这次让我们低估了自己已有的覆盖，
> 差点去重造一条已经存在的场景。** 结论同一条：**别信标签，去测。**

## 覆盖断言：让「绿」必须携带信息量（`coverage/*.cover`）

上一节暴露的真问题**不是**缺覆盖，而是**覆盖是偶然的、没人担保**：若有人改动 scenario 致
换色帧不再被画，`game2-level` 会**继续绿**——一个什么都没验的空洞绿灯，且无人察觉。
这正是本项目栽过的那个跟头（拿静态绿灯冒充已验证）的**新变体**。

故 `diff.sh` 增加第 5 步：按 `packages/jvm-oracle/coverage/<场景>.cover` **断言必达路径**，
把「本场景覆盖了什么」从**偶然**变成**机器断言的不变量**。

```
op    <最少次数> <op 子串（可含空格）> | <说明>
state <状态号>                        | <说明>
```

- **断言取 oracle 侧**（信任根＝原版字节码）：断言「**原版**在这条输入下确实走了该路径」。
  port 侧无需另断言——op 已逐字节相同，原版画了 port 必然也画了。
- 断言失败 → **exit 4**，措辞明确写「op 一致但目标路径没被走到 → 这个绿没有信息量」。
- **删条目 = 公开承认放弃该块覆盖，必须写清理由**（豁免只能收紧不能放宽）。
- 无 `.cover` 文件 → 打印「该绿灯不含覆盖信息」，**不假装有**。

**已证该机制本身能红**（负测试）：往 cover 里塞一条不存在的 op（`png:deadbeefdead`）与一个
达不到的状态（16 LevelClear）→ 两条都被点名、exit 4；移除后回绿。

现有清单：`game1-level.cover`（blitSprite 4bit 精灵路径 + 5 状态）、
`game2-level.cover`（**换色帧 frame1 + 基础帧 frame0** + 4 状态）、
`game1-grenade-homing.cover`（**`blitSprite 25x9 t=0 d=74,83`** ＝ F187 手雷的原版位置；
历史缺陷会把它变成 `d=74,56`）。最后这条尤其要紧：**behavior-net golden 覆盖不到手雷路径**，
一旦该夹具空转，那个缺陷就再无防线。

## 🔴🔴 第四份产出：**oracle 自己有个洞——两侧不共享时钟**（本文原先的断言是错的）

**这条最该记：它不是 port 的缺陷，是[信任根]自己的缺陷，而且是本文自己写错的。**

**发现方式**：状态覆盖引导的差分模糊器第一次走到 **MissionFailed(18) / CaptureCutscene(20)**
（死亡/结算路径，**此前从未被任何 scenario 覆盖**），当场翻出：

```
< F2127  drawStr [所用时间: 0:00] 36,105,20   ← oracle（原版字节码）
> F2127  drawStr [所用时间: 3:06] 36,105,20   ← port（移植）
```

**真字节码裁决**（`javap tjge.a`，game1；game2 同构）：

| 位置 | 字节码 | 语义 |
|---|---|---|
| `<init>` | `5: ldc2_w // long 100l` → `8: putfield W:J` | 帧周期 **100ms** |
| `paint()` bci 1655 | `invokestatic System.currentTimeMillis` → `putfield D:J` | 关卡开始打点 |
| `paint()` bci 3078 | `currentTimeMillis` → `lsub` → `putfield D:J` | `D = now − D`（耗时） |
| `paint()` bci 2246 / 3202 | `getfield D:J` → `a(J)Ljava/lang/String`（`1000l/60l/60l`）→ `drawString(s,36,105,20)` | mm:ss 显示 |

→ **`System.currentTimeMillis()` 有 3 处在 `paint()` 内**，且该值**直接驱动绘制**。

**根因＝两侧 harness 不共享时钟**（不是两侧实现有别）：
- oracle harness **不虚拟化时钟**，按固定帧预算全速直调 `paint()` → 2127 帧只花 <1s 墙钟 → `0:00`
- port 的 behavior-net harness **有假时钟**（每帧 +100ms）→ 1860 帧 = 186s → `3:06`

**谁对？** 真机 10FPS 跑 1860 帧就是 186 秒 → **`3:06` 才对**。**port 对，oracle 错。**
（算术闭合，且帧周期 100ms 是**独立取自原版字节码**的，不是抄 port。）

### 本文原先错在哪（失效模式值得单独记）

原文写：
> 时钟：原版 `run()` 线程只做 sleep/gc/repaint()，**不改任何游戏状态**（已对 CFR 核实：全部逻辑在
> `paint()` 内）…故 harness 直接按固定帧预算调 `paint()` 与该线程零竞争，**无需虚拟化时钟**。

- **前提为真**：`run()` 确实不改状态、逻辑确实都在 `paint()` 内 —— 这一条**被认真核实过**。
- **推论为假**：`paint()` **自己会读墙钟**。「逻辑都在 paint 内」**恰恰意味着读时钟的也在 paint 内**——
  前提不但不支持结论，**反而是反证**。

> **这次的失效模式与前两次都不同，值得单列**：
> - `复盘-CFR不是权威`：**参照物**错了（信任根是坏的）。
> - 「换色帧零验证」：**记载**错了（标签替代了测量）。
> - **本次：前提对、推论错。** 核实了「run() 改不改状态」，却从没问真正该问的那句
>   ——「**到底有没有东西读时钟？**」。而那只需要一句 `grep currentTimeMillis`。
>
> **为什么能活这么久**：因为**没有任何 scenario 走到会显示耗时的界面**。
> 一条从未被覆盖到的断言，**等于一条从未被检验的断言**——哪怕它写在「审计」文档里、
> 哪怕写它的人（包括我）当时非常认真。**覆盖之外无真相。**

### 影响面（已用字节码收紧，不靠猜）

`D:J` 全部 **7 处读写都在 `paint()` 内**；两处读**都**直接进 mm:ss 格式化再 `drawString`
——**不参与玩法/计分/存档**。**实测印证**：命中的那一轮整整 **130932 条 op 只差这 1 条**（seed=70080）。
故 `fuzz.ts` 只**逐 op** 豁免它（签名收紧：同帧 + 两侧都是 drawStr + **坐标完全相同** +
时间戳之前文本**完全相同** + 仅 mm:ss 不同），**其余照常判定**——不是把整轮放过。
200 轮实测：命中 28 轮、**每轮恰好 1 条**，与字节码推断吻合。

### ✅ 已根治（2026-07-17）：虚拟时钟 `patch-clock.mjs` + `harness/VClock.java`

**手法：只改常量池，不动任何一条字节码指令。** `invokestatic #M` 里的 M 是个
`Methodref(Class, NameAndType)`：
1. 在常量池**末尾追加** `Utf8("harness/VClock")` + `Class(→它)`（**追加不移动既有索引**）；
2. 把 `Methodref(java/lang/System, currentTimeMillis:()J)` 的 **class_index 两字节**改指向新 Class。

于是每条 `invokestatic #M` 自动落到 `harness.VClock.currentTimeMillis()J`——**方法名与描述符一字未改**，
故**无需遍历指令流**（不需要 opcode 长度表、不需要 ASM）。`Class("java/lang/System")` 本身不动 →
`System.gc()` / `System.out` 等照常。实测：每游戏命中 **2 个类、2 个 Methodref**
（`tjge.a` 里 6 个调用点共用同一个 Methodref → 一次重定向全覆盖）。

**步长 W 独立取自原版字节码，不是抄 port**（否则就成了「用它自己验它自己」）：
game1 `tjge.a.<init>` 的 `ldc2_w long 100l → putfield W:J` → **100ms**；
game2 `tjge.a.run()` 的 `ldc2_w long 80l` 紧邻 `Thread.sleep` → **80ms**。
（port 侧 `game{1,2}-adapter.ts` 的 `frameStepMs` 恰是 100/80 —— **来源独立而结论吻合**，是佐证不是依据。）

**语义对齐**：port（`installClock(0)`）从 0 起、**每帧 paint 之后** `advance(frameStepMs)` →
第 f 帧 paint 期间时刻 = `f*step`。故 harness 必须 **paint 之后**才 `VClock.tick()`。
（两侧都只用**差值**，绝对原点无关；但每帧步进必须一致。）

**RNG 安全性（已核实，非假设）**：两游戏**构造函数**里都有 `c.setSeed(System.currentTimeMillis())`
（`javap` 确认在 `public tjge.GameMIDlet()` 内，不在 `startApp`）→ 补丁后变成 `setSeed(0)`。
**无影响**：harness 在 `newInstance()` 之后、`startApp()` 之前把 `GameMIDlet.c` 整体替换为固定种子的
`LoggingRandom` → 构造函数里那个 Random 当场被丢弃。

#### ⚠️ 方法论代价：信任根变了，必须诚实标注

oracle 的核心卖点是「**直跑原版未修改的字节码**」。本补丁**修改了字节码** → 严格说信任根从
「原版 `.class`」变成「原版 `.class` + 本补丁」，**本补丁自己就成了一个「中间物」**
（判据见 `复盘-CFR不是权威.md` §2.2：**隔 ≥1 跳且中间物未验证 = 只能证「没变」不能证「对」**）。
**这正是 CFR 当年的位置。** 所以不能只靠「我写得很小心」：

**`--verify` 机器验证补丁的最小性**：用 `javap` 逐行对拍补丁前后的反汇编，
**断言唯一差异就是 `java/lang/System.currentTimeMillis` → `harness/VClock.currentTimeMillis`**，
行数变化或任何其它差异一律 **exit 1**。已并入 `diff.sh` / `run.sh`（补丁失败即 exit 3，拒绝出结论）。

#### 实证（决定性）

- **修前**：捞出它的 `s70080` 脚本 → `< 0:00` vs `> 3:06`，2 行差异。
- **修后**：同一脚本 **130932 条 op 逐字节一致**，oracle 现在显示 **`3:06`**（与真机 10FPS 跑 1860 帧吻合）。
- **豁免已彻底删除**（根因已修，留着失效豁免会掩盖将来的真 bug；删豁免属「收紧」）：
  **同样 200 个种子**（其中原本 28 轮需要时钟豁免）→ **200/200 全绿、豁免为零、不可判定为零**。
  这是「根因真修了」而非「被糊过去」的证据。

## 提交前门禁 `pnpm verify`（行动项 F）

一条命令跑完全部闸门：`test:shim` → `test:behavior` → `oracle:diff` 两条 level →
**`regress/` 下全部夹具**（所属游戏按文件名前缀 `game1-`/`game2-` 推断，**新增夹具自动纳入**）。

**已证门禁能红**：把 `ProjectileActor.computeHomingTrajectory` 退回 CFR 的错误形态
（`H = D > n3 ? -n4 : (n4 /= n)`，即那个真缺陷）→ 门禁 **exit 1**。
**但真正值得看的是「谁抓到了它」**：

| 闸门 | 结果 | 为什么 |
|---|---|---|
| `test:shim` | ✅ 过 | 不碰游戏逻辑 |
| `test:behavior`（golden） | ✅ 过 | **结构性抓不到**——golden 是从 port 自己录的，port 错则 golden 把错的当基准 |
| `oracle:diff game1-level` | ✅ 过 | **走不到手雷路径**（既有场景只开武器0=导弹） |
| **`regress` 夹具** | ❌ **红** | `blitSprite 25x9 t=0 d=74,83` → `d=74,56`，**唯一抓到的** |

> **这张表就是整个项目方法论的实证**：一个**玩法可见的真缺陷**，能同时躲过
> 单元测试、行为回归网、**以及锚在真字节码上的跨引擎差分**——只因为**没有场景走到它**。
> 「有绝对闸门」**不等于**「被闸门覆盖」。**闸门 × 覆盖，缺一不可。**
> 这也正是 `regress/` 夹具与 `coverage/*.cover` 必须存在的理由。

## 状态覆盖现状（诚实标注：哪些走到了、哪些没有）

差分模糊测试（状态覆盖引导）+ 定向夹具的实际覆盖。**未达到的状态＝未被验证，不许当已验。**

| 游戏 | 已达状态 | **未达状态（覆盖缺口）** | 缺口原因 |
|---|---|---|---|
| game1 | 1,2,3,4,6,10,13,14,18,20,21,22（**12/15**） | **15 Ending / 16 MissionComplete / 19 GoalCutscene** | 见下 |
| game2 | 1,2,3,4,6,10,19,20,22,100（10/13；18 见下） | **16 LevelClear / 18 LevelFailed / 21 GameComplete** | 见下 |

**已由本轮新增覆盖**：game1 **21 LevelScroll**（`game1-level-scroll` 夹具，存档注入跳关卡7）、
**18 MissionFailed / 20 CaptureCutscene**（模糊器死亡路径）；game2 **100 NoSave / 19 About / 6 Help**（模糊器菜单探索）。

### 缺口分层（字节码 triage 裁决，非猜测）

- **`beat-level`（必须真打到某关 goal，随机输入与存档注入都省不掉）**：
  game1 **GoalCutscene(19)**（横穿关卡 + 通常需清场 + 在 goal 触发器按动作键；关卡0 的 goal 是 prop 触发器非纯 hold-right）、
  game1 **MissionComplete(16)**（GoalCutscene 的收尾，须先到 19）、
  game2 **LevelClear(16)**（走到关卡收尾剧本 / 打完 Boss 段）。
  → **存档注入只能把你送进目标关卡的开头，送不到终点。** 要覆盖须**录一段能确定性通关卡0的输入脚本**
  （打到 goal 触发器），那是一项独立的、不小的投入；本轮**未做**，如实标为缺口。

- **`beat-game`（须打穿末关）**：game1 **Ending(15)**（唯有关卡7完成结算才进）、
  game2 **GameComplete(21)**（唯有关卡6 LevelClear 结算动画播完才进）。**随机不可能**，存档注入也只到末关开头。

- **game2 LevelFailed(18)——理论 `cheap-input`，实测却够不到**：玩家在横向关卡内被打死即进
  （与 game1 已达的 MissionFailed 同层）。但玩家 10 血、每击仅 1–3 伤，**相当耐打**。实测证据：
  ①原地不动 900 帧存活；②持续向右走入敌群、不开火 1200 帧仍存活；③模糊器 150+33 轮均未死。
  → 与预期相反，**随机输入与简单脚本都杀不死玩家**；要覆盖它得**标定「走到某敌近旁并滞留挨打」的
  精确战斗脚本**——与 `beat-level` 同一投入档，本轮**未做**，如实标为缺口。
  （对比 game1 MissionFailed 之所以达到：那是模糊器 seed=70080 的一次**偶然**死亡，非可靠路径。）

> **方法论一致性**：这张表本身就是「覆盖之外无真相」的应用——**不把「没走到」粉饰成「已验证」**。
> 要消除 `beat-level`/`beat-game` 缺口，正确做法**不是**继续加随机模糊里程（原理上到不了），
> 而是**录确定性通关脚本**（一次跑可同时覆盖 GoalCutscene→MissionComplete 等链式状态）。

### 通关脚本起点（给未来会话——省得重新 fan-out 推一遍）

**为什么值得做（不只是刷覆盖）**：结算/终点屏的渲染代码**从未与原版对拍过**。按本项目规律（bug 藏在
「移植方不得不自己发明、且没被覆盖」处，手雷弹道即如此），这里完全可能藏着照抄错反编译的保真缺陷。
打通关卡 = 去**体检一块从没体检过的渲染代码**，非刷数字。

**目标状态的触发条件（字节码 triage 已裁决，file:line 可直接跳）**：
- **game1 GoalCutscene(19)**：关卡0 的 goal 是 **prop 触发器**（非 Boss）。条件＝横穿关卡到 goal actor +
  **清场**（`enemyAliveCount<=0` / `scriptFlagL`）+ 在触发点**按住动作键**（`player.stateFlags & 1`）。
  各类型 setter：`EffectActor.ts:188` GatedTrigger(type12)、`:278` RescueTargetNpc(type4)、
  `:292` CaptureTrigger(type5，要 `scriptFlagL && reinforceBudget<=0 && enemyAliveCount<=0 && posY>490000`）。
- **game1 MissionComplete(16)**：19 的**自动收尾**（`GameScreen.ts:889` 关卡1/3 stateTimer>23 淡出后 /
  `:900` 玩家走出视野 posX>cameraX+viewWidth+px(10) 且 stateTimer>32）。到了 19 就会进 16，一次覆盖两个。
- **game2 LevelClear(16)**：`GameCanvas.ts:678` showResult(true)，由 `LevelScene.ts:395/434/505/547/582/715/826`
  的关卡收尾剧本调（走到剧情终点 / 玩家走过相机边界 frameGroupIndex===0）。

**实操起点**：
- 进关卡引导（已实证）：game1 `100,48,1 / 101,48,0`（新游戏直进关卡0）；game2 `100,53,1 / 101,53,0 / 130,22,1 / 131,22,0`。
- 键码→动作映射：game1 `GameScreen.keyCodeToAction`（约 :1717）；game2 `GameCanvas.keyPressed`（:1037，case 54=Right/53=Fire/55=Reload…）。
- **逐帧步进观察玩家/敌人状态**推导下一步输入：`DUMP_ACTORS=1`（port）/ `-Doracle.dumpActors=true`（oracle）
  逐帧 dump drawQueue 里每个 actor 的 typeId/posX/posY——用它盯着「玩家 x 逼近 goal」「enemyAliveCount 归零」。
- **验证同旧夹具**：① 先证脚本真达 state 19/16（statesSeen 含之，走不到＝白做）；② 差分绿/红定性到根因
  （红→可能就是没对拍过的保真缺陷，照手雷流程 javap 裁决 CFR 是否又错）；③ 固化 `regress/` + `coverage/*.cover`
  + 变异测试证夹具能抓旧缺陷。
- ⚠️ 诚实预期：这条得摸关卡0 地形/敌人布置、标定移动时序，**未必一次成功**；做不到就如实说卡在哪，别硬凑。

### 本会话实测修正与现状（2026-07-18）——上面几条有**事实错误**，以此节为准

本会话按上节起手，用**逐帧 port 内部字段观测**（复刻 game1/2-adapter 但直接读 screen/canvas 内部）
把关卡0 的 goal 机制**从字节码/关卡数据钉死**，纠正了上节的推测错误。**但两条通关脚本都未标定成功**，
诚实标注卡点如下。

**🔴 game1 关卡0 goal ≠ prop 触发器（上节错）**：关卡0 的 actor 放置数据（`LevelLoader.actorTypeId/SpawnX/SpawnY`
逐条 dump）里**根本没有 type4/5/12/13**。实测 goal＝**击败 type18 ScrollChaserHeavy**（关卡数据 actor #11，
像素坐标 (681,240)，位于地图右下角的坑内）。机制链（javap/源码逐句核实）：
- 玩家 **roll（actionId 19**：走路态 actionId===5 时按 **DOWN**，`PlayerActor.handleDownPress` :1148 `setFrame(19)`，
  沿朝向 px(8) 冲）撞上敌人 → `EnemyActor.handleKnockback` :186 置 `knockedBack`、把玩家击退并 `setFrame(0x14=20)`；
- 玩家 actionId 自动 20→21（`stepTransition20` :660）；`handleKnockback` :196 见玩家 actionId===21 且 |Δx|<px(40)
  → 敌 `aiState=9`、type18 `setFrame(3)`；
- `scrollChaserHitCheck` :794：aiState 9 且 `actionLow24===3 && timerB>2 && (玩家 stateFlags&1)!==0` → `GoalCutscene(19)`。
- **`stateFlags & 1` ＝着地态 bit0**（非上节说的"按住动作键"；出生 `resetForLevel` :232 即置 1）。
- **清场那条路（type5 CaptureTrigger）走不通**：`reinforceBudget` 关卡0 恒＝30（`:1675` 初值，唯一递减在
  `PlayerActor.stepVehicleLevel` :314，那是**关卡4 载具专属**）→ `reinforceBudget<=0` 永不成立。

**game1 关卡0 地形**（`tileMap.queryColumnTileAt` 逐格 dump）：44×22 tile（704×352px，16px/tile）。出生 tile(2,7)。
敌人坑＝右下角 cols 34-43 / rows 15-19，被 **row10 天花板**（cols 33-43 全 solid）+ **col33 竖墙**（rows 10-17 solid）
封死，**唯一入口在底部 row18-19**（col33 在此开口）。顶层走廊(rows 4-10)可横穿到 col42（多种自动导航实证达到），
但**"下坑"路线未标定**——须从左侧竖井下到 row19 再右行到坑。camera 脚本 case0（`GameScreen.ts:1332`）在
camera 到 tile(33,11)＝到坑区上方时置 `scriptFlagL`，与 type18 goal 无因果（是另一段过场）。

**🟢 game2 关卡0 goal（实测钉死，可复用）**：clear＝玩家走进 **type-2 触发器 AABB x∈[1450,1470] y∈[548,612]**
（`triggerTable[#1]`，cutscene 编码值＝9 → `cutsceneState[0]=0, [1]=9`）→ `LevelScene.runCutsceneScene0` :387/395
`showResult(true)` → `GameCanvas.showResult` :678 `uiState=LevelClear(16)`。关卡0 触发表 14 条（dump 见下），
mapWidth=1536：`#0` type2 cutscene=0(开场,x-50..252)、**`#1` type2 cutscene=9(结局,x1450..1470)**、
`#2` type0 相机点(x902)、`#3` type1 战斗波(x1286..1360)、`#4-13` type3 formation(抓钩机关,x195..1017)。

**game2 入关引导（实测修正上节）**：`100,53`（菜单 Fire→CutsceneIntro）→ **`130,22`（SoftRight 结束开场过场）**
→ **`180,22`（SoftRight 结束任务简报）→ InGame(10) Normal @F190**。keyCode **22→SoftRight**
（`GameCanvas.keyToAction`；仅 MainMenu 时是 Fire）。⚠️ **InGame 中再按 22 会重新打开简报**（`keyPressed` :1040 软键→
MissionBrief），别多按。之后玩家自 x=194 向右走，**卡在 x~470 的 type3 formation**（抓钩/攀爬机关，
需 `reserved&1` 置位 + ClimbUp key50，见 `PlayerActor` :804）。

**现状（诚实，本单元主目标未达成）**：**两条脚本都没标定成功，结算/终点屏渲染仍未与原版对拍。**
- **game1** 卡在"顶层走廊 → 下坑"的平台跳跃。试过：hold-right+卡墙跳、梯度制导（宽松 BFS 距离场）、
  waypoint 跟随（中等 BFS 模型路径）、**真实模拟器 beam search**。beam 能横穿到 col29(h=5) 但**下不去坑**
  （maxLowY 始终≈row9，无宏序列把玩家降到 row9 以下）；根因＝**无精确跳跃/落体物理模型**，宽松-BFS 启发式
  把玩家往顶层右侧拉，而真入口在左下竖井 → 启发式误导，且坑口是窄缝，8 帧粗粒度宏对不准。
- **game2** 卡在 x~470 抓钩机关（ClimbUp 机制未解）＋后续 x~1286 战斗波（须清敌）。

**给下会话的可复用杠杆（本会话踩通的）**：
1. **静态重置使单进程批量模拟可行**（自动搜索的关键使能）：game1 每次 `new GameMIDlet` 前须清
   `LevelLoader.actorPools/activeActors/spriteDefPool/spriteDefRetained` 与 `.tileMap`，否则 `buildActorPool`
   复用旧 screen 的池 → 玩家不生成（表现为 posX 恒 0）。清了就能在**一个 node 进程里重放上千次**。
2. **正解方向**：要么建**精确移动模型**（每条边用真实模拟验证可达，做真物理 flood-fill 得可信距离场），
   要么**手工分段标定**（game1 顶层横穿已解决，只剩「下坑／底部右行／跳上敌人／roll」四段各自标定）。
3. **game2 更接近**（goal 是干净坐标 x≈1460，启发式可简化为"活着最大化 x"），但需先解抓钩机关(ClimbUp)与
   战斗波清敌两个子机制。

### ⭐ ultracode 深挖（2026-07-18 续）——关卡0 GoalCutscene **证伪不可达** + 转攻关卡3 + 快速搜索工具链

上节把 game1 关卡0 goal 标为「type18 卡在下坑」。**本轮用穷举真物理搜索把它升级为决定性结论**：

**🔴🔴 game1 关卡0 GoalCutscene(19) 物理不可达（穷举证明，任务前提错）**：
- **两套独立穷举 BFS（真游戏当模拟器）**：粗宏 + 速度感知/细宏，均判**敌人坑(row15+)零可达**——
  可达 tile 仅 52/58 个、最深 row14；坑口区(col≤33,row17+)亦零可达。玩家被封在地图上半。
- game1 玩家碰撞**只判 `===1`(实)/`===2`(梯)**，**无单向/可落穿平台**（grep 实证）→ 真物理 BFS 已完备。
- **导弹只制导 type1/2**（`ProjectileActor.isHomingTarget` :296，**永不锁 type18**）；投射物撞地形
  （`advanceAndCollide` :250）→ 隔墙打不到坑里的 boss。
- **type18 scrollChaser 只在玩家与它同 Y（即在坑里）才交互**（`scrollChaserDecideAction` :719：`target.posY∈(posY-10,posY+60)`），**从不上来找玩家**。
- 抓取锚点 type22 → **CaptureCutscene(20)**（`handleUpPress` :1098 setFrame13→`stepEnterCapture` :671），非 GoalCutscene。
- **∴ 关卡0 可达结局＝CaptureCutscene(20)**（模糊器已覆盖）；**GoalCutscene(19) 在关卡0 根本到不了**。上节「type18 是 goal 但卡下坑」措辞过弱，以本条为准。

**全 7 关 goal-actor 地图**（`LevelLoader` 逐关 dump）：关0=type18(封死坑) / **关1=type5** / **关2=type12+type13** /
**关3=type4 RescueNpc@(1372,128)+type8 Boss@(1298,227)** / 关4=type8 / 关5=无标准 goal 触发器 / 关6=type8。
→ GoalCutscene 须打**别的关**；type4「走到即触发」最简，故**选关卡3**（用户拍板）。

**关卡3 全解剖（攻到 col78/85，只差最后 boss）**：
- **入关**：`save=3,3,1` + Continue（`100,6 / 130,48`）→ 关3 Playing @~F232，出生 tile(2,14)。地图 88×16，row14 平地板。
- **战斗 gauntlet**：一路远程 type1/2 敌，HP 10 掉到 col39 剩~3。开火(key48)=导弹制导 type1/2 清敌。
- **桶谜题 cols39-43**：ExplosiveBarrel(type7) 在 col40/41/43 + row13 小方块 col39/42 挡路。
  **手雷(fireWeapon20) 是落地弹、spawn 在玩家头顶(posY-px35)→对隔开的桶无用**；桶须
  **weapon1(PlayerBounceShot,直飞) --hitPoints**（桶 3 血）——须先**换武器 key35(action32)**。血包在 col62。
- **终点**：col82 梯子(rows9-13)→row8 平台→RescueNpc(type4)@col85。走到它着地→GoalCutscene(19)。
- **🔴 最终 boss（强制、相机锁死）**：AtvVehicleBoss(type8)@col81 守着梯子。camera 脚本 case3 在 col68+ 置 `scriptFlagL`→
  boss 激活 + **相机锁在竞技场(cols~68-79)**，玩家困在 col78 前进不了直到 boss 死。boss **waveCount=9(指标~20 击)**、
  **冲刺(phase3)撞玩家 3 伤/次、~5 次即死**；**只在静止(`targetVelX===0`)时可伤**：导弹/弹跳弹 1 伤、手雷 3 伤
  （`BossActor.onProjectileHit` :396-421）。**关3 打死 boss 不直接给 GoalCutscene**（那是关6 专属 :225-229）——
  是**解锁相机**让玩家爬梯到 RescueNpc 才 GoalCutscene。
- **进度**：战斗感知 best-first 搜索**攻到 col78 hp7**（过了 gauntlet+桶群+血包），**唯一未破＝这个 9 波相机锁 boss**。

**⭐ 本轮踩通的快速搜索工具链（下会话直接复用）**：
1. **no-op 图形上下文**（Proxy 全返 no-op 函数）：跳过渲染、**逻辑逐字节不变**（实测玩家末位/状态一致）、**4.5×提速**→ ~12ms/400帧 sim。
2. **静态重置** + **no-op 图形** → 单进程可重放上万次真物理 sim。
3. **save 注入**（`save=N,N,1`+Continue）可进任意关。
4. **战斗 best-first 搜索**：状态=(col,hp,facing,weaponIdx,活跃桶数)、**parent 指针重建路径**（修 OOM，别每节点存全事件表）、队列上限。
5. **⚠️ 规模瓶颈**：每次扩展**从头重放全程**（无法克隆游戏状态）→ 深层 boss 战搜索（~20 击 × 多周期）不实际。
   **正解＝boss 战感知规划器**（boss 血进状态 + weapon0/1 + 静止窗口开火 + 冲刺时后撤闪避），或按上面钉死的机制手工分段标定。

**现状（诚实）**：关卡3 **未完整通关**，卡在最终 9 波相机锁 boss；关卡0 **已证 GoalCutscene 不可达**（非"没做到"，是"做不到"）。
结算屏 16/19 仍未对拍——但已把「哪关能到、每关卡在哪、怎么打」全部钉死，且工具链就绪。

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
