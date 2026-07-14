#!/usr/bin/env bash
# oracle:diff —— 把「TS 移植」与「原版字节码」在同一输入脚本下的 J2ME 语义级绘制调用
# 逐帧逐 op 对拍。绿 = 移植忠实于原版；红 = 打印首个失配 op 及其帧号。
#
# 用法：./diff.sh game1-level | ./diff.sh game2-level
#
# 两侧同源保证：输入脚本、种子、帧数、分辨率全部取自 behavior-net 的 scenarios.ts；
# oracle 侧 harness/OracleRun.java 原样搬运同一份脚本（见其 IN_G1/IN_G2）。
set -uo pipefail

SCN="${1:?用法: ./diff.sh <game1-level|game2-level>}"
cd "$(dirname "$0")"
REPO="$(cd ../.. && pwd)"

case "$SCN" in
  game1-level) GAME=1; W=176; H=208 ;;
  game2-level) GAME=2; W=176; H=204 ;;
  *) echo "未知场景：$SCN（目前支持 game1-level / game2-level）"; exit 2 ;;
esac

OUT="$(pwd)/out"
mkdir -p "$OUT"
javac -nowarn -d "$OUT" $(find src -name '*.java') || exit 1
RESPATCH="$OUT/.respatch${GAME}"
rm -rf "$RESPATCH" && mkdir -p "$RESPATCH"
cp -r "$REPO/reverse/game${GAME}/1-jar-unpacked/res" "$RESPATCH/"

O="$OUT/$SCN.oracle.ops"
P="$OUT/$SCN.port.ops"

echo "[1/3] 跑 oracle（无头 JVM 直跑原版 .class 字节码）…"
java --patch-module "java.base=$RESPATCH" --add-opens java.base/res=ALL-UNNAMED \
  -Djava.awt.headless=true -Doracle.dumpOps=true \
  -Doracle.width="$W" -Doracle.height="$H" \
  -cp "$OUT:$REPO/reverse/game${GAME}/1-jar-unpacked" \
  harness.OracleRun "$GAME" 2>/dev/null | grep -v '^\[' > "$O"

echo "[2/3] 跑 port（TS 移植，复用 behavior-net 驱动）…"
(cd "$REPO" && node --experimental-transform-types packages/behavior-net/dump-ops.ts "$SCN" 2>/dev/null) > "$P"

echo "[3/3] 逐 op 对拍…"
echo "      oracle=$(wc -l < "$O") op   port=$(wc -l < "$P") op"

if diff -q "$O" "$P" > /dev/null; then
  echo ""
  echo "✅ 绿：$SCN 全部 $(wc -l < "$O" | tr -d ' ') 条绘制调用跨引擎逐字节一致"
  echo "   → 该路径上，TS 移植的绘制行为与原版**位级相同**（机器判定，无需人看画面）"
  exit 0
fi

echo ""
echo "❌ 红：存在失配"
echo "   差异行数：$(diff "$O" "$P" | grep -c '^[<>]')"
echo ""
echo "--- 首个失配（< = oracle 原版 ／ > = port 移植）---"
diff "$O" "$P" | head -12
echo ""
echo "--- op 种类分布对比（定位是结构性差异还是数值差异）---"
paste <(awk -F'\t' '{split($2,a," "); print a[1]}' "$O" | sort | uniq -c | sort -rn) \
      <(awk -F'\t' '{split($2,a," "); print a[1]}' "$P" | sort | uniq -c | sort -rn) \
  | awk '{printf "  oracle %-8s %-14s | port %-8s %s\n", $1, $2, $3, $4}'
echo ""
echo "已知的结构性差异（非回归，见 docs/jvm-oracle-保真审计.md）："
echo "  · game1 精灵：原版 DirectGraphics.drawPixels(short[],4444) ⟷ 移植 createRGBImage+drawRegion"
echo "    （浏览器无 Nokia DirectGraphics，属已文档化的必要平台偏差；需规范化映射后才可对拍）"
exit 1
