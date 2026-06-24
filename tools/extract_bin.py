#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tjge 引擎 .bin 资源归档通用解包器
================================

格式来源：反编译 GameMIDlet.c() / a.f() / a.g() / a.g(int) 后还原。

归档结构（小端序）：
    int32   count                 # 条目数
    int32   offset[count]         # 每个条目相对“偏移表末尾”的起始字节
    blob    <payload>             # entry[i] = blob[offset[i] : offset[i+1]]
                                  #            最后一个条目到 EOF
说明：
  - offset[0] 通常为 0；最后一个 offset 往往等于总载荷长度，充当 EOF 哨兵，
    因此“真实条目数”常为 count-1。
  - 每个 .bin 的载荷语义不同：
      image.bin / *png.bin / logo.bin  -> PNG 图片
      sound.bin                        -> 音频(原始 PCM/厂商格式)
      x.bin / string.bin               -> UTF-16LE 字符串(每条前 2 字节为字数头)
      t.bin / s.bin / f.bin / a.bin..  -> 精灵帧表 / 地图 / 动作数据(需结合各 loader 解析)

用法:
    python3 tools/extract_bin.py <game1|game2> <bin文件名 或 all>
输出:
    reverse/<game>/assets/ 下：images/*.png, strings/*.txt, rawdump/<bin>/entry_NN.dat
"""
import struct, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GAMES = {
    "game1": "reverse/game1/1-jar-unpacked/res",
    "game2": "reverse/game2/1-jar-unpacked/res",
}

PNG_SIG = b"\x89PNG\r\n\x1a\n"


def u32(b, o):
    return struct.unpack_from("<I", b, o)[0]


def parse_archive(data):
    """返回 [(start, end, bytes), ...]，按归档格式切分。"""
    count = u32(data, 0)
    offs = [u32(data, 4 + 4 * i) for i in range(count)]
    base = 4 + 4 * count
    entries = []
    for i in range(count):
        start = base + offs[i]
        end = base + offs[i + 1] if i + 1 < count else len(data)
        entries.append((offs[i], end - base, data[start:end]))
    return count, offs, base, entries


def classify(chunk):
    if chunk[:8] == PNG_SIG:
        return "png"
    if len(chunk) == 0:
        return "empty"
    # 粗略判断 UTF-16LE 文本：前 2 字节像字数，且后续多为可读字符
    return "raw"


def decode_utf16le_strings(chunk):
    """x.bin/string.bin 风格：[u16 字数][char...]（小端）。返回字符串或 None。"""
    if len(chunk) < 2 or len(chunk) % 2 != 0:
        return None
    try:
        n = struct.unpack_from("<H", chunk, 0)[0]
        body = chunk[2:]
        s = body.decode("utf-16-le", errors="strict")
        # 字数头应与实际字符数吻合（允许末尾 1 个差异）
        if abs(len(s) - n) <= 1:
            return s
    except Exception:
        pass
    return None


def extract(game, binname):
    res_dir = os.path.join(ROOT, GAMES[game])
    path = os.path.join(res_dir, binname)
    data = open(path, "rb").read()
    count, offs, base, entries = parse_archive(data)

    assets = os.path.join(ROOT, "reverse", game, "assets")
    img_dir = os.path.join(assets, "images")
    str_dir = os.path.join(assets, "strings")
    raw_dir = os.path.join(assets, "rawdump", binname.replace(".bin", ""))
    for d in (img_dir, str_dir, raw_dir):
        os.makedirs(d, exist_ok=True)

    stem = binname.replace(".bin", "")
    print(f"\n[{game}/{binname}] 总字节={len(data)} count={count} (有效条目≈{count-1})")
    print(f"  偏移表={offs}")
    kinds = {}
    str_lines = []
    for i, (off, size, chunk) in enumerate(entries):
        kind = classify(chunk)
        note = ""
        if kind == "png":
            fn = os.path.join(img_dir, f"{stem}_{i:02d}.png")
            open(fn, "wb").write(chunk)
            note = f"-> images/{stem}_{i:02d}.png"
        elif kind == "raw" and size > 0:
            s = decode_utf16le_strings(chunk)
            if s is not None:
                kind = "str"
                str_lines.append(f"[{i:02d}] {s!r}")
                note = f"str={s!r}"
            else:
                open(os.path.join(raw_dir, f"entry_{i:02d}.dat"), "wb").write(chunk)
                note = f"-> rawdump/{stem}/entry_{i:02d}.dat  head={chunk[:12].hex()}"
        kinds[kind] = kinds.get(kind, 0) + 1
        print(f"   entry[{i:02d}] off={off:6d} size={size:6d} {kind:5s} {note}")
    if str_lines:
        open(os.path.join(str_dir, f"{stem}.txt"), "w", encoding="utf-8").write("\n".join(str_lines))
    print(f"  汇总: {kinds}")
    return count, kinds


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    game, target = sys.argv[1], sys.argv[2]
    res_dir = os.path.join(ROOT, GAMES[game])
    if target == "all":
        bins = sorted(f for f in os.listdir(res_dir) if f.endswith(".bin"))
    else:
        bins = [target]
    for b in bins:
        try:
            extract(game, b)
        except Exception as e:
            print(f"[{game}/{b}] 解析失败: {e}")


if __name__ == "__main__":
    main()
