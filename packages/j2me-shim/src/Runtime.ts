/**
 * J2ME 运行时桥接：Canvas / Display / MIDlet / Thread 的最小复刻，
 * 把 MIDP 的"自管线程 + repaint"模型映射到浏览器单线程协作式循环。
 *
 * 关键取舍（不破坏逻辑一致性）：
 *  - Java 的 `while(true){...; Thread.sleep(100);}` → 移植为 async run() + `await Thread.sleep(100)`。
 *    仅增加 async/await 语法，控制流与时序逐帧一致。
 *  - repaint() 同步把游戏画面绘到离屏缓冲，再整数倍缩放 blit 到可见画布（等价于平台双缓冲）。
 */
import { Graphics } from "./Graphics.ts";
import { DEFAULT_KEYMAP } from "./keys.ts";

/** 协作式 Thread 替身：start() 驱动 runnable.run()（可为 async）。 */
export class Thread {
  private runnable: { run: () => void | Promise<void> };
  constructor(runnable: { run: () => void | Promise<void> }) {
    this.runnable = runnable;
  }
  start(): void {
    // 异步启动，模拟独立线程
    queueMicrotask(() => void this.runnable.run());
  }
  /** 对应 Thread.sleep(ms)。 */
  static sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

/** 模块级屏幕状态：在任何 Canvas 构造之前由 configureScreen() 设定，
 *  使 Canvas 构造函数里调用 getWidth()/getHeight() 即可拿到真实分辨率（与真机 MIDP 一致）。 */
let SCREEN: { width: number; height: number; scale: number; screen: HTMLCanvasElement } | null = null;
let CURRENT: Canvas | null = null;

/** 运行壳在创建 MIDlet 之前调用：设定屏幕分辨率/缩放，并接管键盘事件。 */
export function configureScreen(cfg: ScreenConfig): void {
  SCREEN = { width: cfg.width, height: cfg.height, scale: cfg.scale, screen: cfg.screen };
  cfg.screen.width = cfg.width * cfg.scale;
  cfg.screen.height = cfg.height * cfg.scale;
  const keymap = cfg.keymap ?? DEFAULT_KEYMAP;
  const down = new Set<number>();
  window.addEventListener("keydown", (e) => {
    const code = keymap[e.code];
    if (code === undefined || !CURRENT) return;
    e.preventDefault();
    if (down.has(code)) CURRENT.keyRepeated(code);
    else {
      down.add(code);
      CURRENT.keyPressed(code);
    }
  });
  window.addEventListener("keyup", (e) => {
    const code = keymap[e.code];
    if (code === undefined || !CURRENT) return;
    e.preventDefault();
    down.delete(code);
    CURRENT.keyReleased(code);
  });
}

/** MIDP Canvas 抽象基类，游戏主类继承它。 */
export abstract class Canvas {
  private screenCtx: CanvasRenderingContext2D | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private buffer: any = null;
  private scale: number;
  private _width: number;
  private _height: number;

  constructor() {
    // 分辨率在构造时即从全局屏幕配置读取（configureScreen 须先于 MIDlet 创建调用）
    this._width = SCREEN ? SCREEN.width : 0;
    this._height = SCREEN ? SCREEN.height : 0;
    this.scale = SCREEN ? SCREEN.scale : 1;
  }

  /** 由 Display.setCurrent 绑定离屏缓冲与可见画布上下文。 */
  bindScreen(screenCtx: CanvasRenderingContext2D, bufferCtx: CanvasRenderingContext2D, buffer: any): void {
    this.screenCtx = screenCtx;
    this.bufferCtx = bufferCtx;
    this.buffer = buffer;
  }

  getWidth(): number {
    return this._width;
  }
  getHeight(): number {
    return this._height;
  }
  isDoubleBuffered(): boolean {
    return true;
  }

  /** 触发一次绘制：游戏画面 → 离屏缓冲 → 缩放 blit 到屏幕。 */
  repaint(): void {
    if (!this.bufferCtx || !this.screenCtx) return;
    const g = new Graphics(this.bufferCtx, this._width, this._height);
    this.paint(g);
    this.screenCtx.imageSmoothingEnabled = false;
    this.screenCtx.drawImage(this.buffer, 0, 0, this._width * this.scale, this._height * this.scale);
  }

  repaintRegion(_x: number, _y: number, _w: number, _h: number): void {
    this.repaint();
  }

  serviceRepaints(): void {
    /* 同步模型下 repaint 已即时完成 */
  }

  // 子类（移植的游戏类）实现：
  abstract paint(g: Graphics): void;
  keyPressed(_keyCode: number): void {}
  keyReleased(_keyCode: number): void {}
  keyRepeated(_keyCode: number): void {}
  showNotify(): void {}
  hideNotify(): void {}
}

/** MIDlet 基类。 */
export abstract class MIDlet {
  abstract startApp(): void;
  abstract pauseApp(): void;
  abstract destroyApp(unconditional: boolean): void;
  notifyDestroyed(): void {
    /* no-op */
  }
}

/** 屏幕配置。 */
export interface ScreenConfig {
  width: number;
  height: number;
  scale: number;
  /** 可见 <canvas> 元素。 */
  screen: HTMLCanvasElement;
  /** 键盘映射（默认 DEFAULT_KEYMAP）。 */
  keymap?: Record<string, number>;
}

/** Display：绑定 Canvas 到屏幕，接管键盘事件。 */
export class Display {
  private static instances = new WeakMap<MIDlet, Display>();
  private current: Canvas | null = null;

  static getDisplay(midlet: MIDlet): Display {
    let d = Display.instances.get(midlet);
    if (!d) {
      d = new Display();
      Display.instances.set(midlet, d);
    }
    return d;
  }

  /** 兼容入口：委托给模块级 configureScreen（推荐运行壳在创建 MIDlet 前直接调用 configureScreen）。 */
  configure(cfg: ScreenConfig): void {
    configureScreen(cfg);
  }

  setCurrent(canvas: Canvas | null): void {
    this.current = canvas;
    CURRENT = canvas;
    if (canvas && SCREEN) {
      const screenCtx = SCREEN.screen.getContext("2d")!;
      const buffer = document.createElement("canvas");
      buffer.width = SCREEN.width;
      buffer.height = SCREEN.height;
      const bufferCtx = buffer.getContext("2d")!;
      canvas.bindScreen(screenCtx, bufferCtx, buffer);
      canvas.showNotify();
    }
  }

  getCurrent(): Canvas | null {
    return this.current;
  }
}
