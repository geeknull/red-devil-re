/**
 * java.util.Random 的精确复刻（位级一致）。
 *
 * 算法依据 JDK 规范（48 位线性同余）：
 *   seed = (seed ^ 0x5DEECE66D) & ((1<<48)-1)        // setSeed
 *   seed = (seed * 0x5DEECE66D + 0xB) & ((1<<48)-1)   // 每次 next 推进
 *   next(bits) = (int)(seed >>> (48 - bits))          // 取高位
 *
 * 已用本机 JDK 17 生成参考序列断言（见 test/random.verify.ts）。
 * 原版游戏用法：GameMIDlet 构造时 setSeed(currentTimeMillis())；
 * 取随机数走 GameMIDlet.a(n) = abs(nextInt()) % n（见本类 absMod）。
 *
 * 48 位运算超出 Number 安全整数范围，故 seed 用 BigInt 维护。
 */
const MULTIPLIER = 0x5deece66dn;
const ADDEND = 0xbn;
const MASK = (1n << 48n) - 1n;

export class Random {
  private seed: bigint;

  constructor(seed?: number | bigint) {
    // 未给种子时，Java 用与时间/计数相关的值；这里默认用当前毫秒，
    // 但游戏总是显式 setSeed，故默认值不影响位级一致。
    this.seed = 0n;
    this.setSeed(seed ?? BigInt(Date.now()));
  }

  /** 对应 Java Random.setSeed(long)。 */
  setSeed(seed: number | bigint): void {
    const s = BigInt.asUintN(64, typeof seed === "bigint" ? seed : BigInt(Math.trunc(seed)));
    this.seed = (s ^ MULTIPLIER) & MASK;
  }

  /** 对应 Java Random.next(int bits)，返回有符号 32 位整数语义。 */
  protected next(bits: number): number {
    this.seed = (this.seed * MULTIPLIER + ADDEND) & MASK;
    // 取高 bits 位；asIntN(32,...) 还原成有符号 32 位
    return Number(BigInt.asIntN(32, this.seed >> BigInt(48 - bits)));
  }

  /** 对应 Java Random.nextInt()，返回 [-2^31, 2^31) 的有符号整数。 */
  nextInt(): number;
  /** 对应 Java Random.nextInt(int bound)，返回 [0, bound)。 */
  nextInt(bound: number): number;
  nextInt(bound?: number): number {
    if (bound === undefined) return this.next(32);
    if (bound <= 0) throw new Error("bound must be positive");

    // bound 为 2 的幂的快速路径（与 JDK 一致）
    if ((bound & -bound) === bound) {
      return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    }
    let bits: number;
    let val: number;
    do {
      bits = this.next(31);
      val = bits % bound;
    } while (bits - val + (bound - 1) < 0); // 拒绝采样，避免取模偏置（JDK 同款）
    return val;
  }

  /** 对应 Java Random.nextBoolean()。 */
  nextBoolean(): boolean {
    return this.next(1) !== 0;
  }

  /**
   * 复刻 GameMIDlet.a(int)：取 nextInt() 绝对值再对 n 取模。
   * 原版静态方法的等价实现，移植代码可直接调用。
   */
  absMod(n: number): number {
    let v = this.next(32);
    if (v < 0) v = -v;
    return v % n;
  }
}
