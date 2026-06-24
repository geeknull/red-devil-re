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

  private constructor() {
  }

  /**
   * i.a(Graphics,int,int,int,int,int)：绘制第 n3 张小图。
   * n/n2=目标 x/y，n3=小图索引(高字节带翻转请求位 a/b)，n4=调色板组索引，n5=附加 manipulation(旋转)。
   */
  drawSprite(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number): void {
    const n6 = n3 & 0xff000000;
    n3 &= 0xffffff;
    let n7 = 0;
    // 原版：DirectGraphics directGraphics = DirectUtils.getDirectGraphics(graphics);
    //       —— 偏差：无 Nokia DirectGraphics，改用下方解码 + drawRegion。
    if ((n6 & SpriteAtlas.flipHorizontalBit) !== 0) {
      n7 = 8192;
    }
    if ((n6 & SpriteAtlas.flipVerticalBit) !== 0) {
      n7 |= 0x4000;
    }
    n7 |= n5;
    let n8 = 0;
    const n9 = this.paletteBaseIndices[n3] << 4;
    const bl = this.rowOffsets[n3] % 2 === 1;
    let n10 = this.widths[n3];
    const bl2 = (n10 - (this.rowOffsets[n3] % 2)) % 2 === 1;
    n10 = (n10 / 2) | 0;
    const n11 = (this.rowOffsets[n3] / 2) | 0;
    if (bl && !bl2) {
      ++n10;
    }
    let n12 = this.startRows[n3];
    while (n12 < this.startRows[n3] + this.heights[n3]) {
      let n13: number;
      if (bl) {
        SpriteAtlas.pixelBuffer[n8] = this.palettes[n4][n9 + (this.packedPixels[n12 * this.bytesPerRow + n11] & 0xf)];
        ++n8;
        n13 = 1;
      } else {
        n13 = 0;
      }
      while (n13 < n10) {
        const by = this.packedPixels[n12 * this.bytesPerRow + n13 + n11];
        SpriteAtlas.pixelBuffer[n8] = this.palettes[n4][n9 + ((by >> 4) & 0xf)];
        SpriteAtlas.pixelBuffer[++n8] = this.palettes[n4][n9 + (by & 0xf)];
        ++n8;
        ++n13;
      }
      if (bl2) {
        SpriteAtlas.pixelBuffer[n8] = this.palettes[n4][n9 + ((this.packedPixels[n12 * this.bytesPerRow + n13 + n11] >> 4) & 0xf)];
        ++n8;
      }
      ++n12;
    }
    if ((n6 & SpriteAtlas.flipHorizontalBit) !== 0) {
      n -= this.widths[n3];
    }
    if ((n6 & SpriteAtlas.flipVerticalBit) !== 0) {
      n2 -= this.heights[n3];
    }
    // 原版：directGraphics.drawPixels(f, true, 0, this.d[n3], n, n2, this.d[n3], this.e[n3], n7, 4444);
    //   偏差：把 f 缓冲(ARGB4444 short)解码为 0xAARRGGBB，建不可变图后用 drawRegion 等价贴出。
    const w = this.widths[n3];
    const h = this.heights[n3];
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
    const transform = SpriteAtlas.manipulationToTransform(n7);
    graphics.drawRegion(image, 0, 0, w, h, transform, n, n2, TOP | LEFT);
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
  static load(n: number): SpriteAtlas | null {
    const i2 = new SpriteAtlas();
    try {
      const inputStream = GameMIDlet.openArchiveEntryStream("/res/t.bin", n)!;
      i2.spriteCount = GameMIDlet.readU16Le(inputStream);
      i2.rowOffsets = new Int16Array(i2.spriteCount);
      i2.startRows = new Int16Array(i2.spriteCount);
      i2.widths = new Int16Array(i2.spriteCount);
      i2.heights = new Int16Array(i2.spriteCount);
      i2.paletteBaseIndices = new Int8Array(i2.spriteCount);
      let n2 = 0;
      while (n2 < i2.spriteCount) {
        i2.paletteBaseIndices[n2] = GameMIDlet.readByte(inputStream);
        i2.rowOffsets[n2] = GameMIDlet.readU16Le(inputStream);
        i2.startRows[n2] = GameMIDlet.readU16Le(inputStream);
        i2.widths[n2] = GameMIDlet.readByte(inputStream);
        if (i2.widths[n2] < 0) {
          const n3 = n2;
          i2.widths[n3] = ((i2.widths[n3] + 256) << 16) >> 16; // (short)
        }
        i2.heights[n2] = GameMIDlet.readByte(inputStream);
        if (i2.heights[n2] < 0) {
          const n4 = n2;
          i2.heights[n4] = ((i2.heights[n4] + 256) << 16) >> 16; // (short)
        }
        ++n2;
      }
      i2.paletteCount = GameMIDlet.readByte(inputStream);
      const by = GameMIDlet.readByte(inputStream);
      i2.palettes = new Array<Int16Array>(i2.paletteCount);
      for (let q = 0; q < i2.paletteCount; ++q) {
        i2.palettes[q] = new Int16Array(by << 4);
      }
      n2 = 0;
      while (n2 < i2.paletteCount) {
        let n5 = 0;
        while (n5 < by << 4) {
          i2.palettes[n2][n5] = GameMIDlet.readU16Le(inputStream);
          ++n5;
        }
        ++n2;
      }
      i2.bytesPerRow = GameMIDlet.readU16Le(inputStream);
      i2.totalRows = GameMIDlet.readU16Le(inputStream);
      i2.bytesPerRow = (i2.bytesPerRow / 2) | 0;
      i2.packedPixels = new Int8Array(i2.bytesPerRow * i2.totalRows);
      inputStream.read(i2.packedPixels);
      inputStream.close();
    } catch (exception) {
      return null;
    }
    return i2;
  }
}
