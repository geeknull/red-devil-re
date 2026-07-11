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
import { MIRROR_FLAG, FLIP_VERTICAL_BIT, SEQUENCE_MASK } from "./constants.ts";

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

  /**
   * 私有无参构造器（CFR d.java 的 `<init>()V`）。
   * 仅由静态工厂 {@link SpriteDef.loadFromArchive} 内部 new 出空壳实例，
   * 随后由工厂逐字段从 a.bin 填充；外部不可直接构造。
   */
  private constructor() {
  }

  /**
   * 返回本动作定义包含的动作数（字段 r / actionCount）。
   * 二开遍历某 actor 的所有动作（如切换待机/移动/攻击动画）时按此取上界。
   * 对应 CFR d.java 的 getter（无副作用）。
   */
  public getActionCount(): number {
    return this.actionCount;
  }

  /**
   * 返回第 n 个动作的帧数（字段 s[n] / framesPerAction[n]）。
   * 二开推进动画帧索引时按此取该动作的帧上界（如帧循环 frame % getFrameCount(action)）。
   * @param actionId 动作号（0 ≤ actionId < {@link getActionCount}）。
   */
  public getFrameCount(actionId: number): number {
    return this.framesPerAction[actionId];
  }

  /**
   * 主绘制方法（CFR d.java 的 `a(Graphics,IIIIII)V`）：把动作 n3 的第 n4 帧绘制到 (n, n2)。
   * 帧 = 一组图块；逐个取出该组图块的子图索引与 x/y 偏移，加偏移、按需镜像后调
   * {@link TileSheet.drawCell} 绘制到本定义所属图集 tileSheet 上。
   *
   * 动作号 n3 的高位即镜像标志：0x80000000(MIRROR_FLAG, 水平镜像) 与 0x40000000(FLIP_VERTICAL_BIT,
   * 垂直镜像) 被先剥离为 n7/n8，再用低 24 位(0xffffff)索引 actionFrameGroups。镜像时偏移量取
   * (byte)(-by)（-128 取负仍为 -128，忠实复刻 Java byte 溢出），并把镜像位 OR 进 drawCell 的子图参数。
   *
   * @param graphics 目标画布。
   * @param x  绘制锚点 x（屏幕坐标）。
   * @param y 绘制锚点 y（屏幕坐标）。
   * @param action 动作号，含高位镜像标志（见上）。
   * @param frame 帧号（0 ≤ frame < {@link getFrameCount}(action 低 24 位)）。
   * @param drawParamA 透传给 drawCell 的参数（如调色板/分组）。
   * @param drawParamB 透传给 drawCell 的参数。
   */
  public drawFrame(graphics: Graphics, x: number, y: number, action: number, frame: number, drawParamA: number, drawParamB: number): void {
    const mirrorFlag = action & MIRROR_FLAG; // Integer.MIN_VALUE = 0x80000000
    const flipFlag = action & FLIP_VERTICAL_BIT;
    const group = this.actionFrameGroups[(action &= SEQUENCE_MASK)][frame];
    const tileCount = this.tilesPerGroup[group];
    let i = 0;
    while (i < tileCount) {
      const cellIndex = this.groupTileIndices[group][i] & 0xffff;
      let offsetX = this.groupTileOffsetX[group][i];
      if (mirrorFlag !== 0) {
        offsetX = ((-offsetX) << 24) >> 24; // (byte)(-offsetX)：-128 取负仍为 -128
      }
      let offsetY = this.groupTileOffsetY[group][i];
      if (flipFlag !== 0) {
        offsetY = ((-offsetY) << 24) >> 24; // (byte)(-offsetY)
      }
      this.tileSheet.drawCell(graphics, x + offsetX, y + offsetY, cellIndex | mirrorFlag | flipFlag, drawParamA, drawParamB);
      ++i;
    }
  }

  /**
   * 静态工厂（CFR d.java 的 `b(I)Ltjge/d;`）：从归档 /res/a.bin 第 n 条读取并解析一份精灵动作定义。
   * 二开新增/查表 actor 类型的动作集时由此入口加载（上层经 ActorScene.loadActorDef 调用）。
   *
   * 解析顺序（小端，全程忠实复刻 d.java）：外部 id `by` → 图集 id sheetId → 图块组数 tileGroupCount，
   * 逐组读 tilesPerGroup 及每图块的 (子图索引, x 偏移, y 偏移)；跳过 4 字节占位；读动作数 actionCount，
   * 逐动作读 4 个 byte 参数(A~D)、帧数、各帧引用的图块组索引（负值 +256 还原为无符号）；末尾读 4 个 short(J~M)。
   * 完成后置 loadedFlags[sheetId]=true、登记 idMap[by]=sheetId，并按需经 {@link TileSheet.loadFromBin}
   * 加载并绑定图集 tileSheet。
   *
   * @param entryIndex a.bin 中的条目序号。
   * @returns 解析成功的 SpriteDef 实例；任何异常（IO/格式）均吞掉并返回 null（与原版一致）。
   */
  public static loadFromArchive(entryIndex: number): SpriteDef | null {
    const spriteDef = new SpriteDef();
    try {
      let i: number;
      const inputStream = GameMIDlet.openEntryStream("/res/a.bin", entryIndex)!;
      const externalId = GameMIDlet.readByte(inputStream);
      spriteDef.sheetId = GameMIDlet.readByte(inputStream);
      spriteDef.tileGroupCount = GameMIDlet.readShortLE(inputStream);
      spriteDef.tilesPerGroup = new Int16Array(spriteDef.tileGroupCount);
      spriteDef.groupTileIndices = new Array<Int16Array>(spriteDef.tileGroupCount);
      spriteDef.groupTileOffsetX = new Array<Int8Array>(spriteDef.tileGroupCount);
      spriteDef.groupTileOffsetY = new Array<Int8Array>(spriteDef.tileGroupCount);
      let groupIndex = 0;
      while (groupIndex < spriteDef.tileGroupCount) {
        spriteDef.tilesPerGroup[groupIndex] = GameMIDlet.readShortLE(inputStream);
        spriteDef.groupTileIndices[groupIndex] = new Int16Array(spriteDef.tilesPerGroup[groupIndex]);
        spriteDef.groupTileOffsetX[groupIndex] = new Int8Array(spriteDef.tilesPerGroup[groupIndex]);
        spriteDef.groupTileOffsetY[groupIndex] = new Int8Array(spriteDef.tilesPerGroup[groupIndex]);
        i = 0;
        while (i < spriteDef.tilesPerGroup[groupIndex]) {
          spriteDef.groupTileIndices[groupIndex][i] = GameMIDlet.readShortLE(inputStream);
          spriteDef.groupTileOffsetX[groupIndex][i] = GameMIDlet.readByte(inputStream);
          spriteDef.groupTileOffsetY[groupIndex][i] = GameMIDlet.readByte(inputStream);
          ++i;
        }
        ++groupIndex;
      }
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      spriteDef.actionCount = GameMIDlet.readShortLE(inputStream);
      spriteDef.actionParamA = new Int8Array(spriteDef.actionCount);
      spriteDef.actionParamB = new Int8Array(spriteDef.actionCount);
      spriteDef.actionParamC = new Int8Array(spriteDef.actionCount);
      spriteDef.actionParamD = new Int8Array(spriteDef.actionCount);
      spriteDef.framesPerAction = new Int16Array(spriteDef.actionCount);
      spriteDef.actionFrameGroups = new Array<Int16Array>(spriteDef.actionCount);
      i = 0;
      while (i < spriteDef.actionCount) {
        spriteDef.actionParamA[i] = GameMIDlet.readByte(inputStream);
        spriteDef.actionParamB[i] = GameMIDlet.readByte(inputStream);
        spriteDef.actionParamC[i] = GameMIDlet.readByte(inputStream);
        spriteDef.actionParamD[i] = GameMIDlet.readByte(inputStream);
        spriteDef.framesPerAction[i] = GameMIDlet.readShortLE(inputStream);
        spriteDef.actionFrameGroups[i] = new Int16Array(spriteDef.framesPerAction[i]);
        let frameIndex = 0;
        while (frameIndex < spriteDef.framesPerAction[i]) {
          spriteDef.actionFrameGroups[i][frameIndex] = GameMIDlet.readByte(inputStream);
          if (spriteDef.actionFrameGroups[i][frameIndex] < 0) {
            const frameGroups = spriteDef.actionFrameGroups[i];
            const idx = frameIndex;
            frameGroups[idx] = (frameGroups[idx] + 256) | 0;
          }
          ++frameIndex;
        }
        ++i;
      }
      spriteDef.paramJ = GameMIDlet.readShortLE(inputStream);
      spriteDef.paramK = GameMIDlet.readShortLE(inputStream);
      spriteDef.paramL = GameMIDlet.readShortLE(inputStream);
      spriteDef.paramM = GameMIDlet.readShortLE(inputStream);
      inputStream.close();
      SpriteDef.loadedFlags[spriteDef.sheetId] = true;
      SpriteDef.idMap[externalId] = spriteDef.sheetId;
      if (SpriteDef.tileSheets[spriteDef.sheetId] == null) {
        SpriteDef.tileSheets[spriteDef.sheetId] = TileSheet.loadFromBin(spriteDef.sheetId);
      }
      spriteDef.tileSheet = SpriteDef.tileSheets[spriteDef.sheetId]!;
    } catch (exception) {
      return null;
    }
    return spriteDef;
  }
}
