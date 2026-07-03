// 零依赖断言辅助，聚合失败计数（对齐 j2me-shim/test 风格）。
export class Asserter {
  fail = 0;
  eq(label: string, got: unknown, want: unknown): void {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (ok) console.log(`✓ ${label}`);
    else {
      this.fail++;
      console.error(`✗ ${label}\n   got=${JSON.stringify(got)}\n  want=${JSON.stringify(want)}`);
    }
  }
  ok(label: string, cond: boolean): void {
    if (cond) console.log(`✓ ${label}`);
    else {
      this.fail++;
      console.error(`✗ ${label}`);
    }
  }
  done(suite: string): void {
    if (this.fail > 0) {
      console.error(`\n❌ ${suite}: ${this.fail} 项失败`);
      process.exit(1);
    }
    console.log(`\n✅ ${suite} 全部通过`);
  }
}
