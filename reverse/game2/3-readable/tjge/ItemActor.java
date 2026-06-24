// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/e.java
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
import tjge.SpriteDef;   // 原 tjge.d
import tjge.ActorBase;   // 原 tjge.h
import tjge.LevelScene;  // 原 tjge.j

public final class ItemActor
extends ActorBase {
    int patrolMinX;   // 原字段 a
    int patrolMaxX;   // 原字段 b
    int patrolMinY;   // 原字段 c
    int patrolMaxY;   // 原字段 d
    int counter;      // 原字段 e

    public ItemActor(int typeId, SpriteDef spriteDef) {
        super(typeId, spriteDef);
    }

    // 原 e.a([B)Z -> spawnFromBytes
    public final boolean spawnFromBytes(byte[] byArray) {
        if (!super.spawnFromBytes(byArray)) {   // 原 super.a(byArray)
            return false;
        }
        switch (this.typeId) {   // 原 this.h
            case 15: {
                int span = byArray[7] & 0xFF;
                this.patrolMinX = this.patrolMaxX = this.posX;   // 原 this.a = this.b = this.u
                if (this.actionHighByte == 0) {   // 原 this.H
                    this.patrolMaxX = this.posX + (span << 10);
                } else {
                    this.patrolMinX = this.posX - (span << 10);
                }
                this.patrolMinY = this.posY - 10240;   // 原 this.c = this.v - 10240
                this.patrolMaxY = this.posY + 10240;   // 原 this.d = this.v + 10240
                this.counter = 10;
                break;
            }
            case 7: {
                this.counter = byArray[7];
            }
        }
        return true;
    }

    // 原 e.b()V -> tick
    public final void tick() {
        switch (this.typeId) {   // 原 this.h
            case 15: {
                int dir = this.actionHighByte == 0 ? 1 : -1;
                this.targetVelX = 1024 * dir;   // 原 this.y = 1024 * n
                if (dir > 0 && this.posX > this.patrolMaxX || dir < 0 && this.posX < this.patrolMinX) {
                    this.targetVelX = 0;
                    this.actionHighByte ^= Integer.MIN_VALUE;   // 原 this.H ^= Integer.MIN_VALUE
                    this.setAction(0 | this.actionHighByte);    // 原 this.a(0 | this.H)
                }
                if (this.posY > this.patrolMaxY) {
                    this.targetVelY = -1024;   // 原 this.z = -1024
                } else if (this.posY < this.patrolMinY) {
                    this.targetVelY = 1024;
                }
                if (this.counter-- >= 0) break;
                int rnd = GameMIDlet.randomBelow(2);   // 原 GameMIDlet.a(2)
                this.counter = 1 + rnd;
                this.targetVelY = rnd > 0 ? -1024 : 1024;
                return;
            }
            case 18: {
                if (this.frameGroupIndex != 1 || !this.isAnimationDone()) break;   // 原 this.l != 1 || !this.h()
                this.kill();   // 原 this.e()
                return;
            }
            case 7: {
                if (this.hitFlashTimer > 0) {   // 原 this.J
                    if (this.hitFlashTimer != 1) break;
                    this.killAndMarkSpawned();   // 原 this.f()
                    return;
                }
                // 原 this.L.y.T  ->  canvas.player.health ；原 this.b(this.L.y) -> collidesWith
                if (this.canvas.player.health <= 0 || !this.collidesWith(this.canvas.player)) break;
                this.hitFlashTimer = 10;   // 原 this.J = 10
                this.canvas.player.applyPickup(this);   // 原 this.L.y.a(this)
                return;
            }
            case 20: {
                if (!this.isAnimationDone()) break;   // 原 !this.h()
                this.kill();   // 原 this.e()
                return;
            }
            case 14: {
                if (!this.canvas.scene.isVerticalScrollLevel) break;   // 原 !this.L.z.J
                this.targetVelX = -6144;   // 原 this.y = -6144
                // 原 this.u >= this.L.m - 40960
                if (this.posX >= this.canvas.cameraX - 40960) break;
                // 原 this.u = this.L.m + this.L.q + 40960
                this.posX = this.canvas.cameraX + this.canvas.viewportWidth + 40960;
                return;
            }
            case 6: {
                // 原 this.L.y.u > this.u && this.H == 0
                if (this.canvas.player.posX > this.posX && this.actionHighByte == 0) {
                    this.setAction(Integer.MIN_VALUE);   // 原 this.a(Integer.MIN_VALUE)
                    return;
                }
                // 原 this.L.y.u >= this.u || this.H == 0
                if (this.canvas.player.posX >= this.posX || this.actionHighByte == 0) break;
                this.setAction(0);   // 原 this.a(0)
            }
        }
    }

    // 原 e.c(I)V -> applyCommand
    public final void applyCommand(int command) {
        if (command == 0) {
            this.posX = this.canvas.player.posX;        // 原 this.u = this.L.y.u
            this.posY = this.canvas.player.posY - 12288; // 原 this.v = this.L.y.v - 12288
            return;
        }
        if (command == 1) {
            this.setAction(1 | this.actionHighByte);   // 原 this.a(1 | this.H)
        }
    }

    // 原 e.a(Graphics,II)V -> paint
    public final void paint(Graphics graphics, int n, int n2) {
        super.paint(graphics, n, n2);   // 原 super.a(graphics, n, n2)
        if (this.hitFlashTimer > 0 && this.typeId == 7) {   // 原 this.J > 0 && this.h == 7
            int screenX = this.posX - this.canvas.cameraX >> 10;            // 原 this.u - this.L.m >> 10
            int screenY = (this.posY - this.canvas.cameraY >> 10) + this.boxTop; // 原 (this.v - this.L.n >> 10) + this.r
            // 原 tjge.j.a(graphics, n3, n4 - (40 - 4 * this.J), this.e, true, false)
            LevelScene.drawNumber(graphics, screenX, screenY - (40 - 4 * this.hitFlashTimer), this.counter, true, false);
        }
    }
}
