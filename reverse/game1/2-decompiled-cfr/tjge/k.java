/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.a;
import tjge.d;
import tjge.g;

public final class k
extends g {
    a a;
    int b;
    int c;
    int d;
    boolean e;

    public k(int n, d d2, a a2) {
        super(n, d2);
        this.a = a2;
    }

    public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl) {
        if (bl) {
            return false;
        }
        super.a(n, n2, n3, byArray, bl);
        this.c = 0;
        this.e = false;
        switch (this.q) {
            case 3: {
                this.b = byArray[0];
                this.a(this.b);
                this.d = this.b == 0 ? 6 : 3;
                break;
            }
            case 11: {
                this.d = byArray[0];
                this.a(this.b);
            }
        }
        return true;
    }

    public final void a() {
        if (this.c > 0) {
            this.H = 0;
            return;
        }
        if (this.e) {
            this.b();
            return;
        }
        switch (this.q) {
            case 3: {
                if (!this.a(this.a.j)) break;
                tjge.a.a(1, 1, 255);
                switch (this.b) {
                    case 0: 
                    case 3: {
                        this.a.j.h += 6;
                        break;
                    }
                    case 2: 
                    case 5: {
                        this.a.j.i += 3;
                        break;
                    }
                    case 1: 
                    case 4: {
                        this.a.j.j = 3;
                    }
                }
                this.c = 10;
                this.e = true;
                this.a.g.k[this.B] = true;
                return;
            }
            case 11: {
                if (!this.a(this.a.j) || this.a.j.e <= 0) break;
                tjge.a.a(1, 1, 255);
                this.a.j.e += this.d;
                if (this.a.j.e > 10) {
                    this.a.j.e = 10;
                }
                this.c = 10;
                this.e = true;
                this.a.g.k[this.B] = true;
                return;
            }
            case 13: {
                if (this.a(this.a.j)) {
                    this.a.E = true;
                }
                if (!this.a.E || this.e || (this.a.j.a & 1) == 0) break;
                this.e = true;
                this.c = 10;
                this.a.g.k[this.B] = true;
                this.a.j.G = 0;
                this.a.t = 0;
                this.a.p = 21;
                this.a.L = false;
                this.a.j.a(0 | this.a.j.d);
                tjge.a.a(1, 1, 255);
            }
        }
    }

    public final void a(Graphics graphics, int n, int n2) {
        if (this.c == 0 || --this.c > 0 && (this.c & 1) != 0) {
            super.a(graphics, n, n2);
        }
        if (this.c > 0 && (this.q == 3 || this.q == 11)) {
            int n3 = this.C - this.a.r >> 10;
            int n4 = this.D - this.a.s - 20480 >> 10;
            this.a.a(graphics, this.d, n3, n4 - (30 - 3 * this.c), false, true);
        }
    }
}

