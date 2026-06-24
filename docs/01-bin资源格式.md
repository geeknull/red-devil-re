# tjge 引擎 `.bin` 资源归档格式

> 来源：反编译还原。**归档容器结构（count + 偏移表 + payload）两款游戏一致**，但**字节读取器与加载入口的方法名/语义两款游戏不同**，下文除特别注明外均以 **game1** 的 `GameMIDlet.c(InputStream)` / `GameMIDlet.a(String,int)` / `a.f(int)` / `a.g()` / `a.g(int)` 为准还原。
>
> game2 的同名方法语义已偏移，关键差异：① 字节读取器 `a`/`b` 互换（game2 `a(InputStream)` 读 1 字节、`b(InputStream)` 读小端 short）；② game2 **无** `c(InputStream)` 这个 int32 读取器，4 字节整数改用静态辅助 `a(byte[],off,4)`；③ 随机定位是 `GameMIDlet.b(String,int)`（game1 是 `a(String,int)`）；④ PNG/字符串不走 `a.f`/`a.g`。逐条对照见下文各表注释。
>
> 命名约定：`.java` 基准（`reverse/game{1,2}/2-decompiled-cfr/tjge/*.java`）仍为 CFR 混淆名 `a/b/c`，本文引用的即为混淆名；行号锚定该归档。

## 1. 字节读取原语（`GameMIDlet`）

所有多字节数值均为**小端序（little-endian）**。**两款游戏的方法名互不相同**，分列如下。

**game1**（`reverse/game1/2-decompiled-cfr/tjge/GameMIDlet.java`）：

| 方法 | 含义 | 还原逻辑 |
|---|---|---|
| `a(InputStream)` → short（:58） | 读小端 16 位**无符号** | `lo + hi*256`，`lo` 为负时 +256 |
| `b(InputStream)` → byte（:69） | 读 1 字节 | 读 1 字节原样返回（有符号 byte） |
| `c(InputStream)` → int（:75） | 读小端 32 位 | `for i in 3..0: v=(v<<8)+d[i]`，各字节为负时 +256 |

**game2**（`reverse/game2/2-decompiled-cfr/tjge/GameMIDlet.java`，注意 `a`/`b` 与 game1 互换，且无 `c(InputStream)`）：

| 方法 | 含义 | 还原逻辑 |
|---|---|---|
| `a(InputStream)` → byte（:88） | 读 1 字节 | `read(d)` 后返回 `d[0]`（有符号 byte） |
| `b(InputStream)` → short（:93） | 读小端 16 位 | `(e[1]<<8) | (e[0]&0xFF)` |
| `a(byte[],off,4)`（:100） | 由字节数组读小端 32 位 | 顶字节带符号、低 3 字节 `&0xFF`，逐字节左移拼装（替代 game1 的 `c(InputStream)`） |

> 佐证：game2 loader `b.java:290-294` 即用 `GameMIDlet.a(inputStream)` 读字节、`GameMIDlet.b(inputStream)` 读 short。
>
> TS 兼容层须严格按"无符号小端"复刻这些读取器；移植时按各自游戏选用正确的方法名/语义。

## 2. 归档容器结构

```
偏移   类型      含义
0      int32     count            条目数（含 1 个 EOF 哨兵）
4      int32[]   offset[count]    每个条目相对“偏移表末尾”的起始字节
4+4n   blob      payload          实际数据
```

- 第 i 个条目数据 = `payload[ offset[i] : offset[i+1] ]`；最后一个条目取到 EOF。
- `offset[0]` 恒为 0；最后一个 `offset` 通常等于 payload 总长，**充当 EOF 哨兵**，故"真实条目数 = count − 1"。
- 取条目大小：`size = offset[i+1] − offset[i]`（见 game1 `a.f`：`nArray[n+1] - nArray[n]`，`a.java:2103`）。

### 两种访问方式（原版都用过）

1. **随机定位**：读 count → 遍历偏移表只取第 index 项的偏移 → `skip(offset)` 定位到该条目起始，返回流。game1 为 `GameMIDlet.a(path, index)`（`GameMIDlet.java:90`），game2 为 `GameMIDlet.b(path, index)`（`GameMIDlet.java:224`）。
2. **全表读取**：读 count → 读入整张偏移表 → 按需 `skip(offset[i])` 再 `read(size)`。game1 见 `a.f`（图片，`a.java:2091`）/ `a.g`（音频，`a.java:2123`）；game2 改由 `GameMIDlet.c(path, index)`（`GameMIDlet.java:246`）一次性取出第 index 项的字节数组（`n3 = offset[i+1] - offset[i]`）。

## 3. 各 `.bin` 的载荷语义

容器格式统一，但**载荷内部结构因文件而异**：

| 文件 | 载荷类型 | 加载者 / 说明 |
|---|---|---|
| `image.bin`（游戏1） | **PNG** 图片 | game1 `a.f(i)` → `Image.createImage(bytes)`（`a.java:2091`，`image.bin` 仅 game1 有） |
| `actorPng.bin` `bpng.bin` `fpng.bin` `logo.bin`（游戏2） | **PNG** 图片 | 不走 `a.f`（game2 的类 `a` 是 GameCanvas，无图片加载方法）。`actorPng` 经 `GameMIDlet.c("/res/actorPng.bin", n)` 取字节再 `Image.createImage`（`i.java:109-119`）；其余经 `GameMIDlet.a(String,int)` → `Image.createImage`（`GameMIDlet.java:217-222`，调用见 `b.java:336`） |
| `sound.bin`（游戏1） | WAV(RIFF) + 自定义音 | `a.g()` → `Sound(bytes, gain)`，`gain = size<256 ? 1 : 5`（`a.java:2123-2142`） |
| `sound.bin`（游戏2） | **标准 MIDI**（`MThd`，hexdump 已确认） | `GameMIDlet.b(path, n)` → `Manager.createPlayer(stream, "audio/midi")`（`GameMIDlet.java:122-123`，**无** game1 的 `size<256?1:5` gain 逻辑） |
| `x.bin`（游戏1） | UTF-16LE 字符串（前 2 字节 BOM `FF FE`） | `a.g(int)`（`a.java:2174`）：`skip(offset+2)`，按 `char`(小端 16 位) 读 `size/2 − 1` 个 |
| `string.bin`（游戏2） | UTF-16 中文字符串 | 经 `GameMIDlet.c(path, n)` 取字节，按 `a(byte[],n*2,2)` 逐 `char` 解码（`GameMIDlet.java:199-215`）；另见游戏2 `资源映射.md` |
| `a.bin` `f.bin` `s.bin` `t.bin`（游戏1）<br>`a.bin` `b.bin` `m.bin` `p.bin` `s.bin` `t.bin`（游戏2） | 自定义二进制：精灵帧表 / 瓦片地图 / 动作脚本 | 由各模块 loader 解析，字段含义见各游戏 `资源映射.md` |

### 字符串读取要点（`x.bin`，游戏1）

```
a.g(int i):
  size = (offset[i+1] - offset[i]) / 2     # 字符数（含头）
  skip(offset[i] + 2)                       # 跳过 2 字节 BOM/头
  读 (size - 1) 个 char（每个 = 小端 u16）  # 得到字符串
```

## 4. 解包工具

`tools/extract_bin.py`：
```bash
python3 tools/extract_bin.py game1 all          # 解包游戏1全部 .bin
python3 tools/extract_bin.py game2 actorPng.bin # 注意 game2 无 image.bin，PNG 容器是 actorPng/bpng/fpng/logo.bin
```
- 输入：脚本从 `reverse/<game>/1-jar-unpacked/res/` 读取 `.bin`（即 jar 解包后的资源目录）。
- 输出到 `reverse/<game>/assets/`：PNG → `images/`，可识别字符串 → `strings/`，其余 → `rawdump/<bin>/entry_NN.dat`（供逐字段分析）。
