#!/usr/bin/env bash
# 提交前门禁（行动项 F）—— 一条命令跑完**全部**验证闸门。
#
# 用法：pnpm verify
#
# ## 为什么要有它
# 本项目栽过两次同一个跟头：**拿静态绿灯冒充已验证**
# （docs/复盘-语义化改名静默崩溃.md）、**整棵验证树锚在一个从未被验证的根上**
# （docs/复盘-CFR不是权威.md）。教训是：闸门必须**常跑**，且必须分清它**锚在哪**。
#
# ## 各闸门锚在哪（这决定了它能证明什么）
#   闸门                     拿什么 vs 什么              能证明
#   ─────────────────────────────────────────────────────────────────────────
#   test:shim                shim 原语 vs 硬编码 JDK/规范值   原语没漂移
#   test:behavior            port(新) vs port(旧, golden)     **只能证「没变」，不能证「对」**
#   oracle:diff（★）          port vs **原版 .class 字节码**   **能证「对」——隔 0 跳，唯一的绝对闸门**
#   regress/ 夹具（★）        同上，锚住已修复的真缺陷         防修复被回退
#
# ★ = 锚在真实制品（原版字节码）上。**只有它们能求真**；其余只能证「没弄坏」。
#     判据见 docs/复盘-CFR不是权威.md §2.2：
#     「从这道闸门到真实制品隔了几跳？中间那个东西被验证过吗？」
#
# 注：oracle 首跑会 javac 编译，慢属正常。

set -uo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"

FAILED=()
PASSED=()

run_gate() {
  local name="$1"; shift
  echo ""
  echo "══════════════════════════════════════════════════════════════════"
  echo "▶ $name"
  echo "══════════════════════════════════════════════════════════════════"
  if "$@"; then
    PASSED+=("$name")
  else
    FAILED+=("$name（退出码 $?）")
  fi
}

run_gate "test:shim（shim 原语 vs 硬编码 JDK/规范值）" \
  node --experimental-strip-types packages/j2me-shim/test/run-all.ts

run_gate "test:behavior（port 新 vs port 旧 golden —— 只证没变，不证对）" \
  node --experimental-transform-types packages/behavior-net/run.ts

# ── 绝对闸门：跨引擎差分（锚在原版字节码）────────────────────────────────
for scn in game1-level game2-level; do
  run_gate "oracle:diff $scn ★（port vs 原版字节码）" \
    packages/jvm-oracle/diff.sh "$scn"
done

# ── 绝对闸门：全部回归夹具（锚住已修复的真缺陷，防回退）──────────────────
# 夹具所属游戏从文件名前缀推断（game1-*/game2-*）；新增夹具**自动**纳入门禁，无需改本脚本。
shopt -s nullglob
FIXTURES=(packages/jvm-oracle/regress/*.txt)
if [ ${#FIXTURES[@]} -eq 0 ]; then
  echo ""
  echo "⚠️  regress/ 下没有任何夹具 —— 已修复的真缺陷目前**没有回归防线**"
else
  for fx in "${FIXTURES[@]}"; do
    base="$(basename "$fx" .txt)"
    case "$base" in
      game1-*) g=1 ;;
      game2-*) g=2 ;;
      *) echo "⚠️  跳过 $base：文件名未以 game1-/game2- 开头，无法判定所属游戏"; FAILED+=("夹具 $base（无法判定游戏）"); continue ;;
    esac
    run_gate "regress 夹具 $base ★（game$g）" \
      packages/jvm-oracle/diff.sh --script "$REPO/$fx" "$g"
  done
fi

# ── 汇总 ────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  门禁汇总"
echo "══════════════════════════════════════════════════════════════════"
# 注意：macOS 自带 bash 3.2，`set -u` 下展开**空数组** `"${a[@]}"` 会报 unbound variable
# （门禁全过时 FAILED 恰好为空 → 正好在「一切正常」时崩）。故用 `${a[@]+...}` 形式守卫。
for p in ${PASSED[@]+"${PASSED[@]}"}; do echo "  ✅ $p"; done
for f in ${FAILED[@]+"${FAILED[@]}"}; do echo "  ❌ $f"; done
echo ""
if [ ${#FAILED[@]} -ne 0 ]; then
  echo "⛔ 门禁未通过：${#FAILED[@]} 项失败 / 共 $(( ${#PASSED[@]} + ${#FAILED[@]} )) 项"
  echo "   注：oracle:diff 退出码 4 = op 逐字节一致但**目标路径没被走到**（空洞绿灯），"
  echo "       见 packages/jvm-oracle/coverage/<场景>.cover。"
  exit 1
fi
echo "✅ 全部 ${#PASSED[@]} 项通过"
echo ""
echo "   诚实标注：绿 ≠ 「移植处处正确」，只 ≠ 「**这些被走到的路径**上与原版位级相同」。"
echo "   覆盖之外的路径未被验证；oracle 已知盲区（字体度量／音色／音频触发时序）仍不可判。"
echo "   扩大覆盖用差分模糊测试：node --experimental-transform-types packages/jvm-oracle/fuzz.ts <1|2> [轮数] [种子] [帧数]"
