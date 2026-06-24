// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/d.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
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
import tjge.TileSheet; // 原 tjge.i

public final class SpriteDef { // 原 tjge.d
    // 原 a：每个内部 id 对应的图集 TileSheet 数组[32]（懒加载，跨实例共享）
    public static TileSheet[] tileSheets = new TileSheet[32];
    // 原 b：各图集是否已加载的标志数组[32]
    public static boolean[] loadedFlags = new boolean[32];
    // 原 c：外部 id → 内部图集 id 的映射表[32]
    public static int[] idMap = new int[32];
    // 原 o：图块组数（每组是一帧拼图所用的一批子图）
    private short tileGroupCount;
    // 原 p：每个图块组包含的图块数[tileGroupCount]
    private short[] tilesPerGroup;
    // 原 q：每组各图块引用的子图(tile)索引[tileGroupCount][tilesPerGroup]
    private short[][] groupTileIndices;
    // 原 d：每组各图块的 x 偏移（byte，可负；水平镜像时取反）
    public byte[][] groupTileOffsetX;
    // 原 e：每组各图块的 y 偏移（byte，可负；垂直镜像时取反）
    public byte[][] groupTileOffsetY;
    // 原 r：动作总数
    private short actionCount;
    // 原 s：每个动作的帧数[actionCount]
    private short[] framesPerAction;
    // 原 t：每个动作各帧引用的图块组索引[actionCount][framesPerAction]
    private short[][] actionFrameGroups;
    // 原 f：每个动作的 byte 参数表 A[actionCount]
    public byte[] actionParamA;
    // 原 g：每个动作的 byte 参数表 B[actionCount]
    public byte[] actionParamB;
    // 原 h：每个动作的 byte 参数表 C[actionCount]
    public byte[] actionParamC;
    // 原 i：每个动作的 byte 参数表 D[actionCount]
    public byte[] actionParamD;
    // 原 j：全局 short 参数 J（动作定义末尾的 4 个 short 之一）
    public short paramJ;
    // 原 k：全局 short 参数 K
    public short paramK;
    // 原 l：全局 short 参数 L
    public short paramL;
    // 原 m：全局 short 参数 M
    public short paramM;
    // 原 n：本定义所属图集的内部 id（用于索引静态 tileSheets/loadedFlags）
    public short sheetId;
    // 原 u：本定义实际使用的图集 TileSheet 实例（= tileSheets[sheetId]）
    private TileSheet tileSheet;

    // 原 d.<init> ()V：私有无参构造器，仅由静态工厂 loadFromArchive 内部 new 出实例
    private SpriteDef() {
    }

    // 原 d.a ()S：返回动作总数 actionCount
    public final short getActionCount() {
        return this.actionCount;
    }

    // 原 d.a (I)S：返回第 frameAction 个动作的帧数 framesPerAction[frameAction]
    public final short getFrameCount(int action) {
        return this.framesPerAction[action];
    }

    // 原 d.a (Ljavax/microedition/lcdui/Graphics;IIIIII)V：
    // 按动作号(含 0x80000000 水平镜像/0x40000000 垂直镜像高位标志)与帧号，
    // 把该帧引用的一组图块逐个加偏移并镜像后绘制到图集 tileSheet 上
    public final void drawFrame(Graphics graphics, int x, int y, int action, int frame, int n5, int n6) {
        int flipH = action & Integer.MIN_VALUE;
        int flipV = action & 0x40000000;
        short groupIndex = this.actionFrameGroups[action &= 0xFFFFFF][frame];
        int tileCount = this.tilesPerGroup[groupIndex];
        int tileIdx = 0;
        while (tileIdx < tileCount) {
            int cellRef = this.groupTileIndices[groupIndex][tileIdx] & 0xFFFF;
            byte offX = this.groupTileOffsetX[groupIndex][tileIdx];
            if (flipH != 0) {
                offX = -offX;
            }
            byte offY = this.groupTileOffsetY[groupIndex][tileIdx];
            if (flipV != 0) {
                offY = -offY;
            }
            this.tileSheet.drawCell(graphics, x + offX, y + offY, cellRef | flipH | flipV, n5, n6);
            ++tileIdx;
        }
    }

    // 原 d.b (I)Ltjge/d;：静态工厂——从归档 /res/a.bin 第 entry 条读取并解析一份
    // 精灵动作定义，建立图集映射并返回实例，失败返回 null
    public static final SpriteDef loadFromArchive(int entry) {
        SpriteDef def = new SpriteDef();
        try {
            int g;
            InputStream inputStream = GameMIDlet.openEntryStream("/res/a.bin", entry);
            byte externalId = GameMIDlet.readByte(inputStream);
            def.sheetId = GameMIDlet.readByte(inputStream);
            def.tileGroupCount = GameMIDlet.readShortLE(inputStream);
            def.tilesPerGroup = new short[def.tileGroupCount];
            def.groupTileIndices = new short[def.tileGroupCount][];
            def.groupTileOffsetX = new byte[def.tileGroupCount][];
            def.groupTileOffsetY = new byte[def.tileGroupCount][];
            int group = 0;
            while (group < def.tileGroupCount) {
                def.tilesPerGroup[group] = GameMIDlet.readShortLE(inputStream);
                def.groupTileIndices[group] = new short[def.tilesPerGroup[group]];
                def.groupTileOffsetX[group] = new byte[def.tilesPerGroup[group]];
                def.groupTileOffsetY[group] = new byte[def.tilesPerGroup[group]];
                g = 0;
                while (g < def.tilesPerGroup[group]) {
                    def.groupTileIndices[group][g] = GameMIDlet.readShortLE(inputStream);
                    def.groupTileOffsetX[group][g] = GameMIDlet.readByte(inputStream);
                    def.groupTileOffsetY[group][g] = GameMIDlet.readByte(inputStream);
                    ++g;
                }
                ++group;
            }
            inputStream.read();
            inputStream.read();
            inputStream.read();
            inputStream.read();
            def.actionCount = GameMIDlet.readShortLE(inputStream);
            def.actionParamA = new byte[def.actionCount];
            def.actionParamB = new byte[def.actionCount];
            def.actionParamC = new byte[def.actionCount];
            def.actionParamD = new byte[def.actionCount];
            def.framesPerAction = new short[def.actionCount];
            def.actionFrameGroups = new short[def.actionCount][];
            g = 0;
            while (g < def.actionCount) {
                def.actionParamA[g] = GameMIDlet.readByte(inputStream);
                def.actionParamB[g] = GameMIDlet.readByte(inputStream);
                def.actionParamC[g] = GameMIDlet.readByte(inputStream);
                def.actionParamD[g] = GameMIDlet.readByte(inputStream);
                def.framesPerAction[g] = GameMIDlet.readShortLE(inputStream);
                def.actionFrameGroups[g] = new short[def.framesPerAction[g]];
                int frame = 0;
                while (frame < def.framesPerAction[g]) {
                    def.actionFrameGroups[g][frame] = GameMIDlet.readByte(inputStream);
                    if (def.actionFrameGroups[g][frame] < 0) {
                        short[] frameGroups = def.actionFrameGroups[g];
                        int idx = frame;
                        frameGroups[idx] = (short)(frameGroups[idx] + 256);
                    }
                    ++frame;
                }
                ++g;
            }
            def.paramJ = GameMIDlet.readShortLE(inputStream);
            def.paramK = GameMIDlet.readShortLE(inputStream);
            def.paramL = GameMIDlet.readShortLE(inputStream);
            def.paramM = GameMIDlet.readShortLE(inputStream);
            inputStream.close();
            tjge.SpriteDef.loadedFlags[def.sheetId] = true;
            tjge.SpriteDef.idMap[externalId] = def.sheetId;
            if (tileSheets[def.sheetId] == null) {
                tjge.SpriteDef.tileSheets[def.sheetId] = tjge.TileSheet.loadFromBin(def.sheetId);
            }
            def.tileSheet = tileSheets[def.sheetId];
        }
        catch (Exception exception) {
            return null;
        }
        return def;
    }

    // 原 d.<clinit> ()V：静态初始化块——将 0 号图集标记为已加载（loadedFlags[0]=true）
    static {
        tjge.SpriteDef.loadedFlags[0] = true;
    }
}
