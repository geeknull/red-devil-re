# game1（红魔特种兵）— 重命名可读副本

**派生文档，非权威。** 本目录是 `../2-decompiled-cfr/tjge/*.java`（CFR 反编译权威源）的**可读副本**：
逻辑逐字节等同原版，只把混淆后的单字母 类名/方法名/字段名/局部变量 改成了有意义的名字。

- **以谁为准**：任何不一致**以 `../2-decompiled-cfr/tjge/` 为准**。本目录仅供阅读理解，不参与移植验证基准。
- **符号对照**：完整的 单字母→友好名 词典见 [`SYMBOLS.md`](SYMBOLS.md)，机读版 `glossary.json`。
- **生成与验证**：由符号词典套用生成，每个文件经对抗验证确认与 CFR 原版**逻辑逐字节一致**（仅标识符/注释不同）。

## 类名映射

| 原 | 友好名 | 职责 |
|---|---|---|
| `GameMIDlet` | `GameMIDlet` | MIDlet 入口 / 资源流 / 小端读取 / 随机数 / 4 字节共享缓冲 / 文案 |
| `a` | `GameScreen` | 主 Canvas + 主循环 + 状态机核心 + 3 字节存档（RecordStore `TGS_CT`） |
| `b` | `TileMap` | 瓦片地图（解析 f.bin，离屏增量滚动） |
| `c` | `BossActor` | Boss（继承 ActorBase） |
| `d` | `SpriteDef` | 精灵帧定义（解析 a.bin） |
| `e` | `EffectActor` | 特效/交互演员（继承 ActorBase） |
| `f` | `PlayerActor` | 玩家（继承 ActorBase） |
| `g` | `ActorBase` | 演员基类 |
| `h` | `EnemyActor` | 敌人 AI（继承 ActorBase） |
| `i` | `SpriteAtlas` | 精灵图集（解析 t.bin，RGB4444 调色板） |
| `j` | `LevelLoader` | 关卡/屏块流式加载（解析 s.bin） |
| `k` | `PickupActor` | 道具/拾取物（继承 ActorBase） |
| `l` | `ProjectileActor` | 子弹/抛射物（继承 ActorBase） |
