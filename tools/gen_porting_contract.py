#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
移植契约生成器
==============
解析 `javap -p -s` 的签名文件，为每个混淆方法生成唯一、确定性的 TS 方法名，
解决 Java 方法重载在 TS 中的冲突。

命名规则（确定性、继承重写安全——同 (名,描述符) 全局映射到同一 TS 名）：
  - J2ME 框架/生命周期方法保留原名：paint/keyPressed/keyReleased/showNotify/
    hideNotify/run/startApp/pauseApp/destroyApp。
  - 构造函数 -> TS constructor。
  - 其余方法 -> `原名 + '_' + 参数类型码`：
      I=int J=J(long) Z=bool Y=byte C=char F=float D=double  数组前缀 A
      G=Graphics M=Image S=String  Tx=tjge.x(x为类字母)  其余取末段首字母
    例：a(int,tjge.d)->a_ITd  a(Graphics)->a_G  a()->a_  a(II)->a_II
  - 字段保留原名（字段不重载；TS 中字段与同名方法不冲突，因方法已加后缀）。

输入：reverse/<game>/porting-naming/signatures/  输出：reverse/<game>/porting-naming/porting-contract.json  与可读表打印到 stdout。
"""
import os, re, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMEWORK = {"paint", "keyPressed", "keyReleased", "keyRepeated", "showNotify",
             "hideNotify", "run", "startApp", "pauseApp", "destroyApp",
             "notifyDestroyed", "getWidth", "getHeight", "main"}


# 基本类型码（JVM 'S'=short 映射为 'H'，给 String 让出 'S'）
PRIM = {"I": "I", "J": "J", "Z": "Z", "B": "Y", "C": "C", "F": "F", "D": "D", "S": "H"}
# 已知对象类型码（均≥1字符且不与基本类型撞；不确定的用末段全名）
OBJ = {
    "javax/microedition/lcdui/Graphics": "G",
    "javax/microedition/lcdui/Image": "M",
    "java/lang/String": "S",
    "java/io/InputStream": "In",
    "java/util/Random": "Rnd",
}


def parse_descriptor_params(desc):
    """解析 JVM 方法描述符的参数部分，返回参数类型码列表。"""
    m = re.match(r"\((.*)\)(.*)", desc)
    params = m.group(1)
    codes = []
    i = 0
    while i < len(params):
        ch = params[i]
        arr = ""
        while ch == "[":
            arr += "A"
            i += 1
            ch = params[i]
        if ch == "L":
            j = params.index(";", i)
            cls = params[i + 1 : j]  # e.g. tjge/d, javax/microedition/lcdui/Graphics
            i = j + 1
            if cls in OBJ:
                code = OBJ[cls]
            elif cls.startswith("tjge/"):
                code = "T" + cls.split("/")[-1]
            else:
                code = cls.split("/")[-1]  # 末段全名，避免与基本类型单字母撞
            codes.append(arr + code)
        else:
            codes.append(arr + PRIM.get(ch, ch))
            i += 1
    return codes


def ts_name(method, desc, is_ctor):
    if is_ctor:
        return "constructor"
    if method in FRAMEWORK:
        return method
    codes = parse_descriptor_params(desc)
    return method + "_" + "".join(codes)


def parse_class(path, clsname):
    """返回 {'methods': [(java_decl, ts_name, desc)], 'fields': [decl]}。"""
    lines = open(path, encoding="utf-8", errors="replace").read().splitlines()
    methods, fields = [], []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
        if nxt.startswith("descriptor:"):
            desc = nxt[len("descriptor:"):].strip()
            if "(" in line:  # 方法或构造
                # '(' 前按空白分词取最后一个：构造函数形如 `tjge.a`（含点），
                # 方法形如 `... void a`（末段无点，即方法名）。
                head = line.split("(")[0].strip()
                last = head.split()[-1]
                is_ctor = "." in last  # tjge.<cls> -> 构造
                token = last if is_ctor else last  # 方法名
                method_name = "" if is_ctor else token
                name = ts_name(method_name, desc, is_ctor)
                methods.append({"java": line, "ts": name, "desc": desc, "orig": method_name or "<init>"})
            else:  # 字段
                fields.append({"java": line, "desc": desc})
            i += 2
        else:
            i += 1
    return {"methods": methods, "fields": fields}


def gen(game):
    sig_dir = os.path.join(ROOT, "reverse", game, "porting-naming", "signatures")
    out = {}
    for fn in sorted(os.listdir(sig_dir)):
        if not fn.endswith(".txt"):
            continue
        cls = fn[:-4]
        out[cls] = parse_class(os.path.join(sig_dir, fn), cls)
    dst = os.path.join(ROOT, "reverse", game, "porting-naming", "porting-contract.json")
    json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    # 打印重载消歧概览
    print(f"\n===== {game} 移植契约 (重载方法消歧) =====")
    for cls, data in out.items():
        names = [m["orig"] for m in data["methods"]]
        dup = {n for n in names if names.count(n) > 1}
        if dup:
            print(f"  类 {cls}:")
            for m in data["methods"]:
                if m["orig"] in dup:
                    print(f"    {m['java']:60s} -> {m['ts']}")
    print(f"  -> 写入 {os.path.relpath(dst, ROOT)}")


if __name__ == "__main__":
    for g in (sys.argv[1:] or ["game1", "game2"]):
        gen(g)
