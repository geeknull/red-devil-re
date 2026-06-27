/**
 * 游戏2《红魔特种兵2-深海战舰》图块切片表 / PNG 贴图（TileSheet）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/i.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 职责：加载 /res/t.bin（cell 切片表：源XY/宽/高 + 图像数）+ /res/actorPng.bin（PNG 主图），
 *       用标准 Graphics.drawRegion 切图贴出（无 DirectGraphics，无 4bit 像素自解码）。
 *
 * 与游戏1 的核心差异（见 docs/tjge引擎与兼容层设计.md、docs/game2-深海战舰/类清单与职责.md §10）：
 *   游戏1 的 i 自己做 4bit 像素解码 + RGB444 调色板 + Nokia DirectGraphics.drawPixels；
 *   游戏2 改为直接 Image.createImage(PNG) 加载 PNG，用 Graphics.drawRegion 切图。
 *
 * 字段别名（混淆名沿用原版，见类清单与职责.md §10）：
 *   静态 a=水平翻转请求位(Integer.MIN_VALUE=0x80000000)，b=垂直翻转请求位(0x40000000)；
 *   g=cell 数量(short)；h/i=每 cell 在 PNG 上的源 X/Y(short[])；
 *   j=每 cell 宽(short[]，0..255)；c=每 cell 高(short[]，0..255，public)；
 *   d=PNG 图像数组(Image[]，多帧换色精灵 n5>1)；e=当前绘制用图像(Image)；
 *   f=static int[4][4] 翻转/旋转 → drawRegion transform 映射表。
 *
 * 方法映射（contract.json）：
 *   a(Graphics,5×int)→a_GIIIII（绘制一个 cell）；a(int)→a_I(static，从 t.bin 解析切片表)；构造→constructor。
 *
 * 跨类方法名按契约表（GameMIDlet）：
 *   b(String,int)→b_SI（返回定位流）；b(InputStream)→b_In（读短）；a(InputStream)→a_In（读字节）；
 *   c(String,int)→c_SI（返回整条字节切片 Int8Array）。
 *
 * 必要偏差（资源/像素管线，见规约 §5/§6 与设计文档 §“Image.createImage(byte[])”）：
 *   原版 Image.createImage((byte[])byArray2,0,length) 在运行时同步解码 PNG 字节。
 *   兼容层 PNG 解码改在预加载阶段异步完成、运行时按 (归档,索引,帧) 同步取预解码 Image
 *   （GameMIDlet.a_SI / getCachedImage），仅同步/异步桥接，配色与原版一致：
 *     - 第 0 张（未打补丁）= actorPng.bin[n] 原字节，bit 一致于预解码缓存。
 *     - n5>1 的换色帧（把主图 PLTE 段 offset=s,len=s2 替换为后续帧字节）：补丁后 PNG 由
 *       a_PaletteFrames() 在预加载阶段离线解码、按 (归档,索引,帧) 登记，a_I 此处按帧取回，
 *       绘制时 a_GIIIII 用 d[n4] 取对应配色帧——与原版逐帧同步解码同效。
 */
import { Graphics, Image, InputStream, getCachedImage, getResourceAsStream } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { MIRROR_FLAG, FLIP_VERTICAL_BIT } from "./constants.ts";

export class TileSheet {
  static flipHorizontalBit: number = MIRROR_FLAG; // Integer.MIN_VALUE (0x80000000)
  static flipVerticalBit: number = FLIP_VERTICAL_BIT;
  private cellCount: number = 0; // short
  private cellSrcX!: Int16Array; // short[]
  private cellSrcY!: Int16Array; // short[]
  private cellWidth!: Int16Array; // short[]
  cellHeight!: Int16Array; // short[]（public）
  imageFrames!: (Image | null)[]; // Image[]（public）
  currentImage!: Image; // Image（public）
  static transformTable: number[][] = [
    [0, 2, 1, 3],
    [5, 4, 7, 6],
    [3, 1, 2, 0],
    [6, 7, 4, 5],
  ]; // static final int[4][4]

  // 偏差辅助：记录 actorPng.bin 归档名与本切片表的资源索引，
  // 供 a_GIIIII 在缺少运行时同步 PNG 解码时按 (归档,索引) 取预解码缓存（见类头偏差说明）。
  private static readonly ACTOR_PNG = "/res/actorPng.bin";
  private resIndex: number = 0;

  private constructor() {
  }

  /**
   * i.a(Graphics,int,int,int,int,int)：绘制第 n3 张 cell。
   * n/n2=目标 x/y；n3=cell 索引（高位带翻转/旋转请求位 a/b 与 0x3000 旋转码）；
   * n4=图像数组索引（换色帧）；n5（未直接用，方法签名第 5 个 int 参数）。
   */
  drawCell(graphics: Graphics, n: number, n2: number, n3: number, n4: number, _n5: number): void {
    let n6 = 0;
    let n7 = 0;
    if ((((n3 >> 31) & 1) ^ ((n3 >> 15) & 1)) !== 0) {
      n7 = 1;
    }
    if ((((n3 >> 30) & 1) ^ ((n3 >> 14) & 1)) !== 0) {
      n7 = n7 > 0 ? 3 : 2;
    }
    const n8 = n3;
    n3 &= 0xfff;
    let s: number = this.cellWidth[n3];
    let s2: number = this.cellHeight[n3];
    switch (n8 & 0x3000) {
      case 4096: {
        s = this.cellHeight[n3];
        s2 = this.cellWidth[n3];
        n6 = TileSheet.transformTable[3][n7];
        break;
      }
      case 8192: {
        n6 = TileSheet.transformTable[2][n7];
        break;
      }
      case 12288: {
        s = this.cellHeight[n3];
        s2 = this.cellWidth[n3];
        n6 = TileSheet.transformTable[1][n7];
        break;
      }
      default: {
        n6 = TileSheet.transformTable[0][n7];
      }
    }
    if ((n8 & TileSheet.flipHorizontalBit) !== 0) {
      n -= s;
    }
    if ((n8 & TileSheet.flipVerticalBit) !== 0) {
      n2 -= s2;
    }
    graphics.setClip(n, n2, s, s2);
    this.currentImage = this.imageFrames[n4]!;
    graphics.drawRegion(this.currentImage, this.cellSrcX[n3], this.cellSrcY[n3], this.cellWidth[n3], this.cellHeight[n3], n6, n, n2, 20);
  }

  /**
   * i.a(int)：从 /res/t.bin 第 n 条目解析 cell 切片表 + 加载 actorPng 主图。
   * 解析失败（异常）返回 null（保持原版语义）。
   */
  static loadFromBin(n: number): TileSheet | null {
    const i2 = new TileSheet();
    i2.resIndex = n; // 偏差：记录资源索引以便取预解码缓存
    try {
      const inputStream: InputStream = GameMIDlet.openEntryStream("/res/t.bin", n)!;
      GameMIDlet.readShortLE(inputStream);
      i2.cellCount = GameMIDlet.readShortLE(inputStream);
      i2.cellSrcX = new Int16Array(i2.cellCount);
      i2.cellSrcY = new Int16Array(i2.cellCount);
      i2.cellWidth = new Int16Array(i2.cellCount);
      i2.cellHeight = new Int16Array(i2.cellCount);
      let n2 = 0;
      while (n2 < i2.cellCount) {
        i2.cellSrcX[n2] = GameMIDlet.readShortLE(inputStream);
        i2.cellSrcY[n2] = GameMIDlet.readShortLE(inputStream);
        i2.cellWidth[n2] = GameMIDlet.readByte(inputStream);
        if (i2.cellWidth[n2] < 0) {
          const n3 = n2;
          i2.cellWidth[n3] = ((i2.cellWidth[n3] + 256) << 16) >> 16; // (short)
        }
        i2.cellHeight[n2] = GameMIDlet.readByte(inputStream);
        if (i2.cellHeight[n2] < 0) {
          const n4 = n2;
          i2.cellHeight[n4] = ((i2.cellHeight[n4] + 256) << 16) >> 16; // (short)
        }
        ++n2;
      }
      const n5 = GameMIDlet.readByte(inputStream);
      let s = 0; // short
      let s2 = 0; // short
      let byArray: Int8Array | null = null;
      i2.imageFrames = new Array<Image | null>(n5).fill(null);
      if (n5 > 1) {
        s = GameMIDlet.readShortLE(inputStream);
        s2 = GameMIDlet.readShortLE(inputStream);
      }
      const byArray2: Int8Array = GameMIDlet.readEntryBytes("/res/actorPng.bin", n)!;
      let n6 = 0;
      while (n6 < n5) {
        if (n6 > 0) {
          if (byArray == null) {
            byArray = new Int8Array(s2);
          }
          inputStream.read(byArray);
          // System.arraycopy(byArray, 0, byArray2, s, s2)
          byArray2.set(byArray.subarray(0, s2), s);
        }
        // 原版：i2.d[n6] = Image.createImage(byArray2, 0, byArray2.length);
        //   偏差：兼容层无运行时同步 PNG 解码，按 (归档,索引,帧) 取预解码缓存（见类头偏差说明）。
        //   第 0 张为 actorPng.bin[n] 原字节；n6>0 的换色帧由预加载阶段 a_PaletteFrames() 离线解码
        //   补丁后 PNG 并按 (归档,索引,n6) 登记，此处直接取回，配色与原版一致。
        i2.imageFrames[n6] = getCachedImage<Image>(TileSheet.ACTOR_PNG, n, n6);
        ++n6;
      }
      inputStream.close();
    } catch (exception) {
      return null;
    }
    return i2;
  }

  /**
   * 偏差配套：收集所有 actor 换色帧（PLTE 补丁帧）的「补丁后 PNG 字节」，
   * 供运行壳在预加载阶段离线解码（兼容层无运行时同步 PNG 解码，见类头偏差说明）。
   *
   * 解析逐行对应 a_I：每条 t.bin 条目 跳 1 短 → g(cell 数) → g×(2 短 cell 源XY + 2 字节 宽高) →
   * n5(图像数)；若 n5>1 读 s/s2(补丁偏移/长度)，再逐帧读 s2 字节覆盖基图 actorPng.bin[n] 的
   * [s, s+s2) 区（即整段 PLTE chunk，自带 CRC，可被标准 PNG 解码器接受）。
   * 返回每个换色帧的 { index=条目号, frame=帧号(1..n5-1), bytes=补丁后 PNG 字节 }。
   * 须在 /res/t.bin 与 /res/actorPng.bin 已注册后调用。
   */
  static a_PaletteFrames(): { index: number; frame: number; bytes: Int8Array }[] {
    const out: { index: number; frame: number; bytes: Int8Array }[] = [];
    const head = getResourceAsStream("/res/t.bin");
    if (head == null) return out;
    // 归档头：小端 32 位条目数（含末尾 EOF 哨兵），真实条目数 = count - 1。
    const f4 = new Int8Array(4);
    head.read(f4);
    const count = (f4[0] & 0xff) | ((f4[1] & 0xff) << 8) | ((f4[2] & 0xff) << 16) | ((f4[3] & 0xff) << 24);
    head.close();
    for (let n = 0; n < count - 1; n++) {
      const inputStream = GameMIDlet.openEntryStream("/res/t.bin", n);
      if (inputStream == null) continue;
      try {
        GameMIDlet.readShortLE(inputStream); // 跳 1 短
        const g = GameMIDlet.readShortLE(inputStream); // cell 数
        for (let c = 0; c < g; c++) {
          GameMIDlet.readShortLE(inputStream); // 源 X
          GameMIDlet.readShortLE(inputStream); // 源 Y
          GameMIDlet.readByte(inputStream); // 宽
          GameMIDlet.readByte(inputStream); // 高
        }
        const n5 = GameMIDlet.readByte(inputStream); // 图像数
        if (n5 <= 1) {
          inputStream.close();
          continue;
        }
        const s = GameMIDlet.readShortLE(inputStream); // 补丁偏移
        const s2 = GameMIDlet.readShortLE(inputStream); // 补丁长度
        const byArray2 = GameMIDlet.readEntryBytes("/res/actorPng.bin", n); // 基图 PNG 字节
        if (byArray2 == null) {
          inputStream.close();
          continue;
        }
        const byArray = new Int8Array(s2);
        for (let frame = 1; frame < n5; frame++) {
          inputStream.read(byArray);
          byArray2.set(byArray.subarray(0, s2), s); // 覆盖 PLTE 区（与 a_I 同 arraycopy 语义）
          out.push({ index: n, frame, bytes: byArray2.slice() }); // 异步解码前快照
        }
        inputStream.close();
      } catch (exception) {
        /* 单条目解析失败则跳过，不影响其余 */
      }
    }
    return out;
  }
}
