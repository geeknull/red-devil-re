/**
 * 游戏1《红魔特种兵》精灵图集（pixmap atlas）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/i.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 职责：解析 /res/t.bin（小图表 + RGB4444 调色板 + 4bit packed 像素），
 *       原版用 Nokia DirectGraphics.drawPixels(format=4444) 直接把 16 位 ARGB4444
 *       像素带翻转/旋转贴到屏幕。
 *
 * 字段别名（见 docs/game1-红魔特种兵/类清单与职责.md）：
 *   静态 a=水平翻转请求位(Integer.MIN_VALUE), b=垂直翻转请求位(0x40000000), c=拼像素缓冲容量(4096)
 *   g=小图数量(short), h/i=每张小图的 行偏移/起始行(short[]),
 *   d=每张小图的 宽(short[],0..255), e=每张小图的 高(short[],0..255),
 *   j=每张小图的 调色板基址>>4 索引(byte[]), k=每行字节数(/2 后), l=像素图总行数,
 *   m=4bit packed 像素(byte[]), n=调色板表[组][色]=ARGB4444(short[][]), o=调色板组数,
 *   f=拼像素临时缓冲(static short[c])
 *
 * 方法映射：a(Graphics,5×int)→a_GIIIII（绘制单张小图）, a(int)→a_I(static, 从 t.bin 解析图集),
 *           构造→constructor
 *
 * 偏差说明（资源/像素管线，见规约 §5/§6）：
 *   Nokia DirectGraphics 不可用。drawPixels(f,...,4444) 改写为：
 *   先把缓冲 f 中的 ARGB4444 short 经 RGB444 调色板解码成 0xAARRGGBB 的 Int32Array，
 *   Image.createRGBImage(argb,w,h,true) 生成不可变图，再用 Graphics.drawRegion 以
 *   等价的 Sprite 变换（由 Nokia manipulation 翻转/旋转标志换算）贴出。
 */
import {
  Graphics,
  Image,
  TOP,
  LEFT,
  TRANS_NONE,
  TRANS_MIRROR,
  TRANS_MIRROR_ROT180,
  TRANS_ROT180,
  TRANS_ROT90,
  TRANS_ROT270,
  TRANS_MIRROR_ROT90,
  TRANS_MIRROR_ROT270,
} from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { SEQUENCE_MASK, FACING_MASK } from "./constants.ts";

// Nokia DirectGraphics manipulation 常量（仅本文件像素管线偏差换算用）。
const FLIP_HORIZONTAL = 8192; // 0x2000
const FLIP_VERTICAL = 0x4000; // 16384

export class SpriteAtlas {
  static flipHorizontalBit: number = -2147483648; // Integer.MIN_VALUE (0x80000000)
  static flipVerticalBit: number = 0x40000000;
  static pixelBufferCapacity: number = 4096;
  private spriteCount: number = 0; // short
  private rowOffsets!: Int16Array; // short[]
  private startRows!: Int16Array; // short[]
  widths!: Int16Array; // short[]（public）
  heights!: Int16Array; // short[]（public）
  private paletteBaseIndices!: Int8Array; // byte[]
  private bytesPerRow: number = 0;
  private totalRows: number = 0;
  private packedPixels!: Int8Array; // byte[]
  private palettes!: Int16Array[]; // short[][]
  private paletteCount: number = 0;
  static pixelBuffer: Int16Array = new Int16Array(SpriteAtlas.pixelBufferCapacity); // short[c]

  /**
   * i.<init>()：私有无参构造。仅由静态工厂 {@link SpriteAtlas.load} 内部用于
   * 实例化一个空图集对象，随后由 load 从 t.bin 逐字段填充；外部不可直接 new。
   */
  private constructor() {
  }

  /**
   * i.a(Graphics,int,int,int,int,int)：绘制第 n3 张小图。
   * n/n2=目标 x/y，n3=小图索引(高字节带翻转请求位 a/b)，n4=调色板组索引，n5=附加 manipulation(旋转)。
   */
  drawSprite(graphics: Graphics, x: number, y: number, cellIndex: number, paletteIndex: number, manip: number): void {
    const facingBits = cellIndex & FACING_MASK;
    cellIndex &= SEQUENCE_MASK;
    let manipCode = 0;
    // 原版：DirectGraphics directGraphics = DirectUtils.getDirectGraphics(graphics);
    //       —— 偏差：无 Nokia DirectGraphics，改用下方解码 + drawRegion。
    if ((facingBits & SpriteAtlas.flipHorizontalBit) !== 0) {
      manipCode = 8192;
    }
    if ((facingBits & SpriteAtlas.flipVerticalBit) !== 0) {
      manipCode |= 0x4000;
    }
    manipCode |= manip;
    let pixelCursor = 0;
    const paletteBase = this.paletteBaseIndices[cellIndex] << 4;
    const oddStart = this.rowOffsets[cellIndex] % 2 === 1;
    let halfWidth = this.widths[cellIndex];
    const oddTail = (halfWidth - (this.rowOffsets[cellIndex] % 2)) % 2 === 1;
    halfWidth = (halfWidth / 2) | 0;
    const colStart = (this.rowOffsets[cellIndex] / 2) | 0;
    if (oddStart && !oddTail) {
      ++halfWidth;
    }
    let row = this.startRows[cellIndex];
    while (row < this.startRows[cellIndex] + this.heights[cellIndex]) {
      let col: number;
      if (oddStart) {
        SpriteAtlas.pixelBuffer[pixelCursor] = this.palettes[paletteIndex][paletteBase + (this.packedPixels[row * this.bytesPerRow + colStart] & 0xf)];
        ++pixelCursor;
        col = 1;
      } else {
        col = 0;
      }
      while (col < halfWidth) {
        const packed = this.packedPixels[row * this.bytesPerRow + col + colStart];
        SpriteAtlas.pixelBuffer[pixelCursor] = this.palettes[paletteIndex][paletteBase + ((packed >> 4) & 0xf)];
        SpriteAtlas.pixelBuffer[++pixelCursor] = this.palettes[paletteIndex][paletteBase + (packed & 0xf)];
        ++pixelCursor;
        ++col;
      }
      if (oddTail) {
        SpriteAtlas.pixelBuffer[pixelCursor] = this.palettes[paletteIndex][paletteBase + ((this.packedPixels[row * this.bytesPerRow + col + colStart] >> 4) & 0xf)];
        ++pixelCursor;
      }
      ++row;
    }
    if ((facingBits & SpriteAtlas.flipHorizontalBit) !== 0) {
      x -= this.widths[cellIndex];
    }
    if ((facingBits & SpriteAtlas.flipVerticalBit) !== 0) {
      y -= this.heights[cellIndex];
    }
    // 原版：directGraphics.drawPixels(f, true, 0, this.d[cellIndex], x, y, this.d[cellIndex], this.e[cellIndex], manipCode, 4444);
    //   偏差：把 f 缓冲(ARGB4444 short)解码为 0xAARRGGBB，建不可变图后用 drawRegion 等价贴出。
    const w = this.widths[cellIndex];
    const h = this.heights[cellIndex];
    const argb = new Int32Array(w * h);
    for (let p = 0; p < w * h; ++p) {
      const s = SpriteAtlas.pixelBuffer[p] & 0xffff; // ARGB4444
      const a4 = (s >> 12) & 0xf;
      const r4 = (s >> 8) & 0xf;
      const g4 = (s >> 4) & 0xf;
      const b4 = s & 0xf;
      // 4bit 通道按 c | c<<4 扩展到 8bit（与 Nokia 4444→8888 一致）
      const a8 = (a4 << 4) | a4;
      const r8 = (r4 << 4) | r4;
      const g8 = (g4 << 4) | g4;
      const b8 = (b4 << 4) | b4;
      argb[p] = ((a8 << 24) | (r8 << 16) | (g8 << 8) | b8) | 0;
    }
    const image = Image.createRGBImage(argb, w, h, true); // transparency=true → processAlpha
    const transform = SpriteAtlas.manipulationToTransform(manipCode);
    graphics.drawRegion(image, 0, 0, w, h, transform, x, y, TOP | LEFT);
  }

  /**
   * 偏差辅助：把 Nokia DirectGraphics 的 manipulation（翻转 8192/0x4000 + 旋转 90/180/270）
   * 换算为等价的 Sprite 变换常量，供 drawRegion 使用。
   */
  private static manipulationToTransform(manip: number): number {
    const flipH = (manip & FLIP_HORIZONTAL) !== 0;
    const flipV = (manip & FLIP_VERTICAL) !== 0;
    const rot = manip & ~(FLIP_HORIZONTAL | FLIP_VERTICAL); // 0/90/180/270
    // 先按旋转再叠加翻转，落到等价的 Sprite TRANS_* 上。
    if (rot === 90) {
      if (flipH || flipV) return flipH && flipV ? TRANS_ROT90 : flipH ? TRANS_MIRROR_ROT90 : TRANS_MIRROR_ROT270;
      return TRANS_ROT90;
    }
    if (rot === 270) {
      if (flipH || flipV) return flipH && flipV ? TRANS_ROT270 : flipH ? TRANS_MIRROR_ROT270 : TRANS_MIRROR_ROT90;
      return TRANS_ROT270;
    }
    if (rot === 180) {
      if (flipH && flipV) return TRANS_NONE;
      if (flipH) return TRANS_MIRROR_ROT180;
      if (flipV) return TRANS_MIRROR;
      return TRANS_ROT180;
    }
    // 无旋转
    if (flipH && flipV) return TRANS_ROT180;
    if (flipH) return TRANS_MIRROR;
    if (flipV) return TRANS_MIRROR_ROT180;
    return TRANS_NONE;
  }

  /** i.a(int)：从 /res/t.bin 第 n 条目解析图集。解析失败（异常）返回 null（保持原版语义）。 */
  static load(entryIndex: number): SpriteAtlas | null {
    const atlas = new SpriteAtlas();
    try {
      const inputStream = GameMIDlet.openArchiveEntryStream("/res/t.bin", entryIndex)!;
      atlas.spriteCount = GameMIDlet.readU16Le(inputStream);
      atlas.rowOffsets = new Int16Array(atlas.spriteCount);
      atlas.startRows = new Int16Array(atlas.spriteCount);
      atlas.widths = new Int16Array(atlas.spriteCount);
      atlas.heights = new Int16Array(atlas.spriteCount);
      atlas.paletteBaseIndices = new Int8Array(atlas.spriteCount);
      let i = 0;
      while (i < atlas.spriteCount) {
        atlas.paletteBaseIndices[i] = GameMIDlet.readByte(inputStream);
        atlas.rowOffsets[i] = GameMIDlet.readU16Le(inputStream);
        atlas.startRows[i] = GameMIDlet.readU16Le(inputStream);
        atlas.widths[i] = GameMIDlet.readByte(inputStream);
        if (atlas.widths[i] < 0) {
          const idx = i;
          atlas.widths[idx] = ((atlas.widths[idx] + 256) << 16) >> 16; // (short)
        }
        atlas.heights[i] = GameMIDlet.readByte(inputStream);
        if (atlas.heights[i] < 0) {
          const idx = i;
          atlas.heights[idx] = ((atlas.heights[idx] + 256) << 16) >> 16; // (short)
        }
        ++i;
      }
      atlas.paletteCount = GameMIDlet.readByte(inputStream);
      const paletteSize = GameMIDlet.readByte(inputStream);
      atlas.palettes = new Array<Int16Array>(atlas.paletteCount);
      for (let q = 0; q < atlas.paletteCount; ++q) {
        atlas.palettes[q] = new Int16Array(paletteSize << 4);
      }
      i = 0;
      while (i < atlas.paletteCount) {
        let j = 0;
        while (j < paletteSize << 4) {
          atlas.palettes[i][j] = GameMIDlet.readU16Le(inputStream);
          ++j;
        }
        ++i;
      }
      atlas.bytesPerRow = GameMIDlet.readU16Le(inputStream);
      atlas.totalRows = GameMIDlet.readU16Le(inputStream);
      atlas.bytesPerRow = (atlas.bytesPerRow / 2) | 0;
      atlas.packedPixels = new Int8Array(atlas.bytesPerRow * atlas.totalRows);
      inputStream.read(atlas.packedPixels);
      inputStream.close();
    } catch (exception) {
      return null;
    }
    return atlas;
  }
}
