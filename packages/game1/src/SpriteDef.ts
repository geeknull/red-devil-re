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
  getSequenceFrameCount(sequenceId: number): number {
    return this.sequenceFrameCounts[sequenceId];
  }

  /**
   * d.a(Graphics,int,int,int,int,int,int)：按 sequence/帧拼帧绘制。
   * x/y=坐标, sequence=序列索引(高2位为水平/垂直翻转标志), frame=帧索引, drawParamA/rotation=透传给图集绘制(缩放/旋转, rotation===270 时交换)。
   */
  paintSequenceFrame(graphics: Graphics, x: number, y: number, sequence: number, frame: number, drawParamA: number, rotation: number): void {
    const mirrorFlag = sequence & MIRROR_FLAG; // Integer.MIN_VALUE (0x80000000)
    const flipFlag = sequence & FLIP_VERTICAL_BIT;
    const pose = this.sequencePoseIndices[(sequence &= SEQUENCE_MASK)][frame];
    const moduleCount = this.poseModuleCounts[pose];
    graphics.setClip(0, 0, 176, 208);
    let i = 0;
    while (i < moduleCount) {
      let drawY: number;
      let drawX: number;
      const module = this.poseModuleFrames[pose][i];
      let offsetX = this.poseModuleOffsetX[pose][i];
      if (mirrorFlag !== 0) {
        offsetX = ((-offsetX) << 24) >> 24; // (byte)(-offsetX)：Java byte 取负带 i2b 截断，-128 取负仍为 -128
      }
      let offsetY = this.poseModuleOffsetY[pose][i];
      if (flipFlag !== 0) {
        offsetY = ((-offsetY) << 24) >> 24; // (byte)(-offsetY)
      }
      const shiftX = offsetX;
      const shiftY = offsetY;
      const rotatedHeight = shiftY + this.atlas.heights[module];
      if (rotation === 270) {
        drawX = x - rotatedHeight;
        drawY = y + shiftX;
      } else {
        drawX = x + offsetX;
        drawY = y + offsetY;
      }
      this.atlas.drawSprite(graphics, drawX, drawY, module | mirrorFlag | flipFlag, drawParamA, rotation);
      ++i;
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
  static loadFromBin(entryIndex: number): SpriteDef | null {
    const spriteDef = new SpriteDef();
    try {
      let i: number;
      const inputStream = GameMIDlet.openArchiveEntryStream("/res/a.bin", entryIndex)!;
      spriteDef.atlasId = GameMIDlet.readU16Le(inputStream);
      if (SpriteDef.atlasTable[spriteDef.atlasId] == null) {
        SpriteDef.atlasTable[spriteDef.atlasId] = SpriteAtlas.load(spriteDef.atlasId);
      }
      SpriteDef.atlasLoadedFlags[spriteDef.atlasId] = true;
      spriteDef.atlas = SpriteDef.atlasTable[spriteDef.atlasId]!;
      SpriteDef.resourceToAtlasId[entryIndex] = spriteDef.atlasId;
      spriteDef.poseCount = GameMIDlet.readU16Le(inputStream);
      spriteDef.poseModuleCounts = new Int16Array(spriteDef.poseCount);
      spriteDef.poseModuleFrames = new Array<Int16Array>(spriteDef.poseCount);
      spriteDef.poseModuleOffsetX = new Array<Int8Array>(spriteDef.poseCount);
      spriteDef.poseModuleOffsetY = new Array<Int8Array>(spriteDef.poseCount);
      let poseIndex = 0;
      while (poseIndex < spriteDef.poseCount) {
        spriteDef.poseModuleCounts[poseIndex] = GameMIDlet.readU16Le(inputStream);
        spriteDef.poseModuleFrames[poseIndex] = new Int16Array(spriteDef.poseModuleCounts[poseIndex]);
        spriteDef.poseModuleOffsetX[poseIndex] = new Int8Array(spriteDef.poseModuleCounts[poseIndex]);
        spriteDef.poseModuleOffsetY[poseIndex] = new Int8Array(spriteDef.poseModuleCounts[poseIndex]);
        i = 0;
        while (i < spriteDef.poseModuleCounts[poseIndex]) {
          spriteDef.poseModuleFrames[poseIndex][i] = GameMIDlet.readByte(inputStream);
          if (spriteDef.poseModuleFrames[poseIndex][i] < 0) {
            const fixupArray = spriteDef.poseModuleFrames[poseIndex];
            const idx = i;
            fixupArray[idx] = ((fixupArray[idx] + 256) << 16) >> 16; // (short)
          }
          spriteDef.poseModuleOffsetX[poseIndex][i] = GameMIDlet.readByte(inputStream);
          spriteDef.poseModuleOffsetY[poseIndex][i] = GameMIDlet.readByte(inputStream);
          ++i;
        }
        ++poseIndex;
      }
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      spriteDef.sequenceCount = GameMIDlet.readU16Le(inputStream);
      spriteDef.collisionBoxX = new Int8Array(spriteDef.sequenceCount);
      spriteDef.collisionBoxY = new Int8Array(spriteDef.sequenceCount);
      spriteDef.collisionBoxWidth = new Int8Array(spriteDef.sequenceCount);
      spriteDef.collisionBoxHeight = new Int8Array(spriteDef.sequenceCount);
      spriteDef.sequenceFrameCounts = new Int16Array(spriteDef.sequenceCount);
      spriteDef.sequencePoseIndices = new Array<Int16Array>(spriteDef.sequenceCount);
      i = 0;
      while (i < spriteDef.sequenceCount) {
        spriteDef.collisionBoxX[i] = GameMIDlet.readByte(inputStream);
        spriteDef.collisionBoxY[i] = GameMIDlet.readByte(inputStream);
        spriteDef.collisionBoxWidth[i] = GameMIDlet.readByte(inputStream);
        spriteDef.collisionBoxHeight[i] = GameMIDlet.readByte(inputStream);
        spriteDef.sequenceFrameCounts[i] = GameMIDlet.readU16Le(inputStream);
        spriteDef.sequencePoseIndices[i] = new Int16Array(spriteDef.sequenceFrameCounts[i]);
        let frameIndex = 0;
        while (frameIndex < spriteDef.sequenceFrameCounts[i]) {
          spriteDef.sequencePoseIndices[i][frameIndex] = GameMIDlet.readByte(inputStream);
          if (spriteDef.sequencePoseIndices[i][frameIndex] < 0) {
            const fixupArray = spriteDef.sequencePoseIndices[i];
            const idx = frameIndex;
            fixupArray[idx] = ((fixupArray[idx] + 256) << 16) >> 16; // (short)
          }
          ++frameIndex;
        }
        ++i;
      }
      spriteDef.boundsX = GameMIDlet.readU16Le(inputStream);
      spriteDef.boundsY = GameMIDlet.readU16Le(inputStream);
      spriteDef.boundsWidth = GameMIDlet.readU16Le(inputStream);
      spriteDef.boundsHeight = GameMIDlet.readU16Le(inputStream);
      spriteDef.atlasId = 0;
      inputStream.close();
    } catch (exception) {
      return null;
    }
    return spriteDef;
  }

  // 静态初始化块：原版 static { d.b[0] = true; }
  static {
    SpriteDef.atlasLoadedFlags[0] = true;
  }
}
