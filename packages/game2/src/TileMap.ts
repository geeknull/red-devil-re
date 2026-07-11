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

  /**
   * 构造瓦片地图层。仅记录相机视口尺寸（关卡内固定为 176×172），
   * 其余字段（网格/调色/碰撞/缓冲）一律延迟到 {@link load} 时填充。
   * 对应 CFR b.java 构造（b(int,int)）。
   * @param n  视口宽 viewportWidth（相机一次可见的像素宽）
   * @param n2 视口高 viewportHeight
   */
  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  /**
   * 设置相机左上角像素坐标（绘制偏移）。{@link render} 据此从离屏缓冲取景。
   * 对应 CFR b.java a(int,int)。
   * @param cameraX  相机 X（cameraX）
   * @param cameraY 相机 Y（cameraY）
   */
  // a(int,int) → a_II
  public setCameraPosition(cameraX: number, cameraY: number): void {
    this.cameraX = cameraX;
    this.cameraY = cameraY;
  }

  /**
   * 把离屏缓冲「已绘制区域」边界标记为失效（drawnLeft/drawnTop = -1），
   * 强制下一次 {@link renderViewport} 整屏重绘而非增量滚动。
   * 切换关卡/重置相机后调用。对应 CFR b.java a()。
   */
  // a() → a_
  public resetDrawnBounds(): void {
    this.drawnLeft = -1;
    this.drawnTop = -1;
  }

  /**
   * 地图像素总宽 = 瓦片宽 × 单元横向瓦片数 × 网格列数（tileWidth*cellTilesX*gridCols）。
   * 供相机夹取与坐标回卷使用。对应 CFR b.java b()。
   */
  // b() → b_
  public getMapWidth(): number {
    return this.tileWidth * this.cellTilesX * this.gridCols;
  }

  /**
   * 地图像素总高 = 瓦片高 × 单元纵向瓦片数 × 网格行数（tileHeight*cellTilesY*gridRows）。
   * 对应 CFR b.java c()。
   */
  // c() → c_
  public getMapHeight(): number {
    return this.tileHeight * this.cellTilesY * this.gridRows;
  }

  /**
   * 主绘制入口：按当前相机位置({@link cameraX}/{@link cameraY})与视口尺寸
   * 调用 {@link renderViewport} 把地图贴到目标 Graphics。每帧由场景主循环调用。
   * 对应 CFR b.java a(Graphics)。
   * @param graphics 目标画布
   */
  // a(Graphics) → a_G
  public render(graphics: Graphics): void {
    this.renderViewport(graphics, this.cameraX, this.cameraY, this.viewportWidth, this.viewportHeight);
  }

  // e(int,int) → e_II
  private sampleGridIndex(pixelX: number, pixelY: number): number {
    let gridIndex = this.gridIndices[((pixelY / (this.cellTilesY * this.tileHeight)) | 0) * this.gridCols + ((pixelX / (this.cellTilesX * this.tileWidth)) | 0)];
    if (gridIndex < -1) {
      gridIndex += 256;
    }
    return gridIndex;
  }

  /**
   * 核心碰撞/属性查询：给定像素坐标，返回该点的瓦片碰撞属性值（0=空）。
   * 越界（含负坐标、超出地图宽高）直接返回 0；先经 {@link sampleGridIndex} 定位
   * 网格单元，再换算到「碰撞属性条带」表 {@link collisionRows} 的行(n2)/列(n)，
   * 按 RLE 段长累加定位命中段并返回其属性字节。
   * 属性语义（参见 g.java 碰撞）：`&3 != 0` 视为实心，`==4` 视为可站立平台面。
   * 对应 CFR b.java b(int,int)（核心碰撞）。
   * @param pixelX  查询点像素 X（越过映射行后原地复用为碰撞条带的列）
   * @param pixelY 查询点像素 Y（越过映射行后原地复用为碰撞条带的行）
   * @returns 碰撞属性值（0 表示无碰撞/越界）
   */
  // b(int,int) → b_II
  public sampleCollision(pixelX: number, pixelY: number): number {
    if (pixelY < 0) {
      return 0;
    }
    if (pixelY >= this.getMapHeight()) {
      return 0;
    }
    if (pixelX < 0 || pixelX >= this.getMapWidth()) {
      return 0;
    }
    const gridIndex = this.sampleGridIndex(pixelX, pixelY);
    if (gridIndex === -1) {
      return 0;
    }
    // 以下 pixelX/pixelY 被原地复用为碰撞属性条带的列/行下标（CFR 寄存器复用惯用法）。
    pixelX = (((gridIndex % ((this.foregroundPaletteWidth / this.cellTilesX) | 0)) * this.cellTilesX + ((pixelX / this.tileWidth) | 0) % this.cellTilesX) * this.tileWidth / this.collisionStepX) | 0;
    if (this.collisionRows[(pixelY = ((((gridIndex / ((this.foregroundPaletteWidth / this.cellTilesX) | 0)) | 0) * this.cellTilesY + ((pixelY / this.tileHeight) | 0) % this.cellTilesY) * this.tileHeight / this.collisionStepY) | 0)]![0] === 0) {
      return 0;
    }
    let runLength = 0;
    let segCursor = 2;
    do {
      runLength += this.collisionRows[pixelY]![segCursor + 1];
      if (this.collisionRows[pixelY]![segCursor + 1] < 0) {
        runLength += 256;
      }
      segCursor += 2;
    } while (runLength < pixelX + 1);
    return this.collisionRows[pixelY]![(segCursor -= 2)];
  }

  /**
   * 像素坐标 → 前景图集(fpng)的 cell 索引（即应贴哪一格瓦片）。
   * 经 {@link sampleGridIndex} 取网格块，再换算到前景调色表 {@link foregroundTileIndices}
   * 的偏移并读出 cell（负值 +256 还原为无符号）；网格块为 -1（空）时返回 -1。
   * 索引非法时抛 "error index"（供 {@link drawTileRegion} try/catch 跳过该格）。
   * 对应 CFR b.java c(int,int)。
   * @returns 前景 cell 索引；-1 表示该格无前景瓦片
   */
  // c(int,int) → c_II（throws Exception）
  // 入参 pixelX/pixelY 中途被原地复用为前景图集的列/行；gridIndex 从网格块索引复用为扁平表下标（CFR 寄存器复用）。
  public sampleForegroundTile(pixelX: number, pixelY: number): number {
    let cellIndex = -1;
    let gridIndex = this.sampleGridIndex(pixelX, pixelY);
    if (gridIndex !== -1) {
      pixelX = gridIndex % ((this.foregroundPaletteWidth / this.cellTilesX) | 0) * this.cellTilesX + ((pixelX / this.tileWidth) | 0) % this.cellTilesX;
      pixelY = ((gridIndex / ((this.foregroundPaletteWidth / this.cellTilesX) | 0)) | 0) * this.cellTilesY + ((pixelY / this.tileHeight) | 0) % this.cellTilesY;
      gridIndex = pixelY * this.foregroundPaletteWidth + pixelX;
      cellIndex = this.foregroundTileIndices[gridIndex];
      if (this.foregroundTileIndices[gridIndex] < 0) {
        cellIndex += 256;
      }
      if (cellIndex < 0) {
        throw new Error("error index");
      }
    }
    return cellIndex;
  }

  /**
   * 像素坐标 → 背景图集(bpng)的 cell 索引。坐标先对背景层总尺寸取模（背景平铺循环），
   * 再换算到背景块索引表 {@link backgroundIndices} 取 cell（负值 +256 还原）。
   * 仅在含背景层（{@link layerMode}===2）时有效；索引非法时抛 "error index"。
   * 对应 CFR b.java d(int,int)。
   * @returns 背景 cell 索引
   */
  // d(int,int) → d_II（throws Exception）
  public sampleBackgroundTile(pixelX: number, pixelY: number): number {
    let cellIndex = 0;
    const blockIndex = ((pixelY %= this.backgroundBlockHeight * this.backgroundPaletteRows) / this.backgroundBlockHeight | 0) * this.backgroundPaletteCols + ((pixelX %= this.backgroundBlockWidth * this.backgroundPaletteCols) / this.backgroundBlockWidth | 0);
    cellIndex = this.backgroundIndices[blockIndex];
    if (this.backgroundIndices[blockIndex] < 0) {
      cellIndex += 256;
    }
    if (cellIndex < 0) {
      throw new Error("error index");
    }
    return cellIndex;
  }

  // f(int,int) → f_II（按视口宽高分配对齐到瓦片的离屏缓冲）
  private ensureOffscreenBuffer(width: number, height: number): void {
    if (TileMap.offscreenBuffer == null) {
      const bufWidth = width % this.tileWidth === 0 ? width + this.tileWidth : width - (width % this.tileWidth) + 2 * this.tileWidth;
      const bufHeight = height % this.tileHeight === 0 ? this.viewportHeight + this.tileHeight : height - (height % this.tileHeight) + 2 * this.tileHeight;
      TileMap.offscreenBuffer = Image.createMutable(bufWidth | 0, bufHeight | 0);
      TileMap.offscreenGraphics = TileMap.offscreenBuffer.getGraphics();
      this.resetDrawnBounds();
    }
  }

  /**
   * 把一块矩形瓦片区域绘制到（离屏缓冲的）Graphics。入参给出绘制范围与环形回卷模数。
   * 双重循环按瓦片步进（步长 tileWidth/tileHeight），坐标到达模数 n5/n6 即回卷到 0，
   * 实现离屏缓冲的环形复用。每格：若含背景层(layerMode===2)先经 {@link sampleBackgroundTile}
   * 贴背景；再经 {@link sampleForegroundTile}（!=-1 时）setClip+drawImage 贴前景；
   * 查询越界由 try/catch 跳过该格。供 {@link renderViewport} 增量重绘调用。
   * 对应 CFR b.java a(Graphics,6参)（CFR b.java:156-198）。
   * @param graphics 目标（通常为离屏缓冲）Graphics
   * @param x0  绘制范围左边界 x0（瓦片对齐像素）
   * @param y0 绘制范围上边界 y0
   * @param x1 绘制范围右边界 x1
   * @param y1 绘制范围下边界 y1
   * @param wrapW 横向回卷模数（缓冲宽）
   * @param wrapH 纵向回卷模数（缓冲高）
   */
  // a(Graphics,int,int,int,int,int,int) → a_GIIIIII
  public drawTileRegion(graphics: Graphics, x0: number, y0: number, x1: number, y1: number, wrapW: number, wrapH: number): void {
    let cell = 0;
    let bufY = y0 % wrapH;
    const mapWidth = this.getMapWidth();
    const mapHeight = this.getMapHeight();
    let tileY = y0;
    while (tileY <= y1) {
      let bufX = x0 % wrapW;
      let tileX = x0;
      while (tileX <= x1) {
        block10: {
          if (this.layerMode === 2) {
            try {
              cell = this.sampleBackgroundTile(tileX, tileY);
            } catch (exception) {
              break block10;
            }
            graphics.setClip(bufX, bufY, this.backgroundBlockWidth, this.backgroundBlockHeight);
            graphics.drawImage(this.backgroundImage!, bufX - (cell % this.backgroundBlocksPerRow) * this.backgroundBlockWidth, bufY - ((cell / this.backgroundBlocksPerRow) | 0) * this.backgroundBlockHeight, 20);
          }
          try {
            cell = this.sampleForegroundTile(tileX % mapWidth, tileY % mapHeight);
          } catch (exception) {
            break block10;
          }
          if (cell !== -1) {
            graphics.setClip(bufX, bufY, this.tileWidth, this.tileHeight);
            graphics.drawImage(this.foregroundImage!, bufX - (cell % this.foregroundTilesPerRow) * this.tileWidth, bufY - ((cell / this.foregroundTilesPerRow) | 0) * this.tileHeight, 20);
          }
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

  /**
   * 把离屏缓冲的一块矩形区域 blit 到目标 Graphics（按相机偏移做平移），
   * 用 setClip 限制贴图范围。{@link renderViewport} 据相机跨越缓冲边界的情况
   * 分 1~4 块调用本方法拼出完整视口（环形缓冲的四象限拼接）。
   * 对应 CFR b.java b(Graphics,6参)。
   * @param graphics 目标画布
   * @param srcX  缓冲取样起点 X（相机在缓冲内的 X）
   * @param srcY 缓冲取样起点 Y
   * @param blockW 该块宽
   * @param blockH 该块高
   * @param dstX 目标画布落点 X
   * @param dstY 目标画布落点 Y
   */
  // b(Graphics,int,int,int,int,int,int) → b_GIIIIII
  public blitBufferRegion(graphics: Graphics, srcX: number, srcY: number, blockW: number, blockH: number, dstX: number, dstY: number): void {
    graphics.setClip(dstX, dstY, blockW, blockH);
    graphics.drawImage(TileMap.offscreenBuffer!, dstX - srcX, dstY - srcY, 20);
  }

  /**
   * 滚动增量重绘：以相机位置为基准维护离屏缓冲，仅补绘新进入视野的瓦片条带
   * （比较 {@link drawnLeft}/Top/Right/Bottom 与当前对齐边界，左右/上下方向各补一条），
   * 然后据相机在环形缓冲内的取样起点把缓冲分块 {@link blitBufferRegion} 贴到目标画布。
   * 首帧（drawnLeft<0）或 {@link resetDrawnBounds} 后做整屏重绘。{@link render} 的实现体。
   * 对应 CFR b.java a(Graphics,int,int,int,int)。
   * @param graphics 目标画布
   * @param cameraX  相机像素 X
   * @param cameraY 相机像素 Y
   * @param viewW 视口宽
   * @param viewH 视口高
   */
  // a(Graphics,int,int,int,int) → a_GIIII
  public renderViewport(graphics: Graphics, cameraX: number, cameraY: number, viewW: number, viewH: number): void {
    // stripStart/stripEnd 为补绘条带的起止边界，横向补绘时表左/右、纵向补绘时表上/下（多轴复用）。
    let stripEnd: number;
    let stripStart: number;
    const bufWidth = TileMap.offscreenBuffer!.getWidth();
    const bufHeight = TileMap.offscreenBuffer!.getHeight();
    TileMap.offscreenGraphics!.setColor(0xffffff);
    const alignedLeft = cameraX - (cameraX % this.tileWidth);
    const alignedTop = cameraY - (cameraY % this.tileHeight);
    const alignedRight = cameraX + bufWidth - this.tileWidth - ((cameraX + bufWidth - this.tileWidth) % this.tileWidth);
    const alignedBottom = cameraY + bufHeight - this.tileHeight - ((cameraY + bufHeight - this.tileHeight) % this.tileHeight);
    if (this.drawnLeft < 0) {
      this.drawTileRegion(TileMap.offscreenGraphics!, alignedLeft, alignedTop, alignedRight, alignedBottom, bufWidth, bufHeight);
      this.drawnLeft = alignedLeft;
      this.drawnTop = alignedTop;
      this.drawnRight = alignedRight;
      this.drawnBottom = alignedBottom;
    }
    if (this.drawnLeft !== alignedLeft) {
      if (this.drawnLeft < alignedLeft) {
        stripStart = this.drawnRight + this.backgroundBlockWidth;
        stripEnd = alignedRight;
      } else {
        stripStart = alignedLeft;
        stripEnd = this.drawnLeft - this.backgroundBlockWidth;
      }
      this.drawTileRegion(TileMap.offscreenGraphics!, stripStart, alignedTop, stripEnd, alignedBottom, bufWidth, bufHeight);
      this.drawnLeft = alignedLeft;
      this.drawnRight = alignedRight;
    }
    if (this.drawnTop !== alignedTop) {
      if (this.drawnTop < alignedTop) {
        stripStart = this.drawnBottom + this.backgroundBlockHeight;
        stripEnd = alignedBottom;
      } else {
        stripStart = alignedTop;
        stripEnd = this.drawnTop - this.backgroundBlockHeight;
      }
      this.drawTileRegion(TileMap.offscreenGraphics!, alignedLeft, stripStart, alignedRight, stripEnd, bufWidth, bufHeight);
      this.drawnTop = alignedTop;
      this.drawnBottom = alignedBottom;
    }
    const sampleX = cameraX % bufWidth;
    const sampleY = cameraY % bufHeight;
    const sampleEndX = (cameraX + viewW) % bufWidth;
    const sampleEndY = (cameraY + viewH) % bufHeight;
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
   * 释放本层占用的大数组与图像引用（碰撞条带、网格、前/背景索引与图集），
   * 便于 GC。卸载关卡时调用。原 CFR 末尾的 System.gc() 按移植规约 §6 删除并注释。
   * 对应 CFR b.java d()。
   */
  // d() → d_
  public dispose(): void {
    let i = 0;
    while (i < this.collisionRows.length) {
      this.collisionRows[i] = null;
      ++i;
    }
    this.collisionRows = null as unknown as (Int8Array | null)[];
    this.gridIndices = null as unknown as Int8Array;
    this.backgroundIndices = null as unknown as Int8Array;
    this.backgroundImage = null;
    this.foregroundTileIndices = null as unknown as Int8Array;
    this.foregroundImage = null;
    // System.gc();
  }

  /**
   * 加载地图：依次解析 m.bin[n]（网格索引头 + 网格数组）、p.bin（前景调色表 +
   * 碰撞属性条带 RLE，模式 0 全空/1 连续填充/≥2 RLE）、fpng.bin（前景图集），
   * 写入各字段并预计算每行瓦片数；当 {@link layerMode}(=n3)===2 时再加载
   * b.bin[n2]（背景块索引）与 bpng.bin（背景图集）。最后 {@link ensureOffscreenBuffer}
   * 分配滚动用离屏缓冲。整段以 try/catch 兜底（失败静默返回）。
   * 偏差：shim 的 InputStream.read 仅单参，故 RLE 条带用临时缓冲读后再 .set 到偏移处
   * （字节一致，见行内注释）；Image.createImage→createMutable。
   * 对应 CFR b.java a(int,int,int)。
   * @param gridEntry  m.bin 条目索引（网格）
   * @param bgEntry b.bin 条目索引（背景层，仅 layerMode===2 用）
   * @param layerMode 图层模式（2=含背景层）
   */
  // a(int,int,int) → a_III
  public load(gridEntry: number, bgEntry: number, layerMode: number): void {
    try {
      let inputStream: InputStream = GameMIDlet.openEntryStream("/res/m.bin", gridEntry)!;
      if (GameMIDlet.readByte(inputStream) !== 1) {
        return;
      }
      let paletteEntry = GameMIDlet.readByte(inputStream);
      this.cellTilesX = GameMIDlet.readByte(inputStream);
      this.cellTilesY = GameMIDlet.readByte(inputStream);
      this.gridCols = GameMIDlet.readShortLE(inputStream);
      this.gridRows = GameMIDlet.readShortLE(inputStream);
      this.gridIndices = new Int8Array(this.gridCols * this.gridRows);
      inputStream.read(this.gridIndices);
      inputStream.close();
      inputStream = GameMIDlet.openEntryStream("/res/p.bin", paletteEntry)!;
      if (GameMIDlet.readByte(inputStream) !== 0) {
        return;
      }
      paletteEntry = GameMIDlet.readByte(inputStream);
      this.foregroundPaletteWidth = GameMIDlet.readShortLE(inputStream);
      this.foregroundPaletteHeight = GameMIDlet.readShortLE(inputStream);
      this.tileWidth = GameMIDlet.readByte(inputStream);
      this.tileHeight = GameMIDlet.readByte(inputStream);
      this.foregroundTileIndices = new Int8Array(this.foregroundPaletteWidth * this.foregroundPaletteHeight);
      inputStream.read(this.foregroundTileIndices);
      this.collisionStepX = GameMIDlet.readByte(inputStream);
      this.collisionStepY = GameMIDlet.readByte(inputStream);
      const collisionCols = (this.tileWidth * this.foregroundPaletteWidth / this.collisionStepX) | 0;
      const collisionRowCount = (this.tileHeight * this.foregroundPaletteHeight / this.collisionStepY) | 0;
      this.collisionRows = new Array<Int8Array | null>(collisionRowCount);
      let rowIndex = 0;
      while (rowIndex < collisionRowCount) {
        const rowMode = GameMIDlet.readByte(inputStream);
        if (rowMode === 0) {
          this.collisionRows[rowIndex] = new Int8Array(1);
          this.collisionRows[rowIndex]![0] = 0;
        } else if (rowMode === 1) {
          this.collisionRows[rowIndex] = new Int8Array(1 + collisionCols);
          // 原 inputStream.read(this.m[rowIndex], 1, collisionCols)：读 collisionCols 字节填入下标 1 起。
          // 偏差：shim InputStream.read 仅支持单参（从 0 起填满 buf），
          //   故按 Java read(byte[],off,len) 语义用临时缓冲读取再拷入偏移处（字节一致）。
          {
            const __tmp = new Int8Array(collisionCols);
            inputStream.read(__tmp);
            this.collisionRows[rowIndex]!.set(__tmp, 1);
          }
          this.collisionRows[rowIndex]![0] = 1;
        } else {
          let segCount = GameMIDlet.readByte(inputStream);
          if (segCount < 0) {
            segCount += 256;
          }
          this.collisionRows[rowIndex] = new Int8Array(2 + 2 * segCount);
          // 原 inputStream.read(this.m[rowIndex], 2, 2*segCount)：读 2*segCount 字节填入下标 2 起（同上偏差）。
          {
            const __tmp = new Int8Array(2 * segCount);
            inputStream.read(__tmp);
            this.collisionRows[rowIndex]!.set(__tmp, 2);
          }
          this.collisionRows[rowIndex]![0] = 2;
        }
        ++rowIndex;
      }
      inputStream.close();
      this.foregroundImage = GameMIDlet.loadImage("/res/fpng.bin", paletteEntry | 0);
      this.foregroundTilesPerRow = (this.foregroundImage.getWidth() / this.tileWidth) | 0;
      this.layerMode = layerMode;
      if (this.layerMode === 2) {
        inputStream = GameMIDlet.openEntryStream("/res/b.bin", bgEntry)!;
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
