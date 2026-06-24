/**
 * 游戏2《红魔特种兵2-深海战舰》瓦片地图层 TileMap。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/b.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 职责：解析 m.bin（网格索引）/ p.bin（瓦片调色+碰撞属性）/ b.bin（背景层），
 *   把可视范围内的瓦片增量重绘到一块离屏缓冲（F = Image.createMutable，G = 其 Graphics），
 *   再由 a_G(Graphics) 把缓冲按相机位置 blit 到目标 Graphics。
 *
 * 字段别名（混淆名沿用原版）：
 *   a/b=相机视口宽/高（构造入参）；c/d=相机左上角坐标；
 *   h/i=网格单元覆盖的瓦片数(横/纵)；j/k=网格列/行数；l=网格索引数组(m.bin)；
 *   m=每行碰撞属性表(RLE)；e/f=碰撞采样步长；n/o=瓦片调色板列/行数；p/q=瓦片像素宽/高；
 *   r=前景瓦片图(fpng.bin)；s=前景图每行瓦片数；t=瓦片索引数组(p.bin)；
 *   u/v=背景调色板列/行数；w/x=背景块像素宽/高；y=背景图(bpng.bin)；z=背景图每行块数；
 *   A=背景索引数组(b.bin)；g=图层模式(2=含背景层)；
 *   B/C/D/E=离屏缓冲已绘制区域的左/上/右/下边界（瓦片对齐）；
 *   F=静态离屏缓冲 Image；G=F 的 Graphics。
 *
 * 跨类方法名按契约表（GameMIDlet 字节IO/资源）：
 *   GameMIDlet.a(InputStream)→a_In（读字节）；b(InputStream)→b_In（读短）；
 *   GameMIDlet.b(path,i)→b_SI（定位输入流）；GameMIDlet.a(path,i)→a_SI（预解码 Image）。
 *
 * 必要偏差：
 *   - System.gc()（d() 末尾）删除并注释（规约 §6）。
 *   - Image.createImage(w,h) → Image.createMutable(w,h)（shim 工厂方法）。
 *   - 像素直接用 Image + Graphics.drawImage/setClip 贴图（与原 CFR 源一致，无 DirectGraphics）。
 */
import { Graphics, Image, InputStream } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";

export class TileMap {
  public viewportWidth: number;
  public viewportHeight: number;
  public cameraX: number = 0;
  public cameraY: number = 0;
  private cellTilesX: number = 0;
  private cellTilesY: number = 0;
  private gridCols: number = 0;
  private gridRows: number = 0;
  private gridIndices!: Int8Array;
  private collisionRows!: (Int8Array | null)[];
  public collisionStepX: number = 0;
  public collisionStepY: number = 0;
  private foregroundPaletteWidth: number = 0;
  private foregroundPaletteHeight: number = 0;
  private tileWidth: number = 0;
  private tileHeight: number = 0;
  private foregroundImage: Image | null = null;
  private foregroundTilesPerRow: number = 0;
  private foregroundTileIndices!: Int8Array;
  private backgroundPaletteCols: number = 0;
  private backgroundPaletteRows: number = 0;
  private backgroundBlockWidth: number = 0;
  private backgroundBlockHeight: number = 0;
  private backgroundImage: Image | null = null;
  private backgroundBlocksPerRow: number = 0;
  private backgroundIndices!: Int8Array;
  layerMode: number = 0;
  private drawnLeft: number = 0;
  private drawnTop: number = 0;
  private drawnRight: number = 0;
  private drawnBottom: number = 0;
  private static offscreenBuffer: Image | null = null;
  private static offscreenGraphics: Graphics | null = null;

  constructor(n: number, n2: number) {
    this.viewportWidth = n;
    this.viewportHeight = n2;
  }

  // a(int,int) → a_II
  public setCameraPosition(n: number, n2: number): void {
    this.cameraX = n;
    this.cameraY = n2;
  }

  // a() → a_
  public resetDrawnBounds(): void {
    this.drawnLeft = -1;
    this.drawnTop = -1;
  }

  // b() → b_
  public getMapWidth(): number {
    return this.tileWidth * this.cellTilesX * this.gridCols;
  }

  // c() → c_
  public getMapHeight(): number {
    return this.tileHeight * this.cellTilesY * this.gridRows;
  }

  // a(Graphics) → a_G
  public render(graphics: Graphics): void {
    this.renderViewport(graphics, this.cameraX, this.cameraY, this.viewportWidth, this.viewportHeight);
  }

  // e(int,int) → e_II
  private sampleGridIndex(n: number, n2: number): number {
    let n3 = this.gridIndices[((n2 / (this.cellTilesY * this.tileHeight)) | 0) * this.gridCols + ((n / (this.cellTilesX * this.tileWidth)) | 0)];
    if (n3 < -1) {
      n3 += 256;
    }
    return n3;
  }

  // b(int,int) → b_II
  public sampleCollision(n: number, n2: number): number {
    if (n2 < 0) {
      return 0;
    }
    if (n2 >= this.getMapHeight()) {
      return 0;
    }
    if (n < 0 || n >= this.getMapWidth()) {
      return 0;
    }
    const n3 = this.sampleGridIndex(n, n2);
    if (n3 === -1) {
      return 0;
    }
    n = (((n3 % ((this.foregroundPaletteWidth / this.cellTilesX) | 0)) * this.cellTilesX + ((n / this.tileWidth) | 0) % this.cellTilesX) * this.tileWidth / this.collisionStepX) | 0;
    if (this.collisionRows[(n2 = ((((n3 / ((this.foregroundPaletteWidth / this.cellTilesX) | 0)) | 0) * this.cellTilesY + ((n2 / this.tileHeight) | 0) % this.cellTilesY) * this.tileHeight / this.collisionStepY) | 0)]![0] === 0) {
      return 0;
    }
    let n4 = 0;
    let n5 = 2;
    do {
      n4 += this.collisionRows[n2]![n5 + 1];
      if (this.collisionRows[n2]![n5 + 1] < 0) {
        n4 += 256;
      }
      n5 += 2;
    } while (n4 < n + 1);
    return this.collisionRows[n2]![(n5 -= 2)];
  }

  // c(int,int) → c_II（throws Exception）
  public sampleForegroundTile(n: number, n2: number): number {
    let n3 = -1;
    let n4 = this.sampleGridIndex(n, n2);
    if (n4 !== -1) {
      n = n4 % ((this.foregroundPaletteWidth / this.cellTilesX) | 0) * this.cellTilesX + ((n / this.tileWidth) | 0) % this.cellTilesX;
      n2 = ((n4 / ((this.foregroundPaletteWidth / this.cellTilesX) | 0)) | 0) * this.cellTilesY + ((n2 / this.tileHeight) | 0) % this.cellTilesY;
      n4 = n2 * this.foregroundPaletteWidth + n;
      n3 = this.foregroundTileIndices[n4];
      if (this.foregroundTileIndices[n4] < 0) {
        n3 += 256;
      }
      if (n3 < 0) {
        throw new Error("error index");
      }
    }
    return n3;
  }

  // d(int,int) → d_II（throws Exception）
  public sampleBackgroundTile(n: number, n2: number): number {
    let n3 = 0;
    const n4 = ((n2 %= this.backgroundBlockHeight * this.backgroundPaletteRows) / this.backgroundBlockHeight | 0) * this.backgroundPaletteCols + ((n %= this.backgroundBlockWidth * this.backgroundPaletteCols) / this.backgroundBlockWidth | 0);
    n3 = this.backgroundIndices[n4];
    if (this.backgroundIndices[n4] < 0) {
      n3 += 256;
    }
    if (n3 < 0) {
      throw new Error("error index");
    }
    return n3;
  }

  // f(int,int) → f_II
  private ensureOffscreenBuffer(n: number, n2: number): void {
    if (TileMap.offscreenBuffer == null) {
      const n3 = n % this.tileWidth === 0 ? n + this.tileWidth : n - (n % this.tileWidth) + 2 * this.tileWidth;
      const n4 = n2 % this.tileHeight === 0 ? this.viewportHeight + this.tileHeight : n2 - (n2 % this.tileHeight) + 2 * this.tileHeight;
      TileMap.offscreenBuffer = Image.createMutable(n3 | 0, n4 | 0);
      TileMap.offscreenGraphics = TileMap.offscreenBuffer.getGraphics();
      this.resetDrawnBounds();
    }
  }

  // a(Graphics,int,int,int,int,int,int) → a_GIIIIII
  public drawTileRegion(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number, n6: number): void {
    let n7 = 0;
    let n8 = n2 % n6;
    const n9 = this.getMapWidth();
    const n10 = this.getMapHeight();
    let n11 = n2;
    while (n11 <= n4) {
      let n12 = n % n5;
      let n13 = n;
      while (n13 <= n3) {
        block10: {
          if (this.layerMode === 2) {
            try {
              n7 = this.sampleBackgroundTile(n13, n11);
            } catch (exception) {
              break block10;
            }
            graphics.setClip(n12, n8, this.backgroundBlockWidth, this.backgroundBlockHeight);
            graphics.drawImage(this.backgroundImage!, n12 - (n7 % this.backgroundBlocksPerRow) * this.backgroundBlockWidth, n8 - ((n7 / this.backgroundBlocksPerRow) | 0) * this.backgroundBlockHeight, 20);
          }
          try {
            n7 = this.sampleForegroundTile(n13 % n9, n11 % n10);
          } catch (exception) {
            break block10;
          }
          if (n7 !== -1) {
            graphics.setClip(n12, n8, this.tileWidth, this.tileHeight);
            graphics.drawImage(this.foregroundImage!, n12 - (n7 % this.foregroundTilesPerRow) * this.tileWidth, n8 - ((n7 / this.foregroundTilesPerRow) | 0) * this.tileHeight, 20);
          }
          if ((n12 += this.tileWidth) >= n5) {
            n12 = 0;
          }
        }
        n13 += this.tileWidth;
      }
      if ((n8 += this.tileHeight) >= n6) {
        n8 = 0;
      }
      n11 += this.tileHeight;
    }
  }

  // b(Graphics,int,int,int,int,int,int) → b_GIIIIII
  public blitBufferRegion(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number, n6: number): void {
    graphics.setClip(n5, n6, n3, n4);
    graphics.drawImage(TileMap.offscreenBuffer!, n5 - n, n6 - n2, 20);
  }

  // a(Graphics,int,int,int,int) → a_GIIII
  public renderViewport(graphics: Graphics, n: number, n2: number, n3: number, n4: number): void {
    let n5: number;
    let n6: number;
    const n7 = TileMap.offscreenBuffer!.getWidth();
    const n8 = TileMap.offscreenBuffer!.getHeight();
    TileMap.offscreenGraphics!.setColor(0xffffff);
    const n9 = n - (n % this.tileWidth);
    const n10 = n2 - (n2 % this.tileHeight);
    const n11 = n + n7 - this.tileWidth - ((n + n7 - this.tileWidth) % this.tileWidth);
    const n12 = n2 + n8 - this.tileHeight - ((n2 + n8 - this.tileHeight) % this.tileHeight);
    if (this.drawnLeft < 0) {
      this.drawTileRegion(TileMap.offscreenGraphics!, n9, n10, n11, n12, n7, n8);
      this.drawnLeft = n9;
      this.drawnTop = n10;
      this.drawnRight = n11;
      this.drawnBottom = n12;
    }
    if (this.drawnLeft !== n9) {
      if (this.drawnLeft < n9) {
        n6 = this.drawnRight + this.backgroundBlockWidth;
        n5 = n11;
      } else {
        n6 = n9;
        n5 = this.drawnLeft - this.backgroundBlockWidth;
      }
      this.drawTileRegion(TileMap.offscreenGraphics!, n6, n10, n5, n12, n7, n8);
      this.drawnLeft = n9;
      this.drawnRight = n11;
    }
    if (this.drawnTop !== n10) {
      if (this.drawnTop < n10) {
        n6 = this.drawnBottom + this.backgroundBlockHeight;
        n5 = n12;
      } else {
        n6 = n10;
        n5 = this.drawnTop - this.backgroundBlockHeight;
      }
      this.drawTileRegion(TileMap.offscreenGraphics!, n9, n6, n11, n5, n7, n8);
      this.drawnTop = n10;
      this.drawnBottom = n12;
    }
    const n13 = n % n7;
    const n14 = n2 % n8;
    const n15 = (n + n3) % n7;
    const n16 = (n2 + n4) % n8;
    if (n15 > n13) {
      if (n16 > n14) {
        this.blitBufferRegion(graphics, n13, n14, n3, n4, 0, 0);
      } else {
        this.blitBufferRegion(graphics, n13, n14, n3, n4 - n16, 0, 0);
        this.blitBufferRegion(graphics, n13, 0, n3, n16, 0, n4 - n16);
      }
    } else if (n16 > n14) {
      this.blitBufferRegion(graphics, n13, n14, n3 - n15, n4, 0, 0);
      this.blitBufferRegion(graphics, 0, n14, n15, n4, n3 - n15, 0);
    } else {
      this.blitBufferRegion(graphics, n13, n14, n3 - n15, n4 - n16, 0, 0);
      this.blitBufferRegion(graphics, n13, 0, n3 - n15, n16, 0, n4 - n16);
      this.blitBufferRegion(graphics, 0, n14, n15, n4 - n16, n3 - n15, 0);
      this.blitBufferRegion(graphics, 0, 0, n15, n16, n3 - n15, n4 - n16);
    }
    graphics.setClip(0, 0, n3, n4);
  }

  // d() → d_
  public dispose(): void {
    let n = 0;
    while (n < this.collisionRows.length) {
      this.collisionRows[n] = null;
      ++n;
    }
    this.collisionRows = null as unknown as (Int8Array | null)[];
    this.gridIndices = null as unknown as Int8Array;
    this.backgroundIndices = null as unknown as Int8Array;
    this.backgroundImage = null;
    this.foregroundTileIndices = null as unknown as Int8Array;
    this.foregroundImage = null;
    // System.gc();
  }

  // a(int,int,int) → a_III
  public load(n: number, n2: number, n3: number): void {
    try {
      let inputStream: InputStream = GameMIDlet.openEntryStream("/res/m.bin", n)!;
      if (GameMIDlet.readByte(inputStream) !== 1) {
        return;
      }
      let by = GameMIDlet.readByte(inputStream);
      this.cellTilesX = GameMIDlet.readByte(inputStream);
      this.cellTilesY = GameMIDlet.readByte(inputStream);
      this.gridCols = GameMIDlet.readShortLE(inputStream);
      this.gridRows = GameMIDlet.readShortLE(inputStream);
      this.gridIndices = new Int8Array(this.gridCols * this.gridRows);
      inputStream.read(this.gridIndices);
      inputStream.close();
      inputStream = GameMIDlet.openEntryStream("/res/p.bin", by)!;
      if (GameMIDlet.readByte(inputStream) !== 0) {
        return;
      }
      by = GameMIDlet.readByte(inputStream);
      this.foregroundPaletteWidth = GameMIDlet.readShortLE(inputStream);
      this.foregroundPaletteHeight = GameMIDlet.readShortLE(inputStream);
      this.tileWidth = GameMIDlet.readByte(inputStream);
      this.tileHeight = GameMIDlet.readByte(inputStream);
      this.foregroundTileIndices = new Int8Array(this.foregroundPaletteWidth * this.foregroundPaletteHeight);
      inputStream.read(this.foregroundTileIndices);
      this.collisionStepX = GameMIDlet.readByte(inputStream);
      this.collisionStepY = GameMIDlet.readByte(inputStream);
      const n4 = (this.tileWidth * this.foregroundPaletteWidth / this.collisionStepX) | 0;
      const n5 = (this.tileHeight * this.foregroundPaletteHeight / this.collisionStepY) | 0;
      this.collisionRows = new Array<Int8Array | null>(n5);
      let n6 = 0;
      while (n6 < n5) {
        const by2 = GameMIDlet.readByte(inputStream);
        if (by2 === 0) {
          this.collisionRows[n6] = new Int8Array(1);
          this.collisionRows[n6]![0] = 0;
        } else if (by2 === 1) {
          this.collisionRows[n6] = new Int8Array(1 + n4);
          // 原 inputStream.read(this.m[n6], 1, n4)：读 n4 字节填入下标 1 起。
          // 偏差：shim InputStream.read 仅支持单参（从 0 起填满 buf），
          //   故按 Java read(byte[],off,len) 语义用临时缓冲读取再拷入偏移处（字节一致）。
          {
            const __tmp = new Int8Array(n4);
            inputStream.read(__tmp);
            this.collisionRows[n6]!.set(__tmp, 1);
          }
          this.collisionRows[n6]![0] = 1;
        } else {
          let n7 = GameMIDlet.readByte(inputStream);
          if (n7 < 0) {
            n7 += 256;
          }
          this.collisionRows[n6] = new Int8Array(2 + 2 * n7);
          // 原 inputStream.read(this.m[n6], 2, 2*n7)：读 2*n7 字节填入下标 2 起（同上偏差）。
          {
            const __tmp = new Int8Array(2 * n7);
            inputStream.read(__tmp);
            this.collisionRows[n6]!.set(__tmp, 2);
          }
          this.collisionRows[n6]![0] = 2;
        }
        ++n6;
      }
      inputStream.close();
      this.foregroundImage = GameMIDlet.loadImage("/res/fpng.bin", by | 0);
      this.foregroundTilesPerRow = (this.foregroundImage.getWidth() / this.tileWidth) | 0;
      this.layerMode = n3;
      if (this.layerMode === 2) {
        inputStream = GameMIDlet.openEntryStream("/res/b.bin", n2)!;
        GameMIDlet.readByte(inputStream);
        GameMIDlet.readByte(inputStream);
        this.backgroundPaletteCols = GameMIDlet.readShortLE(inputStream);
        this.backgroundPaletteRows = GameMIDlet.readShortLE(inputStream);
        this.backgroundBlockWidth = GameMIDlet.readByte(inputStream);
        this.backgroundBlockHeight = GameMIDlet.readByte(inputStream);
        this.backgroundIndices = new Int8Array(this.backgroundPaletteCols * this.backgroundPaletteRows);
        inputStream.read(this.backgroundIndices);
        inputStream.close();
        this.backgroundImage = GameMIDlet.loadImage("/res/bpng.bin", 0);
        this.backgroundBlocksPerRow = (this.backgroundImage.getWidth() / this.backgroundBlockWidth) | 0;
      }
      this.ensureOffscreenBuffer(this.viewportWidth, this.viewportHeight);
      return;
    } catch (exception) {
      return;
    }
  }
}
