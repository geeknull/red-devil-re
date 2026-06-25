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
  constructor(n: number, n2: number) {
    this.viewportWidth = n;
    this.viewportHeight = n2;
  }

  /**
   * 设置相机左上角像素坐标（绘制偏移）。{@link render} 据此从离屏缓冲取景。
   * 对应 CFR b.java a(int,int)。
   * @param n  相机 X（cameraX）
   * @param n2 相机 Y（cameraY）
   */
  // a(int,int) → a_II
  public setCameraPosition(n: number, n2: number): void {
    this.cameraX = n;
    this.cameraY = n2;
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
  private sampleGridIndex(n: number, n2: number): number {
    let n3 = this.gridIndices[((n2 / (this.cellTilesY * this.tileHeight)) | 0) * this.gridCols + ((n / (this.cellTilesX * this.tileWidth)) | 0)];
    if (n3 < -1) {
      n3 += 256;
    }
    return n3;
  }

  /**
   * 核心碰撞/属性查询：给定像素坐标，返回该点的瓦片碰撞属性值（0=空）。
   * 越界（含负坐标、超出地图宽高）直接返回 0；先经 {@link sampleGridIndex} 定位
   * 网格单元，再换算到「碰撞属性条带」表 {@link collisionRows} 的行(n2)/列(n)，
   * 按 RLE 段长累加定位命中段并返回其属性字节。
   * 属性语义（参见 g.java 碰撞）：`&3 != 0` 视为实心，`==4` 视为可站立平台面。
   * 对应 CFR b.java b(int,int)（核心碰撞）。
   * @param n  查询点像素 X
   * @param n2 查询点像素 Y
   * @returns 碰撞属性值（0 表示无碰撞/越界）
   */
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

  /**
   * 像素坐标 → 前景图集(fpng)的 cell 索引（即应贴哪一格瓦片）。
   * 经 {@link sampleGridIndex} 取网格块，再换算到前景调色表 {@link foregroundTileIndices}
   * 的偏移并读出 cell（负值 +256 还原为无符号）；网格块为 -1（空）时返回 -1。
   * 索引非法时抛 "error index"（供 {@link drawTileRegion} try/catch 跳过该格）。
   * 对应 CFR b.java c(int,int)。
   * @returns 前景 cell 索引；-1 表示该格无前景瓦片
   */
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

  /**
   * 像素坐标 → 背景图集(bpng)的 cell 索引。坐标先对背景层总尺寸取模（背景平铺循环），
   * 再换算到背景块索引表 {@link backgroundIndices} 取 cell（负值 +256 还原）。
   * 仅在含背景层（{@link layerMode}===2）时有效；索引非法时抛 "error index"。
   * 对应 CFR b.java d(int,int)。
   * @returns 背景 cell 索引
   */
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

  /**
   * 把一块矩形瓦片区域绘制到（离屏缓冲的）Graphics。入参给出绘制范围与环形回卷模数。
   * 双重循环按瓦片步进（步长 tileWidth/tileHeight），坐标到达模数 n5/n6 即回卷到 0，
   * 实现离屏缓冲的环形复用。每格：若含背景层(layerMode===2)先经 {@link sampleBackgroundTile}
   * 贴背景；再经 {@link sampleForegroundTile}（!=-1 时）setClip+drawImage 贴前景；
   * 查询越界由 try/catch 跳过该格。供 {@link renderViewport} 增量重绘调用。
   * 对应 CFR b.java a(Graphics,6参)（CFR b.java:156-198）。
   * @param graphics 目标（通常为离屏缓冲）Graphics
   * @param n  绘制范围左边界 x0（瓦片对齐像素）
   * @param n2 绘制范围上边界 y0
   * @param n3 绘制范围右边界 x1
   * @param n4 绘制范围下边界 y1
   * @param n5 横向回卷模数（缓冲宽）
   * @param n6 纵向回卷模数（缓冲高）
   */
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

  /**
   * 把离屏缓冲的一块矩形区域 blit 到目标 Graphics（按相机偏移做平移），
   * 用 setClip 限制贴图范围。{@link renderViewport} 据相机跨越缓冲边界的情况
   * 分 1~4 块调用本方法拼出完整视口（环形缓冲的四象限拼接）。
   * 对应 CFR b.java b(Graphics,6参)。
   * @param graphics 目标画布
   * @param n  缓冲取样起点 X（相机在缓冲内的 X）
   * @param n2 缓冲取样起点 Y
   * @param n3 该块宽
   * @param n4 该块高
   * @param n5 目标画布落点 X
   * @param n6 目标画布落点 Y
   */
  // b(Graphics,int,int,int,int,int,int) → b_GIIIIII
  public blitBufferRegion(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number, n6: number): void {
    graphics.setClip(n5, n6, n3, n4);
    graphics.drawImage(TileMap.offscreenBuffer!, n5 - n, n6 - n2, 20);
  }

  /**
   * 滚动增量重绘：以相机位置为基准维护离屏缓冲，仅补绘新进入视野的瓦片条带
   * （比较 {@link drawnLeft}/Top/Right/Bottom 与当前对齐边界，左右/上下方向各补一条），
   * 然后据相机在环形缓冲内的取样起点把缓冲分块 {@link blitBufferRegion} 贴到目标画布。
   * 首帧（drawnLeft<0）或 {@link resetDrawnBounds} 后做整屏重绘。{@link render} 的实现体。
   * 对应 CFR b.java a(Graphics,int,int,int,int)。
   * @param graphics 目标画布
   * @param n  相机像素 X
   * @param n2 相机像素 Y
   * @param n3 视口宽
   * @param n4 视口高
   */
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

  /**
   * 释放本层占用的大数组与图像引用（碰撞条带、网格、前/背景索引与图集），
   * 便于 GC。卸载关卡时调用。原 CFR 末尾的 System.gc() 按移植规约 §6 删除并注释。
   * 对应 CFR b.java d()。
   */
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

  /**
   * 加载地图：依次解析 m.bin[n]（网格索引头 + 网格数组）、p.bin（前景调色表 +
   * 碰撞属性条带 RLE，模式 0 全空/1 连续填充/≥2 RLE）、fpng.bin（前景图集），
   * 写入各字段并预计算每行瓦片数；当 {@link layerMode}(=n3)===2 时再加载
   * b.bin[n2]（背景块索引）与 bpng.bin（背景图集）。最后 {@link ensureOffscreenBuffer}
   * 分配滚动用离屏缓冲。整段以 try/catch 兜底（失败静默返回）。
   * 偏差：shim 的 InputStream.read 仅单参，故 RLE 条带用临时缓冲读后再 .set 到偏移处
   * （字节一致，见行内注释）；Image.createImage→createMutable。
   * 对应 CFR b.java a(int,int,int)。
   * @param n  m.bin 条目索引（网格）
   * @param n2 b.bin 条目索引（背景层，仅 layerMode===2 用）
   * @param n3 图层模式 layerMode（2=含背景层）
   */
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
