# game2（红魔特种兵2-深海战舰）— 重命名可读副本

**派生文档，非权威。** 本目录是 `../2-decompiled-cfr/tjge/*.java`（CFR 反编译权威源）的**可读副本**：
逻辑逐字节等同原版，只把混淆后的单字母 类名/方法名/字段名/局部变量 改成了有意义的名字。

- **以谁为准**：任何不一致**以 `../2-decompiled-cfr/tjge/` 为准**。本目录仅供阅读理解，不参与移植验证基准。
- **符号对照**：完整的 单字母→友好名 词典见 [`SYMBOLS.md`](SYMBOLS.md)，机读版 `glossary.json`。
- **生成与验证**：由符号词典套用生成，每个文件经对抗验证确认与 CFR 原版**逻辑逐字节一致**（仅标识符/注释不同）。其中 `TileMap`/`ActorBase`/`EnemyActor`/`PlayerActor` 各有 1～3 处字段写反，已对照 CFR 人工修正。

## 类名映射

| 原 | 友好名 | 职责 |
|---|---|---|
| `GameMIDlet` | `GameMIDlet` | MIDlet 入口 / MIDI 音频 / RMS "REDDEVIL2" 5 字节存档 / 文案 |
| `a` | `GameCanvas` | 主画布 + 主循环（176×204，80ms 帧） |
| `b` | `TileMap` | 瓦片地图层（m/p/b.bin） |
| `c` | `BossActor` | Boss/机关/触发器（继承 ActorBase） |
| `d` | `SpriteDef` | 动作/动画定义（含镜像） |
| `e` | `ItemActor` | 道具/特殊单位（继承 ActorBase） |
| `f` | `EnemyActor` | 普通敌人/步兵 AI（继承 ActorBase） |
| `g` | `PlayerActor` | 玩家（最大 Actor，继承 ActorBase） |
| `h` | `ActorBase` | Actor 基类 |
| `i` | `TileSheet` | 图块切片表/PNG 贴图（含换色帧） |
| `j` | `LevelScene` | 场景/关卡运行时（最大类，解析 s.bin） |
| `k` | `ProjectileActor` | 子弹/投射物/手雷（继承 ActorBase） |
