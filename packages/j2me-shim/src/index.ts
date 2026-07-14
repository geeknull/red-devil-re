/**
 * @red-devil/j2me-shim — J2ME (MIDP/CLDC) 兼容层。
 * 在 TS+Canvas 上复刻原语，保证逐行移植的游戏逻辑位级一致。
 */
export { Random } from "./Random.ts";
export {
  ByteReader,
  ResourceArchive,
  MemoryResourceLoader,
  InputStream,
  registerResource,
  getResourceAsStream,
  registerImage,
  getCachedImage,
} from "./Resource.ts";
export type { ResourceLoader } from "./Resource.ts";
export { Image, setCanvasFactory } from "./Image.ts";
export { beginOpCapture, endOpCapture, takeOps, recordOp } from "./optap.ts";
export type { CanvasFactory } from "./Image.ts";
export {
  Graphics,
  HCENTER,
  VCENTER,
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
  BASELINE,
  TRANS_NONE,
  TRANS_MIRROR,
  TRANS_ROT90,
  TRANS_ROT180,
  TRANS_ROT270,
  TRANS_MIRROR_ROT90,
  TRANS_MIRROR_ROT180,
  TRANS_MIRROR_ROT270,
} from "./Graphics.ts";
export {
  Font,
  FACE_SYSTEM,
  FACE_MONOSPACE,
  FACE_PROPORTIONAL,
  STYLE_PLAIN,
  STYLE_BOLD,
  STYLE_ITALIC,
  STYLE_UNDERLINED,
  SIZE_SMALL,
  SIZE_MEDIUM,
  SIZE_LARGE,
} from "./Font.ts";
export { Canvas, MIDlet, Display, Thread, configureScreen } from "./Runtime.ts";
export type { ScreenConfig } from "./Runtime.ts";
export { Sound, SOUND_FORMAT_TONE, SOUND_FORMAT_WAV, setAudioContext, getAudioContext } from "./Sound.ts";
export { MidiSynth, parseSMF, parseOTT } from "./Midi.ts";
export * as Keys from "./keys.ts";
export { getGameAction, DEFAULT_KEYMAP } from "./keys.ts";
