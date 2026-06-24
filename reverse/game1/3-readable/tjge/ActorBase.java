// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/g.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameScreen;
import tjge.TileMap;
import tjge.SpriteDef;
import tjge.ProjectileActor;

public class ActorBase {
    public boolean active;
    protected int typeId;
    protected SpriteDef spriteDef;
    protected boolean loopAnimation;
    protected int frameIndex;
    protected boolean animationDone;
    protected int currentFrame;
    protected short frameCount;
    protected int boundsLeft;
    protected int boundsRight;
    protected int boundsTop;
    protected int boundsBottom;
    public int extra;
    public int posX;
    public int posY;
    public int velX;
    public int velY;
    public int targetVelX;
    public int targetVelY;
    public int accelX;
    public int accelY;
    public int maxVelX;
    public int maxVelY;
    public int orientation;
    public int drawParam;

    public ActorBase(int typeId, SpriteDef spriteDef) {
        this.typeId = typeId;
        this.spriteDef = spriteDef;
        this.active = false;
        this.loopAnimation = true;
    }

    public boolean spawnAt(int frameIndex, int tileX, int tileY, byte[] params, boolean flag) {
        this.setFrame(frameIndex);
        this.posX = tileX << 10;
        this.posY = tileY << 10;
        this.velY = 0;
        this.velX = 0;
        this.targetVelY = 0;
        this.targetVelX = 0;
        this.accelY = 0;
        this.accelX = 0;
        this.maxVelX = 12288;
        this.maxVelY = 12288;
        this.orientation = 0;
        this.drawParam = 0;
        return true;
    }

    public final void deactivate() {
        this.active = false;
    }

    public final void setFrame(int frameIndex) {
        this.frameIndex = frameIndex;
        if ((frameIndex &= 0xFFFFFF) < 0 || frameIndex > this.spriteDef.getSequenceCount()) {
            return;
        }
        if ((this.frameIndex & Integer.MIN_VALUE) == 0) {
            this.boundsLeft = this.spriteDef.collisionBoxX[frameIndex];
            this.boundsRight = this.spriteDef.collisionBoxY[frameIndex];
        } else {
            this.boundsLeft = -this.spriteDef.collisionBoxY[frameIndex];
            this.boundsRight = -this.spriteDef.collisionBoxX[frameIndex];
        }
        if ((this.frameIndex & 0x40000000) == 0) {
            this.boundsTop = this.spriteDef.collisionBoxWidth[frameIndex];
            this.boundsBottom = this.spriteDef.collisionBoxHeight[frameIndex];
        } else {
            this.boundsTop = -this.spriteDef.collisionBoxHeight[frameIndex];
            this.boundsBottom = -this.spriteDef.collisionBoxWidth[frameIndex];
        }
        if (this.orientation == 270) {
            int swap = 0;
            this.boundsTop = this.boundsLeft = this.boundsTop;
            swap = this.boundsRight;
            this.boundsRight = this.boundsBottom;
            this.boundsBottom = swap;
        }
        this.frameCount = this.spriteDef.getSequenceFrameCount(frameIndex);
        this.currentFrame = 0;
        this.animationDone = false;
    }

    public final void advanceAnimation() {
        ++this.currentFrame;
        if (this.currentFrame >= this.frameCount) {
            this.currentFrame = this.loopAnimation ? 0 : --this.currentFrame;
            this.animationDone = true;
        }
    }

    public final boolean isAnimationDone() {
        return this.animationDone;
    }

    public void stepPhysics() {
        this.advanceAnimation();
        this.velX = this.targetVelX;
        this.velY = this.targetVelY;
        this.targetVelX += this.accelX;
        if (this.accelX > 0 && this.targetVelX > this.maxVelX) {
            this.targetVelX = this.maxVelX;
        }
        if (this.accelX < 0 && this.targetVelX < this.maxVelX) {
            this.targetVelX = this.maxVelX;
        }
        this.targetVelY += this.accelY;
        if (this.accelY > 0 && this.targetVelY > this.maxVelY) {
            this.targetVelY = this.maxVelY;
        }
        if (this.accelY < 0 && this.targetVelY < this.maxVelY) {
            this.targetVelY = this.maxVelY;
        }
        this.posX += this.velX;
        this.posY += this.velY;
    }

    public void update() {
    }

    public void onProjectileHit(ProjectileActor projectile) {
    }

    public void paint(Graphics graphics, int cameraX, int cameraY) {
        // 原始局部 s..s4 为屏幕剔除用的边界范围；这里保留与 CFR 完全一致的字段引用：
        // 类 d(SpriteDef) 字段 j=boundsX, k=boundsY, l=boundsWidth, m=boundsHeight。
        short yExtentLo;   // 原 s  : 纵向近端，与 screenY 比较是否在屏上方之外
        short yExtentHi;   // 原 s2 : 纵向远端，与 playHeight 比较是否在屏下方之外
        short xExtentLo;   // 原 s3 : 横向近端，与 screenX 比较是否在屏左侧之外
        short xExtentHi;   // 原 s4 : 横向远端，与 screenWidth 比较是否在屏右侧之外
        int screenX = (this.posX >> 10) - cameraX;
        int screenY = (this.posY >> 10) - cameraY;
        int hFlip = this.frameIndex & Integer.MIN_VALUE;
        int vFlip = this.frameIndex & 0x40000000;
        if (hFlip != 0) {
            xExtentHi = -this.spriteDef.boundsY;
            xExtentLo = -this.spriteDef.boundsX;
        } else {
            xExtentHi = this.spriteDef.boundsX;
            xExtentLo = this.spriteDef.boundsY;
        }
        if (screenX + xExtentLo < 0 || screenX + xExtentHi > GameScreen.screenWidth) {
            return;
        }
        if (vFlip != 0) {
            yExtentHi = -this.spriteDef.boundsHeight;
            yExtentLo = -this.spriteDef.boundsWidth;
        } else {
            yExtentHi = this.spriteDef.boundsWidth;
            yExtentLo = this.spriteDef.boundsHeight;
        }
        if (screenY + yExtentLo < 0 || screenY + yExtentHi > GameScreen.playHeight) {
            return;
        }
        this.spriteDef.paintSequenceFrame(graphics, screenX, screenY, this.frameIndex, this.currentFrame, this.drawParam, this.orientation);
    }

    public final boolean intersectsActor(ActorBase other) {
        if (this == other || this.boundsLeft == this.boundsRight || this.boundsTop == this.boundsBottom || other.boundsLeft == other.boundsRight || other.boundsTop == other.boundsBottom) {
            return false;
        }
        int thisLeft = (this.posX >> 10) + this.boundsLeft;
        int thisRight = (this.posX >> 10) + this.boundsRight;
        int thisTop = (this.posY >> 10) + this.boundsTop;
        int thisBottom = (this.posY >> 10) + this.boundsBottom;
        int otherLeft = (other.posX >> 10) + other.boundsLeft;
        int otherRight = (other.posX >> 10) + other.boundsRight;
        int otherTop = (other.posY >> 10) + other.boundsTop;
        int otherBottom = (other.posY >> 10) + other.boundsBottom;
        return thisRight >= otherLeft && thisLeft <= otherRight && thisBottom >= otherTop && thisTop <= otherBottom;
    }

    public final boolean collideLeftWall(TileMap tileMap) {
        if (this.velX >= 0) {
            return false;
        }
        int rowBase = this.posY + this.velY >> 10;
        int col = (this.posX + this.velX >> 10) + this.boundsLeft >> 4;
        int rowTop = rowBase + this.boundsTop + 1 >> 4;
        int rowBottom = rowBase + this.boundsBottom - 2 >> 4;
        int row = rowTop;
        while (row <= rowBottom) {
            int dx = 0;
            while (dx < 2) {
                rowBase = tileMap.queryColumnTileAt(col + dx, row, false);
                if (rowBase == 1) {
                    this.targetVelX = 0;
                    this.posX &= 0xFFFFFC00;
                    this.velX = ((col + dx << 4) + 15 << 10) - (this.posX + (this.boundsLeft << 10));
                    return true;
                }
                ++dx;
            }
            ++row;
        }
        return false;
    }

    public final boolean collideRightWall(TileMap tileMap) {
        if (this.velX <= 0) {
            return false;
        }
        int rowBase = this.posY + this.velY >> 10;
        int col = (this.posX + this.velX >> 10) + this.boundsRight >> 4;
        int rowTop = rowBase + this.boundsTop + 1 >> 4;
        int rowBottom = rowBase + this.boundsBottom - 2 >> 4;
        int row = rowTop;
        while (row <= rowBottom) {
            int dx = 0;
            while (dx < 2) {
                rowBase = tileMap.queryColumnTileAt(col - dx, row, false);
                if (rowBase == 1) {
                    this.targetVelX = 0;
                    this.posX &= 0xFFFFFC00;
                    this.velX = ((col - dx << 4) - 1 << 10) - (this.posX + (this.boundsRight << 10));
                    return true;
                }
                ++dx;
            }
            ++row;
        }
        return false;
    }

    public boolean collideGround(TileMap tileMap) {
        if (this.velY < 0) {
            return false;
        }
        int row = (this.posY + this.velY >> 10) + this.boundsBottom >> 4;
        int colLeft = (this.posX + this.velX >> 10) + this.boundsLeft + 1 >> 4;
        int colRight = (this.posX + this.velX >> 10) + this.boundsRight - 1 >> 4;
        int col = colLeft;
        while (col <= colRight) {
            int tile = tileMap.queryColumnTileAt(col, row, false);
            if (tile == 1) {
                this.accelY = 0;
                this.targetVelY = 0;
                this.velY = ((row << 4) - this.boundsBottom << 10) - this.posY;
                this.posY += this.velY;
                this.velY = 0;
                return true;
            }
            ++col;
        }
        return false;
    }

    public final boolean collideCeiling(TileMap tileMap) {
        if (this.velY > 0) {
            return false;
        }
        int col = this.posX + this.velX >> 14;
        int row = (this.posY + this.velY >> 10) + this.boundsTop - 4 >> 4;
        if (tileMap.queryColumnTileAt(col, row, false) == 1) {
            this.targetVelY = 0;
            this.velY = ((row << 4) + 15 - this.boundsTop + 4 << 10) - this.posY;
            this.accelY = 4096;
            return true;
        }
        return false;
    }
}
