// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/b.java
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

public final class TileMap {
    public int viewportWidth;
    public int viewportHeight;
    public int cameraX;
    public int cameraY;
    private int cellTilesX;
    private int cellTilesY;
    private int gridCols;
    private int gridRows;
    private byte[] gridIndices;
    private byte[][] collisionRows;
    public int collisionStepX;
    public int collisionStepY;
    private int foregroundPaletteWidth;
    private int foregroundPaletteHeight;
    private int tileWidth;
    private int tileHeight;
    private Image foregroundImage;
    private int foregroundTilesPerRow;
    private byte[] foregroundTileIndices;
    private int backgroundPaletteCols;
    private int backgroundPaletteRows;
    private int backgroundBlockWidth;
    private int backgroundBlockHeight;
    private Image backgroundImage;
    private int backgroundBlocksPerRow;
    private byte[] backgroundIndices;
    int layerMode;
    private int drawnLeft;
    private int drawnTop;
    private int drawnRight;
    private int drawnBottom;
    private static Image offscreenBuffer;
    private static Graphics offscreenGraphics;

    public TileMap(int viewportW, int viewportH) {
        this.viewportWidth = viewportW;
        this.viewportHeight = viewportH;
    }

    public final void setCameraPosition(int x, int y) {
        this.cameraX = x;
        this.cameraY = y;
    }

    public final void resetDrawnBounds() {
        this.drawnLeft = -1;
        this.drawnTop = -1;
    }

    public final int getMapWidth() {
        return this.tileWidth * this.cellTilesX * this.gridCols;
    }

    public final int getMapHeight() {
        return this.tileHeight * this.cellTilesY * this.gridRows;
    }

    public final void render(Graphics graphics) {
        this.renderViewport(graphics, this.cameraX, this.cameraY, this.viewportWidth, this.viewportHeight);
    }

    private int sampleGridIndex(int px, int py) {
        int gridValue = this.gridIndices[py / (this.cellTilesY * this.tileHeight) * this.gridCols + px / (this.cellTilesX * this.tileWidth)];
        if (gridValue < -1) {
            gridValue += 256;
        }
        return gridValue;
    }

    public final int sampleCollision(int px, int py) {
        if (py < 0) {
            return 0;
        }
        if (py >= this.getMapHeight()) {
            return 0;
        }
        if (px < 0 || px >= this.getMapWidth()) {
            return 0;
        }
        int blockIndex = this.sampleGridIndex(px, py);
        if (blockIndex == -1) {
            return 0;
        }
        px = (blockIndex % (this.foregroundPaletteWidth / this.cellTilesX) * this.cellTilesX + px / this.tileWidth % this.cellTilesX) * this.tileWidth / this.collisionStepX;
        if (this.collisionRows[py = (blockIndex / (this.foregroundPaletteWidth / this.cellTilesX) * this.cellTilesY + py / this.tileHeight % this.cellTilesY) * this.tileHeight / this.collisionStepY][0] == 0) {
            return 0;
        }
        int accumulated = 0;
        int cursor = 2;
        do {
            accumulated += this.collisionRows[py][cursor + 1];
            if (this.collisionRows[py][cursor + 1] < 0) {
                accumulated += 256;
            }
            cursor += 2;
        } while (accumulated < px + 1);
        return this.collisionRows[py][cursor -= 2];
    }

    protected final int sampleForegroundTile(int px, int py) throws Exception {
        int result = -1;
        int blockIndex = this.sampleGridIndex(px, py);
        if (blockIndex != -1) {
            px = blockIndex % (this.foregroundPaletteWidth / this.cellTilesX) * this.cellTilesX + px / this.tileWidth % this.cellTilesX;
            py = blockIndex / (this.foregroundPaletteWidth / this.cellTilesX) * this.cellTilesY + py / this.tileHeight % this.cellTilesY;
            blockIndex = py * this.foregroundPaletteWidth + px;
            result = this.foregroundTileIndices[blockIndex];
            if (this.foregroundTileIndices[blockIndex] < 0) {
                result += 256;
            }
            if (result < 0) {
                throw new Exception("error index");
            }
        }
        return result;
    }

    protected final int sampleBackgroundTile(int px, int py) throws Exception {
        int result = 0;
        int flatIndex = (py %= this.backgroundBlockHeight * this.backgroundPaletteRows) / this.backgroundBlockHeight * this.backgroundPaletteCols + (px %= this.backgroundBlockWidth * this.backgroundPaletteCols) / this.backgroundBlockWidth;
        result = this.backgroundIndices[flatIndex];
        if (this.backgroundIndices[flatIndex] < 0) {
            result += 256;
        }
        if (result < 0) {
            throw new Exception("error index");
        }
        return result;
    }

    private void ensureOffscreenBuffer(int px, int py) {
        if (offscreenBuffer == null) {
            int bufW = px % this.tileWidth == 0 ? px + this.tileWidth : px - px % this.tileWidth + 2 * this.tileWidth;
            int bufH = py % this.tileHeight == 0 ? this.viewportHeight + this.tileHeight : py - py % this.tileHeight + 2 * this.tileHeight;
            offscreenBuffer = Image.createImage((int)bufW, (int)bufH);
            offscreenGraphics = offscreenBuffer.getGraphics();
            this.resetDrawnBounds();
        }
    }

    protected final void drawTileRegion(Graphics graphics, int startX, int startY, int endX, int endY, int wrapW, int wrapH) {
        int tileIndex = 0;
        int destY = startY % wrapH;
        int mapW = this.getMapWidth();
        int mapH = this.getMapHeight();
        int worldY = startY;
        while (worldY <= endY) {
            int destX = startX % wrapW;
            int worldX = startX;
            while (worldX <= endX) {
                block10: {
                    if (this.layerMode == 2) {
                        try {
                            tileIndex = this.sampleBackgroundTile(worldX, worldY);
                        }
                        catch (Exception exception) {
                            break block10;
                        }
                        graphics.setClip(destX, destY, this.backgroundBlockWidth, this.backgroundBlockHeight);
                        graphics.drawImage(this.backgroundImage, destX - tileIndex % this.backgroundBlocksPerRow * this.backgroundBlockWidth, destY - tileIndex / this.backgroundBlocksPerRow * this.backgroundBlockHeight, 20);
                    }
                    try {
                        tileIndex = this.sampleForegroundTile(worldX % mapW, worldY % mapH);
                    }
                    catch (Exception exception) {
                        break block10;
                    }
                    if (tileIndex != -1) {
                        graphics.setClip(destX, destY, this.tileWidth, this.tileHeight);
                        graphics.drawImage(this.foregroundImage, destX - tileIndex % this.foregroundTilesPerRow * this.tileWidth, destY - tileIndex / this.foregroundTilesPerRow * this.tileHeight, 20);
                    }
                    if ((destX += this.tileWidth) >= wrapW) {
                        destX = 0;
                    }
                }
                worldX += this.tileWidth;
            }
            if ((destY += this.tileHeight) >= wrapH) {
                destY = 0;
            }
            worldY += this.tileHeight;
        }
    }

    protected final void blitBufferRegion(Graphics graphics, int srcX, int srcY, int regionW, int regionH, int destX, int destY) {
        graphics.setClip(destX, destY, regionW, regionH);
        graphics.drawImage(offscreenBuffer, destX - srcX, destY - srcY, 20);
    }

    protected final void renderViewport(Graphics graphics, int camX, int camY, int viewW, int viewH) {
        int newRight;
        int newLeft;
        int bufW = offscreenBuffer.getWidth();
        int bufH = offscreenBuffer.getHeight();
        offscreenGraphics.setColor(0xFFFFFF);
        int alignedLeft = camX - camX % this.tileWidth;
        int alignedTop = camY - camY % this.tileHeight;
        int alignedRight = camX + bufW - this.tileWidth - (camX + bufW - this.tileWidth) % this.tileWidth;
        int alignedBottom = camY + bufH - this.tileHeight - (camY + bufH - this.tileHeight) % this.tileHeight;
        if (this.drawnLeft < 0) {
            this.drawTileRegion(offscreenGraphics, alignedLeft, alignedTop, alignedRight, alignedBottom, bufW, bufH);
            this.drawnLeft = alignedLeft;
            this.drawnTop = alignedTop;
            this.drawnRight = alignedRight;
            this.drawnBottom = alignedBottom;
        }
        if (this.drawnLeft != alignedLeft) {
            if (this.drawnLeft < alignedLeft) {
                newLeft = this.drawnRight + this.backgroundBlockWidth;
                newRight = alignedRight;
            } else {
                newLeft = alignedLeft;
                newRight = this.drawnLeft - this.backgroundBlockWidth;
            }
            this.drawTileRegion(offscreenGraphics, newLeft, alignedTop, newRight, alignedBottom, bufW, bufH);
            this.drawnLeft = alignedLeft;
            this.drawnRight = alignedRight;
        }
        if (this.drawnTop != alignedTop) {
            if (this.drawnTop < alignedTop) {
                newLeft = this.drawnBottom + this.backgroundBlockHeight;
                newRight = alignedBottom;
            } else {
                newLeft = alignedTop;
                newRight = this.drawnTop - this.backgroundBlockHeight;
            }
            this.drawTileRegion(offscreenGraphics, alignedLeft, newLeft, alignedRight, newRight, bufW, bufH);
            this.drawnTop = alignedTop;
            this.drawnBottom = alignedBottom;
        }
        int wrappedX = camX % bufW;
        int wrappedY = camY % bufH;
        int wrappedRight = (camX + viewW) % bufW;
        int wrappedBottom = (camY + viewH) % bufH;
        if (wrappedRight > wrappedX) {
            if (wrappedBottom > wrappedY) {
                this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW, viewH, 0, 0);
            } else {
                this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW, viewH - wrappedBottom, 0, 0);
                this.blitBufferRegion(graphics, wrappedX, 0, viewW, wrappedBottom, 0, viewH - wrappedBottom);
            }
        } else if (wrappedBottom > wrappedY) {
            this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW - wrappedRight, viewH, 0, 0);
            this.blitBufferRegion(graphics, 0, wrappedY, wrappedRight, viewH, viewW - wrappedRight, 0);
        } else {
            this.blitBufferRegion(graphics, wrappedX, wrappedY, viewW - wrappedRight, viewH - wrappedBottom, 0, 0);
            this.blitBufferRegion(graphics, wrappedX, 0, viewW - wrappedRight, wrappedBottom, 0, viewH - wrappedBottom);
            this.blitBufferRegion(graphics, 0, wrappedY, wrappedRight, viewH - wrappedBottom, viewW - wrappedRight, 0);
            this.blitBufferRegion(graphics, 0, 0, wrappedRight, wrappedBottom, viewW - wrappedRight, viewH - wrappedBottom);
        }
        graphics.setClip(0, 0, viewW, viewH);
    }

    public final void dispose() {
        int idx = 0;
        while (idx < this.collisionRows.length) {
            this.collisionRows[idx] = null;
            ++idx;
        }
        this.collisionRows = null;
        this.gridIndices = null;
        this.backgroundIndices = null;
        this.backgroundImage = null;
        this.foregroundTileIndices = null;
        this.foregroundImage = null;
        System.gc();
    }

    public final void load(int gridResId, int backgroundResId, int layerModeArg) {
        try {
            InputStream inputStream = GameMIDlet.openEntryStream("/res/m.bin", gridResId);
            if (GameMIDlet.readByte(inputStream) != 1) {
                return;
            }
            byte sharedResId = GameMIDlet.readByte(inputStream);
            this.cellTilesX = GameMIDlet.readByte(inputStream);
            this.cellTilesY = GameMIDlet.readByte(inputStream);
            this.gridCols = GameMIDlet.readShortLE(inputStream);
            this.gridRows = GameMIDlet.readShortLE(inputStream);
            this.gridIndices = new byte[this.gridCols * this.gridRows];
            inputStream.read(this.gridIndices);
            inputStream.close();
            inputStream = GameMIDlet.openEntryStream("/res/p.bin", sharedResId);
            if (GameMIDlet.readByte(inputStream) != 0) {
                return;
            }
            sharedResId = GameMIDlet.readByte(inputStream);
            this.foregroundPaletteWidth = GameMIDlet.readShortLE(inputStream);
            this.foregroundPaletteHeight = GameMIDlet.readShortLE(inputStream);
            this.tileWidth = GameMIDlet.readByte(inputStream);
            this.tileHeight = GameMIDlet.readByte(inputStream);
            this.foregroundTileIndices = new byte[this.foregroundPaletteWidth * this.foregroundPaletteHeight];
            inputStream.read(this.foregroundTileIndices);
            this.collisionStepX = GameMIDlet.readByte(inputStream);
            this.collisionStepY = GameMIDlet.readByte(inputStream);
            int cellPixelsX = this.tileWidth * this.foregroundPaletteWidth / this.collisionStepX;
            int collisionRowCount = this.tileHeight * this.foregroundPaletteHeight / this.collisionStepY;
            this.collisionRows = new byte[collisionRowCount][];
            int rowIdx = 0;
            while (rowIdx < collisionRowCount) {
                byte rowType = GameMIDlet.readByte(inputStream);
                if (rowType == 0) {
                    this.collisionRows[rowIdx] = new byte[1];
                    this.collisionRows[rowIdx][0] = 0;
                } else if (rowType == 1) {
                    this.collisionRows[rowIdx] = new byte[1 + cellPixelsX];
                    inputStream.read(this.collisionRows[rowIdx], 1, cellPixelsX);
                    this.collisionRows[rowIdx][0] = 1;
                } else {
                    int runCount = GameMIDlet.readByte(inputStream);
                    if (runCount < 0) {
                        runCount += 256;
                    }
                    this.collisionRows[rowIdx] = new byte[2 + 2 * runCount];
                    inputStream.read(this.collisionRows[rowIdx], 2, 2 * runCount);
                    this.collisionRows[rowIdx][0] = 2;
                }
                ++rowIdx;
            }
            inputStream.close();
            this.foregroundImage = GameMIDlet.loadImage("/res/fpng.bin", (int)sharedResId);
            this.foregroundTilesPerRow = this.foregroundImage.getWidth() / this.tileWidth;
            this.layerMode = layerModeArg;
            if (this.layerMode == 2) {
                inputStream = GameMIDlet.openEntryStream("/res/b.bin", backgroundResId);
                GameMIDlet.readByte(inputStream);
                GameMIDlet.readByte(inputStream);
                this.backgroundPaletteCols = GameMIDlet.readShortLE(inputStream);
                this.backgroundPaletteRows = GameMIDlet.readShortLE(inputStream);
                this.backgroundBlockWidth = GameMIDlet.readByte(inputStream);
                this.backgroundBlockHeight = GameMIDlet.readByte(inputStream);
                this.backgroundIndices = new byte[this.backgroundPaletteCols * this.backgroundPaletteRows];
                inputStream.read(this.backgroundIndices);
                inputStream.close();
                this.backgroundImage = GameMIDlet.loadImage("/res/bpng.bin", 0);
                this.backgroundBlocksPerRow = this.backgroundImage.getWidth() / this.backgroundBlockWidth;
            }
            this.ensureOffscreenBuffer(this.viewportWidth, this.viewportHeight);
            return;
        }
        catch (Exception exception) {
            return;
        }
    }
}
