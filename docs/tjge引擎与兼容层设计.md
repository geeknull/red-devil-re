# tjge 引擎架构 与 J2ME 兼容层设计

> 两款游戏共用自研引擎 `tjge`。本文给出引擎的共性架构，以及把 J2ME API 映射到
> TS+Canvas 兼容层（`packages/j2me-shim`）的设计与对应关系。逐类细节见各游戏
> `类清单与职责.md`。

## 1. tjge 引擎共性架构

> 下图节点用 TS port 的**友好类名**（括号内为对应单字母源文件名，与 CFR 基准混淆名一一对应）。
> 命名约定与完整映射见本文 §4 与 `tools/rename-map.game{1,2}.json`。

```
GameMIDlet (MIDlet 入口)
  └── 主画布 (game1 GameScreen / game2 GameCanvas，Canvas + Runnable)
        │    主循环 / 全局状态机 / HUD / 资源加载门面
        ├── Actor 基类 ActorBase：派生 玩家 / 敌人 / Boss / 子弹 / 道具 / 特效
        ├── 瓦片地图模块：游戏1 = TileMap + f.bin(地图RLE) + image.bin(瓦片图)；游戏2 = TileMap + m/p/b.bin 三件套(+ fpng/bpng.bin 图)
        ├── 精灵帧模块：游戏1 = SpriteDef + a.bin(帧定义) + SpriteAtlas 解 t.bin(4bit像素)；游戏2 = SpriteDef + a.bin + TileSheet 解 t.bin/actorPng.bin
        └── 关卡/场景：游戏1 = LevelLoader（静态门面 + GameScreen 内脚本）；
                        游戏2 = LevelScene（场景实例 + 子状态机字段 subState）
```

共同特征（两代一致）：
- **单线程定帧循环**：主画布 `run()`（CFR 基准 `a.run()`，TS port 为 GameScreen/GameCanvas 的 `async run()`）中 `while` + `Thread.sleep`（游戏1=100ms/10FPS，游戏2=80ms）。
- **定点数坐标**：位置/速度用 `<< 10`（×1024）定点表示，绘制时 `>> 10`。
- **确定性更新**：每帧先重建渲染/逻辑队列，再"全体物理 → 全体行为"两遍，保证顺序确定。
- **随机数**：`GameMIDlet` 构造时 `Random.setSeed(currentTimeMillis())`，取数走 `a(n)=abs(nextInt())%n`。
- **资源**：统一 `.bin` 归档（见 `bin资源格式.md`），按索引随机定位。

两代差异（详见游戏2 `类清单与职责.md`）：
| 维度 | 游戏1 | 游戏2 |
|---|---|---|
| 类数 | 13（子弹独立类 `ProjectileActor`） | 12（子弹并入 `ProjectileActor`） |
| 像素管线 | `SpriteAtlas` 自解码 4bit + RGB444 调色板 + Nokia DirectGraphics | 直接 `Image.createImage(PNG)` + `drawRegion` |
| 地图 | 单 `f.bin` | `m.bin`(网格)+`p.bin`(瓦片属性)+`b.bin`(背景) |
| 音频 | WAV + 自定义短音 | 标准 MIDI |
| 文本 | `x.bin`(UTF-16LE+BOM) | `string.bin`(UTF-16 中文) |
| 帧率/关卡 | 100ms / 8 关 | 80ms / 7 关 |
| 场景重心 | 巨型 `GameScreen` 内嵌脚本 | 下沉到场景对象 `LevelScene`，含子状态机字段 `subState` |

## 2. J2ME → 兼容层 API 映射

| J2ME API | 兼容层（`@red-devil/j2me-shim`） | 备注 |
|---|---|---|
| `java.util.Random` | `Random` | 48bit LCG，**位级一致**（JDK 参考序列单测通过） |
| `getResourceAsStream` + 手写读取器 | `ResourceArchive` + `ByteReader` | `.bin` 归档解析，**与 Python 解包器一致** |
| `Image.createImage(byte[])` | 预解码 PNG → `Image.fromSource` | 预加载阶段异步解码，运行时同步取用 |
| `Image.createImage(w,h)` | `Image.createMutable` | 可变图，`getGraphics()` 离屏绘制 |
| Nokia `DirectGraphics` 像素 | `Image.createRGBImage` | 游戏1 4bit→RGBA 后 `putImageData` |
| `Graphics`(fillRect/drawImage/drawRegion/setClip/translate…) | `Graphics` | Canvas 2D；锚点/Sprite 变换常量严格对齐 |
| `Canvas`(paint/keyPressed/repaint) | `Canvas` 抽象基类 | 离屏缓冲 + 整数倍缩放 blit |
| `MIDlet` / `Display` | `MIDlet` / `Display` | 生命周期 + 键盘事件接管 |
| `Thread` + `Thread.sleep` | `Thread` 协作式替身 | `run()` 移植为 async + `await Thread.sleep` |
| `com.nokia.mid.sound.Sound` | `Sound`(WebAudio) | WAV 解码播放；标准 MIDI(`parseSMF`) 与 Nokia OTT 短音(`parseOTT`) 经 `MidiSynth` WebAudio 方波合成播放（见 `j2me-shim/src/Midi.ts`，验证 `test/midi.verify.ts`、`ott.verify.ts`） |
| `Canvas.getGameAction` / keyCode | `getGameAction` / `keys.ts` | 手机数字键布局映射 |

## 3. 一致性的保障点（核心逻辑层位级一致 + 列明必要偏差）

定位为**核心逻辑层位级一致**，并列明必要偏差，而非笼统宣称"逐帧/逐像素 100% 一致"：

1. **Random**：`packages/j2me-shim/test/random.verify.ts` 对 4 个种子断言 nextInt/nextInt(n)/absMod，与 JDK 17 完全一致（位级一致）。
2. **资源**：`resource.verify.ts` 断言 `.bin` 偏移表、条目大小、PNG/MThd/地图头与原字节一致（位级一致）。
3. **绘制/时序**：在浏览器中以原帧率推进，关键帧人工与模拟器截图比对（见 `04-验证方法-位级一致.md`）。**注意**：缺周期精确模拟器，故自动逐像素 diff 未做；MIDI 音色受设备/合成器影响、ASCII 字距等存在必要偏差。
4. **静态闸门的局限**：`tsc`/token 骨架同一性/字面量平价/双射检查全绿**不等于**功能已验证——参见 `复盘-语义化改名静默崩溃.md`：语义化改名曾在静态闸门全绿下静默崩溃，靠人工实测才暴露。故"回归通过即收敛"需以人工实测为准。

## 4. 移植约定（保证"逐行对应"）

- **命名约定**：TS port 的 源文件名 / 类 / 方法 / 字段 均已语义化为友好名（如 `GameScreen.ts` 内 `export class GameScreen`，文件名与类名一致；ts-morph 机械改名，逻辑逐字节不变，见提交 `172e8da`「TS port 语义化」）。**CFR 权威基准（`reverse/gameN/2-decompiled-cfr/`）仍保留混淆名 `a`~`l`** 作为对照权威，故文档引用 `.java` 基准时用混淆名是正确的；混淆名 ↔ 友好名的完整映射见 `tools/rename-map.game1.json` / `tools/rename-map.game2.json`。
- 定点运算保持 `<< 10 / >> 10`，整数除法用 `(x / y) | 0`，移位用 `>>`/`>>>` 严格区分有无符号。
- `int` 溢出语义：必要处用 `| 0` 截断为 32 位。
- 权威反编译源为 **CFR**（`reverse/gameN/2-decompiled-cfr/`）；jadx 产物已删除，历史上仅作参考（弃用对比见 [`reverse/反编译技术选型.md`](../reverse/反编译技术选型.md)）。
