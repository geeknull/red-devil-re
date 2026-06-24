/**
 * 极简标准 MIDI 文件(SMF)解析 + WebAudio 振荡器合成器。
 *
 * 背景：游戏2 的 sound.bin 是标准 MIDI，原版在 Motorola E398 上由设备自带 MIDI
 * 合成器播放——**设备相关**，无法与某台真机逐采样相同（与字体同理）。本实现为
 * 最佳努力：自带一个轻量的方波/三角波合成器，把 MIDI 音符调度到 AudioContext，
 * 让音乐能在浏览器里响起（复古芯片音风格），不引入任何外部依赖或音色库。
 */

interface NoteEvent {
  t: number; // 绝对时间(秒)
  on: boolean;
  note: number;
  vel: number;
}

function noteFreq(n: number): number {
  return 440 * Math.pow(2, (n - 69) / 12);
}

/** 解析 SMF 字节为按时间排序的音符事件 + 总时长(秒)。 */
export function parseSMF(buf: Uint8Array): { notes: NoteEvent[]; duration: number } {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0) !== 0x4d546864) return { notes: [], duration: 0 }; // 'MThd'
  const division = dv.getUint16(12); // ticks / 四分音符
  let p = 8 + dv.getUint32(4); // 跳过头块

  // 收集所有轨的 (绝对tick, 类型) 事件
  type Raw = { tick: number; kind: "tempo" | "note"; data: number; on?: boolean; note?: number; vel?: number };
  const raw: Raw[] = [];

  while (p < buf.length - 8) {
    if (dv.getUint32(p) !== 0x4d54726b) break; // 'MTrk'
    const len = dv.getUint32(p + 4);
    let q = p + 8;
    const end = q + len;
    let tick = 0;
    let running = 0;
    while (q < end) {
      // 变长 delta-time
      let dt = 0;
      let b: number;
      do {
        b = buf[q++];
        dt = (dt << 7) | (b & 0x7f);
      } while (b & 0x80);
      tick += dt;

      let status = buf[q];
      if (status & 0x80) q++;
      else status = running; // running status
      running = status;

      const hi = status & 0xf0;
      if (status === 0xff) {
        // meta
        const type = buf[q++];
        let mlen = 0;
        let mb: number;
        do {
          mb = buf[q++];
          mlen = (mlen << 7) | (mb & 0x7f);
        } while (mb & 0x80);
        if (type === 0x51 && mlen === 3) {
          const us = (buf[q] << 16) | (buf[q + 1] << 8) | buf[q + 2];
          raw.push({ tick, kind: "tempo", data: us });
        }
        q += mlen;
      } else if (status === 0xf0 || status === 0xf7) {
        // sysex：跳过
        let slen = 0;
        let sb: number;
        do {
          sb = buf[q++];
          slen = (slen << 7) | (sb & 0x7f);
        } while (sb & 0x80);
        q += slen;
      } else if (hi === 0x90 || hi === 0x80) {
        const note = buf[q++];
        const vel = buf[q++];
        raw.push({ tick, kind: "note", data: 0, on: hi === 0x90 && vel > 0, note, vel });
      } else if (hi === 0xc0 || hi === 0xd0) {
        q += 1; // program change / channel pressure：1 字节，忽略
      } else if (hi === 0xa0 || hi === 0xb0 || hi === 0xe0) {
        q += 2; // 2 字节，忽略
      } else {
        q++; // 兜底
      }
    }
    p = end;
  }

  // 按 tick 排序，走一遍用 tempo 图换算成秒
  raw.sort((a, b) => a.tick - b.tick);
  let curTick = 0;
  let curSec = 0;
  let us = 500000; // 默认 120BPM
  const notes: NoteEvent[] = [];
  for (const e of raw) {
    curSec += ((e.tick - curTick) * us) / 1e6 / division;
    curTick = e.tick;
    if (e.kind === "tempo") us = e.data;
    else notes.push({ t: curSec, on: e.on!, note: e.note!, vel: e.vel! });
  }
  return { notes, duration: curSec };
}

/**
 * 解析 Nokia OTT/OTA（Smart Messaging 铃声）音调序列为音符事件。
 * 公开标准，位级 MSB-first 编码：命令表 → 铃声编程/声音 → 歌曲(基本/临时) → 模式 → 音符/音阶/风格/速度指令。
 * 游戏1 sound.bin 的 type-1 小音（拾取/UI 蜂鸣，前缀 02 4a 3a 40…）即此格式。
 */
export function parseOTT(buf: Uint8Array): { notes: NoteEvent[]; duration: number } {
  let pos = 0;
  let bit = 0;
  // MSB-first 位读取；越界返回 0（与设备/参考实现一致地在 EOF 截止）
  const readBits = (n: number): number => {
    let v = 0;
    for (let i = 0; i < n; i++) {
      if (pos >= buf.length) return 0;
      v = (v << 1) | ((buf[pos] >> (7 - bit)) & 1);
      if (++bit === 8) {
        bit = 0;
        pos++;
      }
    }
    return v;
  };

  // 音符频率表(note 1..12 = C5..B5，0=休止)、tempo(BPM)表
  const FREQ = [0, 523, 554, 587, 622, 659, 698, 740, 784, 831, 880, 932, 988];
  const TEMPO = [25, 28, 31, 35, 40, 45, 50, 56, 63, 70, 80, 90, 100, 112, 125, 140, 160, 180, 200, 225, 250, 285, 320, 355, 400, 450, 500, 565, 635, 715, 800, 900];
  const freqToMidi = (f: number): number => Math.round(Math.log(f / 8.176) * 17.31234049066755);

  let noteScale = 1.0;
  let noteStyle = 0; // 0=自然 1=连音 2=断音
  let bpm = 120;
  let curSec = 0;
  const notes: NoteEvent[] = [];
  let lastPatPos = 0;
  let lastPatBit = 0;
  let lastPatLen = 0;
  let guard = 0; // 防失控

  const secPerTick = (): number => 60 / (bpm * 24);

  const parseNote = (): void => {
    const noteVal = readBits(4);
    const dur = readBits(3);
    const spec = readBits(2);
    let ticks = 24;
    if (dur === 0) ticks *= 4;
    else if (dur === 1) ticks *= 2;
    else if (dur === 3) ticks = (ticks / 2) | 0;
    else if (dur === 4) ticks = (ticks / 4) | 0;
    else if (dur === 5) ticks = (ticks / 8) | 0;
    if (spec === 1) ticks = (ticks * 1.5) | 0;
    else if (spec === 2) ticks = (ticks * 1.75) | 0;
    else if (spec === 3) ticks = (ticks * 0.6666666666666666) | 0;
    const durSec = ticks * secPerTick();
    if (noteVal >= 1 && noteVal <= 12) {
      const midi = freqToMidi(FREQ[noteVal] * noteScale);
      const offFrac = noteStyle === 2 ? 0.6 : noteStyle === 1 ? 1.0 : 0.8;
      notes.push({ t: curSec, on: true, note: midi, vel: 93 });
      notes.push({ t: curSec + durSec * offFrac, on: false, note: midi, vel: 0 });
    }
    curSec += durSec;
  };

  const parsePatternInstruction = (): void => {
    const t = readBits(3);
    if (t === 1) parseNote();
    else if (t === 2) {
      const n = readBits(2);
      noteScale = n === 0 ? 0.5 : n === 1 ? 1.0 : n === 2 ? 2.0 : 4.0;
    } else if (t === 3) {
      const n = readBits(2);
      if (n < 3) noteStyle = n;
    } else if (t === 4) {
      bpm = TEMPO[readBits(5)] ?? 120;
    } else if (t === 5) {
      readBits(4); // volume
    }
  };

  const parseSongPattern = (): void => {
    readBits(3); // pattern id
    readBits(2); // pattern instance
    let loop = readBits(4);
    if (loop === 15) loop = 0; // 无限循环不实现，按一次
    const hPos = pos;
    const hBit = bit;
    while (loop >= 0 && pos < buf.length && ++guard < 100000) {
      pos = hPos;
      bit = hBit;
      const patLen = readBits(8);
      if (patLen === 0) {
        // 复用上一个已定义模式
        const rPos = pos;
        const rBit = bit;
        while (loop >= 0 && ++guard < 100000) {
          pos = lastPatPos;
          bit = lastPatBit;
          for (let i = 0; i < lastPatLen; i++) parsePatternInstruction();
          loop--;
        }
        pos = rPos;
        bit = rBit;
        return;
      }
      lastPatLen = patLen;
      lastPatPos = pos;
      lastPatBit = bit;
      noteStyle = 0;
      noteScale = 1.0;
      for (let i = 0; i < patLen; i++) parsePatternInstruction();
      loop--;
    }
  };

  const parseTemporarySong = (): void => {
    const seqLen = readBits(8);
    for (let i = 0; i < seqLen && pos < buf.length; i++) parseSongPattern();
  };
  const parseBasicSong = (): void => {
    const titleLen = readBits(4);
    for (let i = 0; i < titleLen; i++) readBits(8);
    parseTemporarySong();
  };
  const parseSound = (): void => {
    const songType = readBits(3);
    if (songType === 1) parseBasicSong();
    else if (songType === 2) parseTemporarySong();
    // 3/4/5(MIDI/数字/复音) 不支持，忽略
  };
  const parseRingingTone = (): void => {
    const n = readBits(7);
    if (n === 29) parseSound();
    else if (n === 34) readBits(16);
  };

  const cmdCount = readBits(8);
  for (let i = 0; i < cmdCount && pos < buf.length && ++guard < 100000; i++) {
    const cmd = readBits(8);
    if (cmd === 74) {
      parseRingingTone();
      i++;
    } else if (cmd === 68) {
      readBits(16);
    } else if (cmd === 58) {
      parseSound();
    } else if (cmd === 10) {
      readBits(7);
      readBits(16);
    } else if (cmd === 0) {
      break; // 结束
    } else {
      break; // 未知命令，停止以防失控
    }
  }
  return { notes, duration: curSec };
}

/** 把一段 SMF 调度到 WebAudio 播放（方波合成），支持循环与停止。 */
export class MidiSynth {
  private notes: NoteEvent[];
  private duration: number;
  private ctx: AudioContext;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private active: { osc: OscillatorNode; gain: GainNode }[] = [];
  private playing = false;

  constructor(buf: Uint8Array, ctx: AudioContext, format: "smf" | "ott" = "smf") {
    const parsed = format === "ott" ? parseOTT(buf) : parseSMF(buf);
    this.notes = parsed.notes;
    this.duration = parsed.duration;
    this.ctx = ctx;
  }

  play(loop: boolean): void {
    this.stop();
    if (this.notes.length === 0) return;
    this.playing = true;
    this.scheduleOnce();
    const ms = (this.duration + 0.3) * 1000;
    if (loop && this.duration > 0) {
      const tick = () => {
        if (!this.playing) return;
        this.scheduleOnce();
        this.timer = setTimeout(tick, ms);
      };
      this.timer = setTimeout(tick, ms);
    } else if (this.duration > 0) {
      // 单次播放：结束后标记停止，供宿主的清理逻辑判定
      this.timer = setTimeout(() => {
        this.playing = false;
      }, ms);
    }
  }

  private scheduleOnce(): void {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.05;
    const master = ctx.createGain();
    master.gain.value = 0.18; // 总音量(避免和弦削顶)
    master.connect(ctx.destination);
    this.master = master;
    // 用栈匹配 note-on / note-off
    const pending = new Map<number, { startGain: GainNode; osc: OscillatorNode; t: number }>();
    for (const ev of this.notes) {
      if (ev.on) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = noteFreq(ev.note);
        const g = ctx.createGain();
        const vol = (ev.vel / 127) * 0.6;
        g.gain.setValueAtTime(0, t0 + ev.t);
        g.gain.linearRampToValueAtTime(vol, t0 + ev.t + 0.01); // attack
        osc.connect(g).connect(master);
        osc.start(t0 + ev.t);
        pending.set(ev.note, { startGain: g, osc, t: ev.t });
        this.active.push({ osc, gain: g });
      } else {
        const held = pending.get(ev.note);
        if (held) {
          const endT = t0 + ev.t;
          held.startGain.gain.setValueAtTime(held.startGain.gain.value, endT);
          held.startGain.gain.linearRampToValueAtTime(0, endT + 0.03); // release
          held.osc.stop(endT + 0.05);
          pending.delete(ev.note);
        }
      }
    }
    // 收尾未关闭的音
    for (const held of pending.values()) {
      const endT = t0 + this.duration + 0.1;
      held.startGain.gain.linearRampToValueAtTime(0, endT);
      held.osc.stop(endT + 0.05);
    }
  }

  stop(): void {
    this.playing = false;
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const a of this.active) {
      try {
        a.osc.stop();
      } catch {
        /* 已停止 */
      }
    }
    this.active = [];
    this.master = null;
  }

  isPlaying(): boolean {
    return this.playing;
  }
}
