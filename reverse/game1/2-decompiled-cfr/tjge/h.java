/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.a;
import tjge.d;
import tjge.e;
import tjge.f;
import tjge.g;
import tjge.l;

public final class h
extends g {
    int a;
    int b;
    int c;
    int d;
    int e;
    int f;
    int g;
    int h;
    int i;
    int j;
    int k;
    int l;
    int m;
    int n;
    int o;
    int O;
    int P;
    boolean Q;
    boolean R;
    boolean S;
    boolean T;
    boolean U;
    f V;
    a W;
    e X;

    public h(int n, d d2, a a2) {
        super(n, d2);
        this.W = a2;
    }

    public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl) {
        if (bl) {
            return false;
        }
        super.a(n, n2, n3, byArray, bl);
        this.s = true;
        this.c = this.C;
        this.Q = false;
        this.R = false;
        this.S = false;
        this.b = 0;
        this.a = 0;
        this.P = 0;
        this.V = this.W.j;
        this.U = false;
        this.X = null;
        switch (byArray[3]) {
            case 0: {
                this.f = 40960;
                this.g = -40960;
                break;
            }
            case 1: {
                this.f = 81920;
                this.g = -40960;
                break;
            }
            case 2: {
                this.f = 40960;
                this.g = -81920;
                break;
            }
            case 3: {
                this.f = 81920;
                this.g = -81920;
            }
        }
        switch (this.q) {
            case 1: 
            case 2: {
                this.T = true;
                this.N = this.h = byArray[2];
                this.l = 3;
                break;
            }
            case 18: {
                this.h = 0;
            }
        }
        this.e = byArray[0];
        this.d = byArray[1];
        this.m = this.h + 1;
        this.o = 0;
        if (this.e == 0) {
            this.i = this.c - (this.d << 10);
            this.j = this.c;
            this.k = 0;
            this.a(n | 0);
        } else {
            this.i = this.c;
            this.j = this.c + (this.d << 10);
            this.k = Integer.MIN_VALUE;
            this.a(n | Integer.MIN_VALUE);
        }
        return true;
    }

    public final void a() {
        if (this.W.p == 21) {
            return;
        }
        this.k = this.t & 0xFF000000;
        this.n = this.t & 0xFFFFFF;
        if (this.V.c == 19 && this.o != 4 && this.a(this.V)) {
            this.V.m = 0;
            this.V.G = 0;
            this.V.b = 0;
            this.R = true;
            this.V.C = this.V.C + (this.V.U ? 8192 : -8192);
            this.V.a(0x14 | this.V.d);
            return;
        }
        if (this.R) {
            if (this.V.c == 21 && this.o != 4 && Math.abs(this.C - this.V.C) < 40960) {
                this.G = 0;
                this.m = 0;
                this.o = 9;
                this.R = false;
                if (this.q == 18) {
                    this.s = false;
                    this.a(3 | this.k);
                } else {
                    this.a(7 | this.k);
                }
                tjge.a.a(4, 1, 200);
            } else if (this.V.c != 20) {
                this.R = false;
            }
        }
        switch (this.q) {
            case 1: 
            case 2: {
                if (this.T) {
                    this.f();
                    return;
                }
                this.g();
                return;
            }
            case 18: {
                this.h();
            }
        }
    }

    public final void f() {
        if (this.W.L && this.a-- > 0) {
            return;
        }
        if (this.a(this.V) && this.o != 7 && (this.o != 5 && this.o != 9 && this.o != 4 || this.o == 5 && this.b < this.l) && (this.k != 0 && this.V.C < this.C || this.k == 0 && this.C < this.V.C)) {
            this.k ^= Integer.MIN_VALUE;
            this.a(this.n | this.k);
            this.b = 0;
        }
        if (this.o == 0 || this.o == 3 || this.o == 1) {
            if ((this.k == 0 && this.C > this.V.C && this.C - this.V.C < 30720 || this.k != 0 && this.V.C > this.C && this.V.C - this.C < 30720) && Math.abs(this.V.D - this.D) < 10240 && this.V.c != 23 && this.V.c != 15 && this.V.c != 16 && this.V.c != 20 && this.V.c != 21 && this.V.c != 19) {
                this.O = 1;
                this.G = 0;
                this.b = 0;
                this.o = 5;
                this.S = false;
                this.a(4 | this.k);
                return;
            }
            if (this.V.D < this.D + this.f && this.V.D > this.D + this.g) {
                int n = 143360;
                if (this.k == 0 && this.C > this.V.C && this.C - this.V.C < n || this.k != 0 && this.C < this.V.C && this.V.C - this.C < n) {
                    if (this.S && this.b++ > this.l) {
                        this.o = this.h > 0 && this.Q ? 8 : 5;
                        this.O = 0;
                        this.b = 0;
                        this.G = 0;
                        this.S = false;
                        this.Q = !this.Q;
                    } else if (!this.S) {
                        this.b = 0;
                        this.G = 0;
                        this.o = 0;
                        this.S = true;
                        if (this.h > 0 && this.Q) {
                            this.a(8 | this.k);
                        } else if (this.q == 2) {
                            this.a(0 | this.k);
                        } else {
                            this.a(2 | this.k);
                        }
                    }
                } else {
                    this.S = false;
                }
            } else {
                this.S = false;
            }
        }
        switch (this.o) {
            case 0: {
                if (this.S) break;
                this.b = 0;
                if (!this.d()) break;
                if (this.d > 0) {
                    if (this.k == 0 && this.C > this.i || this.k != 0 && this.C < this.j) {
                        this.G = this.k == 0 ? -3072 : 3072;
                        this.a(1 | this.k);
                    } else {
                        this.G = 0;
                        this.a(0 | this.k);
                    }
                    this.o = 3;
                    return;
                }
                this.a(0 | this.k);
                return;
            }
            case 1: {
                if (++this.b == 10) {
                    this.k = this.k == 0 ? Integer.MIN_VALUE : 0;
                    this.a(this.n | this.k);
                    return;
                }
                if (this.b < 20) break;
                this.b = 0;
                this.o = 3;
                this.G = this.k == 0 ? -3072 : 3072;
                this.a(1 | this.k);
                return;
            }
            case 11: {
                if (this.d()) {
                    if (this.n == 3) {
                        this.a(2 | this.k);
                    } else if (this.n == 9) {
                        this.a(8 | this.k);
                    }
                }
                if (this.b++ <= 4) break;
                this.b = 0;
                this.o = 0;
                return;
            }
            case 3: {
                if ((this.k != 0 || this.C >= this.i) && (this.k == 0 || this.C <= this.j)) break;
                this.G = 0;
                this.b = 0;
                this.o = 1;
                if (this.q == 2) {
                    this.a(0 | this.k);
                    return;
                }
                this.a(2 | this.k);
                return;
            }
            case 5: 
            case 8: {
                switch (this.O) {
                    case 0: {
                        switch (this.q) {
                            case 2: {
                                if (this.o == 8) {
                                    this.a(8 | this.k);
                                    if (this.b++ > 10) {
                                        this.b = 0;
                                        this.o = 0;
                                    }
                                    return;
                                }
                                if (this.n == 2) {
                                    if (this.d()) {
                                        this.a(3 | this.k);
                                    }
                                    return;
                                }
                                if (this.n == 3) {
                                    this.o = 0;
                                    this.a(0 | this.k);
                                    return;
                                }
                                this.i();
                                break;
                            }
                            case 1: {
                                if (this.o == 8 && this.h == 1) {
                                    if (this.b++ > 10) {
                                        this.b = 0;
                                        this.o = 0;
                                    }
                                    return;
                                }
                                l l2 = this.b(this.o == 5 ? 32 : 14);
                                if (l2 == null) break;
                                if (this.o == 5) {
                                    this.a(3 | this.k);
                                } else {
                                    this.a(9 | this.k);
                                }
                                if (l2.a(this.k == 0)) {
                                    l2.a(1);
                                } else {
                                    l2.G = l2.G + (this.k == 0 ? -12288 : 12288);
                                }
                                this.o = 11;
                                this.l = this.h > 0 ? 12 : 15;
                            }
                        }
                        break;
                    }
                    case 1: {
                        if (!this.d()) break;
                        this.V.e(1);
                        if (this.C <= this.V.C && !this.V.b(this.W.f, 100) || this.C >= this.V.C && !this.V.a(this.W.f, 100)) {
                            this.V.C = this.V.C + (this.C >= this.V.C ? -8192 : 8192);
                        }
                        this.o = 0;
                        this.a(0 | this.k);
                    }
                }
                return;
            }
            case 9: {
                if (this.b++ <= 1) break;
                this.b = 0;
                if (this.m <= 0) {
                    this.o = 4;
                    this.s = false;
                    if (!this.U) {
                        this.W.g.k[this.B] = true;
                    }
                    this.a(5 | this.k);
                    return;
                }
                this.o = 0;
                this.S = false;
                this.k = this.C < this.V.C ? Integer.MIN_VALUE : 0;
                this.a(0 | this.k);
                return;
            }
            case 4: {
                if (this.n == 5) {
                    if (this.b++ <= 1) break;
                    this.P = 15;
                    this.a(6 | this.k);
                    return;
                }
                if (this.n != 6 || this.P != 0) break;
                this.b();
                ++this.W.C;
                if (!this.U) break;
                --this.W.z;
                return;
            }
            case 7: {
                if (this.e == 0 && this.C <= this.j || this.e != 0 && this.C >= this.i) {
                    this.G = 0;
                    this.o = 0;
                    return;
                }
                this.G = this.e == 0 ? -4096 : 4096;
            }
        }
    }

    public final void g() {
        if (this.X != null && this.X.p) {
            this.X.C = this.C;
            this.X.D = this.D - 30720;
        }
        if (this.o == 0) {
            if (this.k == 0 && this.C < this.V.C) {
                this.k = Integer.MIN_VALUE;
                this.a(this.n | Integer.MIN_VALUE);
            } else if (this.k != 0 && this.C > this.V.C) {
                this.k = 0;
                this.a(this.n | 0);
            }
            if (this.D < this.V.D && this.H > 0) {
                if (this.a++ % 60 == 0 && this.C > this.W.r + 61440 && this.C < this.W.r + tjge.a.c - 61440) {
                    int n = this.G = GameMIDlet.a(1) == 1 ? 9216 : 7168;
                }
                if (this.C < this.W.r + 40960) {
                    this.G = 9216;
                } else if (this.C > this.W.r + tjge.a.c - 40960) {
                    this.G = 7168;
                }
            }
            if ((this.q == 2 && this.D > this.W.s + 40960 || this.q == 1 && this.D >= this.V.D - 30720) && Math.abs(this.C - this.V.C) > 40960 && this.b++ > this.l) {
                this.b = 0;
                this.o = 5;
            }
        }
        if (this.C < this.W.r || this.C > this.W.r + tjge.a.c) {
            this.b();
            this.j();
            ++this.W.C;
            --this.W.z;
            return;
        }
        if (this.D >= this.V.D + 25600 && this.H > 0) {
            this.H = 0;
            this.G = 0;
            this.j();
            if (this.o == 9) {
                this.a(5 | this.k);
                this.o = 4;
                return;
            }
            this.a(0 | this.k);
            return;
        }
        if (this.o != 4 && this.o != 9 && this.a(this.V.aa)) {
            this.o = 9;
            this.G = 0;
            this.b = 0;
            this.H = 10240;
            this.m = 0;
            this.a(7 | this.k);
        }
        switch (this.o) {
            case 0: {
                if (!this.d()) break;
                this.a(0 | this.k);
                return;
            }
            case 5: {
                switch (this.q) {
                    case 2: {
                        if (this.n == 2) {
                            if (this.d()) {
                                this.a(3 | this.k);
                            }
                            return;
                        }
                        if (this.n == 3) {
                            this.o = 0;
                            this.a(0 | this.k);
                            return;
                        }
                        this.i();
                        break;
                    }
                    case 1: {
                        l l2 = this.b(28);
                        if (l2 == null) break;
                        this.o = 0;
                        l2.G = l2.G + (this.k == 0 ? -12288 : 12288);
                        this.a(3 | this.k);
                        this.l = 12;
                    }
                }
                return;
            }
            case 9: {
                this.j();
                if (this.H <= 0 || this.H >= 12288) break;
                this.H = 12288;
                return;
            }
            case 4: {
                if (this.n != 5 || this.b++ <= 1) break;
                this.a(6 | this.k);
            }
        }
    }

    private final void i() {
        l l2 = this.W.a(20, 0, 0, this.C, this.D - 30720, 1);
        if (l2 != null) {
            this.b = 0;
            l2.b(this.k != 0 ? 1 : 0);
            this.a(2 | this.k);
            this.l = this.h > 0 ? 12 : 15;
        }
    }

    private final l b(int n) {
        int n2 = 29696;
        if (this.k == 0) {
            n2 = -29696;
        }
        return this.W.a(21, 0 | (this.k == 0 ? Integer.MIN_VALUE : 0), 0, this.C + n2, this.D - (n << 10), 1);
    }

    private final void j() {
        if (this.X != null) {
            this.X.b();
        }
    }

    public final void h() {
        if ((this.o == 0 || this.o == 1 || this.o == 3) && Math.abs(this.C - this.V.C) < 131072) {
            if (this.V.D < this.D + 61440 && this.V.D > this.D - 10240 && Math.abs(this.C - this.V.C) < 81920) {
                this.G = 4096;
                this.o = 6;
                this.k = Integer.MIN_VALUE;
                this.a(1 | Integer.MIN_VALUE);
            } else if (this.W.L && this.W.z <= 0 && this.C < this.W.r + tjge.a.c - 40960) {
                this.G = 0;
                this.o = 5;
                this.k = 0;
                this.a(2);
            }
        }
        switch (this.o) {
            case 0: {
                if (this.d()) {
                    this.a(0 | this.k);
                }
                if (this.b++ <= 10) break;
                this.b = 0;
                this.o = 3;
                this.G = this.k == 0 ? -2560 : 2560;
                this.a(1 | this.k);
                return;
            }
            case 1: {
                if (this.b++ <= 20) break;
                this.b = 0;
                this.o = 3;
                this.k = this.k == 0 ? Integer.MIN_VALUE : 0;
                this.G = this.k == 0 ? -2560 : 2560;
                this.a(1 | this.k);
                return;
            }
            case 3: {
                if ((this.k != 0 || this.C >= this.i) && (this.k == 0 || this.C <= this.j)) break;
                this.G = 0;
                this.o = 1;
                this.a(0 | this.k);
                return;
            }
            case 5: {
                if (!this.d()) break;
                this.o = 0;
                int n = 327680;
                this.W.b(1, 3, this.W.r + tjge.a.c, n, 1, 1);
                return;
            }
            case 6: {
                if (this.C <= this.W.r + tjge.a.c + 20480) break;
                this.G = 0;
                this.k = 0;
                this.o = 10;
                this.a(0 | this.k);
                return;
            }
            case 10: {
                if (this.V.D - this.D <= 71680) break;
                this.o = 0;
                this.b = 11;
                return;
            }
            case 4: 
            case 9: {
                if (this.n == 3 && this.b++ > 2) {
                    if ((this.V.a & 1) == 0) break;
                    this.P = 10;
                    this.a(4 | this.k);
                    this.W.p = 19;
                    return;
                }
                if (this.n != 4 || this.P != 0) break;
                this.b();
            }
        }
    }

    public final void a(l l2) {
        if (l2.d == 1 || this.o == 4 || this.o == 9 || this.o == 10) {
            return;
        }
        boolean bl = false;
        switch (l2.q) {
            case 21: {
                if ((l2.t & 0xFFFFFF) != 0) break;
                l2.b();
                --this.m;
                bl = true;
                break;
            }
            case 10: 
            case 16: {
                this.m = 0;
                bl = true;
                break;
            }
            case 15: 
            case 20: {
                int n = l2.G > 0 ? 8192 : -8192;
                this.W.a(16, 0, 0, l2.C + n, l2.D + 8192, 0);
                l2.b();
                tjge.a.a(5, 1, 220);
            }
        }
        if (bl) {
            this.b = 0;
            this.G = 0;
            this.o = 9;
            if (this.q == 18) {
                this.s = false;
                this.a(3 | this.k);
            } else {
                this.a(7 | this.k);
            }
        }
        if (this.m <= 0) {
            tjge.a.a(4, 1, 200);
        }
    }

    public final void a(Graphics graphics, int n, int n2) {
        if (this.P == 0 || --this.P > 0 && (this.P & 1) != 0) {
            super.a(graphics, n, n2);
        }
    }
}

