// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/h.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.GameCanvas;       // 原: tjge.a
import tjge.SpriteDef;        // 原: tjge.d
import tjge.LevelScene;       // 原: tjge.j

public class ActorBase {                       // 原: class h
    public boolean alive;                      // 原: g
    protected int typeId;                       // 原: h
    protected SpriteDef spriteDef;              // 原: i  (tjge.d)
    protected boolean animLoop;                 // 原: j
    protected int actionCode;                   // 原: k
    protected int frameGroupIndex;              // 原: l
    protected boolean animDone;                 // 原: m
    protected int frameIndex;                   // 原: n
    protected short frameCount;                 // 原: o
    protected int boxLeft;                      // 原: p
    protected int boxRight;                     // 原: q
    protected int boxTop;                       // 原: r
    protected int boxBottom;                    // 原: s
    public int slotIndex;                       // 原: t
    public int posX;                            // 原: u
    public int posY;                            // 原: v
    public int velX;                            // 原: w
    public int velY;                            // 原: x
    public int targetVelX;                      // 原: y
    public int targetVelY;                      // 原: z
    public int accelX;                          // 原: A
    public int accelY;                          // 原: B
    public int maxVelX;                         // 原: C
    public int maxVelY;                         // 原: D
    public int drawAlpha;                       // 原: E
    public int palette;                         // 原: F
    public int reserved;                        // 原: G
    public int actionHighByte;                  // 原: H
    public int layer;                           // 原: I
    protected int hitFlashTimer;                // 原: J
    protected int collisionMask;                // 原: K
    protected GameCanvas canvas;                // 原: L  (tjge.a)
    private static int idCounter = 0;           // 原: N
    private int uniqueId;                       // 原: O
    private int lastContactId;                  // 原: P
    public boolean drawThisFrame = true;        // 原: M

    public ActorBase(int typeId, SpriteDef spriteDef) {   // 原: h(int n, d d2)
        this.typeId = typeId;
        this.spriteDef = spriteDef;
        this.alive = false;
        this.animLoop = true;
        this.canvas = GameCanvas.instance;       // 原: a.a
        this.uniqueId = idCounter;                // 原: N
        idCounter += 1000000;                     // 原: N += 1000000
    }

    public boolean spawnFromBytes(byte[] byArray) {        // 原: a(byte[])
        boolean bl = false;
        if (this.slotIndex < this.canvas.scene.residentActorSlots && this.canvas.scene.triggerHitFlags[this.slotIndex]) {
            if (this.typeId == 13) {
                bl = true;
            } else {
                return false;
            }
        }
        int actionLow = bl ? 4 : byArray[5] & 0x7F;
        int mirrorH = (byArray[5] & 0x80) << 24;
        int mirrorV = (byArray[5] & 0x40) << 24;
        this.setAction(actionLow | mirrorH | mirrorV);
        int spawnX = GameMIDlet.readIntLE(byArray, 1, 2);
        int spawnY = GameMIDlet.readIntLE(byArray, 3, 2);
        this.posX = spawnX << 10;
        this.posY = spawnY << 10;
        this.palette = byArray[6];
        this.drawAlpha = 0;
        this.velY = 0;
        this.velX = 0;
        this.targetVelY = 0;
        this.targetVelX = 0;
        this.accelX = 0;
        this.accelY = 0;
        this.maxVelX = 15360;
        this.maxVelY = 15360;
        this.hitFlashTimer = 0;
        this.animLoop = true;
        this.layer = LevelScene.actorDrawLayer[this.typeId];   // 原: tjge.j.h[this.h]
        return true;
    }

    public final void kill() {                              // 原: e()
        this.alive = false;
        LevelScene.activeActors[this.slotIndex] = null;     // 原: tjge.j.e[this.t]
    }

    public final void killAndMarkSpawned() {                // 原: f()
        this.kill();
        if (this.slotIndex < this.canvas.scene.residentActorSlots) {
            this.canvas.scene.triggerHitFlags[this.slotIndex] = true;
        }
    }

    public final void setAction(int code) {                 // 原: a(int n)
        this.actionCode = code;
        this.actionHighByte = code & 0xFF000000;
        this.frameGroupIndex = code &= 0xFFFFFF;
        if (code < 0 || code > this.spriteDef.getActionCount()) {   // 原: this.i.a()
            return;
        }
        if ((this.actionCode & Integer.MIN_VALUE) == 0) {
            this.boxLeft = this.spriteDef.actionParamA[code];        // 原: this.i.f[n]
            this.boxRight = this.spriteDef.actionParamB[code];       // 原: this.i.g[n]
        } else {
            this.boxLeft = -this.spriteDef.actionParamB[code];       // 原: -this.i.g[n]
            this.boxRight = -this.spriteDef.actionParamA[code];      // 原: -this.i.f[n]
        }
        if ((this.actionCode & 0x40000000) == 0) {
            this.boxTop = this.spriteDef.actionParamC[code];         // 原: this.i.h[n]
            this.boxBottom = this.spriteDef.actionParamD[code];      // 原: this.i.i[n]
        } else {
            this.boxTop = -this.spriteDef.actionParamD[code];        // 原: -this.i.i[n]
            this.boxBottom = -this.spriteDef.actionParamC[code];     // 原: -this.i.h[n]
        }
        this.frameCount = this.spriteDef.getFrameCount(code);        // 原: this.i.a(n)
        this.frameIndex = 0;
        this.animDone = false;
        ++this.uniqueId;
    }

    public final void advanceFrame() {                      // 原: g()
        ++this.frameIndex;
        if (this.frameIndex >= this.frameCount) {
            this.frameIndex = this.animLoop ? 0 : --this.frameIndex;
            this.animDone = true;
        }
    }

    public final boolean isAnimationDone() {                // 原: h()
        return this.animDone;
    }

    public void step() {                                    // 原: i()
        this.advanceFrame();
        this.velX = this.targetVelX;
        this.velY = this.targetVelY;
        this.targetVelX += this.accelX;
        if (this.accelX > 0 && this.targetVelX > this.maxVelX) {
            this.targetVelX = this.maxVelX;
        }
        if (this.accelX < 0 && this.targetVelX < -this.maxVelX) {
            this.targetVelX = -this.maxVelX;
        }
        this.targetVelY += this.accelY;
        if (this.accelY > 0 && this.targetVelY > this.maxVelY) {
            this.targetVelY = this.maxVelY;
        }
        if (this.accelY < 0 && this.targetVelY < -this.maxVelY) {
            this.targetVelY = -this.maxVelY;
        }
        this.posX += this.velX;
        this.posY += this.velY;
    }

    public void update() {                                  // 原: b()
    }

    public void paint(Graphics graphics, int camX, int camY) {   // 原: a(Graphics, int n, int n2)
        if (!this.drawThisFrame) {
            this.drawThisFrame = true;
            return;
        }
        if (this.hitFlashTimer == 0 || --this.hitFlashTimer > 0 && (this.hitFlashTimer & 1) != 0) {
            short topExtent;
            short bottomExtent;
            short rightExtent;
            short leftExtent;
            int screenX = (this.posX >> 10) - camX;
            int screenY = (this.posY >> 10) - camY;
            int mirrorHFlag = this.actionCode & Integer.MIN_VALUE;
            int mirrorVFlag = this.actionCode & 0x40000000;
            if (mirrorHFlag != 0) {
                leftExtent = -this.spriteDef.paramK;        // 原: -this.i.k
                rightExtent = -this.spriteDef.paramJ;       // 原: -this.i.j
            } else {
                leftExtent = this.spriteDef.paramJ;                 // 原: this.i.j
                rightExtent = this.spriteDef.paramK;                // 原: this.i.k
            }
            if (screenX + rightExtent < 0 || screenX + leftExtent > 176) {
                return;
            }
            if (mirrorVFlag != 0) {
                bottomExtent = -this.spriteDef.paramM;      // 原: -this.i.m
                topExtent = -this.spriteDef.paramL;         // 原: -this.i.l
            } else {
                bottomExtent = this.spriteDef.paramL;               // 原: this.i.l
                topExtent = this.spriteDef.paramM;                  // 原: this.i.m
            }
            if (screenY + topExtent < 0 || screenY + bottomExtent > 172) {
                return;
            }
            this.spriteDef.drawFrame(graphics, screenX, screenY, this.actionCode, this.frameIndex, this.palette, this.drawAlpha);
        }
    }

    public final boolean intersectsRect(int left, int top, int right, int bottom) {   // 原: a(int n, int n2, int n3, int n4)
        int myLeft = (this.posX >> 10) + this.boxLeft;
        int myRight = (this.posX >> 10) + this.boxRight;
        int myTop = (this.posY >> 10) + this.boxTop;
        int myBottom = (this.posY >> 10) + this.boxBottom;
        return myRight >= left && myLeft <= right && myBottom >= top && myTop <= bottom;
    }

    public final boolean collidesWith(ActorBase other) {    // 原: b(h h2)
        if (this.boxLeft == this.boxRight || this.boxTop == this.boxBottom || other.boxLeft == other.boxRight || other.boxTop == other.boxBottom) {
            return false;
        }
        int otherLeft = (other.posX >> 10) + other.boxLeft;
        int otherRight = (other.posX >> 10) + other.boxRight;
        int otherTop = (other.posY >> 10) + other.boxTop;
        int otherBottom = (other.posY >> 10) + other.boxBottom;
        return this.intersectsRect(otherLeft, otherTop, otherRight, otherBottom);
    }

    public boolean collideLeft() {                          // 原: j()
        if (this.velX > 0) {
            return false;
        }
        int tileXAhead = (this.posX + this.velX >> 10) + this.boxLeft >> 3;
        int tileXCur = (this.posX >> 10) + this.boxLeft >> 3;
        int tileTop = (this.posY + this.velY >> 10) + this.boxTop + 1 >> 3;
        int tileBottom = (this.posY + this.velY >> 10) + this.boxBottom - 1 >> 3;
        int tileY = tileTop;
        while (tileY <= tileBottom) {
            int tileX = tileXCur;
            while (tileX >= tileXAhead) {
                int cell = this.tileAt(tileX, tileY);
                if (cell == 1) {
                    this.targetVelX = 0;
                    this.posX &= 0xFFFFFC00;
                    this.velX = ((tileX << 3) + 9 << 10) - (this.posX + (this.boxLeft << 10));
                    return true;
                }
                --tileX;
            }
            ++tileY;
        }
        return false;
    }

    public boolean collideRight() {                         // 原: k()
        if (this.velX < 0) {
            return false;
        }
        int tileXCur = (this.posX >> 10) + this.boxRight >> 3;
        int tileXAhead = (this.posX + this.velX >> 10) + this.boxRight >> 3;
        int tileTop = (this.posY + this.velY >> 10) + this.boxTop + 1 >> 3;
        int tileBottom = (this.posY + this.velY >> 10) + this.boxBottom - 1 >> 3;
        int tileY = tileTop;
        while (tileY <= tileBottom) {
            int tileX = tileXCur;
            while (tileX <= tileXAhead) {
                int cell = this.tileAt(tileX, tileY);
                if (cell == 1) {
                    this.targetVelX = 0;
                    this.posX &= 0xFFFFFC00;
                    this.velX = ((tileX << 3) - 1 << 10) - (this.posX + (this.boxRight << 10));
                    return true;
                }
                ++tileX;
            }
            ++tileY;
        }
        return false;
    }

    public boolean collideDown() {                          // 原: l()
        if (this.velY > 0) {
            return false;
        }
        int tileYCur = (this.posY >> 10) + this.boxTop >> 3;
        int tileYAhead = (this.posY + this.velY >> 10) + this.boxTop >> 3;
        int tileLeft = (this.posX + this.velX >> 10) + this.boxLeft + 1 >> 3;
        int tileRight = (this.posX + this.velX >> 10) + this.boxRight - 1 >> 3;
        int tileX = tileLeft;
        while (tileX <= tileRight) {
            int tileY = tileYCur;
            while (tileY >= tileYAhead) {
                int cell = this.tileAt(tileX, tileY);
                if (cell == 1) {
                    this.targetVelY = 0;
                    this.velY = ((tileY << 3) + 9 << 10) - (this.posY + (this.boxTop << 10));
                    return true;
                }
                --tileY;
            }
            ++tileX;
        }
        return false;
    }

    protected final boolean hasCollisionFlag(int mask) {    // 原: b(int n)
        return (this.collisionMask & mask) != 0;
    }

    protected int getDamage() {                             // 原: m()
        return 0;
    }

    protected boolean onHitBy(ActorBase other) {            // 原: a(h h2)
        return false;
    }

    protected void onCollide(ActorBase other) {             // 原: c(h h2)
    }

    protected boolean isAlive() {                           // 原: d()
        return true;
    }

    protected final void checkCollisions() {                // 原: n()
        if (this.collisionMask == 0) {
            return;
        }
        int i = 0;
        while (i < LevelScene.drawCount) {                  // 原: tjge.j.g
            ActorBase other = LevelScene.drawList[i];       // 原: tjge.j.f[n]
            if (other != null && other != this && other.alive && this.collidesWith(other) && other.onHitBy(this)) {
                this.onCollide(other);
            }
            ++i;
        }
    }

    protected final boolean isNewContact(ActorBase other) {  // 原: d(h h2)
        if (other.uniqueId != this.lastContactId) {
            this.lastContactId = other.uniqueId;
            return true;
        }
        return false;
    }

    protected final int tileAt(int tileX, int tileY) {       // 原: a(int n, int n2)
        return LevelScene.camera.sampleCollision(tileX << 3, tileY << 3);   // 原: tjge.j.a.b(n << 3, n2 << 3)
    }
}
