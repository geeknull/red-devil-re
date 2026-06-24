// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/i.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  com.nokia.mid.ui.DirectGraphics
 *  com.nokia.mid.ui.DirectUtils
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import com.nokia.mid.ui.DirectGraphics;
import com.nokia.mid.ui.DirectUtils;
import java.io.InputStream;
import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;

public final class SpriteAtlas {
    // 静态：水平翻转请求位掩码(Integer.MIN_VALUE/0x80000000)，编码在小图索引高字节中
    public static int flipHorizontalBit = Integer.MIN_VALUE;
    // 静态：垂直翻转请求位掩码(0x40000000)，编码在小图索引高字节中
    public static int flipVerticalBit = 0x40000000;
    // 静态：拼像素临时缓冲 pixelBuffer 的容量(4096)
    public static int pixelBufferCapacity = 4096;
    // 小图(子图)数量
    private short spriteCount;
    // 每张小图在像素图中的行内偏移(列偏移，用于奇偶对齐与 4bit 半字节定位)
    private short[] rowOffsets;
    // 每张小图的起始行号
    private short[] startRows;
    // 每张小图的像素宽(0..255，负数解析时 +256，public)
    public short[] widths;
    // 每张小图的像素高(0..255，负数解析时 +256，public)
    public short[] heights;
    // 每张小图的调色板基址索引（使用时 <<4 得到组内色基偏移）
    private byte[] paletteBaseIndices;
    // 像素图每行的字节数（解析时已 /2）
    private int bytesPerRow;
    // 像素图总行数
    private int totalRows;
    // 4bit packed 像素数据(每字节 2 个调色板索引)，长度 bytesPerRow*totalRows
    private byte[] packedPixels;
    // 调色板表[组][色]=ARGB4444 颜色值
    private short[][] palettes;
    // 调色板组数
    private int paletteCount;
    // 静态：拼像素临时缓冲(容量 pixelBufferCapacity)，按 ARGB4444 逐像素填充后交给 drawPixels
    static short[] pixelBuffer = new short[pixelBufferCapacity];

    // 私有无参构造，仅由静态工厂 load(int) 内部实例化空图集对象
    private SpriteAtlas() {
    }

    // 绘制第 spriteIndex 张小图：从 4bit packed 像素按调色板组解码拼到缓冲 pixelBuffer，
    // 再经 Nokia drawPixels(4444) 带翻转/旋转贴到屏幕(x,y,palette=paletteGroup,manip)
    // 原方法：a(Graphics, IIIII)V
    public final void drawSprite(Graphics graphics, int x, int y, int spriteIndex, int paletteGroup, int manip) {
        int flipFlags = spriteIndex & 0xFF000000;
        spriteIndex &= 0xFFFFFF;
        int manipBits = 0;
        DirectGraphics directGraphics = DirectUtils.getDirectGraphics((Graphics)graphics);
        if ((flipFlags & flipHorizontalBit) != 0) {
            manipBits = 8192;
        }
        if ((flipFlags & flipVerticalBit) != 0) {
            manipBits |= 0x4000;
        }
        manipBits |= manip;
        int bufferPos = 0;
        int paletteBase = this.paletteBaseIndices[spriteIndex] << 4;
        boolean oddRowOffset = this.rowOffsets[spriteIndex] % 2 == 1;
        int width = this.widths[spriteIndex];
        boolean trailingHalfByte = (width - this.rowOffsets[spriteIndex] % 2) % 2 == 1;
        width /= 2;
        int colByteOffset = this.rowOffsets[spriteIndex] / 2;
        if (oddRowOffset && !trailingHalfByte) {
            ++width;
        }
        int row = this.startRows[spriteIndex];
        while (row < this.startRows[spriteIndex] + this.heights[spriteIndex]) {
            int col;
            if (oddRowOffset) {
                tjge.SpriteAtlas.pixelBuffer[bufferPos] = this.palettes[paletteGroup][paletteBase + (this.packedPixels[row * this.bytesPerRow + colByteOffset] & 0xF)];
                ++bufferPos;
                col = 1;
            } else {
                col = 0;
            }
            while (col < width) {
                byte packed = this.packedPixels[row * this.bytesPerRow + col + colByteOffset];
                tjge.SpriteAtlas.pixelBuffer[bufferPos] = this.palettes[paletteGroup][paletteBase + (packed >> 4 & 0xF)];
                tjge.SpriteAtlas.pixelBuffer[++bufferPos] = this.palettes[paletteGroup][paletteBase + (packed & 0xF)];
                ++bufferPos;
                ++col;
            }
            if (trailingHalfByte) {
                tjge.SpriteAtlas.pixelBuffer[bufferPos] = this.palettes[paletteGroup][paletteBase + (this.packedPixels[row * this.bytesPerRow + col + colByteOffset] >> 4 & 0xF)];
                ++bufferPos;
            }
            ++row;
        }
        if ((flipFlags & flipHorizontalBit) != 0) {
            x -= this.widths[spriteIndex];
        }
        if ((flipFlags & flipVerticalBit) != 0) {
            y -= this.heights[spriteIndex];
        }
        directGraphics.drawPixels(pixelBuffer, true, 0, (int)this.widths[spriteIndex], x, y, (int)this.widths[spriteIndex], (int)this.heights[spriteIndex], manipBits, 4444);
    }

    // 静态工厂：从 /res/t.bin 第 entry 条目解析整张图集（小图表+调色板+像素），异常返回 null
    // 原方法：a(I)Ltjge/i;
    public static final SpriteAtlas load(int entry) {
        SpriteAtlas atlas = new SpriteAtlas();
        try {
            // GameMIDlet.a(String,I) → openArchiveEntryStream
            InputStream inputStream = GameMIDlet.a("/res/t.bin", entry);
            // GameMIDlet.a(InputStream) → readU16Le
            atlas.spriteCount = GameMIDlet.a(inputStream);
            atlas.rowOffsets = new short[atlas.spriteCount];
            atlas.startRows = new short[atlas.spriteCount];
            atlas.widths = new short[atlas.spriteCount];
            atlas.heights = new short[atlas.spriteCount];
            atlas.paletteBaseIndices = new byte[atlas.spriteCount];
            int i = 0;
            while (i < atlas.spriteCount) {
                // GameMIDlet.b(InputStream) → readByte
                atlas.paletteBaseIndices[i] = GameMIDlet.b(inputStream);
                atlas.rowOffsets[i] = GameMIDlet.a(inputStream);
                atlas.startRows[i] = GameMIDlet.a(inputStream);
                atlas.widths[i] = GameMIDlet.b(inputStream);
                if (atlas.widths[i] < 0) {
                    int idx = i;
                    atlas.widths[idx] = (short)(atlas.widths[idx] + 256);
                }
                atlas.heights[i] = GameMIDlet.b(inputStream);
                if (atlas.heights[i] < 0) {
                    int idx = i;
                    atlas.heights[idx] = (short)(atlas.heights[idx] + 256);
                }
                ++i;
            }
            atlas.paletteCount = GameMIDlet.b(inputStream);
            byte paletteEntries = GameMIDlet.b(inputStream);
            atlas.palettes = new short[atlas.paletteCount][paletteEntries << 4];
            i = 0;
            while (i < atlas.paletteCount) {
                int color = 0;
                while (color < paletteEntries << 4) {
                    atlas.palettes[i][color] = GameMIDlet.a(inputStream);
                    ++color;
                }
                ++i;
            }
            atlas.bytesPerRow = GameMIDlet.a(inputStream);
            atlas.totalRows = GameMIDlet.a(inputStream);
            atlas.bytesPerRow /= 2;
            atlas.packedPixels = new byte[atlas.bytesPerRow * atlas.totalRows];
            inputStream.read(atlas.packedPixels);
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return atlas;
    }
}
