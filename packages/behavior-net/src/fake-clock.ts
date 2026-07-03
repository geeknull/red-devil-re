// 假时钟：monkeypatch 全局 Date.now，让 headless 逐帧驱动完全确定。
// 唯一嵌入游戏逻辑的非确定源就是 Date.now（RNG 播种 + 关卡计时进结算页文本）。
export interface ClockController {
  now(): number;
  advance(ms: number): void;
  uninstall(): void;
}

export function installClock(startMs: number): ClockController {
  const original = Date.now;
  let current = startMs;
  Date.now = () => current;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
    uninstall: () => {
      Date.now = original;
    },
  };
}
