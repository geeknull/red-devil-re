// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/c.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.GameScreen;     // 原: tjge.a
import tjge.SpriteDef;      // 原: tjge.d
import tjge.PlayerActor;    // 原: tjge.f
import tjge.ActorBase;      // 原: tjge.g
import tjge.EnemyActor;     // 原: tjge.h
import tjge.ProjectileActor;// 原: tjge.l

public final class BossActor              // 原: c
extends ActorBase {                       // 原: extends g
    GameScreen screen;                    // 原: a a
    int delayTimer;                       // 原: int b
    int phase;                            // 原: int c
    int subTimer;                         // 原: int d
    int attackMode;                       // 原: int e
    int health;                           // 原: int f
    int waveCount;                        // 原: int g
    int flashCounter;                     // 原: int h
    int homeX;                            // 原: int i
    int homeY;                            // 原: int j
    boolean disabled;                     // 原: boolean k
    boolean hitFlashing;                  // 原: boolean l
    boolean phaseTriggered;               // 原: boolean m
    boolean visible;                      // 原: boolean n
    EnemyActor minion;                    // 原: h o

    // 原: public c(int n, d d2, a a2)
    public BossActor(int typeId, SpriteDef spriteDef, GameScreen screen) {
        super(typeId, spriteDef);
        this.screen = screen;
        this.minion = null;
        this.visible = true;
    }

    // 原: public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl)
    // 覆写 ActorBase.spawnAt
    public final boolean spawnAt(int frameIndex, int tileX, int tileY, byte[] params, boolean flag) {
        if (flag) {
            return false;
        }
        super.spawnAt(frameIndex, tileX, tileY, params, flag);
        this.hitFlashing = false;
        this.visible = true;
        switch (this.typeId) {            // 原: this.q
            case 14: {
                this.phase = 0;
                this.delayTimer = 15;
                break;
            }
            case 8: {
                boolean disabledLocal = this.disabled = params[0] == 0;   // 原: bl2 = this.k = byArray[0] == 0
                if (this.disabled) {
                    this.screen.player.linkedBoss = this;                 // 原: this.a.j.aa = this
                    break;
                }
                this.health = 5;
                this.phase = 0;
                this.subTimer = 0;
                this.delayTimer = 10;
                this.homeX = this.posX;                                   // 原: this.i = this.C
                if (this.screen.levelIndex == 6) {                        // 原: this.a.x == 6
                    this.screen.boss = this;                              // 原: this.a.n = this
                    this.waveCount = 11;
                    this.attackMode = 1;
                } else {
                    this.waveCount = 9;
                    this.attackMode = 0;
                }
                this.setFrame(Integer.MIN_VALUE);                        // 原: this.a(Integer.MIN_VALUE)
                break;
            }
            case 17: {
                this.delayTimer = params[0];                             // 原: this.b = byArray[0]
                this.flashCounter = params[1];                          // 原: this.h = byArray[1]
                this.subTimer = -1;                                      // 原: this.d = -1
                this.homeX = this.posX;                                  // 原: this.i = this.C
                this.homeY = this.posY;                                  // 原: this.j = this.D
                this.loopAnimation = false;                              // 原: this.s = false
                this.setFrame(3);                                        // 原: this.a(3)
            }
        }
        return true;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    // 原: public final void a()  覆写 ActorBase.update
    public final void update() {
        PlayerActor player = this.screen.player;                        // 原: f f2 = this.a.j
        int actionLow24 = this.frameIndex & 0xFFFFFF;                   // 原: int n = this.t & 0xFFFFFF
        switch (this.typeId) {                                           // 原: this.q
            case 14: {
                if (this.intersectsActor(player)) {                      // 原: this.a(f2)
                    this.phase = 1;
                    this.setFrame(1);                                    // 原: this.a(1)
                    this.screen.levelLoader.actorSpawned[this.extra] = true; // 原: this.a.g.k[this.B] = true
                }
                if (this.phase != 1 || this.delayTimer-- >= 0) return;   // 原: this.c != 1 || this.b-- >= 0
                this.screen.spawnProjectile(16, 0, 0, this.posX, this.posY, 2); // 原: this.a.a(16,0,0,this.C,this.D,2)
                this.deactivate();                                       // 原: this.b()
                GameScreen.playSound(5, 1, 220);                         // 原: tjge.a.a(5, 1, 220)
                return;
            }
            case 8: {
                int n2 = this.screen.cameraX + GameScreen.viewWidthFx;   // 原: int n2 = this.a.r + tjge.a.c
                switch (this.screen.levelIndex) {                        // 原: this.a.x
                    case 3:
                    case 6: {
                        if (!this.screen.scriptFlagL) return;            // 原: this.a.L
                        if (this.delayTimer-- > 0) {                     // 原: this.b-- > 0
                            return;
                        }
                        if (this.health < 0) {                           // 原: this.f < 0
                            this.health = 0;
                        }
                        this.screen.showIndicator = true;               // 原: this.a.M = true
                        int n3 = this.screen.indicatorValue = this.waveCount < 6 ? this.health : this.health + (this.waveCount - 6) * 5;
                        // 原: this.a.O = this.g < 6 ? this.f : this.f + (this.g - 6) * 5
                        if (!this.phaseTriggered && this.intersectsActor(player) && this.health > 0) {
                            // 原: !this.m && this.a(f2) && this.f > 0
                            player.takeDamage(3);                        // 原: f2.e(3)
                            if (this.targetVelX == 0) {                  // 原: this.G == 0
                                this.phase = 2;
                                this.subTimer = 11;
                                this.setFrame(-2147483647);              // 原: this.a(-2147483647)
                                this.phaseTriggered = true;              // 原: this.m = true
                            }
                        } else if (this.health == 0) {                   // 原: this.f == 0
                            if (--this.waveCount < 6) {                  // 原: --this.g < 6
                                if (this.waveCount <= 0) {               // 原: this.g <= 0
                                    this.visible = false;                // 原: this.n = false
                                    boolean bl = false;
                                    this.screen.showIndicator = false;   // 原: this.a.M = false
                                    if (this.screen.levelIndex != 6) {   // 原: this.a.x != 6
                                        bl = true;
                                    } else if ((player.stateFlags & 1) != 0 && player.posY > 500000) {
                                        // 原: (f2.a & 1) != 0 && f2.D > 500000
                                        bl = true;
                                        this.screen.state = 19;          // 原: this.a.p = 19
                                    }
                                    if (!bl) return;
                                    this.deactivate();                   // 原: this.b()
                                    this.screen.scriptFlagL = false;     // 原: this.a.L = false
                                    this.screen.levelLoader.actorSpawned[this.extra] = true; // 原: this.a.g.k[this.B] = true
                                    return;
                                }
                                this.spawnDeathBurst();                  // 原: this.f()
                                return;
                            }
                            this.health = 5;                            // 原: this.f = 5
                            this.subTimer = 0;                          // 原: this.d = 0
                            this.phase = 2;                             // 原: this.c = 2
                        }
                        if (this.targetVelX != 0 && this.hitFlashing) { // 原: this.G != 0 && this.l
                            this.hitFlashing = false;
                            this.flashCounter = 0;                      // 原: this.h = 0
                        } else if (this.hitFlashing) {
                            int n4 = this.posX = this.posX == this.homeX ? this.posX + 2048 : this.homeX;
                            // 原: this.C = this.C == this.i ? this.C + 2048 : this.i
                            if (this.flashCounter++ > 5) {              // 原: this.h++ > 5
                                this.hitFlashing = false;
                                this.flashCounter = 0;
                                this.posX = this.homeX;                 // 原: this.C = this.i
                            }
                        }
                        switch (this.phase) {                           // 原: this.c
                            case 0: {
                                this.targetVelX = -2048;                // 原: this.G = -2048
                                if (this.posX >= n2 - 20480) break;     // 原: this.C >= n2 - 20480
                                this.phase = 1;
                                this.targetVelX = 0;                    // 原: this.G = 0
                                this.setFrame(-2147483646);             // 原: this.a(-2147483646)
                                return;
                            }
                            case 1: {
                                if (this.subTimer++ > 15) {             // 原: this.d++ > 15
                                    int spawnOffset = 35840;            // 原: int n5 = 35840
                                    if (this.attackMode == 0) {         // 原: this.e == 0
                                        ProjectileActor shot = this.screen.spawnProjectile(21, Integer.MIN_VALUE, 0, this.posX - spawnOffset, this.posY - spawnOffset, 1);
                                        // 原: l l2 = this.a.a(21, Integer.MIN_VALUE, 0, this.C - n5, this.D - n5, 1)
                                        if (shot == null) break;
                                        shot.targetVelX = -12288;       // 原: l2.G = -12288
                                        this.subTimer = 0;              // 原: this.d = 0
                                        if (this.targetVelX == 0) {     // 原: this.G == 0
                                            this.setFrame(-2147483644); // 原: this.a(-2147483644)
                                            return;
                                        }
                                        this.setFrame(-2147483645);     // 原: this.a(-2147483645)
                                        return;
                                    }
                                    ProjectileActor lobShot = this.screen.spawnProjectile(20, 0, 0, this.posX + 5120, this.posY - spawnOffset, 1);
                                    // 原: l l3 = this.a.a(20, 0, 0, this.C + 5120, this.D - n5, 1)
                                    if (lobShot == null) break;
                                    this.subTimer = 0;                  // 原: this.d = 0
                                    lobShot.launchArc(0);               // 原: l3.b(0)
                                    if (this.targetVelX > 0) {          // 原: this.G > 0
                                        this.setFrame(-2147483643);     // 原: this.a(-2147483643)
                                        return;
                                    }
                                    this.setFrame(-2147483642);         // 原: this.a(-2147483642)
                                    return;
                                }
                                if (this.targetVelX == 0 && this.isAnimationDone()) { // 原: this.G == 0 && this.d()
                                    this.setFrame(-2147483646);         // 原: this.a(-2147483646)
                                    return;
                                }
                                if (this.targetVelX <= 0) break;        // 原: this.G <= 0
                                if (this.isAnimationDone()) {           // 原: this.d()
                                    this.setFrame(Integer.MIN_VALUE);   // 原: this.a(Integer.MIN_VALUE)
                                }
                                if (this.posX <= n2 - 20480) break;     // 原: this.C <= n2 - 20480
                                this.subTimer = 0;                      // 原: this.d = 0
                                this.targetVelX = 0;                    // 原: this.G = 0
                                if (this.screen.levelIndex != 6) {      // 原: this.a.x != 6
                                    this.attackMode = 0;                // 原: this.e = 0
                                }
                                this.phaseTriggered = false;            // 原: this.m = false
                                return;
                            }
                            case 2: {
                                if (this.subTimer++ > 15) {             // 原: this.d++ > 15
                                    this.subTimer = 0;                  // 原: this.d = 0
                                    this.phase = 3;                     // 原: this.c = 3
                                    this.targetVelX = -10240;           // 原: this.G = -10240
                                    this.setFrame(Integer.MIN_VALUE);   // 原: this.a(Integer.MIN_VALUE)
                                    return;
                                }
                                if (!this.isAnimationDone()) break;     // 原: !this.d()
                                this.setFrame(-2147483647);             // 原: this.a(-2147483647)
                                return;
                            }
                            case 3: {
                                if (!this.collideLeftWall(this.screen.tileMap)) break; // 原: !this.a(this.a.f)
                                this.targetVelX = 4096;                 // 原: this.G = 4096
                                this.phase = 1;                         // 原: this.c = 1
                                this.attackMode = 1;                    // 原: this.e = 1
                            }
                        }
                        return;
                    }
                    case 4: {
                        if (this.disabled) return;                      // 原: this.k
                        if (this.minion.active && this.minion.lives > 0) { // 原: this.o.p && this.o.m > 0
                            this.minion.posX = this.posX - 23552;       // 原: this.o.C = this.C - 23552
                            if ((this.posX >= player.posX || this.posX <= this.screen.cameraX + 32768) && (this.posX <= player.posX || this.posX >= this.screen.cameraX + 186368)) return;
                            // 原: (this.C >= f2.C || this.C <= this.a.r + 32768) && (this.C <= f2.C || this.C >= this.a.r + 186368)
                            this.targetVelX = this.screen.cameraVelX;   // 原: this.G = this.a.t
                            return;
                        }
                        if (this.minion.aiState == 9 && this.minion.lives <= 0 && this.minion.targetVelY == 0) {
                            // 原: this.o.o == 9 && this.o.m <= 0 && this.o.H == 0
                            this.minion.targetVelY = 12288;             // 原: this.o.H = 12288
                            this.minion.targetVelX = 0;                 // 原: this.o.G = 0
                            this.minion.isPatroller = false;            // 原: this.o.T = false
                            this.targetVelX = this.posX > player.posX ? this.screen.cameraVelX + 8192 : 0;
                            // 原: this.G = this.C > f2.C ? this.a.t + 8192 : 0
                            return;
                        }
                        if (this.posX <= this.screen.cameraX + 210944 && this.posX >= this.screen.cameraX - 30720) return;
                        // 原: this.C <= this.a.r + 210944 && this.C >= this.a.r - 30720
                        this.deactivate();                              // 原: this.b()
                        return;
                    }
                }
                return;
            }
            case 17: {
                if (this.delayTimer-- > 0) {                            // 原: this.b-- > 0
                    return;
                }
                switch (actionLow24) {                                  // 原: switch (n)
                    case 0: {
                        if (!this.isAnimationDone()) return;            // 原: !this.d()
                        this.setFrame(1);                               // 原: this.a(1)
                        this.targetVelY = 12288;                        // 原: this.H = 12288
                        return;
                    }
                    case 1: {
                        if (this.intersectsActor(this.screen.player)) { // 原: this.a(this.a.j)
                            this.screen.player.takeDamage(1);           // 原: this.a.j.e(1)
                            this.setFrame(2);                           // 原: this.a(2)
                            this.targetVelY = 0;                        // 原: this.H = 0
                            return;
                        }
                        if (!this.collideGround(this.screen.tileMap)) return; // 原: !this.c(this.a.f)
                        this.setFrame(2);                               // 原: this.a(2)
                        return;
                    }
                    case 2: {
                        if (!this.isAnimationDone()) return;            // 原: !this.d()
                        this.posX = this.homeX;                         // 原: this.C = this.i
                        this.posY = this.homeY;                         // 原: this.D = this.j
                        this.subTimer = this.flashCounter;              // 原: this.d = this.h
                        this.setFrame(3);                               // 原: this.a(3)
                        return;
                    }
                    case 3: {
                        if (this.subTimer-- >= 0) return;               // 原: this.d-- >= 0
                        this.setFrame(0);                               // 原: this.a(0)
                    }
                }
            }
        }
    }

    // 原: public final void a(l l2)  覆写 ActorBase.onProjectileHit
    public final void onProjectileHit(ProjectileActor projectile) {
        if (this.delayTimer > 0 || this.typeId != 8) {                  // 原: this.b > 0 || this.q != 8
            return;
        }
        switch (projectile.typeId) {                                    // 原: l2.q
            case 21: {
                if ((projectile.frameIndex & 0xFFFFFF) != 0) break;     // 原: (l2.t & 0xFFFFFF) != 0
                projectile.setFrame(1);                                 // 原: l2.a(1)
                projectile.targetVelX = 0;                              // 原: l2.G = 0
                projectile.posY += 5120;                                // 原: l2.D += 5120
                if (this.targetVelX != 0) break;                        // 原: this.G != 0
                --this.health;                                          // 原: --this.f
                break;
            }
            case 10: {
                if (this.targetVelX != 0) break;                        // 原: this.G != 0
                --this.health;                                          // 原: --this.f
                break;
            }
            case 15:
            case 20: {
                this.screen.spawnProjectile(16, 0, 0, projectile.posX, projectile.posY, 0);
                // 原: this.a.a(16, 0, 0, l2.C, l2.D, 0)
                projectile.deactivate();                                // 原: l2.b()
                if (this.targetVelX != 0) break;                        // 原: this.G != 0
                this.health -= 3;                                       // 原: this.f -= 3
            }
        }
        if (!this.hitFlashing) {                                        // 原: !this.l
            this.hitFlashing = true;
            this.homeX = this.posX;                                     // 原: this.i = this.C
        }
    }

    // 原: private void f()
    private void spawnDeathBurst() {
        this.posX = this.posX == this.homeX ? this.homeX + 2048 : this.homeX;
        // 原: this.C = this.C == this.i ? this.i + 2048 : this.i
        int loopGuard = 0;                                             // 原: int n = 0
        int burstX = this.posX;                                        // 原: int n2 = this.C
        int burstY = this.posY + 5120;                                 // 原: int n3 = this.D + 5120
        do {
            int offsetX = GameMIDlet.nextRandomMod(36);                // 原: int n4 = GameMIDlet.a(36)
            offsetX = 18 - offsetX;                                    // 原: n4 = 18 - n4
            int offsetY = GameMIDlet.nextRandomMod(20);                // 原: int n5 = GameMIDlet.a(20)
            offsetY = 20 - offsetY;                                    // 原: n5 = 20 - n5
            this.screen.spawnProjectile(16, 0, 0, burstX += offsetX << 10, burstY -= offsetY << 10, 2);
            // 原: this.a.a(16, 0, 0, n2 += n4 << 10, n3 -= n5 << 10, 2)
        } while (loopGuard++ < 1);                                     // 原: while (n++ < 1)
        GameScreen.playSound(5, 1, 220);                               // 原: tjge.a.a(5, 1, 220)
    }

    // 原: public final void a(Graphics graphics, int n, int n2)  覆写 ActorBase.paint
    public final void paint(Graphics graphics, int cameraX, int cameraY) {
        if (this.visible) {                                            // 原: this.n
            super.paint(graphics, cameraX, cameraY);
        }
    }
}
