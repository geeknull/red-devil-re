/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.d;
import tjge.h;
import tjge.j;

public final class e
extends h {
    int a;
    int b;
    int c;
    int d;
    int e;

    public e(int n, d d2) {
        super(n, d2);
    }

    public final boolean a(byte[] byArray) {
        if (!super.a(byArray)) {
            return false;
        }
        switch (this.h) {
            case 15: {
                int n = byArray[7] & 0xFF;
                this.a = this.b = this.u;
                if (this.H == 0) {
                    this.b = this.u + (n << 10);
                } else {
                    this.a = this.u - (n << 10);
                }
                this.c = this.v - 10240;
                this.d = this.v + 10240;
                this.e = 10;
                break;
            }
            case 7: {
                this.e = byArray[7];
            }
        }
        return true;
    }

    public final void b() {
        switch (this.h) {
            case 15: {
                int n = this.H == 0 ? 1 : -1;
                this.y = 1024 * n;
                if (n > 0 && this.u > this.b || n < 0 && this.u < this.a) {
                    this.y = 0;
                    this.H ^= Integer.MIN_VALUE;
                    this.a(0 | this.H);
                }
                if (this.v > this.d) {
                    this.z = -1024;
                } else if (this.v < this.c) {
                    this.z = 1024;
                }
                if (this.e-- >= 0) break;
                int n2 = GameMIDlet.a(2);
                this.e = 1 + n2;
                this.z = n2 > 0 ? -1024 : 1024;
                return;
            }
            case 18: {
                if (this.l != 1 || !this.h()) break;
                this.e();
                return;
            }
            case 7: {
                if (this.J > 0) {
                    if (this.J != 1) break;
                    this.f();
                    return;
                }
                if (this.L.y.T <= 0 || !this.b(this.L.y)) break;
                this.J = 10;
                this.L.y.a(this);
                return;
            }
            case 20: {
                if (!this.h()) break;
                this.e();
                return;
            }
            case 14: {
                if (!this.L.z.J) break;
                this.y = -6144;
                if (this.u >= this.L.m - 40960) break;
                this.u = this.L.m + this.L.q + 40960;
                return;
            }
            case 6: {
                if (this.L.y.u > this.u && this.H == 0) {
                    this.a(Integer.MIN_VALUE);
                    return;
                }
                if (this.L.y.u >= this.u || this.H == 0) break;
                this.a(0);
            }
        }
    }

    public final void c(int n) {
        if (n == 0) {
            this.u = this.L.y.u;
            this.v = this.L.y.v - 12288;
            return;
        }
        if (n == 1) {
            this.a(1 | this.H);
        }
    }

    public final void a(Graphics graphics, int n, int n2) {
        super.a(graphics, n, n2);
        if (this.J > 0 && this.h == 7) {
            int n3 = this.u - this.L.m >> 10;
            int n4 = (this.v - this.L.n >> 10) + this.r;
            tjge.j.a(graphics, n3, n4 - (40 - 4 * this.J), this.e, true, false);
        }
    }
}

