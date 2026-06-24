/**
 * com.nokia.mid.sound.Sound 的复刻（WebAudio）。
 *
 * 游戏1 sound.bin：大条目为 WAV(RIFF, 实为 IMA ADPCM) → 自解码 PCM 播放；
 *   小条目(type-1)为 Nokia OTT 音调序列 → parseOTT 解析后用方波合成器播放。
 * 游戏2 sound.bin：标准 MIDI（由 MidiSynth 处理，另见 GameMIDlet）。
 */
import { MidiSynth } from "./Midi.ts";

export const SOUND_FORMAT_TONE = 1;
export const SOUND_FORMAT_WAV = 5;

const SND_PLAYING = 0; // 与原版 getState 约定一致（0=播放中）
const SND_STOPPED = 1;

// 模块级共享 AudioContext：运行壳在用户手势后注入（绕过浏览器自动播放限制）。
// 这样移植代码里的 `new Sound(bytes, gain)` 无需显式传 ctx 即可发声。
let defaultCtx: AudioContext | undefined;
export function setAudioContext(ctx: AudioContext): void {
  defaultCtx = ctx;
}
export function getAudioContext(): AudioContext | undefined {
  return defaultCtx;
}

export class Sound {
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private state = SND_STOPPED;
  private bytes: Uint8Array;
  private isWav: boolean;
  private type: number;
  private ctx?: AudioContext;
  private toneSynth: MidiSynth | null = null; // Nokia OTT 音调（type-1）用方波合成器播放

  constructor(data: Uint8Array, type: number, ctx?: AudioContext) {
    this.type = type;
    this.ctx = ctx ?? defaultCtx;
    this.bytes = data;
    // RIFF....WAVE
    this.isWav =
      data.length > 12 &&
      data[0] === 0x52 &&
      data[1] === 0x49 &&
      data[2] === 0x46 &&
      data[3] === 0x46;
    if (this.ctx && this.isWav) {
      const fmt = readWavFormat(data);
      if (fmt && (fmt.formatTag === 0x11 || fmt.formatTag === 0x02)) {
        // IMA/DVI ADPCM（浏览器 decodeAudioData 不支持）→ 自行解码为 PCM
        try {
          this.buffer = decodeImaAdpcmToBuffer(this.ctx, data, fmt);
        } catch {
          /* 解码失败：保持静音 */
        }
      } else {
        // 标准 PCM 等：交给浏览器解码
        const copy = data.slice().buffer;
        this.ctx.decodeAudioData(copy).then(
          (b) => (this.buffer = b),
          () => {
            /* 解码失败：保持静音 */
          }
        );
      }
    } else if (this.ctx) {
      // 非 RIFF：按 Nokia OTT 音调序列（type-1 小音）解析，用方波合成器播放
      try {
        this.toneSynth = new MidiSynth(data, this.ctx, "ott");
      } catch {
        /* 解析失败：保持静音 */
      }
    }
  }

  /** 对应 Sound.play(int loop)。loop=0 无限循环（原版约定），>0 播放次数。 */
  play(loop: number): void {
    if (!this.ctx) return;
    if (this.toneSynth) {
      this.toneSynth.play(loop === 0 || loop > 1);
      this.state = SND_PLAYING;
      return;
    }
    if (!this.buffer) {
      // 无可播放缓冲（未解码格式）：视为"已停止"，否则会卡住 a_III 的声道忙判定、屏蔽后续所有音效
      this.state = SND_STOPPED;
      return;
    }
    this.stop();
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = loop === 0 || loop > 1;
    this.gainNode = this.ctx.createGain();
    src.connect(this.gainNode).connect(this.ctx.destination);
    src.onended = () => (this.state = SND_STOPPED);
    src.start();
    this.source = src;
    this.state = SND_PLAYING;
  }

  stop(): void {
    if (this.toneSynth) this.toneSynth.stop();
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        /* 已停止 */
      }
      this.source = null;
    }
    this.state = SND_STOPPED;
  }

  /** 对应 Sound.setGain(int)，0..255 → 0..1。 */
  setGain(gain: number): void {
    if (this.gainNode) this.gainNode.gain.value = Math.max(0, Math.min(255, gain)) / 255;
  }

  /** 对应 Sound.getState()，0=播放中。 */
  getState(): number {
    if (this.toneSynth) return this.toneSynth.isPlaying() ? SND_PLAYING : SND_STOPPED;
    return this.state;
  }
}

// ---- WAV / IMA-ADPCM 解码（游戏1 的 sound.bin 是 fmt=0x11 IMA ADPCM, 8kHz/4bit/mono）----

interface WavFormat {
  formatTag: number;
  channels: number;
  sampleRate: number;
  blockAlign: number;
  bitsPerSample: number;
  dataOffset: number;
  dataLength: number;
}

/** 解析 RIFF/WAVE 的 fmt 与 data 块。 */
function readWavFormat(buf: Uint8Array): WavFormat | null {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0, false) !== 0x52494646) return null; // 'RIFF'
  let p = 12;
  let fmt: Partial<WavFormat> = {};
  while (p + 8 <= buf.length) {
    const id = dv.getUint32(p, false);
    const sz = dv.getUint32(p + 4, true);
    const body = p + 8;
    if (id === 0x666d7420) {
      // 'fmt '
      fmt.formatTag = dv.getUint16(body, true);
      fmt.channels = dv.getUint16(body + 2, true);
      fmt.sampleRate = dv.getUint32(body + 4, true);
      fmt.blockAlign = dv.getUint16(body + 12, true);
      fmt.bitsPerSample = dv.getUint16(body + 14, true);
    } else if (id === 0x64617461) {
      // 'data'
      fmt.dataOffset = body;
      fmt.dataLength = sz;
      break;
    }
    p = body + sz + (sz & 1); // 块按偶数对齐
  }
  if (fmt.dataOffset === undefined) return null;
  return fmt as WavFormat;
}

// IMA ADPCM 标准步长表与索引表
const IMA_STEP = [
  7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107,
  118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963,
  1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894,
  6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794,
  32767,
];
const IMA_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

/** 解码 IMA/DVI ADPCM（mono）为 AudioBuffer。 */
function decodeImaAdpcmToBuffer(ctx: AudioContext, buf: Uint8Array, fmt: WavFormat): AudioBuffer {
  const blockAlign = fmt.blockAlign || 256;
  const start = fmt.dataOffset;
  const end = start + fmt.dataLength;
  const out: number[] = [];

  const decodeNibble = (nibble: number, st: { pred: number; idx: number }): number => {
    let step = IMA_STEP[st.idx];
    let diff = step >> 3;
    if (nibble & 1) diff += step >> 2;
    if (nibble & 2) diff += step >> 1;
    if (nibble & 4) diff += step;
    if (nibble & 8) diff = -diff;
    st.pred += diff;
    if (st.pred > 32767) st.pred = 32767;
    else if (st.pred < -32768) st.pred = -32768;
    st.idx += IMA_INDEX[nibble];
    if (st.idx < 0) st.idx = 0;
    else if (st.idx > 88) st.idx = 88;
    return st.pred;
  };

  for (let b = start; b < end; b += blockAlign) {
    const blockEnd = Math.min(b + blockAlign, end);
    if (b + 4 > blockEnd) break;
    // 块头：predictor(int16 LE) + stepIndex(byte) + reserved(byte)
    let pred = buf[b] | (buf[b + 1] << 8);
    if (pred & 0x8000) pred -= 0x10000;
    const st = { pred, idx: Math.min(88, buf[b + 2]) };
    out.push(pred); // 头里的 predictor 即首样本
    for (let i = b + 4; i < blockEnd; i++) {
      out.push(decodeNibble(buf[i] & 0x0f, st)); // 低 nibble 先
      out.push(decodeNibble((buf[i] >> 4) & 0x0f, st));
    }
  }

  const audioBuf = ctx.createBuffer(1, out.length, fmt.sampleRate || 8000);
  const ch = audioBuf.getChannelData(0);
  for (let i = 0; i < out.length; i++) ch[i] = out[i] / 32768;
  return audioBuf;
}
