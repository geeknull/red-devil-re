// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/k.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.GameCanvas;      // 原 tjge.a
import tjge.SpriteDef;       // 原 tjge.d
import tjge.ItemActor;       // 原 tjge.e
import tjge.ActorBase;       // 原 tjge.h

public final class ProjectileActor          // 原 k
extends ActorBase {                          // 原 h
    // 静态表：子弹动作索引(frameGroupIndex)→碰撞层掩码(1=子弹,3=手雷,0=无碰撞)，供 getCollisionMask 查表
    public static final int[] collisionMaskTable = new int[]{1, 1, 1, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0}; // 原字段 a
    public int timer;                        // 原 b：手雷倒计时 / 追踪弹追踪计数(=8 时锁定玩家方向)
    private int frameTicks;                   // 原 f：帧计时器，>30 触发超时回收
    public int collisionMask;                 // 原 c：当前生效碰撞层掩码(默认 3)
    private boolean exploded;                  // 原 Q：命中/爆炸触发标志
    public boolean hitWall;                   // 原 d：撞墙标志
    private boolean expired;                   // 原 R：出界/超时回收标志
    public boolean isSpecialGrenade;          // 原 e：特殊手雷标志

    public ProjectileActor(int typeId, SpriteDef spriteDef) {   // 原构造器 k(int, d)
        super(typeId, spriteDef);
    }

    // 原 b()：每帧更新
    public final void tick() {
        switch (this.typeId) {                                  // 原 this.h
            case 10: {
                switch (this.frameGroupIndex) {                 // 原 this.l
                    case 9: {
                        if (Math.abs(this.targetVelY) <= 2048) {     // 原 this.z
                            this.setAction(0xA | this.actionHighByte);   // 原 a(...) / this.H
                        }
                    }
                    case 10: {
                        if (this.targetVelY > 3072) {                // 原 this.z
                            this.setAction(0xB | this.actionHighByte);
                        }
                    }
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 11:
                    case 12: {
                        ++this.frameTicks;                           // 原 this.f
                    }
                    case 6: {
                        if (this.typeId == 6 && !this.hasCollisionFlag(1)) {   // 原 this.h / b(1)
                            if (this.timer-- <= 0) {                 // 原 this.b
                                this.targetVelX = 0;                 // 原 this.y
                            }
                        } else if (this.frameTicks > 30) {           // 原 this.f
                            this.expired = true;                     // 原 this.R
                        }
                        this.checkCollisions();                      // 原 this.n()
                        boolean collidedThisStep = false;            // 原局部 bl
                        if (this.targetVelX > 0) {                   // 原 this.y
                            if (this.collideRight()) {               // 原 this.k()
                                this.hitWall = true;                 // 原 this.d
                            } else if (this.posX > this.canvas.cameraX + this.canvas.viewportWidth + 8192) { // 原 this.u / L.m / L.q
                                this.expired = true;
                            }
                        } else if (this.targetVelX < 0) {
                            if (this.collideLeft()) {                // 原 this.j()
                                this.hitWall = true;
                            } else if (this.posX < this.canvas.cameraX - 8192) {   // 原 this.u / L.m
                                this.expired = true;
                            }
                        }
                        if (this.targetVelY < 0) {                   // 原 this.z
                            if (this.collideDown()) {                // 原 this.l()
                                this.hitWall = true;
                            } else if (this.posY < this.canvas.cameraY - 8192) {   // 原 this.v / L.n
                                this.expired = true;
                            }
                        } else if (this.targetVelY > 0) {
                            if (this.checkFloorCollision()) {        // 原 this.a()
                                this.hitWall = true;
                            } else if (this.posY > this.canvas.cameraY + this.canvas.viewportHeight + 8192) {  // 原 this.v / L.n / L.r
                                this.expired = true;
                            }
                        }
                        if ((this.exploded || this.hitWall) && (this.frameGroupIndex == 6 || this.frameGroupIndex == 9 || this.frameGroupIndex == 10 || this.frameGroupIndex == 11 || this.frameGroupIndex == 12)) {  // 原 Q / d / l
                            ProjectileActor.spawnProjectile(12, 0, this.posX, this.posY, this.collisionMaskField, null);  // 原 tjge.k.a(...) / this.u,v / this.K
                            this.kill();                             // 原 this.e()
                            break;
                        }
                        if (this.frameGroupIndex == 11 && this.isSpecialGrenade && this.posY > 149504) {  // 原 l / e / v
                            ItemActor spawnedItem = (ItemActor)this.canvas.scene.spawnActor(20, -1);      // 原 (e)this.L.z.c(20,-1)
                            ((ItemActor)this.canvas.scene.spawnActor(20, -1)).posX = this.posX;            // 原 ((e)L.z.c(20,-1)).u = this.u
                            spawnedItem.posY = this.posY + 10240;    // 原 e2.v / this.v
                            spawnedItem.targetVelX = 0;              // 原 e2.y
                            spawnedItem.targetVelY = 0;              // 原 e2.z
                            spawnedItem.accelY = 0;                  // 原 e2.B
                            spawnedItem.setAction(0);                // 原 e2.a(0)
                            spawnedItem.drawThisFrame = false;       // 原 e2.M
                            this.accelY = 0;                         // 原 this.B
                            this.targetVelY = 0;                     // 原 this.z
                            this.targetVelX = 0;                     // 原 this.y
                            this.kill();                             // 原 this.e()
                            break;
                        }
                        if (this.exploded) {                         // 原 this.Q
                            this.targetVelX = 0;                     // 原 this.y
                            this.targetVelY = 0;                     // 原 this.z
                            this.accelY = 0;                         // 原 this.B
                            this.animLoop = false;                   // 原 this.j
                            this.setAction(7 | this.actionHighByte); // 原 a(7|this.H)
                            break;
                        }
                        if (this.hitWall) {                          // 原 this.d
                            if (this.targetVelX > 0) {               // 原 this.y
                                this.posX += 2048;                   // 原 this.u
                            } else if (this.targetVelX < 0) {
                                this.posX -= 2048;
                            } else if (this.targetVelY < 0) {        // 原 this.z
                                this.posY -= 2048;                   // 原 this.v
                            } else if (this.targetVelY > 0) {
                                this.posY += 2048;
                            }
                            this.targetVelX = 0;                     // 原 this.y
                            this.targetVelY = 0;                     // 原 this.z
                            this.accelY = 0;                         // 原 this.B
                            this.animLoop = false;                   // 原 this.j
                            this.setAction(8 | this.actionHighByte); // 原 a(8|this.H)
                            break;
                        }
                        if (!this.expired) break;                    // 原 this.R
                        this.kill();                                 // 原 this.e()
                        break;
                    }
                    case 7:
                    case 8: {
                        if (!this.isAnimationDone()) break;          // 原 this.h()
                        this.kill();                                 // 原 this.e()
                    }
                }
                return;
            }
            case 16: {
                if (this.exploded) {                                 // 原 this.Q
                    this.kill();                                     // 原 this.e()
                    return;
                }
                if (!(this.targetVelX < 0 && this.collideLeft() || this.targetVelX > 0 && this.collideRight() || !this.checkFloorCollision()) && !this.hasCollisionFlag(this.canvas.player)) break;  // 原 y/j()/k()/a()/b(this.L.y)
                ProjectileActor.spawnProjectile(12, 0, this.posX, this.posY, 255, null);  // 原 tjge.k.a(...)
                this.exploded = true;                                // 原 this.Q
                return;
            }
            case 12: {
                if (this.isAnimationDone()) {                        // 原 this.h()
                    this.kill();                                     // 原 this.e()
                    return;
                }
                this.checkCollisions();                              // 原 this.n()
                return;
            }
            case 9: {
                ++this.timer;                                        // 原 this.b
                if (this.timer == 8) {                               // 原 this.b
                    int dx = this.canvas.player.posX - this.posX;    // 原 n  = this.L.y.u - this.u
                    int absDy = Math.abs(this.posY - this.canvas.player.posY);  // 原 n2 = Math.abs(this.v - this.L.y.v)
                    int absDx = Math.abs(dx);                        // 原 n3 = Math.abs(n)
                    if (absDx > absDy * 4 / 3) {                     // 原 n3 > n2*4/3
                        this.targetVelX = this.posX > this.canvas.player.posX ? -8192 : 8192;  // 原 this.y / this.u > this.L.y.u
                        this.targetVelY = -(absDy / (absDx / 8192)); // 原 this.z = -(n2/(n3/8192))
                    } else {
                        this.targetVelY = -10240;                    // 原 this.z
                        this.targetVelX = dx / (absDy / 10240);      // 原 this.y = n/(n2/10240)
                    }
                    this.accelY = 0;                                 // 原 this.B
                    if (this.targetVelX < -4096) {                   // 原 this.y
                        this.setAction(1);                           // 原 a(1)
                    } else if (this.targetVelX > 4096) {
                        this.setAction(-2147483647);                 // 原 a(-2147483647)
                    }
                }
                if (this.isSpecialGrenade) {                         // 原 this.e
                    if (this.hasCollisionFlag(this.canvas.player)) { // 原 this.b(this.L.y)
                        this.canvas.player.publicFlagA = true;       // 原 this.L.y.ag
                        this.canvas.player.health = 0;               // 原 this.L.y.T
                        this.exploded = true;                        // 原 this.Q
                    }
                } else {
                    this.checkCollisions();                          // 原 this.n()
                }
                if (this.exploded) {                                 // 原 this.Q
                    ProjectileActor.spawnProjectile(12, 0, this.posX, this.posY, 0, null);                  // 原 tjge.k.a(...)
                    ProjectileActor.spawnProjectile(12, 0, this.posX + 2048, this.posY - 4096, 0, null);    // 原 tjge.k.a(...)
                    this.kill();                                     // 原 this.e()
                    return;
                }
                if (this.posX >= this.canvas.cameraX - 10240 && this.posY >= this.canvas.cameraY - 10240 && this.posX <= this.canvas.cameraX + this.canvas.viewportWidth + 10240) break;  // 原 u/L.m / v/L.n / u/L.m/L.q
                this.kill();                                         // 原 this.e()
            }
        }
    }

    // 原 c(h h2)：与另一 Actor 碰撞时回调
    protected final void onCollideWith(ActorBase other) {           // 原 c(h h2)
        switch (this.typeId) {                                       // 原 this.h
            case 10: {
                if (other.typeId == 11 || other.typeId == 17 || other.typeId == 21 || other.typeId == 13 || other.typeId == 19) {  // 原 h2.h ==...
                    this.hitWall = true;                             // 原 this.d
                    return;
                }
                this.exploded = true;                                // 原 this.Q
                return;
            }
            case 9: {
                this.exploded = true;                                // 原 this.Q
            }
        }
    }

    // 原 a(int,int,int,int,int,int[])：静态工厂，从对象池取一个投射物并初始化
    public static final ProjectileActor spawnProjectile(int typeId, int action, int spawnX, int spawnY, int maskValue, int[] extraParams) {  // 原 a(n,n2,n3,n4,n5,nArray)
        ProjectileActor projectile = (ProjectileActor)GameCanvas.instance.scene.spawnActor(typeId, -1);  // 原 (k)tjge.a.a.z.c(n,-1)
        if (projectile != null) {
            projectile.posX = spawnX;                                // 原 k2.u = n3
            projectile.posY = spawnY;                                // 原 k2.v = n4
            projectile.targetVelX = 0;                               // 原 k2.y
            projectile.targetVelY = 0;                               // 原 k2.z
            projectile.accelX = 0;                                   // 原 k2.A
            projectile.accelY = 0;                                   // 原 k2.B
            projectile.maxVelY = 15360;                              // 原 k2.D
            projectile.drawAlpha = 0;                                // 原 k2.E
            projectile.frameTicks = 0;                               // 原 k2.f
            projectile.exploded = false;                             // 原 k2.Q
            projectile.hitWall = false;                              // 原 k2.d
            projectile.expired = false;                              // 原 k2.R
            projectile.animLoop = true;                              // 原 k2.j
            projectile.isSpecialGrenade = false;                     // 原 k2.e
            projectile.setAction(action);                            // 原 k2.a(n2)
            projectile.collisionMask = 3;                            // 原 k2.c = 3
            projectile.collisionMaskField = maskValue;               // 原 k2.K = n5
            switch (typeId) {                                        // 原 switch (n)
                case 10: {
                    if (projectile.frameGroupIndex == 9) break;      // 原 k2.l == 9
                    if (projectile.frameGroupIndex != 6) {
                        projectile.collisionMask = 1;                // 原 k2.c = 1
                    }
                    int tileColLeft = (projectile.posX >> 10) + projectile.boxLeft >> 3;   // 原 n6 = (k2.u>>10)+k2.p>>3
                    int tileColRight = (projectile.posX >> 10) + projectile.boxRight >> 3; // 原 n7 = (k2.u>>10)+k2.q>>3
                    int tileRow = projectile.posY >> 10 >> 3;        // 原 n8 = k2.v>>10>>3
                    while (tileColLeft < tileColRight) {             // 原 while (n6 < n7)
                        if (projectile.tileAt(tileColLeft, tileRow) == 1) {  // 原 k2.a(n6,n8)
                            projectile.hitWall = true;               // 原 k2.d
                            break;
                        }
                        ++tileColLeft;                               // 原 ++n6
                    }
                    projectile.tick();                               // 原 k2.b()
                    break;
                }
                case 12: {
                    projectile.animLoop = false;                     // 原 k2.j
                    break;
                }
                case 9: {
                    projectile.targetVelX = 0;                       // 原 k2.y
                    projectile.targetVelY = -2048;                   // 原 k2.z
                    projectile.timer = 0;                            // 原 k2.b
                    projectile.setAction(0);                         // 原 k2.a(0)
                }
            }
        }
        return projectile;
    }

    // 原 m()：返回当前碰撞层掩码
    protected final int getCollisionMask() {                        // 原 m()
        switch (this.typeId) {                                       // 原 this.h
            case 10: {
                return collisionMaskTable[this.frameGroupIndex];     // 原 a[this.l]
            }
            case 12: {
                return 3;
            }
            case 9: {
                return 2;
            }
        }
        return 0;
    }

    // 原 a()：向下扫描瓦片检测撞地，覆写基类同名方法
    public final boolean checkFloorCollision() {                    // 原 a()
        if (this.velY < 0) {                                        // 原 this.x
            return false;
        }
        int tileRowTop = (this.posY >> 10) + this.boxBottom >> 3;                   // 原 n  = (this.v>>10)+this.s>>3
        int tileRowBottom = (this.posY + this.velY >> 10) + this.boxBottom >> 3;    // 原 n2 = (this.v+this.x>>10)+this.s>>3
        int tileColLeft = (this.posX + this.velX >> 10) + this.boxLeft + 1 >> 3;    // 原 n3 = (this.u+this.w>>10)+this.p+1>>3
        int tileColRight = (this.posX + this.velX >> 10) + this.boxRight - 1 >> 3;  // 原 n4 = (this.u+this.w>>10)+this.q-1>>3
        int col = tileColLeft;                                       // 原 n5 = n3
        while (col <= tileColRight) {                                // 原 while (n5 <= n4)
            int row = tileRowTop;                                    // 原 n6 = n
            while (row <= tileRowBottom) {                           // 原 while (n6 <= n2)
                int tileFlags = this.tileAt(col, row);              // 原 n7 = this.a(n5, n6)
                if ((tileFlags & this.collisionMask) != 0) {        // 原 (n7 & this.c) != 0
                    this.targetVelY = 0;                            // 原 this.z
                    this.velY = (row << 13) - (this.posY + (this.boxBottom << 10));  // 原 this.x = (n6<<13)-(this.v+(this.s<<10))
                    return true;
                }
                ++row;                                              // 原 ++n6
            }
            ++col;                                                  // 原 ++n5
        }
        return false;
    }
}
