// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/b.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
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
import tjge.GameScreen; // 原 tjge.a

public final class TileMap {
    public int viewportWidth;                 // a
    public int viewportHeight;                // b
    private byte[][] columnRleData;           // d : 每列 RLE 编码的瓦片/碰撞数据，d[col][0] 为 0/1/2 标记
    private int mapColumns;                   // e : 地图宽（瓦片数/列）
    private int mapRows;                      // f : 地图高（瓦片数/行）
    private int tileWidthPx;                  // g : 瓦片宽（像素，复制自 tileWidth）
    private int tileHeightPx;                 // h : 瓦片高（像素，复制自 tileHeight）
    private int scaleDivisor;                 // i : 像素坐标转视口原点的缩放除数，固定为 1
    private int viewportOriginX;              // j : 当前视口左上角 X
    private int viewportOriginY;              // k : 当前视口左上角 Y
    private int mapTileWidth;                 // l : 地图宽（瓦片数，来自头部）
    private int mapTileHeight;                // m : 地图高（瓦片数，来自头部）
    private int tileWidth;                    // n : 瓦片宽（像素，来自头部）
    private int tileHeight;                   // o : 瓦片高（像素，来自头部）
    private int blockColumns;                 // p : 块列数（水平分块）
    private int blockRows;                    // q : 块行数（垂直分块）
    private int atlasTilesPerRow;             // r : 图集每行瓦片数 = 图集宽 / tileWidth
    private byte[] blockIndexTable;           // s : 块索引表，块单元映射到图集瓦片 id
    private static Image atlasImage;          // t : 静态共享瓦片图集，来自 image.bin[atlasId+4]
    static int loadedAtlasId;                 // c : 静态，当前已加载图集 id（初值 -1）
    private static Image offscreenBuffer;     // u : 静态离屏滚动缓冲图
    private static int offscreenWidth;        // v : 静态离屏缓冲宽
    private static int offscreenHeight;       // w : 静态离屏缓冲高
    private static Graphics offscreenGraphics;// x : 静态离屏缓冲 Graphics 上下文
    private int bufferDrawnLeft;              // y : 离屏缓冲已绘区域左边（瓦片对齐，-1=无效）
    private int bufferDrawnTop;               // z : 离屏缓冲已绘区域上边（瓦片对齐，-1=无效）
    private int bufferDrawnRight;             // A : 离屏缓冲已绘区域右边（瓦片对齐）
    private int bufferDrawnBottom;            // B : 离屏缓冲已绘区域下边（瓦片对齐）

    // private b(int n, int n2)
    private TileMap(int width, int height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.scaleDivisor = 1;
    }

    // a(II)V -> setViewportOrigin
    public final void setViewportOrigin(int pixelX, int pixelY) {
        this.viewportOriginX = pixelX / this.scaleDivisor;
        this.viewportOriginY = pixelY / this.scaleDivisor;
    }

    // a()I -> getPixelWidth
    public final int getPixelWidth() {
        return this.tileWidthPx * this.mapColumns;
    }

    // b()I -> getPixelHeight
    public final int getPixelHeight() {
        return this.tileHeightPx * this.mapRows;
    }

    // a(Graphics)V -> draw
    public final void draw(Graphics graphics) {
        this.drawViewport(graphics, this.viewportOriginX, this.viewportOriginY, this.viewportWidth, this.viewportHeight);
    }

    // a(IIZ)I -> queryColumnTileAt
    public final int queryColumnTileAt(int cellIndex, int column, boolean solidFlag) {
        if (column < 0) {
            return 0;
        }
        if (column >= this.columnRleData.length) {
            return 3;
        }
        if (cellIndex < 0 || cellIndex >= this.tileWidthPx * this.mapColumns / 16) {
            if (solidFlag) {
                return 1;
            }
            return 0;
        }
        if (this.columnRleData[column][0] == 0) {
            return 0;
        }
        try {
            int accumulated = 0;
            int runPos = 2;
            do {
                accumulated += this.columnRleData[column][runPos + 1];
                if (this.columnRleData[column][runPos + 1] < 0) {
                    accumulated += 256;
                }
                runPos += 2;
            } while (accumulated < cellIndex + 1);
            return this.columnRleData[column][runPos -= 2];
        }
        catch (Exception exception) {
            return 1;
        }
    }

    // b(II)I throws Exception -> resolveTileIndex
    protected final int resolveTileIndex(int pixelX, int pixelY) throws Exception {
        int result = 0;
        int tableIndex = (pixelY %= this.tileHeight * this.mapTileHeight) / this.tileHeight * this.mapTileWidth + (pixelX %= this.tileWidth * this.mapTileWidth) / this.tileWidth;
        result = this.blockIndexTable[tableIndex];
        if (this.blockIndexTable[tableIndex] < 0) {
            result += 256;
        }
        if (result < 0) {
            throw new Exception("error index");
        }
        return result;
    }

    // c()V -> invalidateBuffer
    public final void invalidateBuffer() {
        this.bufferDrawnLeft = -1;
        this.bufferDrawnTop = -1;
    }

    // a(ZII)V -> setupOffscreenBuffer
    private void setupOffscreenBuffer(boolean allocate, int x, int y) {
        if (allocate) {
            if (offscreenBuffer == null) {
                int bufW = x % this.tileWidth == 0 ? x + this.tileWidth : x - x % this.tileWidth + 2 * this.tileWidth;
                int bufH = y % this.tileHeight == 0 ? this.viewportHeight + this.tileHeight : y - y % this.tileHeight + 2 * this.tileHeight;
                offscreenBuffer = Image.createImage((int)bufW, (int)bufH);
                offscreenWidth = offscreenBuffer.getWidth();
                offscreenHeight = offscreenBuffer.getHeight();
                offscreenGraphics = offscreenBuffer.getGraphics();
            }
            this.invalidateBuffer();
            return;
        }
        offscreenBuffer = null;
    }

    // a(Graphics,IIIIII)V -> renderTileRegion
    protected final void renderTileRegion(Graphics graphics, int startX, int startY, int endX, int endY, int wrapW, int wrapH) {
        int destY = startY % wrapH;
        int srcY = startY;
        while (srcY <= endY) {
            int destX = startX % wrapW;
            int srcX = startX;
            while (srcX <= endX) {
                block6: {
                    int tileId;
                    try {
                        tileId = this.resolveTileIndex(srcX, srcY);
                    }
                    catch (Exception exception) {
                        break block6;
                    }
                    graphics.setClip(destX, destY, this.tileWidth, this.tileHeight);
                    graphics.drawImage(atlasImage, destX - tileId % this.atlasTilesPerRow * this.tileWidth, destY - tileId / this.atlasTilesPerRow * this.tileHeight, 20);
                    if ((destX += this.tileWidth) >= wrapW) {
                        destX = 0;
                    }
                }
                srcX += this.tileWidth;
            }
            if ((destY += this.tileHeight) >= wrapH) {
                destY = 0;
            }
            srcY += this.tileHeight;
        }
    }

    // b(Graphics,IIIIII)V -> blitBufferRegion
    protected final void blitBufferRegion(Graphics graphics, int offsetX, int offsetY, int width, int height, int clipX, int clipY) {
        graphics.setClip(clipX, clipY, width, height);
        graphics.drawImage(offscreenBuffer, clipX - offsetX, clipY - offsetY, 20);
    }

    // a(Graphics,IIII)V -> drawViewport
    protected final void drawViewport(Graphics graphics, int viewX, int viewY, int viewW, int viewH) {
        int newRight;
        int newLeft;
        int alignedLeft = viewX - viewX % this.tileWidth;
        int alignedTop = viewY - viewY % this.tileHeight;
        int alignedRight = viewX + offscreenWidth - this.tileWidth - (viewX + offscreenWidth - this.tileWidth) % this.tileWidth;
        int alignedBottom = viewY + offscreenHeight - this.tileHeight - (viewY + offscreenHeight - this.tileHeight) % this.tileHeight;
        if (this.bufferDrawnLeft < 0) {
            this.renderTileRegion(offscreenGraphics, alignedLeft, alignedTop, alignedRight, alignedBottom, offscreenWidth, offscreenHeight);
            this.bufferDrawnLeft = alignedLeft;
            this.bufferDrawnTop = alignedTop;
            this.bufferDrawnRight = alignedRight;
            this.bufferDrawnBottom = alignedBottom;
        }
        if (this.bufferDrawnLeft != alignedLeft) {
            if (this.bufferDrawnLeft < alignedLeft) {
                newLeft = this.bufferDrawnRight + this.tileWidth;
                newRight = alignedRight;
            } else {
                newLeft = alignedLeft;
                newRight = this.bufferDrawnLeft - this.tileWidth;
            }
            this.renderTileRegion(offscreenGraphics, newLeft, alignedTop, newRight, alignedBottom, offscreenWidth, offscreenHeight);
            this.bufferDrawnLeft = alignedLeft;
            this.bufferDrawnRight = alignedRight;
        }
        if (this.bufferDrawnTop != alignedTop) {
            if (this.bufferDrawnTop < alignedTop) {
                newLeft = this.bufferDrawnBottom + this.tileHeight;
                newRight = alignedBottom;
            } else {
                newLeft = alignedTop;
                newRight = this.bufferDrawnTop - this.tileHeight;
            }
            this.renderTileRegion(offscreenGraphics, alignedLeft, newLeft, alignedRight, newRight, offscreenWidth, offscreenHeight);
            this.bufferDrawnTop = alignedTop;
            this.bufferDrawnBottom = alignedBottom;
        }
        int wrappedX = viewX % offscreenWidth;
        int wrappedY = viewY % offscreenHeight;
        int wrappedEndX = (viewX + viewW) % offscreenWidth;
        int wrappedEndY = (viewY + viewH) % offscreenHeight;
        if (wrappedEndX > wrappedX) {
            if (wrappedEndY > wrappedY) {
                this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW, viewH, 0, 0);
            } else {
                this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW, viewH - wrappedEndY, 0, 0);
                this.blitBufferRegion(graphics, wrappedX, 0, viewW, wrappedEndY, 0, viewH - wrappedEndY);
            }
        } else if (wrappedEndY > wrappedY) {
            this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW - wrappedEndX, viewH, 0, 0);
            this.blitBufferRegion(graphics, 0, wrappedY, wrappedEndX, viewH, viewW - wrappedEndX, 0);
        } else {
            this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW - wrappedEndX, viewH - wrappedEndY, 0, 0);
            this.blitBufferRegion(graphics, wrappedX, 0, viewW - wrappedEndX, wrappedEndY, 0, viewH - wrappedEndY);
            this.blitBufferRegion(graphics, 0, wrappedY, wrappedEndX, viewH - wrappedEndY, viewW - wrappedEndX, 0);
            this.blitBufferRegion(graphics, 0, 0, wrappedEndX, wrappedEndY, viewW - wrappedEndX, viewH - wrappedEndY);
        }
        graphics.setClip(0, 0, viewW, viewH);
    }

    // d()V -> dispose
    public final void dispose() {
        int col = 0;
        while (col < this.columnRleData.length) {
            this.columnRleData[col] = null;
            ++col;
        }
        this.columnRleData = null;
        this.blockIndexTable = null;
    }

    // a(III)Ltjge/b; -> loadFromBin
    public static final TileMap loadFromBin(int entry, int n2, int n3) {
        TileMap map;
        try {
            map = new TileMap(GameScreen.screenWidth, GameScreen.playHeight);
            InputStream inputStream = GameMIDlet.openArchiveEntryStream("/res/f.bin", entry);
            byte atlasId = GameMIDlet.readByte(inputStream);
            map.mapTileWidth = GameMIDlet.readU16Le(inputStream);
            map.mapTileHeight = GameMIDlet.readU16Le(inputStream);
            map.tileWidth = GameMIDlet.readByte(inputStream);
            map.tileHeight = GameMIDlet.readByte(inputStream);
            map.blockColumns = GameMIDlet.readByte(inputStream);
            map.blockRows = GameMIDlet.readByte(inputStream);
            map.blockIndexTable = new byte[map.mapTileWidth * map.mapTileHeight];
            inputStream.read(map.blockIndexTable);
            if (loadedAtlasId != atlasId) {
                atlasImage = null;
                atlasImage = GameScreen.loadImageFromBin(atlasId + 4);
            }
            loadedAtlasId = atlasId;
            map.atlasTilesPerRow = atlasImage.getWidth() / map.tileWidth;
            int blockRleLen = map.tileWidth * map.mapTileWidth / map.blockColumns;
            int blockRowCount = map.tileHeight * map.mapTileHeight / map.blockRows;
            map.mapColumns = map.mapTileWidth;
            map.mapRows = map.mapTileHeight;
            map.tileWidthPx = map.tileWidth;
            map.tileHeightPx = map.tileHeight;
            map.columnRleData = new byte[blockRowCount][];
            int row = 0;
            while (row < blockRowCount) {
                byte runType = GameMIDlet.readByte(inputStream);
                if (runType == 0) {
                    map.columnRleData[row] = new byte[1];
                    map.columnRleData[row][0] = 0;
                } else if (runType == 1) {
                    map.columnRleData[row] = new byte[1 + blockRleLen];
                    inputStream.read(map.columnRleData[row], 1, blockRleLen);
                    map.columnRleData[row][0] = 1;
                } else {
                    int runCount = GameMIDlet.readByte(inputStream);
                    if (runCount < 0) {
                        runCount += 256;
                    }
                    map.columnRleData[row] = new byte[2 + 2 * runCount];
                    inputStream.read(map.columnRleData[row], 2, 2 * runCount);
                    map.columnRleData[row][0] = 2;
                }
                ++row;
            }
            inputStream.close();
            map.setupOffscreenBuffer(true, GameScreen.screenWidth, GameScreen.playHeight);
        }
        catch (Exception exception) {
            return null;
        }
        return map;
    }

    // a(I)V -> reloadColumnData
    public final void reloadColumnData(int entry) {
        try {
            InputStream inputStream = GameMIDlet.openArchiveEntryStream("/res/f.bin", entry);
            int blockRowCount = this.tileHeight * this.mapTileHeight / this.blockRows;
            int blockRleLen = this.tileWidth * this.mapTileWidth / this.blockColumns;
            inputStream.skip(9 + this.mapTileWidth * this.mapTileHeight);
            int row = 0;
            while (row < blockRowCount) {
                byte runType = GameMIDlet.readByte(inputStream);
                if (runType == 0) {
                    this.columnRleData[row][0] = 0;
                } else if (runType == 1) {
                    inputStream.read(this.columnRleData[row], 1, blockRleLen);
                    this.columnRleData[row][0] = 1;
                } else {
                    int runCount = GameMIDlet.readByte(inputStream);
                    if (runCount < 0) {
                        runCount += 256;
                    }
                    inputStream.read(this.columnRleData[row], 2, 2 * runCount);
                    this.columnRleData[row][0] = 2;
                }
                ++row;
            }
            inputStream.close();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    // c(II)Z -> clearTileAt
    public final boolean clearTileAt(int cellIndex, int column) {
        if (column < 0) {
            return false;
        }
        if (column >= this.columnRleData.length) {
            return false;
        }
        if (cellIndex < 0 || cellIndex >= this.tileWidthPx * this.mapColumns / 16) {
            return false;
        }
        if (this.columnRleData[column][0] == 0) {
            return false;
        }
        try {
            int accumulated = 0;
            int runPos = 2;
            do {
                accumulated += this.columnRleData[column][runPos + 1];
                if (this.columnRleData[column][runPos + 1] < 0) {
                    accumulated += 256;
                }
                runPos += 2;
            } while (accumulated < cellIndex + 1);
            this.columnRleData[column][runPos -= 2] = 0;
            return true;
        }
        catch (Exception exception) {
            return false;
        }
    }

    static {
        loadedAtlasId = -1;
    }
}
