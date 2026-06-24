# 红魔特种兵 1 & 2 — 逆向复刻项目

把两款 2005/2006 年的 J2ME 功能机游戏**以位级/逐帧一致为目标**复刻到现代 Web 技术栈（TypeScript + HTML5 Canvas），并沉淀完整解析文档，为后续二次开发迭代打基础。核心逻辑层（RNG/资源/状态机/数值）已做到位级一致；MIDI 音色（设备相关）、ASCII 字距等为平台必要偏差/待收敛项（见进度区与 `docs/04`）。

> 这是对**自有持有软件**的存档保护与再实现（正当逆向工程）。

## 两款游戏

| | 游戏1 红魔特种兵 | 游戏2 红魔特种兵2-深海战舰 |
|---|---|---|
| 原始包 | `红魔特种兵.jar` | `红魔特种兵2-深海战舰.jar` |
| 发行/开发 | Sina / TGS | Sina |
| 目标机型 | Nokia N-Gage QD | Motorola E398 |
| 引擎 | 自研 `tjge`（13 类，混淆） | 自研 `tjge`（12 类，混淆） |
| 屏幕 / 帧率 | 176×208 / 100ms(10FPS) | 176×204 / 80ms |

## 目录结构

```
red-devil-re/
├── docs/              中文解析文档（沉淀核心）
│   ├── 00-项目总览与设计.md   01-bin资源格式.md   02-资源清单.md
│   ├── 03-tjge引擎与兼容层设计.md   04-验证方法-位级一致.md   05-移植规约.md
│   ├── 06-复盘-语义化改名静默崩溃.md   （静态闸门全绿≠功能验证的教训）
│   ├── game1-红魔特种兵/      （类清单/状态机/主循环/资源映射/玩法数值）
│   └── game2-深海战舰/        （同结构）
├── reverse/           逆向中间产物（详见 reverse/README.md）
│   ├── 反编译技术选型.md           为何用 CFR、弃用 jadx 的决策记录
│   ├── game1/  派生链 0-jar / 1-jar-unpacked / 2-decompiled-cfr(CFR权威源) / 3-readable + porting-naming(signatures+契约) + assets
│   │           （0-jar/ 内含原始包 红魔特种兵.jar，原名保留）
│   └── game2/  同结构（0-jar/ 内含 红魔特种兵2-深海战舰.jar）
├── tools/             解包/契约/重命名脚本（第三方工具二进制不入库，见 tools/README.md）
│   ├── README.md                 第三方工具（CFR/FreeJ2ME）版本+下载地址 & 自有脚本说明
│   ├── extract_bin.py            通用 .bin 解包器
│   ├── gen_porting_contract.py   方法重载消歧契约生成器
│   ├── build_rename_map.cjs / apply_rename.cjs   TS port 语义化重命名链路
│   ├── rename-map.game{1,2}.json  混淆名→友好名映射（权威）
│   ├── decompilers/cfr.jar       CFR 反编译器（不入库第三方二进制，已 .gitignore）
│   └── emulator/                 FreeJ2ME-Plus 参考比对（不入库第三方二进制，已 .gitignore）
└── packages/          实现代码（pnpm workspace）
    ├── j2me-shim/     J2ME 兼容层（Random/Graphics/Image/Resource/Sound/Runtime）
    ├── game1/         游戏1 忠实移植（逐行对应 tjge 反编译源）
    ├── game2/         游戏2 忠实移植
    └── web/           Vite 运行壳
```

## 技术方案：J2ME 兼容层 + 逐行忠实移植

不凭理解重写，而是**逐行翻译** CFR 反编译出的逻辑。底层原语（随机数/绘图/资源/时序）字节一致 ⇒ 上层逻辑天然一致。三层架构与映射详见 `docs/03`。

**位级一致三支点**：
1. `Random` 复刻 `java.util.Random` 48bit LCG —— 已对 JDK 17 参考序列单测通过 ✅
2. `.bin` 归档解析 —— 已对解包器结果验证一致 ✅
3. 绘制/时序 —— 浏览器内逐帧推进，关键帧与模拟器比对（见 `docs/04`）

## 开发

```bash
pnpm install
node --experimental-strip-types packages/j2me-shim/test/random.verify.ts     # RNG 位级验证
node --experimental-strip-types packages/j2me-shim/test/resource.verify.ts    # 资源解析验证
python3 tools/extract_bin.py game1 all                                        # 解包资源
python3 tools/gen_porting_contract.py                                         # 生成移植契约
pnpm --filter @red-devil/web dev                                              # 运行游戏1（浏览器）
```

## 进度

- [x] P0 脚手架 + 反编译归档（CFR；jadx 经评估后弃用，详见 `reverse/反编译技术选型.md`）+ 全资源解码
- [x] 解析文档（总览/格式/清单/引擎/验证/规约 + 两游戏深度解析）
- [x] J2ME 兼容层（Random、Resource 已测位级一致）
- [x] 游戏1 逐行移植（13 类，~7200 行，`tsc` 零错误）
- [x] **游戏1 浏览器跑通**：开机 logo → 主菜单 → 可玩第一关（瓦片地图/玩家/敌人/HUD 渲染正确，移动/相机滚动正常）
- [x] 游戏2 逐行移植（12 类，~6800 行，`tsc` 零错误）
- [x] **游戏2 浏览器跑通**：开机 → 主菜单 → 任务简报剧情过场（对话翻页/头像/string.bin 文本渲染正确）
- [x] **对抗式逐方法校验（第 1-3 层位级一致）已收敛**：4 轮校验（通览→位宽聚焦→大类深读→其余类全覆盖，覆盖**全部 25 类约 311 个方法**），发现并修复 11 处真实偏差（全为 `(byte)/(short)` 取负截断遗漏 + 构造顺序），最终深读轮 0 发现；**第 4 轮全类覆盖已闭合收敛（loop-until-dry）**（详见 `docs/04` 第 57-61 行）。注：静态闸门（`tsc`/token 骨架/字面量平价）全绿**不等于**功能已验证——见 `docs/06`（语义化改名静默崩溃复盘），"端到端通过"以人工实测为准
- [x] 游戏1 音频**全部 6 条**接入并验证：entry3/4/5 是 **IMA ADPCM（WAV fmt=0x11，8kHz/4bit）**，浏览器 `decodeAudioData` 不支持 → 自实现 IMA ADPCM 解码喂 WebAudio（开火 entry4 实测调度 6 源）；entry0/1/2 是 **Nokia OTT 音调序列**（拾取/入场/通关），按 Smart Messaging 规范自实现 `parseOTT` 解析 → 方波合成器（实测 entry0/1/2 各 24/3/20 音符=47 振荡器）。修复了"无缓冲音永占声道屏蔽全部音效"的 bug。
- [x] **J2ME `Font` 实现**：两游戏文字改用规范字体度量（CJK 全宽/ASCII 半宽，SMALL/MEDIUM/LARGE），逐字网格绘制 → 精确换行 + 清晰小号点阵渲染（替换原系统字体近似）
- [x] 第 4 层视觉交叉验证（人工关键帧）：FreeJ2ME-Plus AWT（不入库第三方工具，安装见 `tools/README.md`）跑原版，游戏1 开机/菜单/简报/关卡**关键帧人工比对（参考截图 `docs/screenshots/`）未见差异**；逐像素自动 diff 见下条未做项（与 `docs/04` 第 45/66 行一致）
- [x] 游戏2 MIDI 音频：自带轻量 SMF 解析 + WebAudio 方波合成器（无外部依赖/音色库），sound.bin 的标准 MIDI 可播放（设备相关、最佳努力，非 bit-identical）
- [ ] 第 4 层自动化逐帧像素 diff（FreeJ2ME 非周期精确，仅作参考截图比对）

> 运行：`pnpm install` 后 `pnpm --filter @red-devil/web dev`，浏览器开 http://localhost:2005 。
> `?game=1` 红魔特种兵 · `?game=2` 深海战舰。页面画布右侧有**按键说明**（随游戏切换）。
> 网络不稳定时可用 `bash tools/dev-watchdog.sh` 守护 dev server（掉线自动重启重试）。

### 按键（重要：两游戏键码体系不同，须分游戏配键）

两游戏 `keyPressed` 都直接 `switch` 原始 keyCode（均不调用 `getGameAction`）：
- **游戏1** 方向 = 键码 `1/6/2/5`（`a.h_I`）；**游戏2** 方向(上/下/左/右) = 键码 `50/56/52/54`（`a.d_I`，即数字键 '2/8/4/6'）。
- 故 `packages/web/src/main.ts` 内 `GAME1_KEYMAP` / `GAME2_KEYMAP` 把 PC 键分别映射到各自键码（曾因统一用 50/52/54/56 导致**游戏1 方向键失灵**，已修）。
- 通用操作：**方向键/WASD** 移动·菜单；**空格/回车/J** 开火·确定；**K/L/U/I/O** 动作/武器/手雷；**P** 暂停(游戏1)；**Esc** 退出关卡/跳过过场。

## 许可

- 自有原创部分（`packages/`、`docs/`、`tools/` 自有脚本）以 **MIT** 授权，见 [`LICENSE`](LICENSE)。
- 原版游戏 JAR、反编译产物与游戏资源版权归原始权利人（Sina / TGS）所有，仅作存档 / 研究收录，**不在 MIT 范围内**（详见 `LICENSE` 末尾声明）。
- 第三方工具（CFR / Procyon / FreeJ2ME-Plus）不随仓库分发，许可见 [`tools/README.md`](tools/README.md)。

模拟器（FreeJ2ME）的按键由其 **Settings → Phone Key Layout**（手机键位布局）与 **Manage Inputs**（重映射）决定——若某游戏方向键无反应，多为布局不匹配，换个布局或在 Manage Inputs 里重映射即可（属配置，非 bug）。

文档与实现以 `docs/` 与 `reverse/` 为权威；权威反编译源为 CFR（`reverse/gameN/2-decompiled-cfr/`）。
