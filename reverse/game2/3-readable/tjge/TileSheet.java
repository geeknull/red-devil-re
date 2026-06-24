// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/i.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 */
package tjge;

import java.io.InputStream;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import tjge.GameMIDlet;

public final class TileSheet {
    // 静态：水平翻转请求位掩码 = Integer.MIN_VALUE (0x80000000)
    public static int flipHorizontalBit = Integer.MIN_VALUE;
    // 静态：垂直翻转请求位掩码 = 0x40000000
    public static int flipVerticalBit = 0x40000000;
    // cell(切片)数量，决定 cellSrcX/cellSrcY/cellWidth/cellHeight 四个数组的长度
    private short cellCount;
    // 每个 cell 在 PNG 主图上的源 X 坐标
    private short[] cellSrcX;
    // 每个 cell 在 PNG 主图上的源 Y 坐标
    private short[] cellSrcY;
    // 每个 cell 的宽(0..255，读字节后负值补 256)
    private short[] cellWidth;
    // public：每个 cell 的高(0..255，读字节后负值补 256)
    public short[] cellHeight;
    // public：PNG 图像帧数组；frameCount>1 时含换色帧
    public Image[] imageFrames;
    // public：当前绘制所用图像，drawCell 中临时赋为 imageFrames[frameIndex] 再传给 drawRegion
    public Image currentImage;
    // 静态 final int[4][4]：旋转码(0x3000 的四档)×翻转状态(flipState=0..3) → drawRegion transform 常量映射表
    public static final int[][] transformTable = new int[][]{{0, 2, 1, 3}, {5, 4, 7, 6}, {3, 1, 2, 0}, {6, 7, 4, 5}};

    private TileSheet() {
    }

    public final void drawCell(Graphics graphics, int x, int y, int cellRef, int frameIndex, int n4, int n5) {
        int transform = 0;
        int flipState = 0;
        if ((cellRef >> 31 & 1 ^ cellRef >> 15 & 1) != 0) {
            flipState = 1;
        }
        if ((cellRef >> 30 & 1 ^ cellRef >> 14 & 1) != 0) {
            flipState = flipState > 0 ? 3 : 2;
        }
        int rawCellRef = cellRef;
        short clipWidth = this.cellWidth[cellRef &= 0xFFF];
        short clipHeight = this.cellHeight[cellRef];
        switch (rawCellRef & 0x3000) {
            case 4096: {
                clipWidth = this.cellHeight[cellRef];
                clipHeight = this.cellWidth[cellRef];
                transform = transformTable[3][flipState];
                break;
            }
            case 8192: {
                transform = transformTable[2][flipState];
                break;
            }
            case 12288: {
                clipWidth = this.cellHeight[cellRef];
                clipHeight = this.cellWidth[cellRef];
                transform = transformTable[1][flipState];
                break;
            }
            default: {
                transform = transformTable[0][flipState];
            }
        }
        if ((rawCellRef & flipHorizontalBit) != 0) {
            x -= clipWidth;
        }
        if ((rawCellRef & flipVerticalBit) != 0) {
            y -= clipHeight;
        }
        graphics.setClip(x, y, (int)clipWidth, (int)clipHeight);
        this.currentImage = this.imageFrames[frameIndex];
        graphics.drawRegion(this.currentImage, (int)this.cellSrcX[cellRef], (int)this.cellSrcY[cellRef], (int)this.cellWidth[cellRef], (int)this.cellHeight[cellRef], transform, x, y, 20);
    }

    public static final TileSheet loadFromBin(int entryIndex) {
        TileSheet sheet = new TileSheet();
        try {
            InputStream inputStream = GameMIDlet.openEntryStream("/res/t.bin", entryIndex);
            GameMIDlet.readShortLE(inputStream);
            sheet.cellCount = GameMIDlet.readShortLE(inputStream);
            sheet.cellSrcX = new short[sheet.cellCount];
            sheet.cellSrcY = new short[sheet.cellCount];
            sheet.cellWidth = new short[sheet.cellCount];
            sheet.cellHeight = new short[sheet.cellCount];
            int cellIdx = 0;
            while (cellIdx < sheet.cellCount) {
                sheet.cellSrcX[cellIdx] = GameMIDlet.readShortLE(inputStream);
                sheet.cellSrcY[cellIdx] = GameMIDlet.readShortLE(inputStream);
                sheet.cellWidth[cellIdx] = GameMIDlet.readByte(inputStream);
                if (sheet.cellWidth[cellIdx] < 0) {
                    int widthIdx = cellIdx;
                    sheet.cellWidth[widthIdx] = (short)(sheet.cellWidth[widthIdx] + 256);
                }
                sheet.cellHeight[cellIdx] = GameMIDlet.readByte(inputStream);
                if (sheet.cellHeight[cellIdx] < 0) {
                    int heightIdx = cellIdx;
                    sheet.cellHeight[heightIdx] = (short)(sheet.cellHeight[heightIdx] + 256);
                }
                ++cellIdx;
            }
            int frameCount = GameMIDlet.readByte(inputStream);
            short paletteOffset = 0;
            short paletteLength = 0;
            byte[] paletteBuffer = null;
            sheet.imageFrames = new Image[frameCount];
            if (frameCount > 1) {
                paletteOffset = GameMIDlet.readShortLE(inputStream);
                paletteLength = GameMIDlet.readShortLE(inputStream);
            }
            byte[] pngBytes = GameMIDlet.readEntryBytes("/res/actorPng.bin", entryIndex);
            int frameIdx = 0;
            while (frameIdx < frameCount) {
                if (frameIdx > 0) {
                    if (paletteBuffer == null) {
                        paletteBuffer = new byte[paletteLength];
                    }
                    inputStream.read(paletteBuffer);
                    System.arraycopy(paletteBuffer, 0, pngBytes, paletteOffset, paletteLength);
                }
                sheet.imageFrames[frameIdx] = Image.createImage((byte[])pngBytes, (int)0, (int)pngBytes.length);
                ++frameIdx;
            }
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return sheet;
    }
}
