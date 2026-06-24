// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/l.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameScreen;     // 原 tjge.a
import tjge.SpriteDef;      // 原 tjge.d
import tjge.EffectActor;    // 原 tjge.e
import tjge.PlayerActor;    // 原 tjge.f
import tjge.ActorBase;      // 原 tjge.g

public final class ProjectileActor
extends ActorBase {
    GameScreen world;       // 原字段 a
    int frameCounter;       // 原字段 b
    int launchOriginX;      // 原字段 c
    int mode;               // 原字段 d
    int lifeTimer;          // 原字段 e
    int armingDelay;        // 原字段 f
    int loopFrames;         // 原字段 g
    int subType;            // 原字段 h

    // 原方法 l(ILtjge/d;Ltjge/a;)V -> Projectile（构造函数）
    public ProjectileActor(int typeId, SpriteDef spriteDef, GameScreen world) {
        super(typeId, spriteDef);
        this.world = world;
    }

    // 原方法 a()V -> update
    public final void update() {
        int index = 0;
        while (index < this.world.drawQueueCount) {            // this.a.v
            if (this.intersectsActor(this.world.drawQueue[index])) {     // this.a(this.a.k[index]) : 参数为 Actor(g) -> 父类 intersectsActor(tjge.g)
                this.world.drawQueue[index].onProjectileHit(this);       // this.a.k[index].a(this)
            }
            ++index;
        }
        if (!this.active) {                                    // this.p
            return;
        }
        int frameLow = this.frameIndex & 0xFFFFFF;             // this.t
        PlayerActor player = this.world.player;                // f f2 = this.a.j
        switch (this.typeId) {                                 // this.q
            case 15:
            case 21: {
                switch (frameLow) {
                    case 0: {
                        if (this.world.levelIndex != 4) {      // this.a.x
                            if (this.collideLeftWall(this.world.tileMap) || this.collideRightWall(this.world.tileMap)) {  // this.a(this.a.f) || this.b(this.a.f)
                                if (this.typeId == 21) {
                                    this.posX += this.velX;    // this.C += this.E
                                    this.setFrame(1);          // this.a(1)
                                } else {
                                    this.world.spawnProjectile(16, 0, 0, this.posX, this.posY, this.mode);  // this.a.a(16,0,0,this.C,this.D,this.d)
                                    this.deactivate();         // this.b()
                                    GameScreen.playSound(5, 1, 220);  // tjge.a.a(5,1,220)
                                }
                            } else if (this.targetVelX > 0 && this.posX - this.launchOriginX > 204800 || this.targetVelX < 0 && this.launchOriginX - this.posX > 204800) {  // this.G>0 && this.C-this.c>204800 || ...
                                this.deactivate();             // this.b()
                            }
                        }
                        if (this.posX >= this.world.cameraX && this.posX <= this.world.cameraX + GameScreen.viewWidthFx) break;  // this.C>=this.a.r && this.C<=this.a.r+tjge.a.c
                        this.deactivate();                     // this.b()
                        break;
                    }
                    case 1: {
                        if (!this.isAnimationDone()) break;    // this.d()
                        this.deactivate();                     // this.b()
                    }
                }
                return;
            }
            case 10: {
                if (this.mode == 2) {                          // this.d == 2
                    if (this.armingDelay-- > 0) {              // this.f-- > 0
                        return;
                    }
                    if (this.intersectsActor(this.world.player)) {  // this.a(this.a.j)
                        this.world.player.takeDamage(2);       // this.a.j.e(2)
                    }
                }
                switch (frameLow) {
                    case 1: {
                        if (this.frameCounter-- >= 0) break;   // this.b-- >= 0
                        if (this.subType == 1) {               // this.h == 1
                            this.setFrame(Integer.MIN_VALUE);  // this.a(Integer.MIN_VALUE)
                            break;
                        }
                        this.setFrame(0);                      // this.a(0)
                        break;
                    }
                    case 0: {
                        if (!this.isAnimationDone()) break;    // this.d()
                        if (this.mode == 2) {                  // this.d == 2
                            this.frameCounter = this.loopFrames;  // this.b = this.g
                            this.setFrame(1);                  // this.a(1)
                            break;
                        }
                        this.deactivate();                     // this.b()
                    }
                }
                return;
            }
            case 20: {
                if (this.mode == 1 && --this.lifeTimer < 0) {  // this.d == 1 && --this.e < 0
                    int unused = this.targetVelX = this.world.levelIndex == 4 ? this.world.cameraVelX : 0;  // this.G = this.a.x==4 ? this.a.t : 0
                }
                if (this.world.levelIndex != 4 && (this.collideGround(this.world.tileMap) || this.collideLeftWall(this.world.tileMap) || this.collideRightWall(this.world.tileMap)) || this.world.levelIndex == 4 && this.posY >= player.posY + 30720) {  // this.a.x!=4 && (this.c(this.a.f)||this.a(this.a.f)||this.b(this.a.f)) || this.a.x==4 && this.D >= f2.D+30720
                    this.world.spawnProjectile(16, 0, 0, this.posX, this.posY, this.mode);  // this.a.a(16,0,0,this.C,this.D,this.d)
                    this.deactivate();                         // this.b()
                    GameScreen.playSound(5, 1, 220);           // tjge.a.a(5,1,220)
                    return;
                }
                ++this.frameCounter;                           // ++this.b
                return;
            }
            case 16: {
                if (!this.isAnimationDone()) break;            // this.d()
                this.deactivate();                             // this.b()
            }
        }
    }

    // 原方法 a(Ljavax/microedition/lcdui/Graphics;II)V -> paint
    public final void paint(Graphics graphics, int cameraX, int cameraY) {
        if (this.typeId == 20 && this.frameCounter < 2) {      // this.q == 20 && this.b < 2
            return;
        }
        super.paint(graphics, cameraX, cameraY);               // super.a(graphics, n, n2)
    }

    // 原方法 f()V -> computeHomingTrajectory
    public final void computeHomingTrajectory() {
        int horizDist = 0;             // n
        int absDeltaY = 0;             // n2
        int targetY = 0;               // n3
        int bestDeltaY = 0;            // n4
        int index = 0;                 // n5
        while (index < this.world.drawQueueCount) {            // this.a.v
            if (this.isHomingTarget(this.world.drawQueue[index].typeId) && (bestDeltaY > (absDeltaY = Math.abs(this.posY - this.world.drawQueue[index].posY + 15360)) || bestDeltaY == 0)) {  // this.d(this.a.k[index].q) && (n4 > (n2 = Math.abs(this.D - this.a.k[index].D + 15360)) || n4 == 0)
                bestDeltaY = absDeltaY;
                targetY = this.world.drawQueue[index].posY - 20480;        // this.a.k[index].D - 20480
                horizDist = Math.abs(this.posX - this.world.drawQueue[index].posX);  // Math.abs(this.C - this.a.k[index].C)
            }
            ++index;
        }
        this.targetVelX += this.world.player.facingFlag == 0 ? 12288 : -12288;  // this.G += this.a.j.d == 0 ? 12288 : -12288
        if (bestDeltaY == 0 || this.posY > targetY - 10240 && this.posY < targetY + 10240) {  // n4==0 || this.D > n3-10240 && this.D < n3+10240
            this.targetVelY = 0;       // this.H = 0
            return;
        }
        absDeltaY = Math.abs(this.targetVelX);                 // n2 = Math.abs(this.G)
        if ((horizDist /= absDeltaY) <= 0) {                   // (n /= n2) <= 0
            horizDist = 1;
        }
        this.targetVelY = this.posY > targetY ? -bestDeltaY : (bestDeltaY /= horizDist);  // this.H = this.D > n3 ? -n4 : (n4 /= n)
    }

    // 原方法 a(Z)Z -> advanceAndCollide
    public final boolean advanceAndCollide(boolean moveRight) {            // 参数 bl
        EffectActor effect;            // e e2
        int index = 0;                 // n
        while (index < this.world.drawQueueCount) {            // this.a.v
            if (this.isEffectType(this.world.drawQueue[index].typeId) && this.intersectsActor(effect = (EffectActor)this.world.drawQueue[index])) {  // this.c(this.a.k[index].q) && this.a(e2 = (e)this.a.k[index])
                effect.onProjectileHit(this);                  // e2.a(this)
                return true;
            }
            ++index;
        }
        effect = null;                 // e2 = null
        int tileX = this.posX >> 14;                           // n2 = this.C >> 14
        int probeTileX = moveRight ? tileX + 1 : tileX - 1;    // n3 = bl ? n2+1 : n2-1
        int topPixel = this.posY >> 10;                        // n4 = this.D >> 10
        int rowStart = topPixel + this.boundsTop + 1 >> 4;     // n5 = n4 + this.z + 1 >> 4
        int rowEnd = topPixel + this.boundsBottom - 2 >> 4;    // n6 = n4 + this.A - 2 >> 4
        int row = rowStart;            // n7 = n5
        while (row <= rowEnd) {
            if (this.world.tileMap.queryColumnTileAt(tileX, row, false) == 1 || this.world.tileMap.queryColumnTileAt(probeTileX, row, false) == 1) {  // this.a.f.a(n2, n7, false) == 1 || this.a.f.a(n3, n7, false) == 1
                return true;
            }
            ++row;
        }
        return false;
    }

    // 原方法 b(I)V -> launchArc
    public final void launchArc(int direction) {               // 参数 n
        int initialVelY = 0;           // n2
        int horizDist = Math.abs(this.world.player.posX - this.posX);  // n3 = Math.abs(this.a.j.C - this.C)
        if (horizDist < 40960) {
            horizDist = 40960;
        }
        int steps = horizDist / 5120;                          // n4
        int halfSteps = steps >>> 1;                           // n5
        int triangularSum = 0;                                 // n6
        int i = 0;                     // n7
        while (i < halfSteps) {
            triangularSum += i;
            ++i;
        }
        horizDist = (horizDist >>> 2) * 3;                     // n3 = (n3 >>> 2) * 3
        triangularSum = (horizDist >>> 1) / triangularSum;     // n6 = (n3 >>> 1) / n6
        initialVelY = (halfSteps - 1) * triangularSum;         // n2 = (n5 - 1) * n6
        this.targetVelX += direction == 0 ? -5120 : 5120;      // this.G += n == 0 ? -5120 : 5120
        if (initialVelY > 15360) {
            initialVelY = 15360;
        }
        this.targetVelY = -initialVelY;                        // this.H = -n2
        this.accelY = triangularSum;                           // this.J = n6
        this.maxVelY = initialVelY;                            // this.L = n2
        this.lifeTimer = steps;                                // this.e = n4
    }

    // 原方法 c(I)Z -> isEffectType
    private boolean isEffectType(int typeId) {                 // 参数 n
        return typeId == 7 || typeId == 9;
    }

    // 原方法 d(I)Z -> isHomingTarget
    private boolean isHomingTarget(int typeId) {               // 参数 n
        return typeId == 2 || typeId == 1;
    }

    // 原方法 a(III[BZ)Z -> spawn
    public final boolean spawn(int frameIndex, int tileX, int tileY, byte[] params, boolean flag) {  // n, n2, n3, byArray, bl
        if (flag) {
            return false;
        }
        super.spawnAt(frameIndex, tileX, tileY, params, flag);  // super.a(n, n2, n3, byArray, bl)
        if (this.typeId == 10) {                               // this.q == 10
            this.armingDelay = params[0];                      // this.f = byArray[0]
            this.loopFrames = params[1];                       // this.g = byArray[1]
            this.subType = params[2];                          // this.h = byArray[2]
            this.frameCounter = -1;                            // this.b = -1
            this.loopAnimation = false;                        // this.s = false
            this.mode = 2;                                     // this.d = 2
            this.orientation = this.subType == 2 ? 270 : 0;    // this.M = this.h == 2 ? 270 : 0
            this.setFrame(1);                                  // this.a(1)
        }
        return true;
    }
}
