// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/k.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 *
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameScreen;   // 原始: tjge.a
import tjge.SpriteDef;    // 原始: tjge.d
import tjge.ActorBase;    // 原始: tjge.g

public final class PickupActor       // 原始类名: k
extends ActorBase {                  // 原始: extends g
    GameScreen screen;               // 原始字段 a
    int subType;                     // 原始字段 b
    int pickupFlashTimer;            // 原始字段 c
    int riseEffectTile;              // 原始字段 d
    boolean pickedUp;                // 原始字段 e

    // 原始: public k(int n, d d2, a a2)
    public PickupActor(int typeId, SpriteDef spriteDef, GameScreen ownerScreen) {
        super(typeId, spriteDef);
        this.screen = ownerScreen;
    }

    // 原始: public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl)  -> spawn
    public final boolean spawn(int frameIndex, int tileX, int tileY, byte[] params, boolean flag) {
        if (flag) {
            return false;
        }
        super.spawnAt(frameIndex, tileX, tileY, params, flag);   // 原始: super.a(...)
        this.pickupFlashTimer = 0;
        this.pickedUp = false;
        switch (this.typeId) {       // 原始: this.q
            case 3: {
                this.subType = params[0];
                this.setFrame(this.subType);                     // 原始: this.a(this.b)
                this.riseEffectTile = this.subType == 0 ? 6 : 3;
                break;
            }
            case 11: {
                this.riseEffectTile = params[0];
                this.setFrame(this.subType);                     // 原始: this.a(this.b)
            }
        }
        return true;
    }

    // 原始: public final void a()  -> update
    public final void update() {
        if (this.pickupFlashTimer > 0) {
            this.targetVelY = 0;     // 原始: this.H
            return;
        }
        if (this.pickedUp) {
            this.deactivate();       // 原始: this.b()
            return;
        }
        switch (this.typeId) {       // 原始: this.q
            case 3: {
                if (!this.intersectsActor(this.screen.player)) break;   // 原始: this.a(this.a.j)
                GameScreen.playSound(1, 1, 255);                        // 原始: tjge.a.a(1, 1, 255)
                switch (this.subType) {                                 // 原始: this.b
                    case 0:
                    case 3: {
                        this.screen.player.ammoReserveB += 6;           // 原始: this.a.j.h
                        break;
                    }
                    case 2:
                    case 5: {
                        this.screen.player.ammoReserveC += 3;           // 原始: this.a.j.i
                        break;
                    }
                    case 1:
                    case 4: {
                        this.screen.player.grenadeCount = 3;            // 原始: this.a.j.j
                    }
                }
                this.pickupFlashTimer = 10;
                this.pickedUp = true;
                this.screen.levelLoader.actorSpawned[this.extra] = true;   // 原始: this.a.g.k[this.B]
                return;
            }
            case 11: {
                if (!this.intersectsActor(this.screen.player) || this.screen.player.health <= 0) break;   // 原始: this.a(this.a.j) || this.a.j.e
                GameScreen.playSound(1, 1, 255);                        // 原始: tjge.a.a(1, 1, 255)
                this.screen.player.health += this.riseEffectTile;       // 原始: this.a.j.e += this.d
                if (this.screen.player.health > 10) {                   // 原始: this.a.j.e
                    this.screen.player.health = 10;                     // 原始: this.a.j.e
                }
                this.pickupFlashTimer = 10;
                this.pickedUp = true;
                this.screen.levelLoader.actorSpawned[this.extra] = true;   // 原始: this.a.g.k[this.B]
                return;
            }
            case 13: {
                if (this.intersectsActor(this.screen.player)) {         // 原始: this.a(this.a.j)
                    this.screen.flagE = true;                           // 原始: this.a.E
                }
                if (!this.screen.flagE || this.pickedUp || (this.screen.player.stateFlags & 1) == 0) break;   // 原始: this.a.E || this.e || (this.a.j.a & 1)
                this.pickedUp = true;
                this.pickupFlashTimer = 10;
                this.screen.levelLoader.actorSpawned[this.extra] = true;   // 原始: this.a.g.k[this.B]
                this.screen.player.inputHoldCount = 0;                  // 原始: this.a.j.G
                this.screen.cameraVelX = 0;                             // 原始: this.a.t
                this.screen.state = 21;                                 // 原始: this.a.p
                this.screen.scriptFlagL = false;                        // 原始: this.a.L
                this.screen.player.setFrame(0 | this.screen.player.facingFlag);   // 原始: this.a.j.a(0 | this.a.j.d)
                GameScreen.playSound(1, 1, 255);                        // 原始: tjge.a.a(1, 1, 255)
            }
        }
    }

    // 原始: public final void a(Graphics graphics, int n, int n2)  -> paint
    public final void paint(Graphics graphics, int cameraX, int cameraY) {
        if (this.pickupFlashTimer == 0 || --this.pickupFlashTimer > 0 && (this.pickupFlashTimer & 1) != 0) {
            super.paint(graphics, cameraX, cameraY);                // 原始: super.a(graphics, n, n2)
        }
        if (this.pickupFlashTimer > 0 && (this.typeId == 3 || this.typeId == 11)) {   // 原始: this.c, this.q
            int screenX = this.posX - this.screen.cameraX >> 10;    // 原始: this.C - this.a.r
            int screenY = this.posY - this.screen.cameraY - 20480 >> 10;   // 原始: this.D - this.a.s - 20480
            this.screen.drawNumber(graphics, this.riseEffectTile, screenX, screenY - (30 - 3 * this.pickupFlashTimer), false, true);   // 原始: this.a.a(graphics, this.d, n3, n4 - (30 - 3 * this.c), false, true)
        }
    }
}
