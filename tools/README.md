# tools/ — 解包 / 契约 / 反编译 / 模拟器

本目录分两类：

- **自有脚本与数据**（已纳入版本库）：解包、契约生成、语义化重命名等，是项目产物的一部分。
- **第三方工具二进制**（**不入库**）：反编译器、模拟器。它们只在开发/验证阶段使用，不是交付物；为避免体积膨胀和第三方许可（尤其 GPLv3）传染，已从 Git 跟踪中移除并在 `.gitignore` 忽略。下方记录确切版本与下载地址，保证可复现。

## 自有脚本（入库）

| 文件 | 作用 |
|---|---|
| `extract_bin.py` | 通用 `.bin` 资源解包器 |
| `gen_porting_contract.py` | 方法重载消歧契约生成器 |
| `build_rename_map.cjs` | 构建"混淆名 → 友好名"重命名映射（输出 `rename-map.<game>.json`） |
| `apply_rename.cjs` | 用 ts-morph 把 TS port 机械重命名为友好名（确定性、作用域安全） |
| `rename-map.game1.json` / `rename-map.game2.json` | 上述映射数据 |
| `dev-watchdog.sh` | 开发辅助脚本 |

## 第三方工具（不入库，需自行下载到对应路径）

| 路径 | 工具 / 版本 | 许可 | 下载 |
|---|---|---|---|
| `tools/decompilers/cfr.jar` | **CFR 0.152**（本项目**权威反编译基准**，产物见 `reverse/*/2-decompiled-cfr/`） | MIT | <https://github.com/leibnitz27/cfr/releases/tag/0.152> |
| `tools/decompilers/procyon.jar` | **Procyon**（当时的次选对照，**最终未采用**；本地该文件实为下载失败留下的 404 占位桩，非有效 jar，无需修复） | Apache-2.0 | <https://github.com/mstrobel/procyon/releases> |
| `tools/emulator/` | **FreeJ2ME-Plus v1.52**（J2ME 模拟器，用于加载原 JAR 做对照；自动逐像素 diff 尚未落地，详见 [`../docs/04-验证方法-位级一致.md`](../docs/04-验证方法-位级一致.md)） | **GPLv3** | <https://github.com/TASEmulators/freej2me-plus> |

> CFR 复现：`2-decompiled-cfr/` 为 CFR 0.152 **默认参数直出**、未经人工改动。详见 [`../reverse/反编译技术选型.md`](../reverse/反编译技术选型.md)。

模拟器运行时产物（`*.rms` 存档、`freej2me_system/` 等）也一并忽略——它们是跑起来后自动生成的，不属于源码。
