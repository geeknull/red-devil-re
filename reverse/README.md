# reverse/ — 逆向产物总览

每个游戏一个目录（`game1/` `game2/`，同构）。核心是一条**派生链**：从"机器真值"逐层加工到"人最好读"，目录名用 `0/1/2/3-` 标出顺序。

```
0-jar/              原始 jar 原物（红魔特种兵.jar / 红魔特种兵2-深海战舰.jar，原名保留）  ← 终极真值
      │  unzip 解包
      ▼
1-jar-unpacked/     jar 解包（tjge/*.class 字节码 + res/*.bin 资源）          ← 真值（解包）
      │  CFR 0.152 反编译（只吃 .class，不碰 res/*.bin）
      ▼
2-decompiled-cfr/   CFR 反编译输出（可读 Java，但名字仍是混淆的 a/b/c）     ← 权威基准
      │  套符号词典重命名（逻辑逐字节不变，只换名字）
      ▼
3-readable/         可读层（自包含）                                        ← 阅读用
      ├ tjge/*.java     重命名后的可读 Java（GameScreen / PlayerActor …）
      ├ SYMBOLS.md      单字母→友好名 符号词典（人读）
      ├ glossary.json   同上（机读，是生成 3-readable 的输入）
      └ README.md       本层说明
```

**权威性递减、可读性递增**：`0-jar`（原物）≈ `1-jar-unpacked`（解包）≫ `2-decompiled-cfr`（权威）＞ `3-readable`（派生·非权威）。
四者**逻辑/行为完全等价**，任何不一致**以 `2-decompiled-cfr/` 为准**，再往上以 `0-jar` 字节码为终极真值。

> 游戏 ↔ 原始 jar 名：`game1 = 红魔特种兵.jar`、`game2 = 红魔特种兵2-深海战舰.jar`。
> `0-jar/` 保留**原始分发文件名**作为出处（命令行引用时加引号）；`game1/game2` 文件夹给工程上下文。
> `.bin` 资源不进 2/3（CFR 只反编译 `.class`）。它有两条独立去向：一是**离线解码**进 `assets/`（图集/精灵/地图等，供人阅读）；二是**原始 `.bin` 原样**拷进 `packages/web/public`（`res/`=game1、`res2/`=game2，共 19 个 `.bin`），由 web 端在浏览器内运行时解码（如 game2 actor 换色帧由 `web/main.ts` 预解码）。注意拷到 web 的不是解码后的 `assets/`。

## 与派生链无关的其它产物

下面两项是**每个游戏目录内**的侧支产物（`game{1,2}/` 下，与 `0/1/2/3-` 链并列）：

| 路径 | 用途 |
|---|---|
| `game{1,2}/porting-naming/` | 给 TS 移植命名（侧支，非 0→3 链）：`signatures/`（`javap` 签名表，原料）+ `porting-contract.json`（Java 重载→TS 名 消歧契约，成品，服务 `packages/`，不是给 3-readable 用的，别混淆） |
| `game{1,2}/assets/` | 从 `res/*.bin` 解码出的 图集/精灵/地图/字符串/声音（`images/maps/sprites/strings/sounds/rawdump`） |

下面是 `reverse/` **根下**的跨游戏 / 说明类产物：

| 路径 | 用途 |
|---|---|
| `反编译技术选型.md` | **为何用 CFR、弃用 jadx 的决策记录**（jadx 产物已删，原因在此）★ |
| `freej2me-ref/` | 从 FreeJ2ME（`tools/emulator/freej2me-v1.52/freej2me.jar`，第三方·不入库，见 `tools/README.md`）CFR 0.152 反编译出的**参考片段**（当前仅一个 Nokia OTT 铃声→MIDI 解码器 `javax/microedition/media/decoders/NokiaOTTDecoder.java` + `summary.txt`）；仅作 J2ME 平台音频行为对照，**非整套引擎源、非本仓游戏代码** |
| `命名链路-signatures-contract.html` | 命名链路可视化：`javap` 签名 → `porting-contract.json` 消歧的对照说明（浏览器打开） |
| `逆向移植全链路.html` | 0-jar → 3-readable / TS port 全链路总览（浏览器打开） |

## 两套命名别搞混

同一个混淆方法（如 `a.h(int)`）有两条去向、两套名字：

- **TS 移植**（`packages/`）用 `porting-contract.json` → `h_I`（消歧、可对照 CFR 验证，仍简短）
- **可读副本**（`3-readable/`）用 `glossary.json`/`SYMBOLS.md` → `keyCodeToAction`（友好、给人读）
