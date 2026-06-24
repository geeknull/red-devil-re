// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/g.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.SpriteDef;        // 原 tjge.d
import tjge.ItemActor;        // 原 tjge.e
import tjge.ActorBase;        // 原 tjge.h
import tjge.LevelScene;       // 原 tjge.j
import tjge.ProjectileActor;  // 原 tjge.k

public final class PlayerActor   // 原 tjge.g
extends ActorBase {              // 原 extends h
    public static final int[] jumpVelocityX = new int[]{8192, 4096, 8192, 8192, 8192, 8192};            // 原字段 a
    public static final int[] jumpVelocityY = new int[]{-10240, -10240, -15360, -17408, -15360, -10240}; // 原字段 b
    public static final int[] ammoInitTable = new int[]{10, 1, 3};   // 原字段 c
    public static final int[] reserveInitTable = new int[]{99, 6, 3}; // 原字段 d
    public static int[] ammoCurrent = new int[3];   // 原字段 e
    public static int[] ammoReserve = new int[3];   // 原字段 f
    public static int[][] throwCooldownQueue = new int[4][];  // 原字段 Q
    private static final int[][] bulletSpawnOffsets;    // 原字段 ak
    private static final int[][] grenadeSpawnOffsets;   // 原字段 al
    private static final int[][][] fireActionTable;     // 原字段 am
    int knockbackTimer;   // 原字段 R
    int actionSubTimer;   // 原字段 S
    int health;           // 原字段 T
    int currentWeaponIndex; // 原字段 U
    int inputCounter;     // 原字段 V
    int vaultType;        // 原字段 W
    int vaultTargetX;     // 原字段 X
    int vaultTargetY;     // 原字段 Y
    boolean vaultLocked;  // 原字段 Z
    boolean canJump;      // 原字段 aa
    boolean switchPending; // 原字段 ab
    boolean ceilingBlocked; // 原字段 ac
    boolean airborneJumping; // 原字段 ad
    boolean levelCleared;  // 原字段 ae
    boolean actionLocked;  // 原字段 af
    private boolean dead;  // 原字段 an
    public boolean publicFlagA;  // 原字段 ag
    public boolean publicFlagB;  // 原字段 ah
    public boolean publicFlagC;  // 原字段 ai
    ItemActor companionEffect;   // 原字段 aj (tjge.e)

    // 原 g(int n, d d2)：构造玩家 Actor，阵营位 collisionMask(K) = 2
    public PlayerActor(int typeId, SpriteDef spriteDef) {
        super(typeId, spriteDef);
        this.collisionMask = 2;   // 原 this.K = 2
    }

    // 原 g.a([B)Z -> loadFromBytes
    public final boolean loadFromBytes(byte[] byArray) {
        super.spawnFromBytes(byArray);   // 原 super.a(byArray)
        this.resetVaultState();          // 原 this.y()
        this.publicFlagA = false;        // 原 this.ag
        this.levelCleared = false;       // 原 this.ae
        this.actionLocked = false;       // 原 this.af
        this.switchPending = false;      // 原 this.ab
        this.publicFlagB = false;        // 原 this.ah
        this.publicFlagC = false;        // 原 this.ai
        this.currentWeaponIndex = 0;     // 原 this.U = 0
        PlayerActor.ammoCurrent[0] = ammoInitTable[0];   // 原 tjge.g.e[0] = c[0]
        PlayerActor.ammoCurrent[1] = ammoInitTable[1];   // 原 tjge.g.e[1] = c[1]
        PlayerActor.ammoCurrent[2] = ammoInitTable[2];   // 原 tjge.g.e[2] = c[2]
        PlayerActor.throwCooldownQueue[0][0] = -1;   // 原 tjge.g.Q[0][0] = -1
        PlayerActor.throwCooldownQueue[1][0] = -1;   // 原 tjge.g.Q[1][0] = -1
        PlayerActor.throwCooldownQueue[2][0] = -1;   // 原 tjge.g.Q[2][0] = -1
        PlayerActor.throwCooldownQueue[3][0] = -1;   // 原 tjge.g.Q[3][0] = -1
        this.health = 10;   // 原 this.T = 10
        if (this.companionEffect != null) {   // 原 this.aj
            this.companionEffect.alive = false;  // 原 this.aj.g = false
            this.companionEffect = null;
        }
        if (byArray[7] > 0) {
            this.spawnEntryEffect();   // 原 this.a()
        } else {
            this.companionEffect = null;
            this.reserved = 1;   // 原 this.G = 1
        }
        return true;
    }

    // 原 g.a()V -> spawnEntryEffect
    public final void spawnEntryEffect() {
        this.companionEffect = (ItemActor)this.canvas.scene.spawnActor(18, -1);  // 原 this.aj = (e)this.L.z.c(18, -1)
        this.companionEffect.applyCommand(0);   // 原 this.aj.c(0)
        this.companionEffect.setAction(0 | this.actionHighByte);  // 原 this.aj.a(0 | this.H)
        this.companionEffect.animLoop = false;  // 原 this.aj.j = false
        this.setAction(0x19 | this.actionHighByte);   // 原 this.a(0x19 | this.H)
        this.reserved = 4;   // 原 this.G = 4
    }

    // 原 g.i()V -> updatePhysics
    public final void updatePhysics() {
        int n;
        int n2;
        int n3;
        this.advanceFrame();   // 原 this.g()
        this.velX = this.targetVelX;   // 原 this.w = this.y
        this.velY = this.targetVelY;   // 原 this.x = this.z
        this.targetVelX += this.accelX;   // 原 this.y += this.A
        if (this.accelX > 0 && this.targetVelX > this.maxVelX) {   // 原 this.A>0 && this.y>this.C
            this.targetVelX = this.maxVelX;   // 原 this.y = this.C
        }
        if (this.accelX < 0 && this.targetVelX < -this.maxVelX) {   // 原 this.A<0 && this.y < -this.C
            this.targetVelX = -this.maxVelX;   // 原 this.y = -this.C
        }
        this.targetVelY += this.accelY;   // 原 this.z += this.B
        if (this.accelY > 0 && this.targetVelY > this.maxVelY) {   // 原 this.B>0 && this.z>this.D
            this.targetVelY = this.maxVelY;   // 原 this.z = this.D
        }
        if (this.accelY < 0 && this.targetVelY < -this.maxVelY) {   // 原 this.B<0 && this.z < -this.D
            this.targetVelY = -this.maxVelY;   // 原 this.z = -this.D
        }
        if ((this.reserved & 2) != 0) {   // 原 (this.G & 2) != 0
            n3 = this.posX >> 13;   // 原 this.u >> 13
            if (this.targetVelY < 0) {    // 原 this.z < 0
                n2 = (this.posY + this.velY >> 10) - 30 >> 3;   // 原 (this.v + this.x >> 10) - 30 >> 3
                n = this.tileAt(n3, n2);   // 原 this.a(n3, n2)
                if ((n & 3) != 0) {
                    this.velY = (n2 << 13) + 8192 - this.posY;   // 原 this.x = (n2 << 13) + 8192 - this.v
                    this.setAction(0x16 | this.actionHighByte);  // 原 this.a(0x16 | this.H)
                    this.ceilingBlocked = true;   // 原 this.ac = true
                }
            } else if (this.targetVelY > 0 && ((n = this.tileAt(n3, n2 = (this.posY + this.velY >> 10) + 4 >> 3)) & 4) == 0) {   // 原 this.z > 0 && ((n = this.a(n3, n2 = (this.v + this.x >> 10) + 4 >> 3)) & 4) == 0
                this.velY = (n2 << 13) - this.posY;   // 原 this.x = (n2 << 13) - this.v
                this.reserved &= 0xFFFFFFFD;   // 原 this.G &= 0xFFFFFFFD
                this.canvas.inputAction = 0;   // 原 this.L.c = 0
            }
            this.targetVelY = 0;   // 原 this.z = 0
        } else if ((this.reserved & 4) != 0) {   // 原 (this.G & 4) != 0
            if (this.canvas.scene.isVerticalScrollLevel && !this.publicFlagB) {   // 原 this.L.z.J && !this.ah
                n3 = this.posY + (this.boxTop << 10) + this.velY;   // 原 this.v + (this.r << 10) + this.x
                n2 = this.posY + (this.boxBottom << 10) + this.velY;   // 原 this.v + (this.s << 10) + this.x
                if (n3 < this.canvas.cameraY) {   // 原 n3 < this.L.n
                    this.velY = this.canvas.cameraY - (this.posY + (this.boxTop << 10));   // 原 this.x = this.L.n - (this.v + (this.r << 10))
                } else if (n2 > this.canvas.cameraY + (this.canvas.viewportHeight >> 1)) {   // 原 n2 > this.L.n + (this.L.r >> 1)
                    this.velY = this.canvas.cameraY + (this.canvas.viewportHeight >> 1) - (this.posY + (this.boxBottom << 10));   // 原 this.x = this.L.n + (this.L.r >> 1) - (this.v + (this.s << 10))
                }
            }
        } else {
            if (this.checkRightWallCollision() && this.frameGroupIndex == 25) {   // 原 this.k() && this.l == 25
                this.setAction(0x10 | this.actionHighByte);   // 原 this.a(0x10 | this.H)
            }
            if (this.checkLeftWallCollision() && this.frameGroupIndex == 25) {   // 原 this.j() && this.l == 25
                this.setAction(0x10 | this.actionHighByte);   // 原 this.a(0x10 | this.H)
            }
            if (this.checkFloorCollision()) {   // 原 this.q()
                this.resetVaultState();   // 原 this.y()
                if ((this.reserved & 1) == 0) {   // 原 (this.G & 1) == 0
                    this.reserved = 1;   // 原 this.G = 1
                    if (this.frameGroupIndex != 5 && this.frameGroupIndex != 6 && this.frameGroupIndex != 25) {   // 原 this.l != 5 && != 6 && != 25
                        this.targetVelX = 0;   // 原 this.y = 0
                        this.setAction(0x10 | this.actionHighByte);   // 原 this.a(0x10 | this.H)
                    }
                }
            } else if (!this.checkCeilingCollision()) {   // 原 !this.l()
                if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
                    this.knockbackTimer = 1;   // 原 this.R = 1
                    this.velX = this.actionHighByte == 0 ? 10240 : -10240;   // 原 this.w = this.H == 0 ? 10240 : -10240
                    this.velY = 6144;   // 原 this.x = 6144
                    this.targetVelY = 10240;   // 原 this.z = 10240
                    this.reserved &= 0xFFFFFFFE;   // 原 this.G &= 0xFFFFFFFE
                    this.airborneJumping = false;   // 原 this.ad = false
                    if (this.frameGroupIndex != 5 && this.frameGroupIndex != 6) {   // 原 this.l != 5 && != 6
                        this.setAction(0x10 | this.actionHighByte);   // 原 this.a(0x10 | this.H)
                    }
                } else if (this.frameGroupIndex == 18 || this.frameGroupIndex == 19 || this.frameGroupIndex == 20 || this.frameGroupIndex == 21) {   // 原 this.l == 18/19/20/21
                    this.targetVelY = 12288;   // 原 this.z = 12288
                    this.airborneJumping = false;   // 原 this.ad = false
                    this.setAction(0x10 | this.actionHighByte);   // 原 this.a(0x10 | this.H)
                }
                this.accelY = 4096;   // 原 this.B = 4096
                this.updateVaultMotion();   // 原 this.u()
            }
        }
        if (this.canvas.scene.subState == 0 || this.canvas.scene.subState == 5) {   // 原 this.L.z.w == 0 || this.L.z.w == 5
            n3 = this.posX + (this.boxLeft << 10) + this.velX;   // 原 this.u + (this.p << 10) + this.w
            n2 = this.posX + (this.boxRight << 10) + this.velX;   // 原 this.u + (this.q << 10) + this.w
            n = this.canvas.cameraX + 4096;   // 原 this.L.m + 4096
            int n4 = this.canvas.cameraX + this.canvas.viewportWidth - 4096;   // 原 this.L.m + this.L.q - 4096
            if (n3 < n) {
                this.velX = n - (this.posX + (this.boxLeft << 10));   // 原 this.w = n - (this.u + (this.p << 10))
            } else if (n2 > n4) {
                this.velX = n4 - (this.posX + (this.boxRight << 10));   // 原 this.w = n4 - (this.u + (this.q << 10))
            }
        }
        this.posX += this.velX;   // 原 this.u += this.w
        this.posY += this.velY;   // 原 this.v += this.x
        if (this.companionEffect != null) {   // 原 this.aj != null
            this.companionEffect.applyCommand(0);   // 原 this.aj.c(0)
            if (!this.companionEffect.alive) {   // 原 !this.aj.g
                this.reserved &= 0xFFFFFFFB;   // 原 this.G &= 0xFFFFFFFB
                this.companionEffect = null;   // 原 this.aj = null
            }
        }
    }

    // 原 g.c()V -> advanceEffectFrame
    public final void advanceEffectFrame() {
        this.companionEffect.applyCommand(1);   // 原 this.aj.c(1)
    }

    // 原 g.o()Z -> isDead
    public final boolean isDead() {
        return this.dead;   // 原 return this.an
    }

    // 原 g.b()V -> tick
    public final void tick() {
        this.runActionStateMachine();   // 原 this.r()
        switch (this.canvas.scene.subState) {   // 原 this.L.z.w
            case 6: {
                if ((this.reserved & 4) != 0) {   // 原 (this.G & 4) != 0
                    this.targetVelX = 0;   // 原 this.y = 0
                    this.targetVelY = 0;   // 原 this.z = 0
                    this.dead = true;      // 原 this.an = true
                    this.setAction(0x19 | this.actionHighByte);   // 原 this.a(0x19 | this.H)
                    break;
                }
                if ((this.reserved & 1) == 0) break;   // 原 (this.G & 1) == 0
                this.targetVelX = 0;   // 原 this.y = 0
                this.dead = true;      // 原 this.an = true
                if (this.levelCleared) {   // 原 this.ae
                    this.setAction(0x21 | this.actionHighByte);   // 原 this.a(0x21 | this.H)
                    break;
                }
                this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                break;
            }
            case 0:
            case 5: {
                if (this.canAcceptInput()) {   // 原 this.v()
                    this.handleInput(this.canvas.inputAction);   // 原 this.c(this.L.c)
                }
                if (!this.switchPending) break;   // 原 !this.ab
                this.switchPending = false;   // 原 this.ab = false
            }
        }
        if (this.canvas.scene.subState != 6) {   // 原 this.L.z.w != 6
            this.dead = false;   // 原 this.an = false
        }
        if (this.health <= 0 && this.frameGroupIndex != 5 && this.frameGroupIndex != 6 && this.frameGroupIndex != 3 && this.frameGroupIndex != 4 && !this.canvas.scene.isVerticalScrollLevel) {   // 原 this.T <= 0 && this.l != 5/6/3/4 && !this.L.z.J
            this.setAction(5 | this.actionHighByte);   // 原 this.a(5 | this.H)
        }
    }

    // 原 g.r()V -> runActionStateMachine
    private final void runActionStateMachine() {
        int facingSign = this.actionHighByte == 0 ? 1 : -1;   // 原 int n = this.H == 0 ? 1 : -1
        switch (this.frameGroupIndex) {   // 原 switch (this.l)
            case 24: {
                if (this.frameIndex > 3) {   // 原 this.n > 3
                    this.checkCollisions();   // 原 this.n()
                }
            }
            case 8:
            case 10:
            case 27:
            case 29:
            case 30:
            case 32: {
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                return;
            }
            case 7: {
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                this.setAction(0x20 | this.actionHighByte);   // 原 this.a(0x20 | this.H)
                return;
            }
            case 12:
            case 13: {
                int n2;
                if (this.isAnimationDone()) {   // 原 this.h()
                    if (this.frameGroupIndex == 13) {   // 原 this.l == 13
                        this.setAction(2 | this.actionHighByte);   // 原 this.a(2 | this.H)
                        return;
                    }
                    this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                    return;
                }
                if (this.frameIndex != 2) break;   // 原 this.n != 2
                int weaponPose = this.frameGroupIndex == 12 ? 0 : 1;   // 原 int n3 = this.l == 12 ? 0 : 1
                boolean bl = false;
                int actionCode = 6 | this.actionHighByte;   // 原 int n4 = 6 | this.H
                int spawnX = this.computeSpawnCoord(grenadeSpawnOffsets, weaponPose, 0);   // 原 int n5 = this.a(al, n3, 0)
                ProjectileActor projectile = ProjectileActor.spawnProjectile(10, actionCode, spawnX, n2 = this.computeSpawnCoord(grenadeSpawnOffsets, weaponPose, 1), 26, null);   // 原 k k2 = tjge.k.a(10, n4, n5, n2 = this.a(al, n3, 1), 26, null)
                if (projectile == null) break;   // 原 if (k2 == null) break
                ammoCurrent[2] = ammoCurrent[2] - 1;   // 原 e[2] = e[2] - 1
                projectile.targetVelX = this.actionHighByte == 0 ? 8192 : -8192;   // 原 k2.y = this.H == 0 ? 8192 : -8192
                projectile.targetVelY = -6656;   // 原 k2.z = -6656
                projectile.accelY = 1128;   // 原 k2.B = 1128
                projectile.maxVelY = 15360;   // 原 k2.D = 15360
                return;
            }
            case 9:
            case 11:
            case 28:
            case 31: {
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                this.setAction(2 | this.actionHighByte);   // 原 this.a(2 | this.H)
                return;
            }
            case 25: {
                if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
                    this.actionSubTimer = 0;   // 原 this.S = 0
                    this.targetVelX = 8192 * facingSign;   // 原 this.y = 8192 * n
                    this.setAction(0x17 | this.actionHighByte);   // 原 this.a(0x17 | this.H)
                    return;
                }
                if ((this.reserved & 4) != 0) break;   // 原 (this.G & 4) != 0
                this.targetVelX = 8192 * facingSign;   // 原 this.y = 8192 * n
                return;
            }
            case 26: {
                if ((this.reserved & 4) == 0) {   // 原 (this.G & 4) == 0
                    this.targetVelX = 8192 * facingSign;   // 原 this.y = 8192 * n
                }
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                this.setAction(0x19 | this.actionHighByte);   // 原 this.a(0x19 | this.H)
                return;
            }
            case 22: {
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                if (this.ceilingBlocked) {   // 原 this.ac
                    this.posY -= 8192;   // 原 this.v -= 8192
                    this.reserved &= 0xFFFFFFFD;   // 原 this.G &= 0xFFFFFFFD
                    this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                    this.canvas.inputAction = 0;   // 原 this.L.c = 0
                    return;
                }
                this.posY += 24576;   // 原 this.v += 24576
                this.setAction(0x12 | this.actionHighByte);   // 原 this.a(0x12 | this.H)
                return;
            }
            case 14:
            case 15:
            case 16: {
                if (this.vaultLocked) {   // 原 this.Z
                    this.vaultLocked = false;   // 原 this.Z = false
                    this.canJump = false;      // 原 this.aa = false
                    this.setAction(0x11 | this.actionHighByte);   // 原 this.a(0x11 | this.H)
                    return;
                }
                if (this.airborneJumping) {   // 原 this.ad
                    this.targetVelX = (this.canJump ? jumpVelocityX[this.vaultType] : 5120) * facingSign;   // 原 this.y = (this.aa ? a[this.W] : 5120) * n
                } else if (--this.knockbackTimer < 0) {   // 原 --this.R < 0
                    this.targetVelX = 0;   // 原 this.y = 0
                }
                if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
                    this.targetVelX = 0;   // 原 this.y = 0
                    this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                    return;
                }
                if (this.frameGroupIndex == 15 && this.targetVelY > 3120) {   // 原 this.l == 15 && this.z > 3120
                    this.setAction(0x10 | this.actionHighByte);   // 原 this.a(0x10 | this.H)
                    return;
                }
                if (this.frameGroupIndex != 14 || this.targetVelY < 0) break;   // 原 this.l != 14 || this.z < 0
                this.setAction(0xF | this.actionHighByte);   // 原 this.a(0xF | this.H)
                return;
            }
            case 17: {
                if (this.vaultType < 2 || this.vaultType > 3) {   // 原 this.W < 2 || this.W > 3
                    this.posY += -12288;   // 原 this.v += -12288
                    this.targetVelY = -15360;   // 原 this.z = -15360
                    this.actionSubTimer = 0;   // 原 this.S = 0
                }
                this.setAction(0x23 | this.actionHighByte);   // 原 this.a(0x23 | this.H)
                return;
            }
            case 35: {
                if (this.actionSubTimer++ > 2) {   // 原 this.S++ > 2
                    this.setAction(0x10 | this.actionHighByte);   // 原 this.a(0x10 | this.H)
                }
                this.targetVelX = (this.canJump ? 8192 : 5120) * facingSign;   // 原 this.y = (this.aa ? 8192 : 5120) * n
                return;
            }
            case 23: {
                if (this.actionSubTimer++ <= 4) break;   // 原 this.S++ <= 4
                if (this.isFootOnGround()) {   // 原 this.w()
                    this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                } else {
                    this.setAction(2 | this.actionHighByte);   // 原 this.a(2 | this.H)
                }
                this.targetVelX = 0;   // 原 this.y = 0
                return;
            }
            case 5:
            case 6: {
                if ((this.reserved & 1) == 0 || !this.isAnimationDone()) break;   // 原 (this.G & 1) == 0 || !this.h()
                if (this.health <= 0) {   // 原 this.T <= 0
                    this.setAction(3 | this.actionHighByte);   // 原 this.a(3 | this.H)
                    return;
                }
                this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                return;
            }
            case 3: {
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                this.setAction(4 | this.actionHighByte);   // 原 this.a(4 | this.H)
                return;
            }
            case 4: {
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                this.canvas.showResult(false);   // 原 this.L.a(false)
            }
        }
    }

    // 原 g.p()I -> stepThrowQueue
    public final int stepThrowQueue() {
        int slot = 0;   // 原 int n = 0
        while (slot < throwCooldownQueue.length) {   // 原 while (n < Q.length)
            if (throwCooldownQueue[slot][0] > 0) {   // 原 if (Q[n][0] > 0)
                int[] entry = throwCooldownQueue[slot];   // 原 int[] nArray = Q[n]
                int countdown = entry[1];   // 原 int n2 = nArray[1]
                entry[1] = countdown - 1;   // 原 nArray[1] = n2 - 1
                if (countdown > 0) {   // 原 if (n2 > 0)
                    this.handleInput(throwCooldownQueue[slot][0]);   // 原 this.c(Q[n][0])
                    break;
                }
                int[] entry2 = throwCooldownQueue[slot];   // 原 int[] nArray2 = Q[n]
                entry2[2] = entry2[2] - 1;   // 原 nArray2[2] = nArray2[2] - 1
                if (entry2[2] < 0) {   // 原 if (nArray2[2] < 0)
                    PlayerActor.throwCooldownQueue[slot][0] = 0;   // 原 tjge.g.Q[n][0] = 0
                    return slot;   // 原 return n
                }
                this.handleInput(0);   // 原 this.c(0)
                break;
            }
            ++slot;   // 原 ++n
        }
        return -1;
    }

    // 原 g.c(I)V -> handleInput：处理一次输入指令位（移动/跳跃/蹲/射击/手雷/换弹等）
    private final void handleInput(int command) {   // 原 private final void c(int n)
        ++this.inputCounter;   // 原 ++this.V
        int facingSign = this.actionHighByte == 0 ? 1 : -1;   // 原 int n2 = this.H == 0 ? 1 : -1
        switch (command) {   // 原 switch (n)
            case 1: {
                if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
                    if (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) {   // 原 this.l == 0 || this.l == 2
                        if (this.actionHighByte != 0) {   // 原 this.H != 0
                            if (this.frameGroupIndex == 2 && !this.isFootOnGround()) break;   // 原 this.l == 2 && !this.w()
                            this.targetVelX = -8192;   // 原 this.y = -8192
                            this.setAction(-2147483647);   // 原 this.a(-2147483647)
                            return;
                        }
                        this.setAction(this.frameGroupIndex | Integer.MIN_VALUE);   // 原 this.a(this.l | Integer.MIN_VALUE)
                        return;
                    }
                    if (this.frameGroupIndex != 1) break;   // 原 this.l != 1
                    if (this.actionHighByte == 0) {   // 原 this.H == 0
                        this.targetVelX = 0;   // 原 this.y = 0
                        this.setAction(Integer.MIN_VALUE);   // 原 this.a(Integer.MIN_VALUE)
                        return;
                    }
                    if (this.targetVelX != 0) break;   // 原 this.y != 0
                    this.targetVelX = -8192;   // 原 this.y = -8192
                    return;
                }
                if ((this.reserved & 4) != 0) {   // 原 (this.G & 4) != 0
                    this.targetVelX = -10240;   // 原 this.y = -10240
                    this.targetVelY = 0;   // 原 this.z = 0
                    return;
                }
                if ((this.reserved & 2) == 0) break;   // 原 (this.G & 2) == 0
                if (this.actionHighByte == 0) {   // 原 this.H == 0
                    this.setAction(this.frameGroupIndex | Integer.MIN_VALUE);   // 原 this.a(this.l | Integer.MIN_VALUE)
                    this.canvas.inputAction = 0;   // 原 this.L.c = 0
                    return;
                }
                if (this.checkLeftWallCollision()) break;   // 原 this.j()
                this.airborneJumping = false;   // 原 this.ad = false
                this.reserved &= 0xFFFFFFFD;   // 原 this.G &= 0xFFFFFFFD
                this.posX -= 8192;   // 原 this.u -= 8192
                this.posY += 8192;   // 原 this.v += 8192
                this.targetVelX = -8192;   // 原 this.y = -8192
                this.targetVelY = 12288;   // 原 this.z = 12288
                this.accelY = 4096;   // 原 this.B = 4096
                this.setAction(-2147483632);   // 原 this.a(-2147483632)
                return;
            }
            case 2: {
                if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
                    if (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) {   // 原 this.l == 0 || this.l == 2
                        if (this.actionHighByte == 0) {   // 原 this.H == 0
                            if (this.frameGroupIndex == 2 && !this.isFootOnGround()) break;   // 原 this.l == 2 && !this.w()
                            this.targetVelX = 8192;   // 原 this.y = 8192
                            this.setAction(1);   // 原 this.a(1)
                            return;
                        }
                        this.setAction(this.frameGroupIndex);   // 原 this.a(this.l)
                        return;
                    }
                    if (this.frameGroupIndex != 1) break;   // 原 this.l != 1
                    if (this.actionHighByte != 0) {   // 原 this.H != 0
                        this.targetVelX = 0;   // 原 this.y = 0
                        this.setAction(0);   // 原 this.a(0)
                        return;
                    }
                    if (this.targetVelX != 0) break;   // 原 this.y != 0
                    this.targetVelX = 8192;   // 原 this.y = 8192
                    return;
                }
                if ((this.reserved & 4) != 0) {   // 原 (this.G & 4) != 0
                    this.targetVelX = 10240;   // 原 this.y = 10240
                    this.targetVelY = 0;   // 原 this.z = 0
                    return;
                }
                if ((this.reserved & 2) == 0) break;   // 原 (this.G & 2) == 0
                if (this.actionHighByte != 0) {   // 原 this.H != 0
                    this.setAction(this.frameGroupIndex);   // 原 this.a(this.l)
                    this.canvas.inputAction = 0;   // 原 this.L.c = 0
                    return;
                }
                if (this.checkRightWallCollision()) break;   // 原 this.k()
                this.airborneJumping = false;   // 原 this.ad = false
                this.reserved &= 0xFFFFFFFD;   // 原 this.G &= 0xFFFFFFFD
                this.posX += 8192;   // 原 this.u += 8192
                this.posY += 8192;   // 原 this.v += 8192
                this.targetVelX = 8192;   // 原 this.y = 8192
                this.targetVelY = 12288;   // 原 this.z = 12288
                this.accelY = 4096;   // 原 this.B = 4096
                this.setAction(16);   // 原 this.a(16)
                return;
            }
            case 64:
            case 128: {
                if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
                    if (this.frameGroupIndex == 2) {   // 原 this.l == 2
                        if (!this.isFootOnGround()) break;   // 原 !this.w()
                        this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                        return;
                    }
                    if (this.actionHighByte == 0 && this.canvas.inputAction == 64) {   // 原 this.H == 0 && this.L.c == 64
                        this.setAction(this.frameGroupIndex | Integer.MIN_VALUE);   // 原 this.a(this.l | Integer.MIN_VALUE)
                        return;
                    }
                    if (this.actionHighByte != 0 && this.canvas.inputAction == 128) {   // 原 this.H != 0 && this.L.c == 128
                        this.setAction(this.frameGroupIndex);   // 原 this.a(this.l)
                        return;
                    }
                    this.vaultType = this.probeVault();   // 原 this.W = this.t()
                    if (this.vaultType == 2 || this.vaultType == 3) {   // 原 this.W == 2 || this.W == 3
                        this.canJump = false;   // 原 this.aa = false
                        this.posX = this.vaultTargetX;   // 原 this.u = this.X
                        this.setAction(0x11 | this.actionHighByte);   // 原 this.a(0x11 | this.H)
                    } else {
                        if (this.vaultType == 5) {   // 原 this.W == 5
                            this.canJump = false;   // 原 this.aa = false
                        }
                        this.posY -= 5120;   // 原 this.v -= 5120
                        this.setAction(0xE | this.actionHighByte);   // 原 this.a(0xE | this.H)
                    }
                    this.targetVelX = jumpVelocityX[this.vaultType] * facingSign;   // 原 this.y = a[this.W] * n2
                    this.targetVelY = jumpVelocityY[this.vaultType];   // 原 this.z = b[this.W]
                    this.airborneJumping = true;   // 原 this.ad = true
                    this.accelY = 4096;   // 原 this.B = 4096
                    this.canvas.inputAction = 0;   // 原 this.L.c = 0
                    this.reserved &= 0xFFFFFFFE;   // 原 this.G &= 0xFFFFFFFE
                    return;
                }
                if ((this.reserved & 4) != 0) {   // 原 (this.G & 4) != 0
                    this.targetVelY = -6144;   // 原 this.z = -6144
                    return;
                }
                if (this.frameGroupIndex != 14 && this.frameGroupIndex != 15 || !this.canJump || this.vaultTargetX >= 0 || this.vaultTargetY >= 0) break;   // 原 this.l != 14 && this.l != 15 || !this.aa || this.X >= 0 || this.Y >= 0
                this.posY -= 20480;   // 原 this.v -= 20480
                this.targetVelY = -5120;   // 原 this.z = -5120
                this.canJump = false;   // 原 this.aa = false
                this.setAction(0x19 | this.actionHighByte);   // 原 this.a(0x19 | this.H)
                return;
            }
            case 8: {
                if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
                    if (this.frameGroupIndex == 2) {   // 原 this.l == 2
                        this.actionSubTimer = 0;   // 原 this.S = 0
                        this.targetVelX = 8192 * facingSign;   // 原 this.y = 8192 * n2
                        this.setAction(0x17 | this.actionHighByte);   // 原 this.a(0x17 | this.H)
                        return;
                    }
                    if (this.snapToLedge(1)) {   // 原 this.d(1)
                        this.reserved = 2;   // 原 this.G = 2
                        this.accelY = 0;   // 原 this.B = 0
                        this.posY += 24576;   // 原 this.v += 24576
                        this.ceilingBlocked = false;   // 原 this.ac = false
                        this.setAction(0x16 | this.actionHighByte);   // 原 this.a(0x16 | this.H)
                        return;
                    }
                    this.targetVelX = 0;   // 原 this.y = 0
                    this.setAction(2 | this.actionHighByte);   // 原 this.a(2 | this.H)
                    this.canvas.inputAction = 0;   // 原 this.L.c = 0
                    return;
                }
                if ((this.reserved & 2) != 0) {   // 原 (this.G & 2) != 0
                    this.targetVelY = 4096;   // 原 this.z = 4096
                    this.setAction(21 - (21 - this.frameGroupIndex + 1) % 4 | this.actionHighByte);   // 原 this.a(21 - (21 - this.l + 1) % 4 | this.H)
                    return;
                }
                if ((this.reserved & 4) == 0) break;   // 原 (this.G & 4) == 0
                this.targetVelY = 6144;   // 原 this.z = 6144
                return;
            }
            case 32: {
                if ((this.reserved & 4) != 0) {   // 原 (this.G & 4) != 0
                    this.targetVelY = -6144;   // 原 this.z = -6144
                    return;
                }
                if ((this.reserved & 2) != 0) {   // 原 (this.G & 2) != 0
                    this.targetVelY = -4096;   // 原 this.z = -4096
                    this.setAction(18 + (this.frameGroupIndex - 18 + 1) % 4 | this.actionHighByte);   // 原 this.a(18 + (this.l - 18 + 1) % 4 | this.H)
                    return;
                }
                if (this.frameGroupIndex == 2) {   // 原 this.l == 2
                    if (this.isFootOnGround()) {   // 原 this.w()
                        this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                    }
                    return;
                }
                if (this.triggerSwitch(false)) {   // 原 this.a(false)
                    return;
                }
                if (this.snapToLedge(0)) {   // 原 this.d(0)
                    this.reserved = 2;   // 原 this.G = 2
                    this.targetVelY = -8192;   // 原 this.z = -8192
                    this.accelY = 0;   // 原 this.B = 0
                    this.setAction(0x12 | this.actionHighByte);   // 原 this.a(0x12 | this.H)
                    return;
                }
            }
            case 16: {
                int n3;   // 原 int n3
                int slotKind;   // 原 int n4
                if (this.actionLocked) {   // 原 this.af
                    return;
                }
                if (this.canvas.inputAction == 32 && (this.reserved & 1) != 0) {   // 原 this.L.c == 32 && (this.G & 1) != 0
                    this.targetVelX = 0;   // 原 this.y = 0
                    slotKind = 0;   // 原 n4 = 0
                } else if (this.frameGroupIndex == 0) {   // 原 this.l == 0
                    this.targetVelX = 0;   // 原 this.y = 0
                    slotKind = 1;   // 原 n4 = 1
                } else if (this.frameGroupIndex == 2) {   // 原 this.l == 2
                    this.targetVelX = 0;   // 原 this.y = 0
                    slotKind = 2;   // 原 n4 = 2
                } else if (this.frameGroupIndex == 25) {   // 原 this.l == 25
                    slotKind = 3;   // 原 n4 = 3
                } else {
                    return;
                }
                if (this.canvas.scene.isVerticalScrollLevel) {   // 原 this.L.z.J
                    if (this.inputCounter < 5) {   // 原 this.V < 5
                        return;
                    }
                    this.currentWeaponIndex = 0;   // 原 this.U = 0
                    n3 = -2147483637;   // 原 n3 = -2147483637
                    this.inputCounter = 0;   // 原 this.V = 0
                } else {
                    if (ammoCurrent[this.currentWeaponIndex] <= 0) {   // 原 e[this.U] <= 0
                        this.setAction(fireActionTable[this.currentWeaponIndex][slotKind][2] | this.actionHighByte);   // 原 this.a(am[this.U][n4][2] | this.H)
                        return;
                    }
                    n3 = fireActionTable[this.currentWeaponIndex][slotKind][0] | this.actionHighByte;   // 原 n3 = am[this.U][n4][0] | this.H
                }
                boolean bl = false;
                int spawnX = this.computeSpawnCoord(bulletSpawnOffsets, slotKind, 0);   // 原 int n5 = this.a(ak, n4, 0)
                int spawnY = this.computeSpawnCoord(bulletSpawnOffsets, slotKind, 1);   // 原 int n6 = this.a(ak, n4, 1)
                ProjectileActor projectile = ProjectileActor.spawnProjectile(10, n3, spawnX, spawnY, 26, null);   // 原 k k2 = tjge.k.a(10, n3, n5, n6, 26, null)
                if (projectile == null) break;   // 原 if (k2 == null) break
                if (!projectile.hitWall) {   // 原 !k2.d
                    switch (slotKind) {   // 原 switch (n4)
                        case 0: {
                            projectile.targetVelY = -12288;   // 原 k2.z = -12288
                            break;
                        }
                        case 1:
                        case 2: {
                            projectile.targetVelX = 12288 * facingSign;   // 原 k2.y = 12288 * n2
                            break;
                        }
                        case 3: {
                            projectile.targetVelX = 12288 * facingSign;   // 原 k2.y = 12288 * n2
                            projectile.targetVelY = 12288;   // 原 k2.z = 12288
                        }
                    }
                }
                this.setAction(fireActionTable[this.currentWeaponIndex][slotKind][1] | this.actionHighByte);   // 原 this.a(am[this.U][n4][1] | this.H)
                if (this.canvas.scene.isVerticalScrollLevel) {   // 原 this.L.z.J
                    projectile.targetVelX = 4096;   // 原 k2.y = 4096
                    projectile.targetVelY = 6144;   // 原 k2.z = 6144
                    projectile.accelY = 2048;   // 原 k2.B = 2048
                    projectile.isSpecialGrenade = true;   // 原 k2.e = true
                } else {
                    int weapon = this.currentWeaponIndex;   // 原 int n7 = this.U
                    ammoCurrent[weapon] = ammoCurrent[weapon] - 1;   // 原 e[n7] = e[n7] - 1
                }
                this.canvas.inputAction = 0;   // 原 this.L.c = 0
                return;
            }
            case 1024: {
                if ((this.reserved & 1) == 0 || ammoCurrent[2] <= 0) break;   // 原 (this.G & 1) == 0 || e[2] <= 0
                if (this.frameGroupIndex == 0) {   // 原 this.l == 0
                    this.setAction(0xC | this.actionHighByte);   // 原 this.a(0xC | this.H)
                    return;
                }
                if (this.frameGroupIndex != 2) break;   // 原 this.l != 2
                this.setAction(0xD | this.actionHighByte);   // 原 this.a(0xD | this.H)
                return;
            }
            case 2048: {
                if ((this.reserved & 1) == 0 || this.frameGroupIndex != 0 && this.frameGroupIndex != 2 || !this.reloadCurrentWeapon()) break;   // 原 (this.G & 1) == 0 || this.l != 0 && this.l != 2 || !this.s()
                if (this.frameGroupIndex == 0) {   // 原 this.l == 0
                    this.setAction(0x1E | this.actionHighByte);   // 原 this.a(0x1E | this.H)
                } else {
                    this.setAction(0x1F | this.actionHighByte);   // 原 this.a(0x1F | this.H)
                }
                this.targetVelX = 0;   // 原 this.y = 0
                return;
            }
            case 4096: {
                int otherWeapon;   // 原 int n8
                if ((this.reserved & 1) != 0 && (this.frameGroupIndex == 0 || this.frameGroupIndex == 2) && ammoCurrent[otherWeapon = (this.currentWeaponIndex + 1) % 2] + ammoReserve[otherWeapon] > 0) {   // 原 (this.G & 1) != 0 && (this.l == 0 || this.l == 2) && e[n8 = (this.U + 1) % 2] + f[n8] > 0
                    this.currentWeaponIndex = otherWeapon;   // 原 this.U = n8
                    this.reloadCurrentWeapon();   // 原 this.s()
                    this.setAction((this.frameGroupIndex == 0 ? 30 : 31) | this.actionHighByte);   // 原 this.a((this.l == 0 ? 30 : 31) | this.H)
                }
                this.canvas.inputAction = 0;   // 原 this.L.c = 0
                return;
            }
            default: {
                if (this.frameGroupIndex == 1) {   // 原 this.l == 1
                    this.targetVelX = 0;   // 原 this.y = 0
                    this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
                    return;
                }
                if ((this.reserved & 4) == 0) break;   // 原 (this.G & 4) == 0
                this.targetVelX = 0;   // 原 this.y = 0
                this.targetVelY = 0;   // 原 this.z = 0
            }
        }
    }

    // 原 g.s()Z -> reloadCurrentWeapon：用备用弹药 ammoReserve 给当前武器补满弹匣 ammoCurrent
    private final boolean reloadCurrentWeapon() {   // 原 private final boolean s()
        if (ammoCurrent[this.currentWeaponIndex] < ammoInitTable[this.currentWeaponIndex] && ammoReserve[this.currentWeaponIndex] > 0) {   // 原 e[this.U] < c[this.U] && f[this.U] > 0
            int need = ammoInitTable[this.currentWeaponIndex] - ammoCurrent[this.currentWeaponIndex];   // 原 int n = c[this.U] - e[this.U]
            if (ammoReserve[this.currentWeaponIndex] >= need) {   // 原 f[this.U] >= n
                if (this.currentWeaponIndex != 0) {   // 原 this.U != 0
                    int weapon = this.currentWeaponIndex;   // 原 int n2 = this.U
                    ammoReserve[weapon] = ammoReserve[weapon] - need;   // 原 f[n2] = f[n2] - n
                }
                int weapon2 = this.currentWeaponIndex;   // 原 int n3 = this.U
                ammoCurrent[weapon2] = ammoCurrent[weapon2] + need;   // 原 e[n3] = e[n3] + n
            } else {
                int weapon3 = this.currentWeaponIndex;   // 原 int n4 = this.U
                ammoCurrent[weapon3] = ammoCurrent[weapon3] + ammoReserve[this.currentWeaponIndex];   // 原 e[n4] = e[n4] + f[this.U]
                PlayerActor.ammoReserve[this.currentWeaponIndex] = 0;   // 原 tjge.g.f[this.U] = 0
            }
            return true;
        }
        return false;
    }

    // 原 g.a(Ltjge/h;)Z -> onHitBy：被另一 Actor 命中时的回调
    protected final boolean onHitBy(ActorBase other) {   // 原 protected final boolean a(h h2)
        if (!other.hasCollisionFlag(1) || this.frameGroupIndex == 23 || !this.isNewContact(other)) {   // 原 !h2.b(1) || this.l == 23 || !this.d(h2)
            return false;
        }
        switch (other.typeId) {   // 原 switch (h2.h)
            case 9:
            case 10:
            case 12: {
                this.takeDamage(other.getDamage(), other.actionHighByte);   // 原 this.c(h2.m(), h2.H)
                return true;
            }
            case 1:
            case 3: {
                if (other.frameGroupIndex != 7) break;   // 原 h2.l != 7
                this.velX = 0;   // 原 this.w = 0
                if (other.actionHighByte == 0) {   // 原 h2.H == 0
                    if (!this.checkRightWallCollision()) {   // 原 !this.k()
                        this.posX += 8192;   // 原 this.u += 8192
                    }
                } else if (!this.checkLeftWallCollision()) {   // 原 !this.j()
                    this.posX -= 8192;   // 原 this.u -= 8192
                }
                this.takeDamage(other.getDamage(), other.actionHighByte);   // 原 this.c(h2.m(), h2.H)
                break;
            }
            case 4: {
                this.takeDamage(3, other.actionHighByte);   // 原 this.c(3, h2.H)
            }
        }
        return false;
    }

    // 原 g.c(Ltjge/h;)V -> onTouchActor：与另一 Actor 接触时的回调
    protected final void onTouchActor(ActorBase other) {   // 原 protected final void c(h h2)
        switch (other.typeId) {   // 原 switch (h2.h)
            case 1:
            case 2:
            case 3:
            case 4:
            case 5: {
                if (this.frameGroupIndex != 23 || (this.reserved & 1) == 0 || !this.isFootOnGround()) break;   // 原 this.l != 23 || (this.G & 1) == 0 || !this.w()
                this.targetVelX = 0;   // 原 this.y = 0
                this.setAction(0x18 | this.actionHighByte);   // 原 this.a(0x18 | this.H)
                return;
            }
            case 11:
            case 13: {
                int edge = other.actionHighByte == 0 ? other.posX + (other.boxLeft << 10) : other.posX + (other.boxRight << 10);   // 原 int n = h2.H == 0 ? h2.u + (h2.p << 10) : h2.u + (h2.q << 10)
                if (this.actionHighByte != other.actionHighByte) break;   // 原 this.H != h2.H
                if (this.actionHighByte == 0) {   // 原 this.H == 0
                    this.posX = edge - (this.boxRight << 10);   // 原 this.u = n - (this.q << 10)
                    return;
                }
                this.posX = edge - (this.boxLeft << 10);   // 原 this.u = n - (this.p << 10)
            }
        }
    }

    // 原 g.c(II)V -> takeDamage：扣血并按当前状态切换受击/格挡/死亡动作
    private final void takeDamage(int amount, int fromDir) {   // 原 private final void c(int n, int n2)
        if (this.health <= 0 || amount <= 0) {   // 原 this.T <= 0 || n <= 0
            return;
        }
        if (this.canvas.scene.subState != 0 && this.canvas.scene.subState != 5) {   // 原 this.L.z.w != 0 && this.L.z.w != 5
            return;
        }
        this.health -= amount;   // 原 this.T -= n
        this.targetVelX = 0;   // 原 this.y = 0
        if ((this.reserved & 1) != 0) {   // 原 (this.G & 1) != 0
            if (this.isFootOnGround()) {   // 原 this.w()
                if (fromDir == this.actionHighByte) {   // 原 n2 == this.H
                    this.setAction(6 | this.actionHighByte);   // 原 this.a(6 | this.H)
                } else {
                    this.setAction(5 | this.actionHighByte);   // 原 this.a(5 | this.H)
                }
            } else if (this.health <= 0) {   // 原 this.T <= 0
                this.setAction(3 | this.actionHighByte);   // 原 this.a(3 | this.H)
            }
        } else if ((this.reserved & 2) != 0) {   // 原 (this.G & 2) != 0
            this.reserved &= 0xFFFFFFFD;   // 原 this.G &= 0xFFFFFFFD
            this.setAction(5 | this.actionHighByte);   // 原 this.a(5 | this.H)
        } else {
            if ((this.reserved & 4) != 0) {   // 原 (this.G & 4) != 0
                this.targetVelY = 0;   // 原 this.z = 0
                if (this.health <= 0) {   // 原 this.T <= 0
                    this.publicFlagC = true;   // 原 this.ai = true
                    tjge.LevelScene.cutsceneState[1] = 2;   // 原 tjge.j.i[1] = 2
                    this.canvas.scene.setSubState(1);   // 原 this.L.z.a(1)
                }
                return;
            }
            this.targetVelY = 6144;   // 原 this.z = 6144
            this.accelY = 4096;   // 原 this.B = 4096
            this.setAction(5 | this.actionHighByte);   // 原 this.a(5 | this.H)
        }
        this.canJump = false;   // 原 this.aa = false
        this.vaultLocked = false;   // 原 this.Z = false
        this.airborneJumping = false;   // 原 this.ad = false
        this.vaultTargetX = -1;   // 原 this.X = -1
        this.vaultTargetY = -1;   // 原 this.Y = -1
    }

    // 原 g.t()I -> probeVault：向前扫描瓦片判定翻越类型并记录翻越目标 X/Y
    private final int probeVault() {   // 原 private final int t()
        int n;
        int n2;
        int n3;
        int dir;   // 原 int n（朝向步进 ±1）
        if (this.actionHighByte == 0) {   // 原 this.H == 0
            n3 = this.boxRight;   // 原 n3 = this.q
            n2 = this.boxRight + 10;   // 原 n2 = this.q + 10
            dir = 1;   // 原 n = 1
        } else {
            n3 = this.boxLeft;   // 原 n3 = this.p
            n2 = this.boxLeft - 10;   // 原 n2 = this.p - 10
            dir = -1;   // 原 n = -1
        }
        int colStart = (this.posX >> 10) + n3 >> 3;   // 原 int n4 = (this.u >> 10) + n3 >> 3
        int colEnd = (this.posX + this.velX >> 10) + n2 >> 3;   // 原 int n5 = (this.u + this.w >> 10) + n2 >> 3
        int rowBottom = (this.posY + this.velY >> 10) - 2 >> 3;   // 原 int n6 = (this.v + this.x >> 10) - 2 >> 3
        int rowTop = rowBottom - 7;   // 原 int n7 = n6 - 7
        int col = colStart;   // 原 int n8 = n4
        while (col != colEnd + dir) {   // 原 while (n8 != n5 + n)
            int row = rowTop;   // 原 int n9 = n7
            while (row <= rowBottom) {   // 原 while (n9 <= n6)
                int tile = this.tileAt(col, row);   // 原 int n10 = this.a(n8, n9)
                if ((tile & 3) != 0) {
                    int height = row - rowTop;   // 原 int n11 = n9 - n7
                    switch (height) {   // 原 switch (n11)
                        case 0: {
                            return 5;
                        }
                        case 1:
                        case 2: {
                            if ((this.reserved & 1) == 0) {   // 原 (this.G & 1) == 0
                                return 5;
                            }
                        }
                        case 3:
                        case 4: {
                            int sideTile = this.tileAt(col - dir, row);   // 原 int n12 = this.a(n8 - n, n9)
                            int aboveTile = this.tileAt(col, row - 1);   // 原 int n13 = this.a(n8, n9 - 1)
                            if (sideTile == 0 && aboveTile == 0) {   // 原 n12 == 0 && n13 == 0
                                this.vaultTargetX = dir > 0 ? col << 13 : (col << 3) + 8 << 10;   // 原 this.X = n > 0 ? n8 << 13 : (n8 << 3) + 8 << 10
                                this.vaultTargetX += this.actionHighByte == 0 ? -10240 : 10240;   // 原 this.X += this.H == 0 ? -10240 : 10240
                                this.vaultTargetY = (row << 13) + 40960;   // 原 this.Y = (n9 << 13) + 40960
                                if (height < 3) {   // 原 n11 < 3
                                    return 4;
                                }
                                if (height < 4) {   // 原 n11 < 4
                                    return 3;
                                }
                                return 2;
                            }
                            return 4;
                        }
                        case 5:
                        case 6: {
                            return 1;
                        }
                    }
                }
                ++row;   // 原 ++n9
            }
            col += dir;   // 原 n8 += n
        }
        return 0;
    }

    // 原 g.u()V -> updateVaultMotion：空中跳跃时驱动翻越，对齐翻越目标点并锁定 Z，或落地转蹲伏
    private final void updateVaultMotion() {   // 原 private final void u()
        if (!this.canJump || !this.airborneJumping) {   // 原 !this.aa || !this.ad
            return;
        }
        if (this.snapToLedge(0)) {   // 原 this.d(0)
            this.targetVelY = 0;   // 原 this.z = 0
            this.accelY = 0;   // 原 this.B = 0
            this.reserved = 2;   // 原 this.G = 2
            this.setAction(0x12 | this.actionHighByte);   // 原 this.a(0x12 | this.H)
            return;
        }
        if (this.vaultTargetX < 0 && this.vaultTargetY < 0) {   // 原 this.X < 0 && this.Y < 0
            this.probeVault();   // 原 this.t()
        }
        if (this.vaultTargetX >= 0 && this.vaultTargetY >= 0) {   // 原 this.X >= 0 && this.Y >= 0
            if (Math.abs(this.posY - this.vaultTargetY) <= Math.abs(this.velY)) {   // 原 Math.abs(this.v - this.Y) <= Math.abs(this.x)
                if (!this.isVaultBlocked()) {   // 原 !this.x()
                    this.velX = this.vaultTargetX - this.posX;   // 原 this.w = this.X - this.u
                    this.velY = this.vaultTargetY - this.posY;   // 原 this.x = this.Y - this.v
                    this.targetVelX = 0;   // 原 this.y = 0
                    this.targetVelY = 0;   // 原 this.z = 0
                    this.vaultLocked = true;   // 原 this.Z = true
                    return;
                }
            } else if (Math.abs(this.posX - this.vaultTargetX) <= Math.abs(this.velX)) {   // 原 Math.abs(this.u - this.X) <= Math.abs(this.w)
                this.targetVelX = 0;   // 原 this.y = 0
                this.velX = 0;   // 原 this.w = 0
            }
        }
    }

    // 原 g.d(I)Z -> snapToLedge：检测并贴靠到 4 号边沿瓦片
    private final boolean snapToLedge(int mode) {   // 原 private final boolean d(int n)
        int col = this.posX + this.velX >> 13;   // 原 int n2 = this.u + this.w >> 13
        int boxX = mode == 0 ? this.boxTop : 10;   // 原 int n3 = n == 0 ? this.r : 10
        int row = (this.posY >> 10) + boxX >> 3;   // 原 int n4 = (this.v >> 10) + n3 >> 3
        if (this.tileAt(col, row) == 4) {   // 原 this.a(n2, n4) == 4
            while (this.tileAt(--col, row) == 4) {   // 原 while (this.a(--n2, n4) == 4)
            }
            this.posX = (col << 3) + 16 << 10;   // 原 this.u = (n2 << 3) + 16 << 10
            this.targetVelX = 0;   // 原 this.y = 0
            this.velX = 0;   // 原 this.w = 0
            return true;
        }
        return false;
    }

    // 原 g.l()Z -> checkCeilingCollision：向上碰撞检测（覆写基类同名 l()）
    public final boolean checkCeilingCollision() {   // 原 public final boolean l()
        if (this.velY > 0) {   // 原 this.x > 0
            return false;
        }
        int rowStart = (this.posY >> 10) + this.boxTop >> 3;   // 原 int n = (this.v >> 10) + this.r >> 3
        int rowEnd = (this.posY + this.velY >> 10) + this.boxTop >> 3;   // 原 int n2 = (this.v + this.x >> 10) + this.r >> 3
        int col = this.posX + this.velX >> 13;   // 原 int n3 = this.u + this.w >> 13
        int row = rowStart;   // 原 int n4 = n
        while (row >= rowEnd) {   // 原 while (n4 >= n2)
            int tile = this.tileAt(col, row);   // 原 int n5 = this.a(n3, n4)
            if ((tile & 3) != 0) {
                this.targetVelY = 0;   // 原 this.z = 0
                this.velY = ((row << 3) + 9 << 10) - (this.posY + (this.boxTop << 10));   // 原 this.x = ((n4 << 3) + 9 << 10) - (this.v + (this.r << 10))
                return true;
            }
            --row;   // 原 --n4
        }
        this.accelY = 4096;   // 原 this.B = 4096
        return false;
    }

    // 原 g.q()Z -> checkFloorCollision：向下碰撞检测（覆写基类同名 q()）
    public final boolean checkFloorCollision() {   // 原 public final boolean q()
        if (this.velY < 0) {   // 原 this.x < 0
            return false;
        }
        int rowStart = (this.posY >> 10) + this.boxBottom >> 3;   // 原 int n = (this.v >> 10) + this.s >> 3
        int rowEnd = (this.posY + this.velY >> 10) + this.boxBottom >> 3;   // 原 int n2 = (this.v + this.x >> 10) + this.s >> 3
        int row = rowStart;   // 原 int n3 = n
        while (row <= rowEnd) {   // 原 while (n3 <= n2)
            int colLeft = (this.posX + this.velX >> 10) - 3 >> 3;   // 原 int n4 = (this.u + this.w >> 10) - 3 >> 3
            int colMid = this.posX + this.velX >> 10 >> 3;   // 原 int n5 = this.u + this.w >> 10 >> 3
            int colRight = (this.posX + this.velX >> 10) + 3 >> 3;   // 原 int n6 = (this.u + this.w >> 10) + 3 >> 3
            int tileMid = this.tileAt(colMid, row);   // 原 int n7 = this.a(n5, n3)
            if ((tileMid & 3) != 0) {
                tileMid = this.tileAt(colLeft, row);   // 原 n7 = this.a(n4, n3)
                int tileRight = this.tileAt(colRight, row);   // 原 int n8 = this.a(n6, n3)
                if ((tileMid & 3) != 0 && (tileRight & 3) != 0) {
                    this.targetVelY = 0;   // 原 this.z = 0
                    this.velY = (row << 13) - (this.posY + (this.boxBottom << 10));   // 原 this.x = (n3 << 13) - (this.v + (this.s << 10))
                    return true;
                }
            }
            ++row;   // 原 ++n3
        }
        this.accelY = 4096;   // 原 this.B = 4096
        return false;
    }

    // 原 g.j()Z -> checkLeftWallCollision：向左碰撞检测（覆写基类同名 j()）
    public final boolean checkLeftWallCollision() {   // 原 public final boolean j()
        if (this.velX > 0) {   // 原 this.w > 0
            return false;
        }
        int colEnd = (this.posX + this.velX >> 10) + this.boxLeft >> 3;   // 原 int n = (this.u + this.w >> 10) + this.p >> 3
        int colStart = (this.posX >> 10) + this.boxLeft >> 3;   // 原 int n2 = (this.u >> 10) + this.p >> 3
        int rowStart = (this.posY >> 10) + this.boxTop + 2 >> 3;   // 原 int n3 = (this.v >> 10) + this.r + 2 >> 3
        int rowEnd = (this.posY >> 10) + this.boxBottom - 4 >> 3;   // 原 int n4 = (this.v >> 10) + this.s - 4 >> 3
        int row = rowStart;   // 原 int n5 = n3
        while (row <= rowEnd) {   // 原 while (n5 <= n4)
            int col = colStart;   // 原 int n6 = n2
            while (col >= colEnd) {   // 原 while (n6 >= n)
                int tile = this.tileAt(col, row);   // 原 int n7 = this.a(n6, n5)
                if ((tile & 3) != 0) {
                    this.targetVelX = 0;   // 原 this.y = 0
                    this.posX &= 0xFFFFFC00;   // 原 this.u &= 0xFFFFFC00
                    this.velX = ((col << 3) + 8 << 10) - (this.posX + (this.boxLeft << 10));   // 原 this.w = ((n6 << 3) + 8 << 10) - (this.u + (this.p << 10))
                    return true;
                }
                --col;   // 原 --n6
            }
            ++row;   // 原 ++n5
        }
        return false;
    }

    // 原 g.k()Z -> checkRightWallCollision：向右碰撞检测（覆写基类同名 k()）
    public final boolean checkRightWallCollision() {   // 原 public final boolean k()
        if (this.velX < 0) {   // 原 this.w < 0
            return false;
        }
        int colStart = (this.posX >> 10) + this.boxRight >> 3;   // 原 int n = (this.u >> 10) + this.q >> 3
        int colEnd = (this.posX + this.velX >> 10) + this.boxRight >> 3;   // 原 int n2 = (this.u + this.w >> 10) + this.q >> 3
        int rowStart = (this.posY >> 10) + this.boxTop + 2 >> 3;   // 原 int n3 = (this.v >> 10) + this.r + 2 >> 3
        int rowEnd = (this.posY >> 10) + this.boxBottom - 4 >> 3;   // 原 int n4 = (this.v >> 10) + this.s - 4 >> 3
        int row = rowStart;   // 原 int n5 = n3
        while (row <= rowEnd) {   // 原 while (n5 <= n4)
            int col = colStart;   // 原 int n6 = n
            while (col <= colEnd) {   // 原 while (n6 <= n2)
                int tile = this.tileAt(col, row);   // 原 int n7 = this.a(n6, n5)
                if ((tile & 3) != 0) {
                    this.targetVelX = 0;   // 原 this.y = 0
                    this.posX &= 0xFFFFFC00;   // 原 this.u &= 0xFFFFFC00
                    this.velX = ((col << 3) - 1 << 10) - (this.posX + (this.boxRight << 10));   // 原 this.w = ((n6 << 3) - 1 << 10) - (this.u + (this.q << 10))
                    return true;
                }
                ++col;   // 原 ++n6
            }
            ++row;   // 原 ++n5
        }
        return false;
    }

    // 原 g.v()Z -> canAcceptInput：判定当前动作 l 是否处于可接受输入的状态
    private final boolean canAcceptInput() {   // 原 private final boolean v()
        return this.health > 0 && !this.levelCleared && (this.frameGroupIndex == 0 || this.frameGroupIndex == 1 || this.frameGroupIndex == 2 || this.frameGroupIndex == 30 || this.frameGroupIndex == 31 || this.frameGroupIndex == 18 || this.frameGroupIndex == 19 || this.frameGroupIndex == 20 || this.frameGroupIndex == 21 || this.frameGroupIndex == 25 || this.frameGroupIndex == 14 || this.frameGroupIndex == 15 || this.frameGroupIndex == 32);   // 原 this.T > 0 && !this.ae && (this.l == 0 || ... || this.l == 32)
    }

    // 原 g.a([[III)I -> computeSpawnCoord：按偏移表与朝向 H 计算投掷物/弹丸的发射世界坐标
    private final int computeSpawnCoord(int[][] offsetTable, int pose, int axis) {   // 原 private final int a(int[][] nArray, int n, int n2)
        int sign = 1;   // 原 int n3 = 1
        if (this.actionHighByte != 0) {   // 原 this.H != 0
            sign = -1;   // 原 n3 = -1
        }
        int coord = 0;   // 原 int n4 = 0
        if (axis == 0) {   // 原 n2 == 0
            coord = (offsetTable[pose][axis] << 10) * sign;   // 原 n4 = (nArray[n][n2] << 10) * n3
            coord += this.posX;   // 原 n4 += this.u
        } else {
            coord = offsetTable[pose][axis] << 10;   // 原 n4 = nArray[n][n2] << 10
            coord += this.posY;   // 原 n4 += this.v
        }
        return coord;
    }

    // 原 g.m()I -> getMeleeDamage：返回当前动作造成的近战伤害值（覆写基类 m()）
    protected final int getMeleeDamage() {   // 原 protected final int m()
        switch (this.frameGroupIndex) {   // 原 switch (this.l)
            case 24: {
                return 10;
            }
        }
        return 0;
    }

    // 原 g.w()Z -> isFootOnGround：脚下三格瓦片探测，判定是否站立在实体地面上
    private final boolean isFootOnGround() {   // 原 private final boolean w()
        int col = this.posX >> 13;   // 原 int n = this.u >> 13
        int rowBase = (this.posY >> 10) + this.boxTop >> 3;   // 原 int n2 = (this.v >> 10) + this.r >> 3
        int offset = 2;   // 原 int n3 = 2
        while (offset >= 0) {   // 原 while (n3 >= 0)
            int tile = this.tileAt(col, rowBase - offset);   // 原 int n4 = this.a(n, n2 - n3)
            if ((tile & 3) != 0) break;
            --offset;   // 原 --n3
        }
        return offset < 0;   // 原 return n3 < 0
    }

    // 原 g.x()Z -> isVaultBlocked：翻越落点下方瓦片探测，判定翻越目标是否被阻挡
    private final boolean isVaultBlocked() {   // 原 private final boolean x()
        int col = this.posX >> 13;   // 原 int n = this.u >> 13
        int rowBase = (this.posY + this.velY >> 10) + this.boxBottom >> 3;   // 原 int n2 = (this.v + this.x >> 10) + this.s >> 3
        int offset = 0;   // 原 int n3 = 0
        while (offset < 2) {   // 原 while (n3 < 2)
            int tile = this.tileAt(col, rowBase + offset);   // 原 int n4 = this.a(n, n2 + n3)
            if ((tile & 3) != 0) break;
            ++offset;   // 原 ++n3
        }
        return offset < 2;   // 原 return n3 < 2
    }

    // 原 g.a(Z)Z -> triggerSwitch：开关交互
    public final boolean triggerSwitch(boolean mark) {   // 原 public final boolean a(boolean bl)
        if (mark) {   // 原 bl
            this.switchPending = true;   // 原 this.ab = true
        } else if (this.switchPending && (this.reserved & 1) != 0) {   // 原 this.ab && (this.G & 1) != 0
            this.targetVelX = 0;   // 原 this.y = 0
            this.setAction(0x21 | this.actionHighByte);   // 原 this.a(0x21 | this.H)
            this.canvas.scene.setSubState(2);   // 原 this.L.z.a(2)
            return true;
        }
        return false;
    }

    // 原 g.b(II)V -> setTilePosition：按瓦片坐标设置玩家定点位置、复位站立动作并重置相机
    public final void setTilePosition(int tileX, int tileY) {   // 原 public final void b(int n, int n2)
        this.posX = tileX << 14;   // 原 this.u = n << 14
        this.posY = tileY << 14;   // 原 this.v = n2 << 14
        this.setAction(0 | this.actionHighByte);   // 原 this.a(0 | this.H)
        tjge.LevelScene.camera.resetDrawnBounds();   // 原 tjge.j.a.a()
    }

    // 原 g.y()V -> resetVaultState：重置翻越/跳跃相关状态
    private void resetVaultState() {   // 原 private void y()
        this.vaultTargetX = -1;   // 原 this.X = -1
        this.vaultTargetY = -1;   // 原 this.Y = -1
        this.airborneJumping = false;   // 原 this.ad = false
        this.vaultLocked = false;   // 原 this.Z = false
        this.canJump = true;   // 原 this.aa = true
        this.vaultType = 0;   // 原 this.W = 0
    }

    // 原 g.a(Ltjge/e;)V -> applyPickup：应用拾取物效果（增加备用弹药/手雷/血量并夹取上限）
    public final void applyPickup(ItemActor item) {   // 原 public final void a(e e2)
        switch (item.frameGroupIndex) {   // 原 switch (e2.l)
            case 0: {
                ammoReserve[1] = ammoReserve[1] + item.counter;   // 原 f[1] = f[1] + e2.e
                PlayerActor.ammoReserve[1] = Math.min(99, ammoReserve[1]);   // 原 tjge.g.f[1] = Math.min(99, f[1])
                return;
            }
            case 1: {
                ammoCurrent[2] = ammoCurrent[2] + item.counter;   // 原 e[2] = e[2] + e2.e
                PlayerActor.ammoCurrent[2] = Math.min(3, ammoCurrent[2]);   // 原 tjge.g.e[2] = Math.min(3, e[2])
                return;
            }
            case 2: {
                this.health += item.counter;   // 原 this.T += e2.e
                this.health = Math.min(10, this.health);   // 原 this.T = Math.min(10, this.T)
            }
        }
    }

    // 原 g.<clinit>()V -> 静态初始化块
    static {
        tjge.PlayerActor.throwCooldownQueue[0] = new int[3];   // 原 tjge.g.Q[0] = new int[3]
        tjge.PlayerActor.throwCooldownQueue[1] = new int[3];   // 原 tjge.g.Q[1] = new int[3]
        tjge.PlayerActor.throwCooldownQueue[2] = new int[3];   // 原 tjge.g.Q[2] = new int[3]
        tjge.PlayerActor.throwCooldownQueue[3] = new int[3];   // 原 tjge.g.Q[3] = new int[3]
        tjge.PlayerActor.ammoReserve[0] = reserveInitTable[0];   // 原 tjge.g.f[0] = d[0]
        tjge.PlayerActor.ammoReserve[1] = reserveInitTable[1];   // 原 tjge.g.f[1] = d[1]
        tjge.PlayerActor.ammoReserve[2] = reserveInitTable[2];   // 原 tjge.g.f[2] = d[2]
        bulletSpawnOffsets = new int[][]{{-2, -56}, {28, -26}, {28, -16}, {30, 11}};   // 原 ak = new int[][]{...}
        grenadeSpawnOffsets = new int[][]{{0, -32}, {0, -24}};   // 原 al = new int[][]{...}
        fireActionTable = new int[][][]{new int[][]{{0, 7, 29}, {1, 8, 27}, {1, 9, 28}, {2, 26, 25}}, new int[][]{{3, 7, 29}, {4, 10, 27}, {4, 11, 28}, {5, 26, 25}}};   // 原 am = new int[][][]{...}
    }
}

