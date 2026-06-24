/**
 * 游戏1《红魔特种兵》瓦片地图引擎（tjge.b）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/b.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 职责：解析 f.bin（地图头 + RLE 行数据）并绘制瓦片地图；维护离屏缓冲 u
 * 做增量滚动重绘（仅重绘进入视口的新行/列）。地图瓦片图集 t 来自
 * image.bin[atlasId + 4]（经 tjge.a.f_I 取预解码图）。
 *
 * 字段别名（逐字对应 CFR 源）：
 *   a,b=视口宽/高(像素)  d=各列 RLE 数据(byte[列][])  e,f=地图列数/行数(瓦片)
 *   g,h=瓦片宽/高(像素)  i=缩放分母(固定1)  j,k=当前视口左上角坐标
 *   l,m=地图宽/高(瓦片)  n,o=瓦片宽/高(像素)  p,q=分块列/行数
 *   r=图集每行瓦片数  s=分块索引表(byte[])
 *   t=瓦片图集(静态)  c=当前已加载图集id(静态)  u=离屏缓冲(静态)
 *   v,w=离屏缓冲宽/高(静态)  x=离屏缓冲 Graphics(静态)
 *   y,z=离屏已绘制窗口左上(瓦片对齐)  A,B=离屏已绘制窗口右下(瓦片对齐)
 *
 * 方法名映射（契约）：
 *   constructor(int,int)  a_II(int,int)  a_()  b_()  a_G(Graphics)
 *   a_IIZ(int,int,boolean)  b_II(int,int)  c_()  a_ZII(boolean,int,int)
 *   a_GIIIIII(Graphics,...)  b_GIIIIII(Graphics,...)  a_GIIII(Graphics,...)
 *   d_()  a_III(int,int,int)[static]  a_I(int)  c_II(int,int)
 */
import { Graphics, Image, InputStream } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameScreen } from "./GameScreen.ts";

export class TileMap {
  public viewportWidth: number;
  public viewportHeight: number;
  private columnRleData!: (Int8Array | null)[];
  private mapColumns: number = 0;
  private mapRows: number = 0;
  private tileWidthPx: number = 0;
  private tileHeightPx: number = 0;
  private scaleDivisor: number;
  private viewportOriginX: number = 0;
  private viewportOriginY: number = 0;
  private mapTileWidth: number = 0;
  private mapTileHeight: number = 0;
  private tileWidth: number = 0;
  private tileHeight: number = 0;
  private blockColumns: number = 0;
  private blockRows: number = 0;
  private atlasTilesPerRow: number = 0;
  private blockIndexTable!: Int8Array;
  private static atlasImage: Image | null;
  static loadedAtlasId: number;
  private static offscreenBuffer: Image | null;
  private static offscreenWidth: number;
  private static offscreenHeight: number;
  private static offscreenGraphics: Graphics;
  private bufferDrawnLeft: number = 0;
  private bufferDrawnTop: number = 0;
  private bufferDrawnRight: number = 0;
  private bufferDrawnBottom: number = 0;

  private constructor(n: number, n2: number) {
    this.viewportWidth = n;
    this.viewportHeight = n2;
    this.scaleDivisor = 1;
  }

  public setViewportOrigin(n: number, n2: number): void {
    this.viewportOriginX = (n / this.scaleDivisor) | 0;
    this.viewportOriginY = (n2 / this.scaleDivisor) | 0;
  }

  public getPixelWidth(): number {
    return this.tileWidthPx * this.mapColumns;
  }

  public getPixelHeight(): number {
    return this.tileHeightPx * this.mapRows;
  }

  public draw(graphics: Graphics): void {
    this.drawViewport(graphics, this.viewportOriginX, this.viewportOriginY, this.viewportWidth, this.viewportHeight);
  }

  public queryColumnTileAt(n: number, n2: number, bl: boolean): number {
    if (n2 < 0) {
      return 0;
    }
    if (n2 >= this.columnRleData.length) {
      return 3;
    }
    if (n < 0 || n >= ((this.tileWidthPx * this.mapColumns / 16) | 0)) {
      if (bl) {
        return 1;
      }
      return 0;
    }
    if (this.columnRleData[n2]![0] === 0) {
      return 0;
    }
    try {
      let n3 = 0;
      let n4 = 2;
      do {
        n3 += this.columnRleData[n2]![n4 + 1];
        if (this.columnRleData[n2]![n4 + 1] < 0) {
          n3 += 256;
        }
        n4 += 2;
      } while (n3 < n + 1);
      return this.columnRleData[n2]![(n4 -= 2)];
    } catch (exception) {
      return 1;
    }
  }

  protected resolveTileIndex(n: number, n2: number): number {
    // Java: throws Exception —— 异常通过 TS throw 传播。
    let n3 = 0;
    const n4 = (((n2 %= this.tileHeight * this.mapTileHeight) / this.tileHeight) | 0) * this.mapTileWidth + (((n %= this.tileWidth * this.mapTileWidth) / this.tileWidth) | 0);
    n3 = this.blockIndexTable[n4];
    if (this.blockIndexTable[n4] < 0) {
      n3 += 256;
    }
    if (n3 < 0) {
      throw new Error("error index");
    }
    return n3;
  }

  public invalidateBuffer(): void {
    this.bufferDrawnLeft = -1;
    this.bufferDrawnTop = -1;
  }

  private setupOffscreenBuffer(bl: boolean, n: number, n2: number): void {
    if (bl) {
      if (TileMap.offscreenBuffer == null) {
        const n3 = n % this.tileWidth === 0 ? n + this.tileWidth : n - (n % this.tileWidth) + 2 * this.tileWidth;
        const n4 = n2 % this.tileHeight === 0 ? this.viewportHeight + this.tileHeight : n2 - (n2 % this.tileHeight) + 2 * this.tileHeight;
        // Image.createImage(int,int)（可变离屏图）→ Image.createMutable(w,h)。
        TileMap.offscreenBuffer = Image.createMutable(n3, n4);
        TileMap.offscreenWidth = TileMap.offscreenBuffer.getWidth();
        TileMap.offscreenHeight = TileMap.offscreenBuffer.getHeight();
        TileMap.offscreenGraphics = TileMap.offscreenBuffer.getGraphics();
      }
      this.invalidateBuffer();
      return;
    }
    TileMap.offscreenBuffer = null;
  }

  protected renderTileRegion(
    graphics: Graphics,
    n: number,
    n2: number,
    n3: number,
    n4: number,
    n5: number,
    n6: number,
  ): void {
    let n7 = n2 % n6;
    let n8 = n2;
    while (n8 <= n4) {
      let n9 = n % n5;
      let n10 = n;
      while (n10 <= n3) {
        block6: {
          let n11: number;
          try {
            n11 = this.resolveTileIndex(n10, n8);
          } catch (exception) {
            break block6;
          }
          graphics.setClip(n9, n7, this.tileWidth, this.tileHeight);
          graphics.drawImage(TileMap.atlasImage!, n9 - (n11 % this.atlasTilesPerRow) * this.tileWidth, n7 - ((n11 / this.atlasTilesPerRow) | 0) * this.tileHeight, 20);
          if ((n9 += this.tileWidth) >= n5) {
            n9 = 0;
          }
        }
        n10 += this.tileWidth;
      }
      if ((n7 += this.tileHeight) >= n6) {
        n7 = 0;
      }
      n8 += this.tileHeight;
    }
  }

  protected blitBufferRegion(
    graphics: Graphics,
    n: number,
    n2: number,
    n3: number,
    n4: number,
    n5: number,
    n6: number,
  ): void {
    graphics.setClip(n5, n6, n3, n4);
    graphics.drawImage(TileMap.offscreenBuffer!, n5 - n, n6 - n2, 20);
  }

  protected drawViewport(graphics: Graphics, n: number, n2: number, n3: number, n4: number): void {
    let n5: number;
    let n6: number;
    const n7 = n - (n % this.tileWidth);
    const n8 = n2 - (n2 % this.tileHeight);
    const n9 = n + TileMap.offscreenWidth - this.tileWidth - ((n + TileMap.offscreenWidth - this.tileWidth) % this.tileWidth);
    const n10 = n2 + TileMap.offscreenHeight - this.tileHeight - ((n2 + TileMap.offscreenHeight - this.tileHeight) % this.tileHeight);
    if (this.bufferDrawnLeft < 0) {
      this.renderTileRegion(TileMap.offscreenGraphics, n7, n8, n9, n10, TileMap.offscreenWidth, TileMap.offscreenHeight);
      this.bufferDrawnLeft = n7;
      this.bufferDrawnTop = n8;
      this.bufferDrawnRight = n9;
      this.bufferDrawnBottom = n10;
    }
    if (this.bufferDrawnLeft !== n7) {
      if (this.bufferDrawnLeft < n7) {
        n6 = this.bufferDrawnRight + this.tileWidth;
        n5 = n9;
      } else {
        n6 = n7;
        n5 = this.bufferDrawnLeft - this.tileWidth;
      }
      this.renderTileRegion(TileMap.offscreenGraphics, n6, n8, n5, n10, TileMap.offscreenWidth, TileMap.offscreenHeight);
      this.bufferDrawnLeft = n7;
      this.bufferDrawnRight = n9;
    }
    if (this.bufferDrawnTop !== n8) {
      if (this.bufferDrawnTop < n8) {
        n6 = this.bufferDrawnBottom + this.tileHeight;
        n5 = n10;
      } else {
        n6 = n8;
        n5 = this.bufferDrawnTop - this.tileHeight;
      }
      this.renderTileRegion(TileMap.offscreenGraphics, n7, n6, n9, n5, TileMap.offscreenWidth, TileMap.offscreenHeight);
      this.bufferDrawnTop = n8;
      this.bufferDrawnBottom = n10;
    }
    const n11 = n % TileMap.offscreenWidth;
    const n12 = n2 % TileMap.offscreenHeight;
    const n13 = (n + n3) % TileMap.offscreenWidth;
    const n14 = (n2 + n4) % TileMap.offscreenHeight;
    if (n13 > n11) {
      if (n14 > n12) {
        this.blitBufferRegion(graphics, n11, n12, n3, n4, 0, 0);
      } else {
        this.blitBufferRegion(graphics, n11, n12, n3, n4 - n14, 0, 0);
        this.blitBufferRegion(graphics, n11, 0, n3, n14, 0, n4 - n14);
      }
    } else if (n14 > n12) {
      this.blitBufferRegion(graphics, n11, n12, n3 - n13, n4, 0, 0);
      this.blitBufferRegion(graphics, 0, n12, n13, n4, n3 - n13, 0);
    } else {
      this.blitBufferRegion(graphics, n11, n12, n3 - n13, n4 - n14, 0, 0);
      this.blitBufferRegion(graphics, n11, 0, n3 - n13, n14, 0, n4 - n14);
      this.blitBufferRegion(graphics, 0, n12, n13, n4 - n14, n3 - n13, 0);
      this.blitBufferRegion(graphics, 0, 0, n13, n14, n3 - n13, n4 - n14);
    }
    graphics.setClip(0, 0, n3, n4);
  }

  public dispose(): void {
    let n = 0;
    while (n < this.columnRleData.length) {
      this.columnRleData[n] = null;
      ++n;
    }
    (this.columnRleData as unknown) = null;
    (this.blockIndexTable as unknown) = null;
  }

  public static loadFromBin(n: number, n2: number, n3: number): TileMap | null {
    let b2: TileMap;
    try {
      b2 = new TileMap(GameScreen.screenWidth, GameScreen.playHeight);
      const inputStream: InputStream = GameMIDlet.openArchiveEntryStream("/res/f.bin", n)!;
      const by = GameMIDlet.readByte(inputStream);
      b2.mapTileWidth = GameMIDlet.readU16Le(inputStream);
      b2.mapTileHeight = GameMIDlet.readU16Le(inputStream);
      b2.tileWidth = GameMIDlet.readByte(inputStream);
      b2.tileHeight = GameMIDlet.readByte(inputStream);
      b2.blockColumns = GameMIDlet.readByte(inputStream);
      b2.blockRows = GameMIDlet.readByte(inputStream);
      b2.blockIndexTable = new Int8Array(b2.mapTileWidth * b2.mapTileHeight);
      inputStream.read(b2.blockIndexTable);
      if (TileMap.loadedAtlasId !== by) {
        TileMap.atlasImage = null;
        // tjge.a.f(int)（image.bin 加载）→ a.f_I 内部返回 getCachedImage（已预解码）。
        TileMap.atlasImage = GameScreen.loadImageFromBin(by + 4);
      }
      TileMap.loadedAtlasId = by;
      b2.atlasTilesPerRow = (TileMap.atlasImage!.getWidth() / b2.tileWidth) | 0;
      // n4/n5 为局部量，与原版一致（n4 未在后续使用，仅 n5 用于分配 d）。
      const n4 = (b2.tileWidth * b2.mapTileWidth / b2.blockColumns) | 0;
      const n5 = (b2.tileHeight * b2.mapTileHeight / b2.blockRows) | 0;
      b2.mapColumns = b2.mapTileWidth;
      b2.mapRows = b2.mapTileHeight;
      b2.tileWidthPx = b2.tileWidth;
      b2.tileHeightPx = b2.tileHeight;
      b2.columnRleData = new Array<Int8Array | null>(n5).fill(null);
      let n6 = 0;
      while (n6 < n5) {
        const by2 = GameMIDlet.readByte(inputStream);
        if (by2 === 0) {
          b2.columnRleData[n6] = new Int8Array(1);
          b2.columnRleData[n6]![0] = 0;
        } else if (by2 === 1) {
          b2.columnRleData[n6] = new Int8Array(1 + n4);
          // read(byte[],off,len)：从 off=1 读 n4 字节。
          TileMap.readInto(inputStream, b2.columnRleData[n6]!, 1, n4);
          b2.columnRleData[n6]![0] = 1;
        } else {
          let n7 = GameMIDlet.readByte(inputStream);
          if (n7 < 0) {
            n7 += 256;
          }
          b2.columnRleData[n6] = new Int8Array(2 + 2 * n7);
          TileMap.readInto(inputStream, b2.columnRleData[n6]!, 2, 2 * n7);
          b2.columnRleData[n6]![0] = 2;
        }
        ++n6;
      }
      inputStream.close();
      b2.setupOffscreenBuffer(true, GameScreen.screenWidth, GameScreen.playHeight);
    } catch (exception) {
      return null;
    }
    return b2;
  }

  public reloadColumnData(n: number): void {
    try {
      const inputStream: InputStream = GameMIDlet.openArchiveEntryStream("/res/f.bin", n)!;
      const n2 = (this.tileHeight * this.mapTileHeight / this.blockRows) | 0;
      const n3 = (this.tileWidth * this.mapTileWidth / this.blockColumns) | 0;
      inputStream.skip(9 + this.mapTileWidth * this.mapTileHeight);
      let n4 = 0;
      while (n4 < n2) {
        const by = GameMIDlet.readByte(inputStream);
        if (by === 0) {
          this.columnRleData[n4]![0] = 0;
        } else if (by === 1) {
          // read(byte[],off,len)：从 off=1 读 n3 字节。
          TileMap.readInto(inputStream, this.columnRleData[n4]!, 1, n3);
          this.columnRleData[n4]![0] = 1;
        } else {
          let n5 = GameMIDlet.readByte(inputStream);
          if (n5 < 0) {
            n5 += 256;
          }
          TileMap.readInto(inputStream, this.columnRleData[n4]!, 2, 2 * n5);
          this.columnRleData[n4]![0] = 2;
        }
        ++n4;
      }
      inputStream.close();
      return;
    } catch (exception) {
      return;
    }
  }

  public clearTileAt(n: number, n2: number): boolean {
    if (n2 < 0) {
      return false;
    }
    if (n2 >= this.columnRleData.length) {
      return false;
    }
    if (n < 0 || n >= ((this.tileWidthPx * this.mapColumns / 16) | 0)) {
      return false;
    }
    if (this.columnRleData[n2]![0] === 0) {
      return false;
    }
    try {
      let n3 = 0;
      let n4 = 2;
      do {
        n3 += this.columnRleData[n2]![n4 + 1];
        if (this.columnRleData[n2]![n4 + 1] < 0) {
          n3 += 256;
        }
        n4 += 2;
      } while (n3 < n + 1);
      this.columnRleData[n2]![(n4 -= 2)] = 0;
      return true;
    } catch (exception) {
      return false;
    }
  }

  /**
   * 偏差：shim 的 InputStream.read 仅支持 read(buf) 单参形式，Java 源使用
   * read(byte[],off,len)。此处用临时缓冲读取 len 字节再拷入目标偏移，
   * 字节语义（有符号 Int8）与原版一致。
   */
  private static readInto(inputStream: InputStream, dst: Int8Array, off: number, len: number): void {
    const tmp = new Int8Array(len);
    inputStream.read(tmp);
    dst.set(tmp, off);
  }

  static {
    // static { c = -1; }；其余静态引用字段（t/u/v/w/x）由 JS 默认初始化为 undefined，
    // 与原版按需赋值前不被读取的行为一致。
    TileMap.atlasImage = null;
    TileMap.offscreenBuffer = null;
    TileMap.offscreenWidth = 0;
    TileMap.offscreenHeight = 0;
    TileMap.loadedAtlasId = -1;
  }
}
