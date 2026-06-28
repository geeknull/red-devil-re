/**
 * 红魔特种兵 1 & 2 复刻版 Web 运行壳。
 * 用 ?game=1|2 选择游戏（默认 1）。
 * 职责：预加载并注册 .bin 资源 → 预解码各 PNG 包 → 配置屏幕 → 启动 GameMIDlet。
 *
 * 注意：两代游戏代码内的资源路径都写死为 "/res/X.bin"。游戏2 的部分 .bin 与游戏1 同名，
 * 故游戏2 的字节实际从 /res2/ 抓取，但仍以逻辑键 "/res/X.bin" 注册（每次只加载一个游戏）。
 */
import { Image, registerResource, registerImage, ResourceArchive, configureScreen, setAudioContext } from "@red-devil/j2me-shim";
import { GameMIDlet as GameMIDlet1 } from "@red-devil/game1";
import { GameMIDlet as GameMIDlet2, TileSheet as TileSheet2 } from "@red-devil/game2";

interface GameDef {
  title: string;
  bins: string[];
  pngArchives: string[];
  width: number;
  height: number;
  fetchDir: string;
  /** PC 键(KeyboardEvent.code) → 该游戏 keyPressed 期望的 keyCode。 */
  keymap: Record<string, number>;
  /** 屏外按键说明（每条：按键 + 作用）。 */
  controls: { keys: string; label: string }[];
  make: () => { startApp(): void };
  /** 偏差配套：预加载阶段离线解码的额外帧（如 game2 actor 换色帧）。须在资源注册后调用。 */
  preloadFrames?: () => { index: number; frame: number; bytes: Int8Array }[];
}

// ⚠️ 两游戏键码体系不同（均不调用 getGameAction，直接 switch 原始 keyCode）：
//   game1 方向 = 键码 1/6/2/5（h_I），game2 方向 = 50/52/54/56（d_I）。故必须分游戏配键。
const GAME1_KEYMAP: Record<string, number> = {
  ArrowUp: 1, KeyW: 1,
  ArrowDown: 6, KeyS: 6,
  ArrowLeft: 2, KeyA: 2,
  ArrowRight: 5, KeyD: 5,
  Space: 48, KeyJ: 48, Enter: 48, // 主动作/确定（h_I: 48→bit16）
  KeyK: 35, // bit32
  KeyL: 51, // bit2048
  KeyI: 49, // bit1024
  KeyP: -6, // 暂停（keyPressed: -6 在关卡内→暂停）
  Escape: -7, Backspace: -7, // 退出关卡 / 暂停时恢复（keyPressed: -7）
  // 原始数字键直通（含 4/6：原版 h_I 对键码 52/54 有 case，52→换弹、54→手雷，补齐别名）
  Digit0: 48, Digit1: 49, Digit2: 50, Digit3: 51, Digit4: 52, Digit5: 53, Digit6: 54, Digit7: 55, Digit8: 56, Digit9: 57,
  NumpadMultiply: 42, // 手机 * 键（h_I: 42→bit16 开火，与 空格/0/7/8 同效）
};
const GAME2_KEYMAP: Record<string, number> = {
  ArrowUp: 50, KeyW: 50,
  ArrowDown: 56, KeyS: 56,
  ArrowLeft: 52, KeyA: 52,
  ArrowRight: 54, KeyD: 54,
  Space: 53, Enter: 53, KeyJ: 53, // 开火/确定（d_I: 53→bit16）
  KeyK: 49, // bit64
  KeyL: 51, // bit128
  KeyU: 55, // bit2048
  KeyI: 57, // bit1024
  KeyO: 42, // bit4096
  KeyP: 21, // 软键（bit16384）
  Escape: 22, Backspace: 22, // 软键 / 返回·跳过（d_I: 22）
  Digit1: 49, Digit2: 50, Digit3: 51, Digit4: 52, Digit5: 53, Digit6: 54, Digit7: 55, Digit8: 56, Digit9: 57, Digit0: 48,
};

const GAMES: Record<string, GameDef> = {
  "1": {
    title: "红魔特种兵",
    bins: ["a", "f", "image", "s", "sound", "t", "x"],
    pngArchives: ["image"],
    width: 176,
    height: 208,
    fetchDir: "/res",
    keymap: GAME1_KEYMAP,
    controls: [
      { keys: "方向键 / WASD", label: "移动（菜单中选择）" },
      { keys: "空格 / J / 回车", label: "开火（菜单中确定）" },
      { keys: "K", label: "切换武器" },
      { keys: "L", label: "换弹" },
      { keys: "I", label: "扔手雷" },
      { keys: "P", label: "暂停" },
      { keys: "Esc", label: "退出关卡 / 暂停时恢复" },
    ],
    make: () => new GameMIDlet1(),
  },
  "2": {
    title: "红魔特种兵2-深海战舰",
    bins: ["a", "actorPng", "b", "bpng", "fpng", "logo", "m", "p", "s", "sound", "string", "t"],
    pngArchives: ["actorPng", "bpng", "fpng", "logo"],
    width: 176,
    height: 204,
    fetchDir: "/res2",
    keymap: GAME2_KEYMAP,
    controls: [
      { keys: "方向键 / WASD", label: "左右移动 · 上下爬梯/下蹲（菜单中选择）" },
      { keys: "空格 / 回车 / J", label: "开火（菜单中确定）" },
      { keys: "K", label: "向左跳 / 转身朝左" },
      { keys: "L", label: "向右跳 / 转身朝右" },
      { keys: "U", label: "换弹" },
      { keys: "I", label: "扔手雷" },
      { keys: "O", label: "切换武器" },
      { keys: "P", label: "暂停 / 菜单" },
      { keys: "Esc", label: "返回 / 跳过过场" },
    ],
    make: () => new GameMIDlet2(),
    // actor 换色帧（PLTE 补丁帧）：兼容层无运行时同步 PNG 解码，故在预加载阶段离线解码。
    preloadFrames: () => TileSheet2.a_PaletteFrames(),
  },
};
const SCALE = 3;
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];

async function fetchBytes(path: string): Promise<Uint8Array> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`资源加载失败 ${path}: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** 预解码归档内所有 PNG 条目，按 (逻辑路径, 索引) 登记为 shim Image。 */
async function preloadImages(logicalPath: string, bytes: Uint8Array): Promise<void> {
  const arc = new ResourceArchive(bytes);
  for (let i = 0; i < arc.entryCount; i++) {
    const entry = arc.entry(i);
    const isPng = entry.length >= 8 && PNG_SIG.every((b, k) => entry[k] === b);
    if (!isPng) continue;
    const bmp = await createImageBitmap(new Blob([entry], { type: "image/png" }));
    registerImage(logicalPath, i, Image.fromSource(bmp, bmp.width, bmp.height));
  }
}

async function boot(): Promise<void> {
  const which = new URLSearchParams(location.search).get("game") ?? "1";
  const def = GAMES[which] ?? GAMES["1"];
  document.title = `${def.title} — 复刻版`;

  for (const name of def.bins) {
    // 资源 fetch 加 Vite base 前缀，支持子路径部署（GitHub Pages /<repo>/）；本地/根部署 BASE_URL 为 "/"，行为不变。
    const dir = def.fetchDir.replace(/^\//, "");
    const bytes = await fetchBytes(`${import.meta.env.BASE_URL}${dir}/${name}.bin`);
    const logical = `/res/${name}.bin`; // 游戏代码内固定用 /res/ 前缀
    registerResource(logical, bytes);
    if (def.pngArchives.includes(name)) await preloadImages(logical, bytes);
  }

  // 额外帧：actor 换色帧（PLTE 补丁后 PNG）须在 t.bin/actorPng.bin 注册完后离线解码登记。
  if (def.preloadFrames) {
    for (const fr of def.preloadFrames()) {
      const u8 = new Uint8Array(fr.bytes); // Int8→Uint8 逐字节保值
      const bmp = await createImageBitmap(new Blob([u8], { type: "image/png" }));
      registerImage("/res/actorPng.bin", fr.index, Image.fromSource(bmp, bmp.width, bmp.height), fr.frame);
    }
  }

  // 音频：建共享 AudioContext（初始 suspended），用户首次按键/点击后 resume（绕过自动播放限制）。
  // 先注入，使关卡加载阶段构造的 Sound 能解码 WAV；播放在 resume 后生效。
  const AudioCtor = (window.AudioContext ?? (window as any).webkitAudioContext) as typeof AudioContext | undefined;
  if (AudioCtor) {
    const audio = new AudioCtor();
    setAudioContext(audio);
    const resume = () => {
      if (audio.state === "suspended") void audio.resume();
    };
    window.addEventListener("keydown", resume);
    window.addEventListener("pointerdown", resume);
  }

  // 屏外按键说明（用户否则不知道按什么键）
  renderControls(def);

  const screen = document.getElementById("screen") as HTMLCanvasElement;
  configureScreen({ width: def.width, height: def.height, scale: SCALE, screen, keymap: def.keymap });
  const midlet = def.make();
  midlet.startApp();
}

/** 在画布外渲染本游戏的按键对照表。 */
function renderControls(def: GameDef): void {
  const el = document.getElementById("controls-panel");
  if (!el) return;
  el.innerHTML =
    `<div class="ctrl-title">${def.title} · 按键说明</div>` +
    def.controls
      .map((c) => `<div class="ctrl-row"><span class="ctrl-keys">${c.keys}</span><span class="ctrl-label">${c.label}</span></div>`)
      .join("");
}

boot().catch((e) => {
  console.error(e);
  const el = document.getElementById("err");
  if (el) el.textContent = String(e?.stack ?? e);
});
