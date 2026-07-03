// configureScreen 会 window.addEventListener 挂键盘监听；headless 提供最小 window 桩。
export function installDomStubs(): void {
  const g = globalThis as unknown as { window?: unknown };
  if (!g.window) {
    g.window = { addEventListener() {}, removeEventListener() {} };
  }
}
