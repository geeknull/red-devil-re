// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/d.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import java.io.InputStream;
import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.GameScreen;       // 原 tjge.a
import tjge.SpriteAtlas;      // 原 tjge.i

public final class SpriteDef {
    // 静态：图集(SpriteAtlas)表，按图集 id 索引，容量 32，懒加载缓存。            (原 a)
    public static SpriteAtlas[] atlasTable = new SpriteAtlas[32];
    // 静态：各图集 id 的已加载标志表，容量 32；索引 0 在静态块中置 true。           (原 b)
    public static boolean[] atlasLoadedFlags = new boolean[32];
    // 静态：资源条目索引 → 图集 id 的映射表，容量 32。                          (原 c)
    public static int[] resourceToAtlasId = new int[32];

    private short poseCount;                 // pose（拼帧姿态）数量。                                    (原 o)
    private short[] poseModuleCounts;        // 每个 pose 的模块(分块)数量。                              (原 p)
    private short[][] poseModuleFrames;      // 每个 pose 各模块在图集中的帧索引(读取时负值+256还原)。      (原 q)
    public byte[][] poseModuleOffsetX;       // 每个 pose 各模块的 x 偏移。                               (原 d)
    public byte[][] poseModuleOffsetY;       // 每个 pose 各模块的 y 偏移。                               (原 e)
    private short sequenceCount;             // sequence（动画序列）数量。                                (原 r)
    private short[] sequenceFrameCounts;     // 每个 sequence 的帧数。                                    (原 s)
    private short[][] sequencePoseIndices;   // 每个 sequence 的逐帧 pose 索引序列(读取时负值+256还原)。   (原 t)
    public byte[] collisionBoxX;             // 每个 sequence 的碰撞箱 x。                                (原 f)
    public byte[] collisionBoxY;             // 每个 sequence 的碰撞箱 y。                                (原 g)
    public byte[] collisionBoxWidth;         // 每个 sequence 的碰撞箱宽 w。                              (原 h)
    public byte[] collisionBoxHeight;        // 每个 sequence 的碰撞箱高 h。                              (原 i)
    public short boundsX;                    // 整体边界 x。                                              (原 j)
    public short boundsY;                    // 整体边界 y。                                              (原 k)
    public short boundsWidth;                // 整体边界宽。                                              (原 l)
    public short boundsHeight;               // 整体边界高。                                              (原 m)
    public short atlasId;                    // 图集 id（临时字段：解析时读入并关联图集，末尾被清零）。      (原 n)
    private SpriteAtlas atlas;               // 本精灵关联的图集，绘制时调用其拼块绘制。                    (原 u)

    // 私有构造函数，仅供静态工厂 loadFromBin(int) 内部创建实例。
    private SpriteDef() {
    }

    // 返回 sequence（动画序列）数量。                                          (原 a()S)
    public final short getSequenceCount() {
        return this.sequenceCount;
    }

    // 返回第 sequenceIndex 个 sequence 的帧数。                                (原 a(I)S)
    public final short getSequenceFrameCount(int sequenceIndex) {
        return this.sequenceFrameCounts[sequenceIndex];
    }

    // 按 sequence 索引(高2位为水平/垂直翻转标志)与帧索引，把对应 pose 的各模块帧逐块拼到 Graphics 上绘制。
    // (原 a(Graphics;IIIIII)V)
    public final void paintSequenceFrame(Graphics graphics, int x, int y, int sequenceIndexFlags, int frameIndex, int n5, int orientation) {
        int flipHorizontal = sequenceIndexFlags & Integer.MIN_VALUE;
        int flipVertical = sequenceIndexFlags & 0x40000000;
        short pose = this.sequencePoseIndices[sequenceIndexFlags &= 0xFFFFFF][frameIndex];
        int moduleCount = this.poseModuleCounts[pose];
        graphics.setClip(0, 0, 176, 208);
        int module = 0;
        while (module < moduleCount) {
            int drawY;
            int drawX;
            short moduleFrame = this.poseModuleFrames[pose][module];
            byte offsetX = this.poseModuleOffsetX[pose][module];
            if (flipHorizontal != 0) {
                offsetX = (byte)(-offsetX);
            }
            byte offsetY = this.poseModuleOffsetY[pose][module];
            if (flipVertical != 0) {
                offsetY = (byte)(-offsetY);
            }
            byte offsetXFinal = offsetX;
            byte offsetYFinal = offsetY;
            int n13 = offsetYFinal + this.atlas.heights[moduleFrame];
            if (orientation == 270) {
                drawX = x - n13;
                drawY = y + offsetXFinal;
            } else {
                drawX = x + offsetX;
                drawY = y + offsetY;
            }
            this.atlas.drawSprite(graphics, drawX, drawY, moduleFrame | flipHorizontal | flipVertical, n5, orientation);
            ++module;
        }
    }

    // 释放本精灵持有的所有 pose/sequence/碰撞箱数组与图集引用。                  (原 b()V)
    public final void dispose() {
        this.collisionBoxX = null;
        this.collisionBoxY = null;
        this.collisionBoxWidth = null;
        this.collisionBoxHeight = null;
        int n = 0;
        while (n < this.sequencePoseIndices.length) {
            this.sequencePoseIndices[n] = null;
            ++n;
        }
        this.sequencePoseIndices = null;
        int n2 = 0;
        while (n2 < this.poseModuleFrames.length) {
            this.poseModuleFrames[n2] = null;
            this.poseModuleOffsetX[n2] = null;
            this.poseModuleOffsetY[n2] = null;
            ++n2;
        }
        this.poseModuleFrames = null;
        this.poseModuleOffsetX = null;
        this.poseModuleOffsetY = null;
        this.poseModuleCounts = null;
        this.sequenceFrameCounts = null;
        this.atlas = null;
    }

    // 静态：依据 GameScreen.isScrollLevel(int) 刷新各资源索引对应图集的已加载标志表。   (原 c()V)
    public static final void refreshLoadedAtlasFlags() {
        int n = 1;
        while (n < 32) {
            tjge.SpriteDef.atlasLoadedFlags[tjge.SpriteDef.resourceToAtlasId[n]] = tjge.GameScreen.isScrollLevel(n);
            ++n;
        }
    }

    // 静态工厂：从 /res/a.bin 第 entryIndex 条目解析出 SpriteDef（pose 拼帧 + sequence 序列 + 碰撞箱），失败返回 null。
    // (原 b(I)Ltjge/d;)
    public static final SpriteDef loadFromBin(int entryIndex) {
        SpriteDef spriteDef = new SpriteDef();
        try {
            int pose;
            InputStream inputStream = GameMIDlet.openArchiveEntryStream("/res/a.bin", entryIndex);
            spriteDef.atlasId = GameMIDlet.readU16Le(inputStream);
            if (atlasTable[spriteDef.atlasId] == null) {
                tjge.SpriteDef.atlasTable[spriteDef.atlasId] = tjge.SpriteAtlas.load(spriteDef.atlasId);
            }
            tjge.SpriteDef.atlasLoadedFlags[spriteDef.atlasId] = true;
            spriteDef.atlas = atlasTable[spriteDef.atlasId];
            tjge.SpriteDef.resourceToAtlasId[entryIndex] = spriteDef.atlasId;
            spriteDef.poseCount = GameMIDlet.readU16Le(inputStream);
            spriteDef.poseModuleCounts = new short[spriteDef.poseCount];
            spriteDef.poseModuleFrames = new short[spriteDef.poseCount][];
            spriteDef.poseModuleOffsetX = new byte[spriteDef.poseCount][];
            spriteDef.poseModuleOffsetY = new byte[spriteDef.poseCount][];
            int poseIndex = 0;
            while (poseIndex < spriteDef.poseCount) {
                spriteDef.poseModuleCounts[poseIndex] = GameMIDlet.readU16Le(inputStream);
                spriteDef.poseModuleFrames[poseIndex] = new short[spriteDef.poseModuleCounts[poseIndex]];
                spriteDef.poseModuleOffsetX[poseIndex] = new byte[spriteDef.poseModuleCounts[poseIndex]];
                spriteDef.poseModuleOffsetY[poseIndex] = new byte[spriteDef.poseModuleCounts[poseIndex]];
                pose = 0;
                while (pose < spriteDef.poseModuleCounts[poseIndex]) {
                    spriteDef.poseModuleFrames[poseIndex][pose] = GameMIDlet.readByte(inputStream);
                    if (spriteDef.poseModuleFrames[poseIndex][pose] < 0) {
                        short[] frames = spriteDef.poseModuleFrames[poseIndex];
                        int idx = pose;
                        frames[idx] = (short)(frames[idx] + 256);
                    }
                    spriteDef.poseModuleOffsetX[poseIndex][pose] = GameMIDlet.readByte(inputStream);
                    spriteDef.poseModuleOffsetY[poseIndex][pose] = GameMIDlet.readByte(inputStream);
                    ++pose;
                }
                ++poseIndex;
            }
            inputStream.read();
            inputStream.read();
            inputStream.read();
            inputStream.read();
            spriteDef.sequenceCount = GameMIDlet.readU16Le(inputStream);
            spriteDef.collisionBoxX = new byte[spriteDef.sequenceCount];
            spriteDef.collisionBoxY = new byte[spriteDef.sequenceCount];
            spriteDef.collisionBoxWidth = new byte[spriteDef.sequenceCount];
            spriteDef.collisionBoxHeight = new byte[spriteDef.sequenceCount];
            spriteDef.sequenceFrameCounts = new short[spriteDef.sequenceCount];
            spriteDef.sequencePoseIndices = new short[spriteDef.sequenceCount][];
            pose = 0;
            while (pose < spriteDef.sequenceCount) {
                spriteDef.collisionBoxX[pose] = GameMIDlet.readByte(inputStream);
                spriteDef.collisionBoxY[pose] = GameMIDlet.readByte(inputStream);
                spriteDef.collisionBoxWidth[pose] = GameMIDlet.readByte(inputStream);
                spriteDef.collisionBoxHeight[pose] = GameMIDlet.readByte(inputStream);
                spriteDef.sequenceFrameCounts[pose] = GameMIDlet.readU16Le(inputStream);
                spriteDef.sequencePoseIndices[pose] = new short[spriteDef.sequenceFrameCounts[pose]];
                int frame = 0;
                while (frame < spriteDef.sequenceFrameCounts[pose]) {
                    spriteDef.sequencePoseIndices[pose][frame] = GameMIDlet.readByte(inputStream);
                    if (spriteDef.sequencePoseIndices[pose][frame] < 0) {
                        short[] poses = spriteDef.sequencePoseIndices[pose];
                        int idx = frame;
                        poses[idx] = (short)(poses[idx] + 256);
                    }
                    ++frame;
                }
                ++pose;
            }
            spriteDef.boundsX = GameMIDlet.readU16Le(inputStream);
            spriteDef.boundsY = GameMIDlet.readU16Le(inputStream);
            spriteDef.boundsWidth = GameMIDlet.readU16Le(inputStream);
            spriteDef.boundsHeight = GameMIDlet.readU16Le(inputStream);
            spriteDef.atlasId = 0;
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return spriteDef;
    }

    static {
        tjge.SpriteDef.atlasLoadedFlags[0] = true;
    }
}
