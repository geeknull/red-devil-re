#!/usr/bin/env bash
# jvm-oracle —— 在无头 JVM 上直跑「原版 .class 字节码」，逐帧抓 J2ME 语义级 draw-op。
#
# 用法：  ./run.sh <1|2> [frames]      例：./run.sh 1
#         SCREEN_W=240 SCREEN_H=320 ./run.sh 1     （覆盖分辨率，默认对齐 TS port）
#
# 为什么需要那两个 --patch-module/--add-opens：
#   原版用 `String.class.getResourceAsStream("/res/xxx.bin")` 读资源。String 属 java.base
#   *具名模块*，Java 9+ 只在该模块内查找资源 → 恒返回 null（Java 8 才搜 classpath），
#   导致图像全 null、菜单 paint 撞 NPE 被游戏自身 try/catch 静默吞掉、卡死在菜单。
#   这里用 --patch-module 把 res/ 注入 java.base，再 --add-opens 解除 res 包封装，
#   即可在 JDK 17 上恢复 Java 8 的资源语义——**零字节码修改**。
set -euo pipefail

GAME="${1:?用法: ./run.sh <1|2> [frames]}"
cd "$(dirname "$0")"
REPO="$(cd ../.. && pwd)"

# 与 TS port 对齐的分辨率（packages/web/src/main.ts）：game1=176x208, game2=176x204
if [ "$GAME" = "1" ]; then DEF_W=176; DEF_H=208; else DEF_W=176; DEF_H=204; fi
W="${SCREEN_W:-$DEF_W}"
H="${SCREEN_H:-$DEF_H}"

UNPACKED="$REPO/reverse/game${GAME}/1-jar-unpacked"
OUT="$(pwd)/out"
# res 补丁目录：只含 res/（不能把 tjge/ 也塞进 java.base）
RESPATCH="$OUT/.respatch${GAME}"

# --- 构建 ---
mkdir -p "$OUT"
javac -nowarn -d "$OUT" $(find src -name '*.java')

rm -rf "$RESPATCH" && mkdir -p "$RESPATCH"
cp -r "$UNPACKED/res" "$RESPATCH/"

# 时钟虚拟化补丁（见 patch-clock.mjs 抬头 / docs/jvm-oracle-保真审计.md 第四份产出）：
# 原版 paint() 里读墙钟且该值驱动绘制 → 不虚拟化则 oracle 在结算界面说谎（显示 0:00）。
# --verify 用 javap 逐行对拍**机器验证补丁最小性**，非预期差异 exit 1。
PATCHED="$OUT/.patched${GAME}"
rm -rf "$PATCHED"
node "$(pwd)/patch-clock.mjs" "$UNPACKED" "$PATCHED" --verify || exit 3

# --- 运行 ---
# 补丁类必须排在原版**之前**（同名类先到先得）
exec java \
  --patch-module "java.base=$RESPATCH" \
  --add-opens java.base/res=ALL-UNNAMED \
  -Djava.awt.headless=true \
  -Doracle.width="$W" -Doracle.height="$H" \
  -cp "$OUT:$PATCHED:$UNPACKED" \
  harness.OracleRun "$GAME"
