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

  /**
   * 私有构造器（CFR b.java:49 `private b(int,int)`）。仅供工厂 {@link loadFromBin}
   * 内部调用：记录视口像素宽高 a/b，并把缩放分母 i 固定为 1。
   * 实际地图数据由 {@link loadFromBin} 解析 f.bin 后逐字段填入。
   * @param n  视口宽（像素，对应 a）
   * @param n2 视口高（像素，对应 b）
   */
  private constructor(n: number, n2: number) {
    this.viewportWidth = n;
    this.viewportHeight = n2;
    this.scaleDivisor = 1;
  }

  /**
   * 设置当前视口左上角（相机位置）。传入像素坐标除以缩放分母 i（固定 1）后
   * 存入 j/k，供 {@link draw} 滚动重绘使用。CFR b.java:56 `a(int,int)`。
   * @param n  视口左上角 X（像素）
   * @param n2 视口左上角 Y（像素）
   */
  public setViewportOrigin(cameraX: number, cameraY: number): void {
    this.viewportOriginX = (cameraX / this.scaleDivisor) | 0;
    this.viewportOriginY = (cameraY / this.scaleDivisor) | 0;
  }

  /** 地图总像素宽 = 瓦片像素宽 g × 地图列数 e。CFR b.java:62 `a()`。 */
  public getPixelWidth(): number {
    return this.tileWidthPx * this.mapColumns;
  }

  /** 地图总像素高 = 瓦片像素高 h × 地图行数 f。CFR b.java:67 `b()`。 */
  public getPixelHeight(): number {
    return this.tileHeightPx * this.mapRows;
  }

  /**
   * 按当前视口原点 j/k 绘制整张地图。委托 {@link drawViewport} 用离屏缓冲做
   * 增量滚动重绘。每帧渲染时由 GameScreen 调用。CFR b.java:72 `a(Graphics)`。
   */
  public draw(graphics: Graphics): void {
    this.drawViewport(graphics, this.viewportOriginX, this.viewportOriginY, this.viewportWidth, this.viewportHeight);
  }

  /**
   * 核心碰撞查询：返回某列 RLE 数据在指定单元格处的瓦片/碰撞类型。
   * 返回 0=空 / 1=实心 / 2=可爬 / 3=越出地图行数（边界）。CFR b.java:77 `a(int,int,boolean)`。
   *
   * 通过 RLE 段 `[type,count]...` 逐段累加 count，定位到包含 n+1 的段后取其 type。
   * 行类型为 0（全空）直接返回 0；解析异常时返回 1（按实心处理，防穿）。
   * @param cellIndex  列内单元格索引（横向；越界且 solidOob=true 时返回 1，否则 0）
   * @param columnIndex 列索引（纵向；<0 返回 0，超出数据行数返回 3）
   * @param solidOob 越界是否按实心处理（玩家碰撞传 true，使地图外为实心墙）
   */
  public queryColumnTileAt(cellIndex: number, columnIndex: number, solidOob: boolean): number {
    if (columnIndex < 0) {
      return 0;
    }
    if (columnIndex >= this.columnRleData.length) {
      return 3;
    }
    if (cellIndex < 0 || cellIndex >= ((this.tileWidthPx * this.mapColumns / 16) | 0)) {
      if (solidOob) {
        return 1;
      }
      return 0;
    }
    if (this.columnRleData[columnIndex]![0] === 0) {
      return 0;
    }
    try {
      return this.columnRleData[columnIndex]![this.rleScanToCell(columnIndex, cellIndex)];
    } catch (exception) {
      return 1;
    }
  }

  /**
   * RLE 段扫描（{@link queryColumnTileAt} 与 {@link clearTileAt} 的逐字重复段）。
   * 列数据 `columnRleData[columnIndex]` 为 `[flag, type0,count0, type1,count1, ...]`：
   * 首字节 [0] 是行类型标志，正式段从下标 2 起。逐段累加 count（负字节 +256 还原为
   * 无符号），直到累计长度覆盖 cellIndex+1，返回命中段的 type 字节下标。
   * 与原版一致，段访问异常（越界等）向上抛，由两个调用方各自的 try/catch 承接
   * （返回值不同：查询=1、清除=false），故 try/catch 不并入本 helper。
   * CFR b.java:85-95（a_IIZ）/ 344-354（c_II）逐字重复段。
   * @param columnIndex 列索引（调用方已保证 columnRleData[columnIndex] 非空且 [0]!==0）
   * @param cellIndex   列内单元格索引（横向）
   * @returns 命中段的 type 字节下标（原版 `n4 -= 2` 后的游标值）
   */
  private rleScanToCell(columnIndex: number, cellIndex: number): number {
    let runLength = 0;
    let segCursor = 2;
    do {
      runLength += this.columnRleData[columnIndex]![segCursor + 1];
      if (this.columnRleData[columnIndex]![segCursor + 1] < 0) {
        runLength += 256;
      }
      segCursor += 2;
    } while (runLength < cellIndex + 1);
    return segCursor - 2;
  }

  protected resolveTileIndex(pixelX: number, pixelY: number): number {
    // Java: throws Exception —— 异常通过 TS throw 传播。
    let cellIndex = 0;
    const blockIndex = (((pixelY %= this.tileHeight * this.mapTileHeight) / this.tileHeight) | 0) * this.mapTileWidth + (((pixelX %= this.tileWidth * this.mapTileWidth) / this.tileWidth) | 0);
    cellIndex = this.blockIndexTable[blockIndex];
    if (this.blockIndexTable[blockIndex] < 0) {
      cellIndex += 256;
    }
    if (cellIndex < 0) {
      throw new Error("error index");
    }
    return cellIndex;
  }

  /**
   * 作废离屏缓冲已绘区域记录（置 y/z = -1），强制下一次 {@link draw} 全量重绘整块缓冲。
   * 切换关卡或地图块、相机大幅跳变后调用。CFR b.java:125 `c()`。
   */
  public invalidateBuffer(): void {
    this.bufferDrawnLeft = -1;
    this.bufferDrawnTop = -1;
  }

  private setupOffscreenBuffer(create: boolean, width: number, height: number): void {
    if (create) {
      if (TileMap.offscreenBuffer == null) {
        const bufWidth = width % this.tileWidth === 0 ? width + this.tileWidth : width - (width % this.tileWidth) + 2 * this.tileWidth;
        const bufHeight = height % this.tileHeight === 0 ? this.viewportHeight + this.tileHeight : height - (height % this.tileHeight) + 2 * this.tileHeight;
        // Image.createImage(int,int)（可变离屏图）→ Image.createMutable(w,h)。
        TileMap.offscreenBuffer = Image.createMutable(bufWidth, bufHeight);
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
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    wrapW: number,
    wrapH: number,
  ): void {
    let bufY = y0 % wrapH;
    let tileY = y0;
    while (tileY <= y1) {
      let bufX = x0 % wrapW;
      let tileX = x0;
      while (tileX <= x1) {
        block6: {
          let cell: number;
          try {
            cell = this.resolveTileIndex(tileX, tileY);
          } catch (exception) {
            break block6;
          }
          graphics.setClip(bufX, bufY, this.tileWidth, this.tileHeight);
          graphics.drawImage(TileMap.atlasImage!, bufX - (cell % this.atlasTilesPerRow) * this.tileWidth, bufY - ((cell / this.atlasTilesPerRow) | 0) * this.tileHeight, 20);
          if ((bufX += this.tileWidth) >= wrapW) {
            bufX = 0;
          }
        }
        tileX += this.tileWidth;
      }
      if ((bufY += this.tileHeight) >= wrapH) {
        bufY = 0;
      }
      tileY += this.tileHeight;
    }
  }

  protected blitBufferRegion(
    graphics: Graphics,
    srcX: number,
    srcY: number,
    blockW: number,
    blockH: number,
    dstX: number,
    dstY: number,
  ): void {
    graphics.setClip(dstX, dstY, blockW, blockH);
    graphics.drawImage(TileMap.offscreenBuffer!, dstX - srcX, dstY - srcY, 20);
  }

  /**
   * 滚动地图增量渲染核心（CFR b.java:185 `a(Graphics,int,int,int,int)`）。
   * 思路：用环绕（toroidal）离屏缓冲 u 缓存当前视口附近的瓦片；当视口移动越过
   * 瓦片边界时，仅用 {@link renderTileRegion} 重绘进入缓冲的新行/列（y/z/A/B 跟踪
   * 已绘窗口），再用 {@link blitBufferRegion} 把缓冲按取模坐标分块拷到屏幕。
   * 缓冲首次或失效（y<0）时全量重绘。二开若改地图滚动/相机务必理解此处。
   * @param cameraX  视口左上角 X（像素）  @param cameraY 视口左上角 Y（像素）
   * @param viewW 视口宽（像素）        @param viewH 视口高（像素）
   */
  protected drawViewport(graphics: Graphics, cameraX: number, cameraY: number, viewW: number, viewH: number): void {
    let stripEnd: number;
    let stripStart: number;
    const alignedLeft = cameraX - (cameraX % this.tileWidth);
    const alignedTop = cameraY - (cameraY % this.tileHeight);
    const alignedRight = cameraX + TileMap.offscreenWidth - this.tileWidth - ((cameraX + TileMap.offscreenWidth - this.tileWidth) % this.tileWidth);
    const alignedBottom = cameraY + TileMap.offscreenHeight - this.tileHeight - ((cameraY + TileMap.offscreenHeight - this.tileHeight) % this.tileHeight);
    if (this.bufferDrawnLeft < 0) {
      this.renderTileRegion(TileMap.offscreenGraphics, alignedLeft, alignedTop, alignedRight, alignedBottom, TileMap.offscreenWidth, TileMap.offscreenHeight);
      this.bufferDrawnLeft = alignedLeft;
      this.bufferDrawnTop = alignedTop;
      this.bufferDrawnRight = alignedRight;
      this.bufferDrawnBottom = alignedBottom;
    }
    if (this.bufferDrawnLeft !== alignedLeft) {
      if (this.bufferDrawnLeft < alignedLeft) {
        stripStart = this.bufferDrawnRight + this.tileWidth;
        stripEnd = alignedRight;
      } else {
        stripStart = alignedLeft;
        stripEnd = this.bufferDrawnLeft - this.tileWidth;
      }
      this.renderTileRegion(TileMap.offscreenGraphics, stripStart, alignedTop, stripEnd, alignedBottom, TileMap.offscreenWidth, TileMap.offscreenHeight);
      this.bufferDrawnLeft = alignedLeft;
      this.bufferDrawnRight = alignedRight;
    }
    if (this.bufferDrawnTop !== alignedTop) {
      if (this.bufferDrawnTop < alignedTop) {
        stripStart = this.bufferDrawnBottom + this.tileHeight;
        stripEnd = alignedBottom;
      } else {
        stripStart = alignedTop;
        stripEnd = this.bufferDrawnTop - this.tileHeight;
      }
      this.renderTileRegion(TileMap.offscreenGraphics, alignedLeft, stripStart, alignedRight, stripEnd, TileMap.offscreenWidth, TileMap.offscreenHeight);
      this.bufferDrawnTop = alignedTop;
      this.bufferDrawnBottom = alignedBottom;
    }
    const sampleX = cameraX % TileMap.offscreenWidth;
    const sampleY = cameraY % TileMap.offscreenHeight;
    const sampleEndX = (cameraX + viewW) % TileMap.offscreenWidth;
    const sampleEndY = (cameraY + viewH) % TileMap.offscreenHeight;
    if (sampleEndX > sampleX) {
      if (sampleEndY > sampleY) {
        this.blitBufferRegion(graphics, sampleX, sampleY, viewW, viewH, 0, 0);
      } else {
        this.blitBufferRegion(graphics, sampleX, sampleY, viewW, viewH - sampleEndY, 0, 0);
        this.blitBufferRegion(graphics, sampleX, 0, viewW, sampleEndY, 0, viewH - sampleEndY);
      }
    } else if (sampleEndY > sampleY) {
      this.blitBufferRegion(graphics, sampleX, sampleY, viewW - sampleEndX, viewH, 0, 0);
      this.blitBufferRegion(graphics, 0, sampleY, sampleEndX, viewH, viewW - sampleEndX, 0);
    } else {
      this.blitBufferRegion(graphics, sampleX, sampleY, viewW - sampleEndX, viewH - sampleEndY, 0, 0);
      this.blitBufferRegion(graphics, sampleX, 0, viewW - sampleEndX, sampleEndY, 0, viewH - sampleEndY);
      this.blitBufferRegion(graphics, 0, sampleY, sampleEndX, viewH - sampleEndY, viewW - sampleEndX, 0);
      this.blitBufferRegion(graphics, 0, 0, sampleEndX, sampleEndY, viewW - sampleEndX, viewH - sampleEndY);
    }
    graphics.setClip(0, 0, viewW, viewH);
  }

  /**
   * 释放本地图实例的堆数据：逐项清空列 RLE 数据 d，再把 d 与块索引表 s 置 null。
   * 不释放静态共享资源（图集 t、离屏缓冲 u）。CFR b.java:247 `d()`。
   */
  public dispose(): void {
    let i = 0;
    while (i < this.columnRleData.length) {
      this.columnRleData[i] = null;
      ++i;
    }
    (this.columnRleData as unknown) = null;
    (this.blockIndexTable as unknown) = null;
  }

  /**
   * 工厂方法 / 关卡地图加载入口（CFR b.java:258 `a(int,int,int)`）。
   * 打开 f.bin 第 n 条目，解析头部（图集 id、地图瓦片宽高 l/m、瓦片像素宽高 n/o、
   * 块列/行数 p/q）→ 读块索引表 s → 按 id 懒加载共享瓦片图集 t（image.bin[id+4]）→
   * 逐行读列 RLE 数据 d（0=空 / 1=连续 n4 字节 / 2=RLE 段）→ 分配离屏缓冲 u。
   * 任一步抛异常则整体返回 null。视口尺寸取 GameScreen.screenWidth × playHeight。
   * @param entryIndex  f.bin 条目索引（关卡/地图编号）
   * @param reservedB 与原版一致的占位参数（在本方法体内未使用）
   * @param reservedC 与原版一致的占位参数（在本方法体内未使用）
   * @returns 加载好的 TileMap，失败时 null
   */
  public static loadFromBin(entryIndex: number, reservedB: number, reservedC: number): TileMap | null {
    let map: TileMap;
    try {
      map = new TileMap(GameScreen.screenWidth, GameScreen.playHeight);
      const inputStream: InputStream = GameMIDlet.openArchiveEntryStream("/res/f.bin", entryIndex)!;
      const atlasEntry = GameMIDlet.readByte(inputStream);
      map.mapTileWidth = GameMIDlet.readU16Le(inputStream);
      map.mapTileHeight = GameMIDlet.readU16Le(inputStream);
      map.tileWidth = GameMIDlet.readByte(inputStream);
      map.tileHeight = GameMIDlet.readByte(inputStream);
      map.blockColumns = GameMIDlet.readByte(inputStream);
      map.blockRows = GameMIDlet.readByte(inputStream);
      map.blockIndexTable = new Int8Array(map.mapTileWidth * map.mapTileHeight);
      inputStream.read(map.blockIndexTable);
      if (TileMap.loadedAtlasId !== atlasEntry) {
        TileMap.atlasImage = null;
        // tjge.a.f(int)（image.bin 加载）→ a.f_I 内部返回 getCachedImage（已预解码）。
        TileMap.atlasImage = GameScreen.loadImageFromBin(atlasEntry + 4);
      }
      TileMap.loadedAtlasId = atlasEntry;
      map.atlasTilesPerRow = (TileMap.atlasImage!.getWidth() / map.tileWidth) | 0;
      // rleFilledLen/columnCount 为局部量，与原版一致（rleFilledLen 未在后续使用，仅 columnCount 用于分配 d）。
      const rleFilledLen = (map.tileWidth * map.mapTileWidth / map.blockColumns) | 0;
      const columnCount = (map.tileHeight * map.mapTileHeight / map.blockRows) | 0;
      map.mapColumns = map.mapTileWidth;
      map.mapRows = map.mapTileHeight;
      map.tileWidthPx = map.tileWidth;
      map.tileHeightPx = map.tileHeight;
      map.columnRleData = new Array<Int8Array | null>(columnCount).fill(null);
      let columnIndex = 0;
      while (columnIndex < columnCount) {
        const rowMode = GameMIDlet.readByte(inputStream);
        if (rowMode === 0) {
          map.columnRleData[columnIndex] = new Int8Array(1);
          map.columnRleData[columnIndex]![0] = 0;
        } else if (rowMode === 1) {
          map.columnRleData[columnIndex] = new Int8Array(1 + rleFilledLen);
          // read(byte[],off,len)：从 off=1 读 rleFilledLen 字节。
          TileMap.readInto(inputStream, map.columnRleData[columnIndex]!, 1, rleFilledLen);
          map.columnRleData[columnIndex]![0] = 1;
        } else {
          let segCount = GameMIDlet.readByte(inputStream);
          if (segCount < 0) {
            segCount += 256;
          }
          map.columnRleData[columnIndex] = new Int8Array(2 + 2 * segCount);
          TileMap.readInto(inputStream, map.columnRleData[columnIndex]!, 2, 2 * segCount);
          map.columnRleData[columnIndex]![0] = 2;
        }
        ++columnIndex;
      }
      inputStream.close();
      map.setupOffscreenBuffer(true, GameScreen.screenWidth, GameScreen.playHeight);
    } catch (exception) {
      return null;
    }
    return map;
  }

  /**
   * 关卡内仅重载列 RLE 数据 d（不重建整张地图），用于「重载地图块」分支
   * （GameScreen.a(int) 的 case1/2，对应 ag 标志）。CFR b.java:316 `a(int)`。
   * 跳过 f.bin 第 n 条目的头部与块索引表（skip 9 + l*m 字节），就地覆写各列 d。
   * 异常时静默返回，保持原 d 不变。
   * @param entryIndex f.bin 条目索引
   */
  public reloadColumnData(entryIndex: number): void {
    try {
      const inputStream: InputStream = GameMIDlet.openArchiveEntryStream("/res/f.bin", entryIndex)!;
      const columnCount = (this.tileHeight * this.mapTileHeight / this.blockRows) | 0;
      const rleFilledLen = (this.tileWidth * this.mapTileWidth / this.blockColumns) | 0;
      inputStream.skip(9 + this.mapTileWidth * this.mapTileHeight);
      let columnIndex = 0;
      while (columnIndex < columnCount) {
        const rowMode = GameMIDlet.readByte(inputStream);
        if (rowMode === 0) {
          this.columnRleData[columnIndex]![0] = 0;
        } else if (rowMode === 1) {
          // read(byte[],off,len)：从 off=1 读 rleFilledLen 字节。
          TileMap.readInto(inputStream, this.columnRleData[columnIndex]!, 1, rleFilledLen);
          this.columnRleData[columnIndex]![0] = 1;
        } else {
          let segCount = GameMIDlet.readByte(inputStream);
          if (segCount < 0) {
            segCount += 256;
          }
          TileMap.readInto(inputStream, this.columnRleData[columnIndex]!, 2, 2 * segCount);
          this.columnRleData[columnIndex]![0] = 2;
        }
        ++columnIndex;
      }
      inputStream.close();
      return;
    } catch (exception) {
      return;
    }
  }

  /**
   * 破坏/清除指定坐标的瓦片：定位 {@link queryColumnTileAt} 所用的同一 RLE 段后
   * 把其 type 置 0（变为空，可穿过）。用于可破坏地形等玩法。CFR b.java:349 `c(int,int)`。
   * 越界、该列全空或解析异常均返回 false（未改动）；成功置 0 返回 true。
   * @param cellIndex  列内单元格索引（横向）
   * @param columnIndex 列索引（纵向）
   * @returns 是否成功清除
   */
  public clearTileAt(cellIndex: number, columnIndex: number): boolean {
    if (columnIndex < 0) {
      return false;
    }
    if (columnIndex >= this.columnRleData.length) {
      return false;
    }
    if (cellIndex < 0 || cellIndex >= ((this.tileWidthPx * this.mapColumns / 16) | 0)) {
      return false;
    }
    if (this.columnRleData[columnIndex]![0] === 0) {
      return false;
    }
    try {
      this.columnRleData[columnIndex]![this.rleScanToCell(columnIndex, cellIndex)] = 0;
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
