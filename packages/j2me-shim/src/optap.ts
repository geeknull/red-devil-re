/**
 * 语义层 op tap —— 把「游戏逻辑决定画什么」录成与 jvm-oracle 同 schema 的 op 流。
 *
 * 用途：与 `packages/jvm-oracle`（无头 JVM 直跑原版字节码）逐帧对拍绘制调用，
 * 机器判定「移植是否忠实于原版」。见 `docs/jvm-oracle-保真审计.md`。
 *
 * 为什么录在 J2ME `Graphics` 公有方法边界、而非 canvas-2d 层：
 *   本项目 TS port **有意**与原版像素不同（字体点阵 vs sans-serif、MIDI 方波 vs GM 音色、
 *   alpha 分级、rot270）。若录在 lowered 后的 canvas-2d 层，`drawString` 已被降解成逐字
 *   `fillText`、其 x 坐标取自**故意偏差**的字体度量 → 对忠实 port 也会刷出假阳性。
 *   录在 J2ME 调用层则字形/度量/合成全部落在该层**之下**，天然绕开。
 *
 * 零行为影响：默认关闭（`ops === null`），`recordOp` 退化为一次 null 判断；
 * 只有 harness 显式 `beginOpCapture()` 后才收集。生产与 behavior-net 路径不受影响。
 */

let ops: string[] | null = null;

/** 开始收集（幂等；会清空上一批）。 */
export function beginOpCapture(): void {
  ops = [];
}

/** 停止收集并丢弃。 */
export function endOpCapture(): void {
  ops = null;
}

/** 取走当前帧已收集的 op 并清空，便于逐帧切分。 */
export function takeOps(): string[] {
  if (ops === null) return [];
  const out = ops;
  ops = [];
  return out;
}

/** 记录一条 op（未开启收集时为 no-op）。 */
export function recordOp(op: string): void {
  if (ops !== null) ops.push(op);
}
