/**
 * 游戏2《红魔特种兵2-深海战舰》动作/动画定义 SpriteDef（动作帧库）。
 * 逐行移植自 reverse/game2/2-decompiled-cfr/tjge/d.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game2/porting-naming/porting-contract.json。
 *
 * 职责：解析 a.bin（精灵动作帧数据），按动作/帧把多个子图（图块）拼帧绘制。
 *   b_I(int)：从归档 /res/a.bin 第 n 条加载一份动作定义。
 *   a_GIIIIII(Graphics,x,y,action,frame,p5,p6)：按动作位标志绘制指定帧（含水平/垂直镜像）。
 *
 * 字段别名（混淆名沿用原版）：
 *   静态 a=每套图集 tjge.i[32]，b=各图集已加载标志[32]，c=外部 id→内部 id 映射[32]。
 *   o=图块组数；p=每组图块数[o]；q=每组各图块的子图索引[o][]；
 *   d/e=每组各图块的 x/y 偏移[o][]（byte，可负，镜像时取反）；
 *   r=动作数；s=每动作帧数[r]；t=每动作各帧引用的图块组索引[r][]；
 *   f/g/h/i=每动作的 4 个 byte 参数表[r]；j/k/l/m=4 个 short 参数；
 *   n=图集内部 id；u=本定义使用的图集 tjge.i。
 *
 * 跨类方法名按契约表：
 *   GameMIDlet.b_SI(path,n)→定位输入流；a_In(in)→读字节(byte)；b_In(in)→读短(short)；
 *   tjge.i.a_I(n)→静态加载图集；this.u.a_GIIIII(...)→图块绘制。
 *
 * 数值语义：动作标志位 n3 高位 0x80000000(水平镜像)/0x40000000(垂直镜像) 与低 24 位
 *   (0xFFFFFF) 帧引用一起按位处理；短/字节读取的有符号语义由 GameMIDlet 读取器保证。
 *
 * 必要偏差：资源经 GameMIDlet.b_SI 取定位输入流（见 docs/05 §5）；本类无音频/像素管线直接调用。
 */
import { Graphics } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { TileSheet } from "./TileSheet.ts";
import { MIRROR_FLAG, FLIP_VERTICAL_BIT } from "./constants.ts";

export class SpriteDef {
  static tileSheets: (TileSheet | null)[] = new Array<TileSheet | null>(32).fill(null);
  static loadedFlags: boolean[] = new Array<boolean>(32).fill(false);
  static idMap: Int32Array = new Int32Array(32);
  private tileGroupCount: number = 0;
  private tilesPerGroup!: Int16Array;
  private groupTileIndices!: Int16Array[];
  groupTileOffsetX!: Int8Array[];
  groupTileOffsetY!: Int8Array[];
  private actionCount: number = 0;
  private framesPerAction!: Int16Array;
  private actionFrameGroups!: Int16Array[];
  actionParamA!: Int8Array;
  actionParamB!: Int8Array;
  actionParamC!: Int8Array;
  actionParamD!: Int8Array;
  paramJ: number = 0;
  paramK: number = 0;
  paramL: number = 0;
  paramM: number = 0;
  sheetId: number = 0;
  private tileSheet!: TileSheet;

  // 静态初始化块（见文件末尾 static {} 等价：d.b[0] = true）
  static {
    SpriteDef.loadedFlags[0] = true;
  }

  private constructor() {
  }

  public getActionCount(): number {
    return this.actionCount;
  }

  public getFrameCount(n: number): number {
    return this.framesPerAction[n];
  }

  public drawFrame(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number, n6: number): void {
    const n7 = n3 & MIRROR_FLAG; // Integer.MIN_VALUE = 0x80000000
    const n8 = n3 & FLIP_VERTICAL_BIT;
    const s = this.actionFrameGroups[(n3 &= 0xffffff)][n4];
    const n9 = this.tilesPerGroup[s];
    let n10 = 0;
    while (n10 < n9) {
      const n11 = this.groupTileIndices[s][n10] & 0xffff;
      let by = this.groupTileOffsetX[s][n10];
      if (n7 !== 0) {
        by = ((-by) << 24) >> 24; // (byte)(-by)：-128 取负仍为 -128
      }
      let by2 = this.groupTileOffsetY[s][n10];
      if (n8 !== 0) {
        by2 = ((-by2) << 24) >> 24; // (byte)(-by2)
      }
      this.tileSheet.drawCell(graphics, n + by, n2 + by2, n11 | n7 | n8, n5, n6);
      ++n10;
    }
  }

  public static loadFromArchive(n: number): SpriteDef | null {
    const d2 = new SpriteDef();
    try {
      let n2: number;
      const inputStream = GameMIDlet.openEntryStream("/res/a.bin", n)!;
      const by = GameMIDlet.readByte(inputStream);
      d2.sheetId = GameMIDlet.readByte(inputStream);
      d2.tileGroupCount = GameMIDlet.readShortLE(inputStream);
      d2.tilesPerGroup = new Int16Array(d2.tileGroupCount);
      d2.groupTileIndices = new Array<Int16Array>(d2.tileGroupCount);
      d2.groupTileOffsetX = new Array<Int8Array>(d2.tileGroupCount);
      d2.groupTileOffsetY = new Array<Int8Array>(d2.tileGroupCount);
      let n3 = 0;
      while (n3 < d2.tileGroupCount) {
        d2.tilesPerGroup[n3] = GameMIDlet.readShortLE(inputStream);
        d2.groupTileIndices[n3] = new Int16Array(d2.tilesPerGroup[n3]);
        d2.groupTileOffsetX[n3] = new Int8Array(d2.tilesPerGroup[n3]);
        d2.groupTileOffsetY[n3] = new Int8Array(d2.tilesPerGroup[n3]);
        n2 = 0;
        while (n2 < d2.tilesPerGroup[n3]) {
          d2.groupTileIndices[n3][n2] = GameMIDlet.readShortLE(inputStream);
          d2.groupTileOffsetX[n3][n2] = GameMIDlet.readByte(inputStream);
          d2.groupTileOffsetY[n3][n2] = GameMIDlet.readByte(inputStream);
          ++n2;
        }
        ++n3;
      }
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      d2.actionCount = GameMIDlet.readShortLE(inputStream);
      d2.actionParamA = new Int8Array(d2.actionCount);
      d2.actionParamB = new Int8Array(d2.actionCount);
      d2.actionParamC = new Int8Array(d2.actionCount);
      d2.actionParamD = new Int8Array(d2.actionCount);
      d2.framesPerAction = new Int16Array(d2.actionCount);
      d2.actionFrameGroups = new Array<Int16Array>(d2.actionCount);
      n2 = 0;
      while (n2 < d2.actionCount) {
        d2.actionParamA[n2] = GameMIDlet.readByte(inputStream);
        d2.actionParamB[n2] = GameMIDlet.readByte(inputStream);
        d2.actionParamC[n2] = GameMIDlet.readByte(inputStream);
        d2.actionParamD[n2] = GameMIDlet.readByte(inputStream);
        d2.framesPerAction[n2] = GameMIDlet.readShortLE(inputStream);
        d2.actionFrameGroups[n2] = new Int16Array(d2.framesPerAction[n2]);
        let n4 = 0;
        while (n4 < d2.framesPerAction[n2]) {
          d2.actionFrameGroups[n2][n4] = GameMIDlet.readByte(inputStream);
          if (d2.actionFrameGroups[n2][n4] < 0) {
            const sArray = d2.actionFrameGroups[n2];
            const n5 = n4;
            sArray[n5] = (sArray[n5] + 256) | 0;
          }
          ++n4;
        }
        ++n2;
      }
      d2.paramJ = GameMIDlet.readShortLE(inputStream);
      d2.paramK = GameMIDlet.readShortLE(inputStream);
      d2.paramL = GameMIDlet.readShortLE(inputStream);
      d2.paramM = GameMIDlet.readShortLE(inputStream);
      inputStream.close();
      SpriteDef.loadedFlags[d2.sheetId] = true;
      SpriteDef.idMap[by] = d2.sheetId;
      if (SpriteDef.tileSheets[d2.sheetId] == null) {
        SpriteDef.tileSheets[d2.sheetId] = TileSheet.loadFromBin(d2.sheetId);
      }
      d2.tileSheet = SpriteDef.tileSheets[d2.sheetId]!;
    } catch (exception) {
      return null;
    }
    return d2;
  }
}
