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
import tjge.e;
import tjge.f;
import tjge.g;

public final class l
extends g {
    a a;
    int b;
    int c;
    int d;
    int e;
    int f;
    int g;
    int h;

    public l(int n, d d2, a a2) {
        super(n, d2);
        this.a = a2;
    }

    public final void a() {
        int n = 0;
        while (n < this.a.v) {
            if (this.a(this.a.k[n])) {
                this.a.k[n].a(this);
            }
            ++n;
        }
        if (!this.p) {
            return;
        }
        int n2 = this.t & 0xFFFFFF;
        f f2 = this.a.j;
        switch (this.q) {
            case 15: 
            case 21: {
                switch (n2) {
                    case 0: {
                        if (this.a.x != 4) {
                            if (this.a(this.a.f) || this.b(this.a.f)) {
                                if (this.q == 21) {
                                    this.C += this.E;
                                    this.a(1);
                                } else {
                                    this.a.a(16, 0, 0, this.C, this.D, this.d);
                                    this.b();
                                    tjge.a.a(5, 1, 220);
                                }
                            } else if (this.G > 0 && this.C - this.c > 204800 || this.G < 0 && this.c - this.C > 204800) {
                                this.b();
                            }
                        }
                        if (this.C >= this.a.r && this.C <= this.a.r + tjge.a.c) break;
                        this.b();
                        break;
                    }
                    case 1: {
                        if (!this.d()) break;
                        this.b();
                    }
                }
                return;
            }
            case 10: {
                if (this.d == 2) {
                    if (this.f-- > 0) {
                        return;
                    }
                    if (this.a(this.a.j)) {
                        this.a.j.e(2);
                    }
                }
                switch (n2) {
                    case 1: {
                        if (this.b-- >= 0) break;
                        if (this.h == 1) {
                            this.a(Integer.MIN_VALUE);
                            break;
                        }
                        this.a(0);
                        break;
                    }
                    case 0: {
                        if (!this.d()) break;
                        if (this.d == 2) {
                            this.b = this.g;
                            this.a(1);
                            break;
                        }
                        this.b();
                    }
                }
                return;
            }
            case 20: {
                if (this.d == 1 && --this.e < 0) {
                    int n3 = this.G = this.a.x == 4 ? this.a.t : 0;
                }
                if (this.a.x != 4 && (this.c(this.a.f) || this.a(this.a.f) || this.b(this.a.f)) || this.a.x == 4 && this.D >= f2.D + 30720) {
                    this.a.a(16, 0, 0, this.C, this.D, this.d);
                    this.b();
                    tjge.a.a(5, 1, 220);
                    return;
                }
                ++this.b;
                return;
            }
            case 16: {
                if (!this.d()) break;
                this.b();
            }
        }
    }

    public final void a(Graphics graphics, int n, int n2) {
        if (this.q == 20 && this.b < 2) {
            return;
        }
        super.a(graphics, n, n2);
    }

    public final void f() {
        int n = 0;
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int n5 = 0;
        while (n5 < this.a.v) {
            if (this.d(this.a.k[n5].q) && (n4 > (n2 = Math.abs(this.D - this.a.k[n5].D + 15360)) || n4 == 0)) {
                n4 = n2;
                n3 = this.a.k[n5].D - 20480;
                n = Math.abs(this.C - this.a.k[n5].C);
            }
            ++n5;
        }
        this.G += this.a.j.d == 0 ? 12288 : -12288;
        if (n4 == 0 || this.D > n3 - 10240 && this.D < n3 + 10240) {
            this.H = 0;
            return;
        }
        n2 = Math.abs(this.G);
        if ((n /= n2) <= 0) {
            n = 1;
        }
        this.H = this.D > n3 ? -n4 : (n4 /= n);
    }

    public final boolean a(boolean bl) {
        e e2;
        int n = 0;
        while (n < this.a.v) {
            if (this.c(this.a.k[n].q) && this.a(e2 = (e)this.a.k[n])) {
                e2.a(this);
                return true;
            }
            ++n;
        }
        e2 = null;
        int n2 = this.C >> 14;
        int n3 = bl ? n2 + 1 : n2 - 1;
        int n4 = this.D >> 10;
        int n5 = n4 + this.z + 1 >> 4;
        int n6 = n4 + this.A - 2 >> 4;
        int n7 = n5;
        while (n7 <= n6) {
            if (this.a.f.a(n2, n7, false) == 1 || this.a.f.a(n3, n7, false) == 1) {
                return true;
            }
            ++n7;
        }
        return false;
    }

    public final void b(int n) {
        int n2 = 0;
        int n3 = Math.abs(this.a.j.C - this.C);
        if (n3 < 40960) {
            n3 = 40960;
        }
        int n4 = n3 / 5120;
        int n5 = n4 >>> 1;
        int n6 = 0;
        int n7 = 0;
        while (n7 < n5) {
            n6 += n7;
            ++n7;
        }
        n3 = (n3 >>> 2) * 3;
        n6 = (n3 >>> 1) / n6;
        n2 = (n5 - 1) * n6;
        this.G += n == 0 ? -5120 : 5120;
        if (n2 > 15360) {
            n2 = 15360;
        }
        this.H = -n2;
        this.J = n6;
        this.L = n2;
        this.e = n4;
    }

    private boolean c(int n) {
        return n == 7 || n == 9;
    }

    private boolean d(int n) {
        return n == 2 || n == 1;
    }

    public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl) {
        if (bl) {
            return false;
        }
        super.a(n, n2, n3, byArray, bl);
        if (this.q == 10) {
            this.f = byArray[0];
            this.g = byArray[1];
            this.h = byArray[2];
            this.b = -1;
            this.s = false;
            this.d = 2;
            this.M = this.h == 2 ? 270 : 0;
            this.a(1);
        }
        return true;
    }
}

