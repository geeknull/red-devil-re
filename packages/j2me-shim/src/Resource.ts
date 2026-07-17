/**
 * tjge 引擎 .bin 资源归档读取（位级一致）。
 *
 * 复刻 GameMIDlet 的字节读取原语（全部小端无符号）与归档容器结构：
 *   int32 count; int32 offset[count]; blob payload;
 *   entry[i] = payload[offset[i] : offset[i+1]]，末项为 EOF 哨兵。
 * 详见 docs/bin资源格式.md。
 */

/** 顺序读取 Uint8Array 的小端读取器，对应 GameMIDlet.a/b/c。 */
export class ByteReader {
  readonly buf: Uint8Array;
  private pos = 0;
  constructor(buf: Uint8Array, start = 0) {
    this.buf = buf;
    this.pos = start;
  }

  get position(): number {
    return this.pos;
  }

  /** 对应 GameMIDlet.b：读 1 字节（有符号）。 */
  readByte(): number {
    const v = this.buf[this.pos++];
    return v < 128 ? v : v - 256;
  }

  /** 读 1 字节（无符号 0..255）。 */
  readUByte(): number {
    return this.buf[this.pos++];
  }

  /** 对应 GameMIDlet.a：读小端 16 位无符号。 */
  readUShort(): number {
    const lo = this.buf[this.pos++];
    const hi = this.buf[this.pos++];
    return lo + hi * 256;
  }

  /** 读小端 16 位有符号（用于读取定点偏移等带符号场景）。 */
  readShort(): number {
    const v = this.readUShort();
    return v < 0x8000 ? v : v - 0x10000;
  }

  /** 对应 GameMIDlet.c：读小端 32 位整数。 */
  readInt(): number {
    const b0 = this.buf[this.pos++];
    const b1 = this.buf[this.pos++];
    const b2 = this.buf[this.pos++];
    const b3 = this.buf[this.pos++];
    // 小端：b0 为低字节；用 >>> 0 后再转有符号
    return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) | 0;
  }

  /** 对应 a.g(int) 的字符串读取：读 n 个小端 u16 作为 char。 */
  readChars(n: number): string {
    let s = "";
    for (let i = 0; i < n; i++) s += String.fromCharCode(this.readUShort());
    return s;
  }

  skip(n: number): void {
    this.pos += n;
  }

  seek(p: number): void {
    this.pos = p;
  }
}

/**
 * 一个 .bin 归档。解析头部偏移表，按索引返回条目字节切片。
 */
export class ResourceArchive {
  readonly count: number;
  /** 偏移表（含 EOF 哨兵）。有效条目数 = count - 1。 */
  readonly offsets: number[];
  private readonly base: number;
  private readonly data: Uint8Array;

  constructor(buf: Uint8Array) {
    this.data = buf;
    const r = new ByteReader(buf);
    this.count = r.readInt();
    this.offsets = [];
    for (let i = 0; i < this.count; i++) this.offsets.push(r.readInt());
    this.base = 4 + 4 * this.count;
  }

  /** 有效条目数（不含 EOF 哨兵）。 */
  get entryCount(): number {
    return this.count - 1;
  }

  /** 第 i 个条目的字节切片（零拷贝视图）。 */
  entry(i: number): Uint8Array {
    const start = this.base + this.offsets[i];
    const end = i + 1 < this.count ? this.base + this.offsets[i + 1] : this.data.length;
    return this.data.subarray(start, end);
  }

  /** 第 i 个条目的 ByteReader。 */
  reader(i: number): ByteReader {
    return new ByteReader(this.entry(i));
  }

  entrySize(i: number): number {
    return i + 1 < this.count ? this.offsets[i + 1] - this.offsets[i] : this.data.length - this.base - this.offsets[i];
  }
}

/**
 * 资源加载器抽象：浏览器用 fetch(ArrayBuffer)，Node 测试用 fs。
 * 由运行壳注入具体实现，shim 本身不依赖环境。
 */
export interface ResourceLoader {
  /** 同步取已加载的归档（需先 preload）。 */
  archive(name: string): ResourceArchive;
  /** 预加载所有 .bin（异步），完成后 archive() 可同步访问。 */
  preload(names: string[]): Promise<void>;
}

/**
 * java.io.InputStream 的最小复刻（基于 Uint8Array）。
 * 使 GameMIDlet 的字节读取器与各类 .bin 解析能逐行忠实移植。
 * read(Int8Array) 会把字节按有符号填入，对应 Java `byte[]` 的有符号语义。
 */
export class InputStream {
  private pos = 0;
  private data: Uint8Array;
  constructor(data: Uint8Array) {
    this.data = data;
  }

  /** read()：读单字节（0..255），EOF 返回 -1。 */
  read1(): number {
    return this.pos < this.data.length ? this.data[this.pos++] : -1;
  }

  /** read(byte[])：填充 buf（Int8Array 得有符号字节），返回读取数；EOF 返回 -1。 */
  read(buf: Int8Array | Uint8Array): number {
    if (this.pos >= this.data.length) return -1;
    const n = Math.min(buf.length, this.data.length - this.pos);
    for (let i = 0; i < n; i++) buf[i] = this.data[this.pos + i];
    this.pos += n;
    return n;
  }

  /** skip(n)：跳过 n 字节，返回实际跳过数。 */
  skip(n: number): number {
    const m = Math.min(n, this.data.length - this.pos);
    this.pos += m;
    return m;
  }

  available(): number {
    return this.data.length - this.pos;
  }

  close(): void {
    /* no-op */
  }
}

// ---- 资源注册表：对应 getClass().getResourceAsStream(path) ----
const RESOURCE_REGISTRY = new Map<string, Uint8Array>();

/** 由运行壳在预加载阶段调用，注册 /res/*.bin 的原始字节。 */
export function registerResource(path: string, bytes: Uint8Array): void {
  RESOURCE_REGISTRY.set(path, bytes);
}

/** 对应 getResourceAsStream(path)；未注册返回 null。 */
export function getResourceAsStream(path: string): InputStream | null {
  const b = RESOURCE_REGISTRY.get(path);
  return b ? new InputStream(b) : null;
}

// ---- 预解码图片缓存：image.bin/*png.bin 的 PNG 在预加载阶段异步解码后按索引登记 ----
const IMAGE_REGISTRY = new Map<string, unknown>();

// key：基础帧(frame=0)用 `${archive}#${index}` 保持向后兼容；
// 换色帧(frame>0，game2 actor PLTE 补丁帧)用 `${archive}#${index}@${frame}`。
function imageKey(archive: string, index: number, frame: number): string {
  return frame ? `${archive}#${index}@${frame}` : `${archive}#${index}`;
}

export function registerImage(archive: string, index: number, img: unknown, frame = 0): void {
  IMAGE_REGISTRY.set(imageKey(archive, index, frame), img);
}

export function getCachedImage<T>(archive: string, index: number, frame = 0): T {
  const img = IMAGE_REGISTRY.get(imageKey(archive, index, frame));
  if (img === undefined) {
    // ⚠️ 这是**兼容层特有**的失败模式：原版在此处不会失败
    //（javap tjge.i 的 a(int)：`Image.createImage(byte[],int,int)` 对合法 PNG 字节不会抛）。
    //
    // 为什么必须在这里 console.error，而不是「抛个更明确的异常」：
    //   抛出去没用——游戏**自己**会把它静默吞掉，而且是**两层**：
    //     TileSheet.loadFromBin  catch → return null   （忠实复刻字节码异常表 from 8 to 291 → aconst_null）
    //     LevelScene.loadLevel   catch → return null   （同样是忠实复刻）
    //   这两个 catch **不能动**（动了就破坏保真），所以任何异常通道都到不了人眼。
    //   console.error 是**旁路副作用**，try/catch 吞不掉 → 这是唯一能让它响的通道。
    //
    // 后果（若无本告警）：game2 忘接 preloadFrames → t.bin 条目 0 的 TileSheet 静默变 null
    //   ——那是玩家 + 全部步兵敌人共用的人形图集（9 个 SpriteDef）。
    //   与 docs/复盘-语义化改名静默崩溃.md、packages/jvm-oracle/README.md 的 JDK9+ 资源坑
    //   是**同一失效模式**：坏掉的状态看起来是活的。
    console.error(
      `[j2me-shim] ⛔ 图片未预解码: ${imageKey(archive, index, frame)}\n` +
        `  这是兼容层特有的失败模式（原版在此不会失败），且**会被游戏自身的 catch 静默吞掉**\n` +
        `  → 症状是「图集/精灵莫名其妙没了」而非报错。\n` +
        (frame > 0
          ? `  frame>0 = game2 actor 换色帧：**运行壳很可能忘了接 preloadFrames**\n` +
            `  （应为 preloadFrames: () => TileSheet.a_PaletteFrames()，参见 packages/web/src/main.ts）。`
          : `  frame=0 = 基础帧：检查该归档是否已在预加载阶段 registerImage。`),
    );
    throw new Error(`图片未预解码: ${imageKey(archive, index, frame)}`);
  }
  return img as T;
}

/** 基于内存 Map 的加载器实现（字节由外部填充）。 */
export class MemoryResourceLoader implements ResourceLoader {
  private cache = new Map<string, ResourceArchive>();
  private fetcher: (name: string) => Promise<Uint8Array>;
  constructor(fetcher: (name: string) => Promise<Uint8Array>) {
    this.fetcher = fetcher;
  }

  async preload(names: string[]): Promise<void> {
    await Promise.all(
      names.map(async (n) => {
        const bytes = await this.fetcher(n);
        this.cache.set(n, new ResourceArchive(bytes));
      })
    );
  }

  archive(name: string): ResourceArchive {
    const a = this.cache.get(name);
    if (!a) throw new Error(`资源未预加载: ${name}`);
    return a;
  }
}
