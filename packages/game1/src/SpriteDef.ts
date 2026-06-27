/**
 * 游戏1《红魔特种兵》精灵帧定义/拼帧绘制。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/d.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 职责：解析 a.bin（两级动画：pose 拼帧 + sequence 序列 + 碰撞箱），
 *       提供拼帧绘制 a_GIIIIII（按 pose 把模块帧逐块拼到 Graphics）。
 *
 * 字段别名：
 *   静态 a=精灵图集(i)表, b=已加载标志表, c=资源索引→图集id映射
 *   o=pose 数量, p=每个 pose 的模块数, q=每个 pose 各模块的帧索引(0..255)
 *   d=每个 pose 各模块的 x 偏移(byte), e=每个 pose 各模块的 y 偏移(byte)
 *   r=sequence 数量, s=每个 sequence 的帧数, t=每个 sequence 的 pose 索引序列
 *   f/g/h/i=每个 sequence 的碰撞箱 x/y/w/h, j/k/l/m=整体边界, n=图集id(临时)
 *   u=本精灵关联的图集(i)
 *
 * 方法映射：a()→a_, a(int)→a_I, a(Graphics,6×int)→a_GIIIIII,
 *           b()→b_, c()→c_(static), b(int)→b_I(static), 构造→constructor
 */
import { Graphics } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameScreen } from "./GameScreen.ts";
import { SpriteAtlas } from "./SpriteAtlas.ts";
import { MIRROR_FLAG, FLIP_VERTICAL_BIT, SEQUENCE_MASK } from "./constants.ts";

/**
 * 精灵帧/动画定义（原 CFR `tjge.d`，基准文件 reverse/game1/2-decompiled-cfr/tjge/d.java）。
 *
 * 角色：游戏1《红魔特种兵》的两级动画资源描述符。解析归档 a.bin 的单条目，得到一套
 * 「pose（拼帧姿态）+ sequence（动画序列）+ 碰撞箱」数据，是所有演员（Player/Enemy/Boss/
 * Projectile/Effect/Pickup）绘制与碰撞的底层数据来源。每个精灵类型对应一个 SpriteDef 实例，
 * 由 LevelLoader 引用计数管理、由 GameScreen.createActor 传给演员；演员只持有 pose/sequence
 * 索引，真正的逐块拼帧绘制委托给本类的 {@link paintSequenceFrame}。
 *
 * 数据模型（两级动画）：
 *   - pose：一个静态拼帧姿态，由若干「模块」组成，每个模块 = 图集小图帧索引 + (x,y) 偏移；
 *   - sequence：一段动画，由一串 pose 索引构成（逐帧切换 pose），并附带该动画的碰撞箱。
 *
 * 关键字段（混淆名→语义，详见 reverse/game1/3-readable/SYMBOLS.md「SpriteDef」节）：
 *   - 静态 atlasTable=图集(SpriteAtlas)缓存表[32]，atlasLoadedFlags=各图集已加载标志[32]，
 *     resourceToAtlasId=资源条目索引→图集 id 映射[32]；
 *   - poseCount/poseModuleCounts/poseModuleFrames=pose 数量/每 pose 模块数/每模块图集帧索引；
 *   - poseModuleOffsetX/poseModuleOffsetY=每模块的有符号 x/y 偏移（绘制时按翻转标志取负）；
 *   - sequenceCount/sequenceFrameCounts/sequencePoseIndices=动画数量/每动画帧数/每帧的 pose 索引；
 *   - collisionBoxX/Y/Width/Height=每个 sequence 的碰撞箱（有符号 byte）；
 *   - boundsX/Y/Width/Height=精灵整体边界；atlasId=临时图集 id；atlas=本精灵关联的图集对象。
 *
 * 协作者：SpriteAtlas（提供 drawSprite 贴图与 heights 表）、GameMIDlet（提供 .bin 流定位与小端读取）、
 * GameScreen（提供 isScrollLevel 判定，供 refreshLoadedAtlasFlags 使用）。
 */
export class SpriteDef {
  static atlasTable: (SpriteAtlas | null)[] = new Array<SpriteAtlas | null>(32).fill(null);
  static atlasLoadedFlags: boolean[] = new Array<boolean>(32).fill(false);
  static resourceToAtlasId: Int32Array = new Int32Array(32);

  private poseCount: number = 0; // short
  private poseModuleCounts!: Int16Array; // short[]
  private poseModuleFrames!: Int16Array[]; // short[][]
  poseModuleOffsetX!: Int8Array[]; // byte[][]
  poseModuleOffsetY!: Int8Array[]; // byte[][]
  private sequenceCount: number = 0; // short
  private sequenceFrameCounts!: Int16Array; // short[]
  private sequencePoseIndices!: Int16Array[]; // short[][]
  collisionBoxX!: Int8Array; // byte[]
  collisionBoxY!: Int8Array; // byte[]
  collisionBoxWidth!: Int8Array; // byte[]
  collisionBoxHeight!: Int8Array; // byte[]
  boundsX: number = 0; // short
  boundsY: number = 0; // short
  boundsWidth: number = 0; // short
  boundsHeight: number = 0; // short
  atlasId: number = 0; // short
  private atlas!: SpriteAtlas;

  /** d.<init>()：私有构造函数，仅供静态工厂 {@link loadFromBin} 内部创建实例（外部应走工厂方法）。 */
  private constructor() {
  }

  /** d.a()：返回 sequence 数量 r。 */
  getSequenceCount(): number {
    return this.sequenceCount;
  }

  /** d.a(int)：返回第 n 个 sequence 的帧数 s[n]。 */
  getSequenceFrameCount(n: number): number {
    return this.sequenceFrameCounts[n];
  }

  /**
   * d.a(Graphics,int,int,int,int,int,int)：按 sequence/帧拼帧绘制。
   * n=x, n2=y, n3=sequence索引(高2位为水平/垂直翻转标志), n4=帧索引, n5/n6=透传给图集绘制(缩放/旋转)。
   */
  paintSequenceFrame(graphics: Graphics, n: number, n2: number, n3: number, n4: number, n5: number, n6: number): void {
    const n7 = n3 & MIRROR_FLAG; // Integer.MIN_VALUE (0x80000000)
    const n8 = n3 & FLIP_VERTICAL_BIT;
    const s = this.sequencePoseIndices[(n3 &= SEQUENCE_MASK)][n4];
    const n9 = this.poseModuleCounts[s];
    graphics.setClip(0, 0, 176, 208);
    let n10 = 0;
    while (n10 < n9) {
      let n11: number;
      let n12: number;
      const s2 = this.poseModuleFrames[s][n10];
      let by = this.poseModuleOffsetX[s][n10];
      if (n7 !== 0) {
        by = ((-by) << 24) >> 24; // (byte)(-by)：Java byte 取负带 i2b 截断，-128 取负仍为 -128
      }
      let by2 = this.poseModuleOffsetY[s][n10];
      if (n8 !== 0) {
        by2 = ((-by2) << 24) >> 24; // (byte)(-by2)
      }
      const by3 = by;
      const by4 = by2;
      const n13 = by4 + this.atlas.heights[s2];
      if (n6 === 270) {
        n12 = n - n13;
        n11 = n2 + by3;
      } else {
        n12 = n + by;
        n11 = n2 + by2;
      }
      this.atlas.drawSprite(graphics, n12, n11, s2 | n7 | n8, n5, n6);
      ++n10;
    }
  }

  /** d.b()：释放本精灵持有的所有数组引用。 */
  dispose(): void {
    this.collisionBoxX = null as unknown as Int8Array;
    this.collisionBoxY = null as unknown as Int8Array;
    this.collisionBoxWidth = null as unknown as Int8Array;
    this.collisionBoxHeight = null as unknown as Int8Array;
    let n = 0;
    while (n < this.sequencePoseIndices.length) {
      this.sequencePoseIndices[n] = null as unknown as Int16Array;
      ++n;
    }
    this.sequencePoseIndices = null as unknown as Int16Array[];
    let n2 = 0;
    while (n2 < this.poseModuleFrames.length) {
      this.poseModuleFrames[n2] = null as unknown as Int16Array;
      this.poseModuleOffsetX[n2] = null as unknown as Int8Array;
      this.poseModuleOffsetY[n2] = null as unknown as Int8Array;
      ++n2;
    }
    this.poseModuleFrames = null as unknown as Int16Array[];
    this.poseModuleOffsetX = null as unknown as Int8Array[];
    this.poseModuleOffsetY = null as unknown as Int8Array[];
    this.poseModuleCounts = null as unknown as Int16Array;
    this.sequenceFrameCounts = null as unknown as Int16Array;
    this.atlas = null as unknown as SpriteAtlas;
  }

  /** d.c()：刷新已加载图集表 b 的有效性（依据 a.d_I）。 */
  static refreshLoadedAtlasFlags(): void {
    let n = 1;
    while (n < 32) {
      SpriteDef.atlasLoadedFlags[SpriteDef.resourceToAtlasId[n]] = GameScreen.isScrollLevel(n);
      ++n;
    }
  }

  /**
   * d.b(int)：从 /res/a.bin 第 n 条目解析精灵帧定义。
   * 解析失败（异常）返回 null（保持原版吞异常返回 null 语义）。
   */
  static loadFromBin(n: number): SpriteDef | null {
    const d2 = new SpriteDef();
    try {
      let n2: number;
      const inputStream = GameMIDlet.openArchiveEntryStream("/res/a.bin", n)!;
      d2.atlasId = GameMIDlet.readU16Le(inputStream);
      if (SpriteDef.atlasTable[d2.atlasId] == null) {
        SpriteDef.atlasTable[d2.atlasId] = SpriteAtlas.load(d2.atlasId);
      }
      SpriteDef.atlasLoadedFlags[d2.atlasId] = true;
      d2.atlas = SpriteDef.atlasTable[d2.atlasId]!;
      SpriteDef.resourceToAtlasId[n] = d2.atlasId;
      d2.poseCount = GameMIDlet.readU16Le(inputStream);
      d2.poseModuleCounts = new Int16Array(d2.poseCount);
      d2.poseModuleFrames = new Array<Int16Array>(d2.poseCount);
      d2.poseModuleOffsetX = new Array<Int8Array>(d2.poseCount);
      d2.poseModuleOffsetY = new Array<Int8Array>(d2.poseCount);
      let n3 = 0;
      while (n3 < d2.poseCount) {
        d2.poseModuleCounts[n3] = GameMIDlet.readU16Le(inputStream);
        d2.poseModuleFrames[n3] = new Int16Array(d2.poseModuleCounts[n3]);
        d2.poseModuleOffsetX[n3] = new Int8Array(d2.poseModuleCounts[n3]);
        d2.poseModuleOffsetY[n3] = new Int8Array(d2.poseModuleCounts[n3]);
        n2 = 0;
        while (n2 < d2.poseModuleCounts[n3]) {
          d2.poseModuleFrames[n3][n2] = GameMIDlet.readByte(inputStream);
          if (d2.poseModuleFrames[n3][n2] < 0) {
            const sArray = d2.poseModuleFrames[n3];
            const n4 = n2;
            sArray[n4] = ((sArray[n4] + 256) << 16) >> 16; // (short)
          }
          d2.poseModuleOffsetX[n3][n2] = GameMIDlet.readByte(inputStream);
          d2.poseModuleOffsetY[n3][n2] = GameMIDlet.readByte(inputStream);
          ++n2;
        }
        ++n3;
      }
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      d2.sequenceCount = GameMIDlet.readU16Le(inputStream);
      d2.collisionBoxX = new Int8Array(d2.sequenceCount);
      d2.collisionBoxY = new Int8Array(d2.sequenceCount);
      d2.collisionBoxWidth = new Int8Array(d2.sequenceCount);
      d2.collisionBoxHeight = new Int8Array(d2.sequenceCount);
      d2.sequenceFrameCounts = new Int16Array(d2.sequenceCount);
      d2.sequencePoseIndices = new Array<Int16Array>(d2.sequenceCount);
      n2 = 0;
      while (n2 < d2.sequenceCount) {
        d2.collisionBoxX[n2] = GameMIDlet.readByte(inputStream);
        d2.collisionBoxY[n2] = GameMIDlet.readByte(inputStream);
        d2.collisionBoxWidth[n2] = GameMIDlet.readByte(inputStream);
        d2.collisionBoxHeight[n2] = GameMIDlet.readByte(inputStream);
        d2.sequenceFrameCounts[n2] = GameMIDlet.readU16Le(inputStream);
        d2.sequencePoseIndices[n2] = new Int16Array(d2.sequenceFrameCounts[n2]);
        let n5 = 0;
        while (n5 < d2.sequenceFrameCounts[n2]) {
          d2.sequencePoseIndices[n2][n5] = GameMIDlet.readByte(inputStream);
          if (d2.sequencePoseIndices[n2][n5] < 0) {
            const sArray = d2.sequencePoseIndices[n2];
            const n6 = n5;
            sArray[n6] = ((sArray[n6] + 256) << 16) >> 16; // (short)
          }
          ++n5;
        }
        ++n2;
      }
      d2.boundsX = GameMIDlet.readU16Le(inputStream);
      d2.boundsY = GameMIDlet.readU16Le(inputStream);
      d2.boundsWidth = GameMIDlet.readU16Le(inputStream);
      d2.boundsHeight = GameMIDlet.readU16Le(inputStream);
      d2.atlasId = 0;
      inputStream.close();
    } catch (exception) {
      return null;
    }
    return d2;
  }

  // 静态初始化块：原版 static { d.b[0] = true; }
  static {
    SpriteDef.atlasLoadedFlags[0] = true;
  }
}
