#!/usr/bin/env bash
# oracle:diff —— 把「TS 移植」与「原版字节码」在同一输入脚本下的 J2ME 语义级绘制调用
# 逐帧逐 op 对拍。绿 = 移植忠实于原版；红 = 打印首个失配 op 及其帧号。
#
# 用法：./diff.sh game1-level | ./diff.sh game2-level
#
# 两侧同源保证：输入脚本、种子、帧数、分辨率全部取自 behavior-net 的 scenarios.ts；
# oracle 侧 harness/OracleRun.java 原样搬运同一份脚本（见其 IN_G1/IN_G2）。
set -uo pipefail

cd "$(dirname "$0")"
REPO="$(cd ../.. && pwd)"

# 用法：./diff.sh <game1-level|game2-level>
#       ./diff.sh --script <脚本文件> <1|2>     —— 跑固化的回归夹具（regress/*.txt）
SCRIPT_ARG=""
if [ "${1:-}" = "--script" ]; then
  SCRIPT_ARG="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
  GAME="${3:?用法: ./diff.sh --script <file> <1|2>}"
  SCN="$(basename "$2" .txt)"
  if [ "$GAME" = "1" ]; then W=176; H=208; else W=176; H=204; fi
else
  SCN="${1:?用法: ./diff.sh <game1-level|game2-level> 或 --script <file> <1|2>}"
  case "$SCN" in
    game1-level) GAME=1; W=176; H=208 ;;
    game2-level) GAME=2; W=176; H=204 ;;
    *) echo "未知场景：$SCN（内置 game1-level / game2-level；夹具用 --script）"; exit 2 ;;
  esac
fi

# ── 覆盖断言 ────────────────────────────────────────────────────────────────
# 「绿」只在真的走到目标路径时才有信息量：绿而没走到 = 没意义（见 docs/复盘-CFR不是权威.md）。
# coverage/<场景>.cover 把「本 scenario 覆盖了哪些路径」从**偶然**变成**机器断言的不变量**——
# 将来若有人改动输入脚本致目标路径不再被走到，这里红，而不是悄悄退化成一个空洞的绿灯。
#
# 断言取 **oracle 侧**（信任根＝原版字节码）：断言的是「原版在这条输入下确实走了该路径」。
# port 侧无需单独断言——op 已逐字节相同，原版画了 port 必然也画了。
assert_coverage() {
  local cov="$(pwd)/coverage/$SCN.cover"
  [ -f "$cov" ] || { echo ""; echo "ℹ️  无 coverage/$SCN.cover → 未声明必达路径（该绿灯不含覆盖信息）"; return 0; }
  local states states_list failed=0
  states="$(grep -oE 'statesSeen=\[[^]]*\]' "$OUT/$SCN.oracle.raw" | head -1)"
  # 归一为空格分隔的词表，用精确整词比对（别用正则：`[,\]]` 这类括号表达式里 `]` 不转义会静默匹配错）
  states_list=" $(echo "$states" | sed 's/statesSeen=\[//; s/\]//; s/,/ /g' | tr -s ' ') "
  echo ""
  echo "[5/5] 断言必达路径（覆盖）…"
  while IFS= read -r line; do
    case "$line" in ''|'#'*) continue ;; esac
    local kind rest desc
    kind="${line%% *}"; rest="${line#* }"
    desc="${rest#*|}"; rest="${rest%%|*}"
    rest="${rest%"${rest##*[![:space:]]}"}"   # 去尾部空白
    if [ "$kind" = "op" ]; then
      # min = 第一个词；sub = 其余全部（**允许含空格**，如 `blitSprite 25x9 t=0 d=74,83`）
      local min="${rest%% *}" sub="${rest#* }" cnt
      cnt=$(grep -cF -- "$sub" "$O" || true)
      if [ "$cnt" -lt "$min" ]; then
        echo "   ❌ op『$sub』出现 $cnt 次 < 要求 $min 次 —— $desc"; failed=1
      else
        echo "   ✅ op『$sub』×$cnt —— $desc"
      fi
    elif [ "$kind" = "state" ]; then
      local st="${rest%% *}"
      case "$states_list" in
        *" $st "*) echo "   ✅ state $st —— $desc" ;;
        *)         echo "   ❌ state $st 未达到 —— $desc"; failed=1 ;;
      esac
    fi
  done < "$cov"
  echo "      oracle $states"
  if [ "$failed" -ne 0 ]; then
    echo ""
    echo "⛔ 覆盖断言失败：op 逐字节一致，但**目标路径没被走到** → 这个「绿」没有信息量。"
    echo "   要么修复 scenario 让它重新走到该路径，要么在 coverage/$SCN.cover 里显式删掉该条"
    echo "   （删 = 公开承认放弃这块覆盖，必须写清理由；豁免只能收紧不能放宽）。"
    return 1
  fi
  echo "   → 上述路径均**确实被走到**，故本绿灯含覆盖信息（非空洞绿灯）"
  return 0
}

OUT="$(pwd)/out"
mkdir -p "$OUT"
javac -nowarn -d "$OUT" $(find src -name '*.java') || exit 1
RESPATCH="$OUT/.respatch${GAME}"
rm -rf "$RESPATCH" && mkdir -p "$RESPATCH"
cp -r "$REPO/reverse/game${GAME}/1-jar-unpacked/res" "$RESPATCH/"

# 时钟虚拟化补丁（修 oracle 自己的洞：两侧不共享时钟，见 docs/jvm-oracle-保真审计.md 第四份产出）。
# 只改常量池、不动任何一条字节码指令；--verify 会用 javap 逐行对拍**机器验证补丁是最小的**，
# 非预期差异一律 exit 1（本补丁自己也是个「中间物」，必须被验证，不能只靠「我写得很小心」）。
PATCHED="$OUT/.patched${GAME}"
rm -rf "$PATCHED"
node "$(pwd)/patch-clock.mjs" "$REPO/reverse/game${GAME}/1-jar-unpacked" "$PATCHED" --verify > "$OUT/patch-clock.${GAME}.log" 2>&1 || {
  echo "⛔ 时钟补丁失败（差分结论不可信，先修补丁）："; cat "$OUT/patch-clock.${GAME}.log"; exit 3;
}
# 补丁类必须排在原版**之前**才能生效（同名类先到先得）
ORACLE_CP="$OUT:$PATCHED:$REPO/reverse/game${GAME}/1-jar-unpacked"

O="$OUT/$SCN.oracle.ops"
P="$OUT/$SCN.port.ops"

echo "[1/4] 跑 oracle（无头 JVM 直跑原版 .class 字节码）…"
java --patch-module "java.base=$RESPATCH" --add-opens java.base/res=ALL-UNNAMED \
  -Djava.awt.headless=true -Doracle.dumpOps=true \
  -Doracle.width="$W" -Doracle.height="$H" \
  ${SCRIPT_ARG:+-Doracle.scriptFile=$SCRIPT_ARG} \
  -cp "$ORACLE_CP" \
  harness.OracleRun "$GAME" > "$OUT/$SCN.oracle.raw" 2>/dev/null
grep -v '^\[' "$OUT/$SCN.oracle.raw" > "$O"

echo "[2/4] 跑 port（TS 移植，复用 behavior-net 驱动）…"
if [ -n "$SCRIPT_ARG" ]; then
  (cd "$REPO" && node --experimental-transform-types packages/behavior-net/dump-ops.ts --script "$SCRIPT_ARG" "$GAME" 2>"$OUT/$SCN.port.err") > "$P"
else
  (cd "$REPO" && node --experimental-transform-types packages/behavior-net/dump-ops.ts "$SCN" 2>"$OUT/$SCN.port.err") > "$P"
fi

# 前置条件断言：RMS 存档会驱动绘制（game1 Q[2]→a.java:322、game2 k[2]→a.java:218）。
# 两侧存档不一致时，差分红了也分不清是回归还是前置条件不符 → 必须先卡住，不能假设。
echo "[3/4] 断言前置条件（两侧 RMS 存档字节一致）…"
SAVE_O=$(grep -oE 'SAVE=\[[^]]*\]' "$OUT/$SCN.oracle.raw" | head -1)
SAVE_P=$(grep -oE 'SAVE=\[[^]]*\]' "$OUT/$SCN.port.err" | head -1)
echo "      oracle $SAVE_O ／ port $SAVE_P"
if [ -z "$SAVE_O" ] || [ -z "$SAVE_P" ]; then
  echo "⛔ 前置条件无法核验：存档字节未 dump 出来（差分结论不可信，先修 harness）"; exit 3
fi
if [ "$SAVE_O" != "$SAVE_P" ]; then
  echo "⛔ 前置条件不符：两侧 RMS 存档不同 → 差分结论不可信（存档驱动绘制，见 docs/jvm-oracle-保真审计.md 四类）"
  exit 3
fi

echo "[4/5] 逐 op 对拍…"
echo "      oracle=$(wc -l < "$O") op   port=$(wc -l < "$P") op"

if diff -q "$O" "$P" > /dev/null; then
  echo ""
  echo "✅ 绿：$SCN 全部 $(wc -l < "$O" | tr -d ' ') 条绘制调用跨引擎逐字节一致"
  echo "   → 该路径上，TS 移植的绘制行为与原版**位级相同**（机器判定，无需人看画面）"
  assert_coverage || exit 4
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
