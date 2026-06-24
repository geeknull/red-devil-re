/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.a;
import tjge.b;
import tjge.c;
import tjge.d;
import tjge.e;
import tjge.g;
import tjge.l;

public final class f
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
    int Q;
    int R;
    int S;
    int T;
    boolean U;
    boolean V;
    boolean W;
    boolean X;
    boolean Y;
    e Z;
    c aa;
    a ab;

    public f(int n, d d2, a a2) {
        super(n, d2);
        this.ab = a2;
    }

    public final boolean c(b b2) {
        if (this.F < 0) {
            return false;
        }
        boolean bl = false;
        boolean bl2 = false;
        int n = this.D + this.F >> 14;
        int n2 = (this.C + this.E >> 10) + -5 >> 4;
        int n3 = (this.C + this.E >> 10) + 5 >> 4;
        boolean bl3 = false;
        boolean bl4 = false;
        if (b2.a(n2, n, true) == 1) {
            bl3 = true;
        }
        if (b2.a(n3, n, true) == 1) {
            bl4 = true;
        }
        if (bl3 && bl4) {
            this.H = 0;
            this.D &= 0xFFFFFC00;
            this.F = (n << 14) - this.D;
            return true;
        }
        if (this.d != 0 && (bl3 || bl4)) {
            if (bl3 && !bl4) {
                int n4 = (n2 << 4) + 16 - ((this.C + this.E >> 10) + -5);
                this.G = 0;
                if (n4 > 6 || n4 >= 4 && (this.c == 4 || this.c == 3)) {
                    this.H = 0;
                    this.E = ((n2 << 4) + 7 << 10) - this.C;
                    this.F = (n << 14) - this.D;
                    return true;
                }
                this.E = ((n2 << 4) + 25 << 10) - this.C;
            } else if (!bl3 && bl4 && (this.a & 1) == 0) {
                int n5 = (n3 << 4) - ((this.C + this.E >> 10) + -5);
                this.G = 0;
                if (n5 < 7) {
                    this.H = 0;
                    this.E = ((n3 << 4) + 7 << 10) - this.C;
                    this.F = (n << 14) - this.D;
                    return true;
                }
                this.E = ((n3 << 4) - 9 << 10) - this.C;
            } else if (!bl3 && bl4) {
                this.F = 2048;
            }
        } else if (this.d == 0 && (bl4 || bl3)) {
            if (bl4 && !bl3) {
                int n6 = (this.C + this.E >> 10) + 5 - (n3 << 4);
                this.G = 0;
                if (n6 > 6 || n6 >= 4 && (this.c == 4 || this.c == 3)) {
                    this.H = 0;
                    this.E = ((n3 << 4) + 7 << 10) - this.C;
                    this.F = (n << 14) - this.D;
                    return true;
                }
                this.E = ((n3 << 4) - 9 << 10) - this.C;
            } else if (!bl4 && bl3 && (this.a & 1) == 0) {
                int n7 = (this.C + this.E >> 10) + 5 - (n3 << 4);
                this.G = 0;
                if (n7 < 7) {
                    this.H = 0;
                    this.E = ((n2 << 4) + 9 << 10) - this.C;
                    this.F = (n << 14) - this.D;
                    return true;
                }
                this.E = ((n2 << 4) + 25 << 10) - this.C;
            } else if (!bl4 && bl3) {
                this.F = 2048;
            }
        }
        this.J = 4096;
        return false;
    }

    public final boolean e(b b2) {
        if (this.F < 0) {
            return false;
        }
        int n = this.C + this.E >> 14;
        int n2 = this.D - 10240 >> 14;
        int n3 = 0;
        while (n3 < 3) {
            if (b2.a(n, n2 + n3, true) == 1) {
                return true;
            }
            ++n3;
        }
        return false;
    }

    public final boolean f(b b2) {
        int n = this.U ? this.C - 2048 : this.C + 2048;
        int n2 = (this.D >> 10) - 34 >> 4;
        return b2.a(n >>= 14, n2, true) == 1;
    }

    public final boolean a(b b2, boolean bl) {
        int n = bl ? this.D - 30720 >> 14 : ((this.a & 0x2000) != 0 ? this.D + this.F >> 14 : this.D + this.F + 20480 >> 14);
        int n2 = (this.C >> 10) - 3 >> 4;
        int n3 = (this.C >> 10) + 3 >> 4;
        int n4 = n2;
        while (n4 <= n3) {
            int n5 = b2.a(n4, n, true);
            if (n5 == 2) {
                this.C = (n4 << 4) + 8 << 10;
                this.E = 0;
                this.G = 0;
                return true;
            }
            ++n4;
        }
        if ((this.a & 0x2000) != 0) {
            if (bl) {
                ++n;
                this.D = (n <<= 14) + 10240;
            } else {
                this.D = n <<= 14;
            }
            this.H = 0;
        }
        return false;
    }

    public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl) {
        super.a(n, n2, n3, byArray, bl);
        this.e = 10;
        this.b = 0;
        this.Z = null;
        this.aa = null;
        this.J = 4096;
        this.a = 1;
        return true;
    }

    public final void f() {
        this.a = this.ab.x == 4 ? (this.a &= 0xFFFFFFFE) : 1;
        this.e = 10;
        this.o = 0;
        this.W = true;
        this.V = false;
        this.Q = 18;
        this.Z = null;
        this.m = 0;
        this.b = 0;
        this.J = 0;
        this.H = 0;
    }

    public final void e() {
        this.c = this.t & 0xFFFFFF;
        this.d = this.t & 0xFF000000;
        --this.R;
        this.c();
        this.E = this.G;
        this.F = this.H;
        this.G += this.I;
        if (this.I > 0 && this.G > this.K) {
            this.G = this.K;
        }
        if (this.I < 0 && this.G < this.K) {
            this.G = this.K;
        }
        this.H += this.J;
        if (this.J > 0 && this.H > this.L) {
            this.H = this.L;
        }
        if (this.J < 0 && this.H < this.L) {
            this.H = this.L;
        }
        switch (this.ab.p) {
            case 14: 
            case 19: {
                this.C += this.E;
                this.D += this.F;
                return;
            }
            case 10: {
                int n;
                int n2 = tjge.a.c;
                if (this.ab.x == 4) {
                    if (this.ab.B-- > 25) {
                        this.G = 0;
                    } else if (this.ab.B > 12) {
                        this.G = 10240;
                    } else if (this.ab.B <= 12) {
                        this.ab.t = 8192;
                    }
                    if (this.ab.n.p && this.aa.a(this.ab.n) && (this.aa.C < this.ab.n.C && this.G > this.ab.t || this.aa.C > this.ab.n.C && this.G < this.ab.t)) {
                        this.G = this.ab.t;
                        this.E = this.ab.t;
                    }
                    this.C += this.E;
                    if (this.ab.t <= 0) break;
                    if (this.C < this.ab.r + 20480) {
                        this.C = this.ab.r + 20480;
                        return;
                    }
                    if (this.C - this.ab.r <= n2 - 20480) break;
                    this.C = this.ab.r + n2 - 20480;
                    return;
                }
                if ((this.a & 0x2000) == 0) {
                    if (this.d(this.ab.f)) {
                        if (!this.c(this.ab.f)) {
                            this.H = 5120;
                            this.j();
                        } else {
                            this.a(5 | this.d);
                        }
                    } else {
                        if (this.d != 0) {
                            n = this.a(this.ab.f, 0);
                            if (n != 0 && (this.a & 1) != 0 && this.c != 19 && this.c != 0 && this.c != 5) {
                                this.a(0 | this.d);
                            }
                        } else {
                            n = this.b(this.ab.f, 0);
                            if (n != 0 && (this.a & 1) != 0 && this.c != 19 && this.c != 0 && this.c != 5) {
                                this.a(0);
                            }
                        }
                        if (this.c(this.ab.f)) {
                            this.i();
                        } else {
                            this.j();
                        }
                    }
                    if ((this.c == 3 || this.c == 4 || this.c == 17) && (this.a & 1) == 0 && this.o != 5 && this.a(this.ab.f, true)) {
                        this.c = 18;
                        this.a |= 0x2000;
                        this.b = 0;
                        this.G = 0;
                        this.H = 0;
                        this.a(0x12 | this.d);
                    }
                }
                this.C += this.E;
                this.D += this.F;
                if ((this.a & 1) != 0 && (this.c == 2 || this.c == 0) && (n = this.C % 8192) > 2048 && n < 6144) {
                    if (n > 4096) {
                        n = 8192 - n;
                        this.C += n;
                    } else {
                        this.C -= n;
                    }
                }
                if (this.ab.L && this.ab.x != 7 && this.ab.x != 2) {
                    if (this.C < this.ab.r + 10240) {
                        this.C = this.ab.r + 10240;
                        this.G = 0;
                        return;
                    }
                    if (this.C <= this.ab.r + n2 - 10240) break;
                    this.C = this.ab.r + n2 - 10240;
                    this.G = 0;
                    return;
                }
                this.ab.t = this.d == 0 ? (this.C > tjge.a.a / 5 << 10 ? this.G + 14336 : 0) : (this.C < this.ab.f.a() - tjge.a.a / 5 << 10 ? this.G + -14336 : 0);
                this.ab.u = -4096;
            }
        }
    }

    public final void a() {
        this.U = (this.t & 0xFF000000) != 0;
        this.g();
        this.c = this.t & 0xFFFFFF;
        this.h();
        if (this.e <= 0 && this.c != 23 && this.c != 15 && this.c != 16) {
            this.a(0x17 | this.d);
        }
    }

    public final void g() {
        switch (this.c) {
            case 3: {
                switch (this.o) {
                    case 0: {
                        this.g(this.ab.f);
                        if (this.n == 2 && this.W) {
                            this.C = this.U ? this.S + 10240 : this.S - 10240;
                            this.D = this.T + 36864;
                            this.o = 3;
                            this.a(0x16 | this.d);
                            return;
                        }
                        if (this.H <= -3120) break;
                        this.a(4 | this.d);
                        break;
                    }
                    case 1: {
                        if ((this.a & 1) == 0) break;
                        this.J = 0;
                        this.G = 0;
                        this.a(0 | this.d);
                        break;
                    }
                    case 3: {
                        this.g(this.ab.f);
                        if (this.n != 2 || !this.W) break;
                        this.C = this.U ? this.S + 10240 : this.S - 10240;
                        this.D = this.T + 36864;
                        this.a(0x16 | this.d);
                        break;
                    }
                    case 4: {
                        if (this.H <= 3120) break;
                        this.a(0x11 | this.d);
                    }
                }
                return;
            }
            case 4: {
                switch (this.o) {
                    case 0: {
                        if (this.H <= 3120) break;
                        this.a(0x11 | this.d);
                        break;
                    }
                    case 2: 
                    case 3: {
                        if (this.D >= this.T) break;
                        this.G = this.o == 3 ? (this.U ? -8192 : 8192) : (this.U ? -4096 : 4096);
                        this.a(0x11 | this.d);
                    }
                }
                return;
            }
            case 17: {
                switch (this.o) {
                    case 0: {
                        this.g(this.ab.f);
                        if (this.n == 2 && !this.e(this.ab.f) && this.W) {
                            this.o = 6;
                            return;
                        }
                    }
                    case 2: 
                    case 3: 
                    case 4: {
                        if ((this.a & 1) == 0) break;
                        this.G = 0;
                        this.a(0 | this.d);
                        break;
                    }
                    case 5: {
                        if (this.m++ <= 0) break;
                        this.m = 0;
                        this.G = 0;
                        this.o = 0;
                        break;
                    }
                    case 6: {
                        this.C = this.U ? this.S + 10240 : this.S - 10240;
                        this.D = this.T + 36864;
                        this.H = -4096;
                        this.o = 3;
                        this.a(0x16 | this.d);
                    }
                }
                return;
            }
            case 22: {
                if (this.o != 2 && this.o != 3) break;
                this.W = false;
                this.J = 4096;
                int n = this.G = this.U ? -4096 : 4096;
                if (this.o == 3) {
                    this.H = -15360;
                }
                this.a(4 | this.d);
                return;
            }
            case 1: 
            case 28: {
                if (!this.d()) break;
                this.n();
                if (this.c == 1) {
                    this.a(0 | this.d);
                    return;
                }
                this.a(5 | this.d);
                return;
            }
            case 6: 
            case 8: 
            case 29: {
                if (!this.d()) break;
                this.a(0 | this.d);
                return;
            }
            case 7: {
                if (!this.d()) break;
                this.a(8 | this.d);
                return;
            }
            case 9: 
            case 11: 
            case 30: {
                if (!this.d()) break;
                this.a(5 | this.d);
                return;
            }
            case 10: {
                if (!this.d()) break;
                this.a(0xB | this.d);
                return;
            }
            case 20: {
                if (this.m++ <= 1) break;
                this.m = 0;
                this.a(0x15 | this.d);
                return;
            }
            case 21: {
                if (this.m++ <= 1) break;
                this.m = 0;
                this.a(0 | this.d);
                return;
            }
            case 13: {
                this.ab.p = 20;
                return;
            }
            case 19: {
                if (this.m++ <= 5) break;
                if (this.f(this.ab.f)) {
                    this.a(5 | this.d);
                } else {
                    this.a(0 | this.d);
                }
                this.b = 0;
                this.m = 0;
                this.G = 0;
                this.f = 0;
                this.g = 0;
                return;
            }
            case 18: 
            case 24: 
            case 25: 
            case 26: {
                if (!this.X) {
                    return;
                }
                switch (this.Q) {
                    case 18: {
                        this.Q = 24;
                        break;
                    }
                    case 24: {
                        this.Q = 25;
                        break;
                    }
                    case 25: {
                        this.Q = 26;
                        break;
                    }
                    case 26: {
                        this.Q = 18;
                    }
                }
                this.X = false;
                if ((this.t & 0xFFFFFF) == 23) break;
                this.a(this.Q | this.d);
                return;
            }
            case 27: {
                if (!this.Y) {
                    this.Q = 24;
                    this.a(this.Q | this.d);
                } else {
                    this.J = 4096;
                    this.D -= 25600;
                    this.a &= 0xFFFFDFFF;
                    this.a(0 | this.d);
                }
                this.X = false;
                return;
            }
            case 23: {
                if (this.ab.x != 4 && (this.a & 1) == 0) break;
                if (this.e <= 0) {
                    this.a(0xF | this.d);
                    tjge.a.a(4, 1, 200);
                    return;
                }
                this.a(0 | this.d);
                return;
            }
            case 15: {
                if (this.m++ <= 2) break;
                this.a(0x10 | this.d);
                return;
            }
            case 16: {
                if (this.m++ <= 4) break;
                this.m = 0;
                this.ab.p = 20;
            }
        }
    }

    /*
     * Unable to fully structure code
     */
    public final void h() {
        block92: {
            block95: {
                block93: {
                    block94: {
                        block88: {
                            block91: {
                                block89: {
                                    block90: {
                                        if (this.ab.p != 10) {
                                            return;
                                        }
                                        if (this.c == 23 || this.c != 0 && this.c != 5 && this.c != 2 && this.c != 1 && this.c != 28 && (this.a & 8192) == 0) {
                                            return;
                                        }
                                        if (this.ab.x == 4) {
                                            this.o();
                                            return;
                                        }
                                        if ((this.a & 8192) != 0) {
                                            this.H = 0;
                                            this.J = 0;
                                        }
                                        if (this.ab.q == 4 && this.c != 5 && !this.V && (this.a & 8192) == 0 && !this.a(this.ab.f, true)) {
                                            this.ab.q &= -5;
                                            if (this.g > 0) {
                                                this.ab.q = this.U != false ? 64 : 128;
                                            }
                                        }
                                        if (this.ab.q == 1) {
                                            if ((this.a & 1) != 0) {
                                                if (this.c != 2) {
                                                    if (this.U) {
                                                        if (this.c == 5 && this.f(this.ab.f)) {
                                                            return;
                                                        }
                                                        if (!this.a(this.ab.f, 2)) {
                                                            this.k();
                                                        }
                                                    } else {
                                                        this.a(this.c | -2147483648);
                                                    }
                                                }
                                            } else if ((this.a & 8192) != 0 && !this.a(this.ab.f, 14)) {
                                                if (this.a(this.ab.f, false)) {
                                                    this.m = 0;
                                                    this.b = 1;
                                                    this.H = 10240;
                                                    this.G = -8192;
                                                    this.o = 5;
                                                    this.a(-2147483631);
                                                } else {
                                                    this.F = 4096;
                                                    this.a(-2147483648);
                                                }
                                                this.a &= -8193;
                                            }
                                            this.f = 1;
                                            return;
                                        }
                                        if (this.ab.q == 2) {
                                            if ((this.a & 1) != 0) {
                                                if (this.c != 2) {
                                                    if (!this.U) {
                                                        if (this.c == 5 && this.f(this.ab.f)) {
                                                            return;
                                                        }
                                                        if (!this.b(this.ab.f, 2)) {
                                                            this.l();
                                                        }
                                                    } else {
                                                        this.a(this.c);
                                                    }
                                                }
                                            } else if ((this.a & 8192) != 0 && !this.b(this.ab.f, 14)) {
                                                if (this.a(this.ab.f, false)) {
                                                    this.m = 0;
                                                    this.b = 1;
                                                    this.H = 10240;
                                                    this.G = 8192;
                                                    this.o = 5;
                                                    this.a(17);
                                                } else {
                                                    this.F = 4096;
                                                    this.a(0);
                                                }
                                                this.a &= -8193;
                                            }
                                            this.f = 2;
                                            return;
                                        }
                                        if (this.ab.q == 4) {
                                            if (this.V && (this.a & 1) != 0) {
                                                if (this.Z != null) {
                                                    this.a(13 | this.d);
                                                }
                                            } else if (this.c == 5) {
                                                if (!this.f(this.ab.f)) {
                                                    this.a(0 | this.d);
                                                }
                                            } else if (this.a(this.ab.f, true)) {
                                                this.X = true;
                                                this.a &= -2;
                                                this.a |= 8192;
                                                this.H = -5120;
                                                this.b = 0;
                                                this.a(this.Q | this.d);
                                            } else if ((this.a & 8192) != 0) {
                                                this.Y = true;
                                                this.a(27 | this.d);
                                            }
                                            this.f = 4;
                                            this.g = 0;
                                            return;
                                        }
                                        if (this.ab.q == 8) {
                                            this.G = 0;
                                            if (this.a(this.ab.f, false)) {
                                                if ((this.a & 8192) == 0) {
                                                    this.a &= -2;
                                                    this.a |= 8192;
                                                    this.b = 0;
                                                    this.Y = false;
                                                    this.D += 30720;
                                                    this.a(27 | this.d);
                                                } else {
                                                    this.a(this.Q | this.d);
                                                }
                                                this.H = 5120;
                                                this.X = true;
                                            } else if ((this.a & 8192) != 0) {
                                                this.a &= -8193;
                                                this.F = 4096;
                                                this.a(0 | this.d);
                                            } else if ((this.a & 1) != 0 && (this.g > 0 && this.g < 3 && this.f == 8 || this.c == 5 && this.g > 0)) {
                                                this.b = 1;
                                                this.G = this.U == false ? 8192 : -8192;
                                                this.a(19 | this.d);
                                            } else if ((this.a & 1) != 0 && this.g > 0) {
                                                this.a(5 | this.d);
                                            }
                                            this.f = 8;
                                            this.g = 0;
                                            return;
                                        }
                                        if (this.ab.q != 64) break block88;
                                        if ((this.a & 1) == 0) break block89;
                                        if (this.c == 5 && this.f(this.ab.f)) {
                                            return;
                                        }
                                        if (!this.U) {
                                            this.a(this.c | -2147483648);
                                            return;
                                        }
                                        this.F = 0;
                                        this.E = 0;
                                        if (!this.g(this.ab.f)) break block90;
                                        this.o = this.n;
                                        switch (this.o) {
                                            case 1: 
                                            case 4: {
                                                if (this.o != 4) ** GOTO lbl136
                                                if (!this.a(this.ab.f, 2)) {
                                                    this.o = 0;
                                                    this.G = -8192;
                                                }
                                                ** GOTO lbl138
lbl136:
                                                // 1 sources

                                                if (this.o == 1) {
                                                    this.G = -4096;
                                                }
                                            }
lbl138:
                                            // 5 sources

                                            case 3: {
                                                this.b(-10240);
                                                break;
                                            }
                                            case 2: {
                                                this.b(-15360);
                                            }
                                        }
                                        break block91;
                                    }
                                    this.o = 0;
                                    this.b(-10240);
                                    this.G = -8192;
                                    break block91;
                                }
                                if ((this.a & 8192) != 0) {
                                    this.J = 0;
                                    this.H = 0;
                                }
                            }
                            this.f = 64;
                            this.ab.q = 0;
                            return;
                        }
                        if (this.ab.q != 128) break block92;
                        if ((this.a & 1) == 0) break block93;
                        if (this.c == 5 && this.f(this.ab.f)) {
                            return;
                        }
                        if (this.U) {
                            this.a(this.c);
                            return;
                        }
                        this.F = 0;
                        this.E = 0;
                        if (!this.g(this.ab.f)) break block94;
                        this.o = this.n;
                        switch (this.o) {
                            case 1: 
                            case 4: {
                                if (this.o != 4) ** GOTO lbl176
                                if (!this.b(this.ab.f, 2)) {
                                    this.o = 0;
                                    this.G = 8192;
                                }
                                ** GOTO lbl178
lbl176:
                                // 1 sources

                                if (this.o == 1) {
                                    this.G = 4096;
                                }
                            }
lbl178:
                            // 5 sources

                            case 3: {
                                this.c(-10240);
                                break;
                            }
                            case 2: {
                                this.c(-15360);
                            }
                        }
                        break block95;
                    }
                    this.o = 0;
                    this.c(-10240);
                    this.G = 8192;
                    break block95;
                }
                if ((this.a & 8192) != 0) {
                    this.J = 0;
                    this.H = 0;
                }
            }
            this.f = 128;
            this.ab.q = 0;
            return;
        }
        if (this.ab.q == 16) {
            if ((this.a & 8192) != 0) {
                return;
            }
            if (this.g == 0) {
                ++this.g;
                return;
            }
            switch (this.k) {
                case 0: 
                case 1: {
                    this.d(21);
                    break;
                }
                case 2: {
                    this.d(15);
                }
            }
            this.g = 0;
            this.G = 0;
            this.ab.q &= -17;
            return;
        }
        if (this.ab.q == 32) {
            if ((this.a & 8192) == 0 && this.g > 1) {
                switch (this.k) {
                    case 0: {
                        if (this.h != 0 || this.i != 0) break;
                        return;
                    }
                    case 1: {
                        this.h += this.l;
                        break;
                    }
                    case 2: {
                        this.i += this.l;
                    }
                }
                this.g = 0;
                this.l = 0;
                ++this.k;
                this.f(32);
            }
            this.G = 0;
            this.ab.q &= -33;
            return;
        }
        if (this.ab.q == 2048) {
            if (this.c != 1 && this.c != 28 && (this.a & 8192) == 0 && this.g > 1) {
                this.f(2048);
                this.g = 0;
            }
            this.G = 0;
            this.ab.q &= -2049;
            return;
        }
        if (this.ab.q == 1024) {
            if ((this.a & 8192) != 0 || this.g == 0) {
                return;
            }
            this.d(20);
            this.g = 0;
            this.G = 0;
            this.ab.q &= -1025;
            return;
        }
        ++this.g;
        if (this.b == 0) {
            this.G = 0;
        }
        if (this.c == 2 && (this.a & 1) != 0) {
            this.a(0 | this.d);
        }
    }

    public final void b(int n) {
        if (this.o == 2) {
            this.C = this.S + 12288;
            this.a(-2147483626);
        } else if (this.o == 5) {
            this.a(-2147483631);
        } else {
            this.a(-2147483645);
        }
        this.H = n;
        this.J = 4096;
        this.a &= 0xFFFFFFFE;
        this.b = 1;
    }

    public final void c(int n) {
        if (this.o == 2) {
            this.C = this.S - 12288;
            this.a(22);
        } else if (this.o == 5) {
            this.a(17);
        } else {
            this.a(3);
        }
        this.H = n;
        this.J = 4096;
        this.a &= 0xFFFFFFFE;
        this.b = 1;
    }

    public final void i() {
        if ((this.a & 1) == 0) {
            this.G = 0;
            this.J = 0;
            this.b = 0;
            this.W = true;
            this.a |= 1;
            if (this.c != 23) {
                this.a(0 | this.d);
            }
        }
    }

    public final void j() {
        if (this.ab.x == 4 || this.c == 15 || this.c == 16 || this.c == 3 || this.c == 4 || this.c == 17 || this.c == 22) {
            return;
        }
        this.a &= 0xFFFFFFFE;
        if (this.c == 23 || this.F > 0) {
            this.H = 10240;
            this.J = 4096;
            this.L = 12288;
            this.m = 0;
            this.b = 1;
            if (this.c == 23) {
                this.G = 0;
                return;
            }
            this.o = 5;
            this.G = this.U ? -8192 : 8192;
            this.a(0x11 | this.d);
        }
    }

    public final void k() {
        this.G = -8192;
        this.b = 0;
        this.a(-2147483646);
    }

    public final void l() {
        this.G = 8192;
        this.b = 0;
        this.a(2);
    }

    public final void d(int n) {
        l l2;
        switch (n) {
            case 10: 
            case 21: {
                if (this.l <= 0) {
                    if (this.c == 5) {
                        this.a(0x1E | this.d);
                        return;
                    }
                    this.a(0x1D | this.d);
                    return;
                }
                if (this.k == 0) {
                    int n2 = !this.U ? 25 : -25;
                    n2 = n2 << 10;
                    l2 = this.ab.a(21, 0 | this.d, 0, this.C + n2, this.D - 20480, 0);
                } else {
                    int n3 = !this.U ? 35 : -35;
                    n3 = n3 << 10;
                    l2 = this.ab.a(10, 0 | (this.d == 0 ? Integer.MIN_VALUE : 0), 1, this.C + n3, this.D - 23552, 0);
                }
                if (l2 != null) {
                    if (this.c == 5) {
                        l2.D += 5120;
                        this.a(9 | this.d);
                    } else {
                        this.a(6 | this.d);
                    }
                    if (this.ab.x != 4 && this.k == 0 && l2.a(this.U)) {
                        l2.a(1);
                    } else if (this.k == 0) {
                        l2.G = l2.G + (!this.U ? 12288 : -12288);
                    }
                    --this.l;
                }
                tjge.a.a(3, 1, 100);
                break;
            }
            case 20: {
                if (this.j == 0 && this.ab.x != 4) {
                    return;
                }
                l2 = this.ab.a(20, 0, 0, this.C, this.D - 35840, 0);
                if (l2 == null) break;
                if (--this.j < 0) {
                    this.j = 0;
                }
                if (this.c == 5) {
                    l2.D += 4096;
                    this.a(0xA | this.d);
                } else {
                    this.a(7 | this.d);
                }
                l2.G = l2.G + (!this.U ? 8192 : -8192);
                l2.H = -6656;
                l2.J = 1128;
                l2.L = 15360;
                break;
            }
            case 15: {
                if (this.l <= 0) {
                    if (this.c == 5) {
                        this.a(0x1E | this.d);
                        return;
                    }
                    this.a(0x1D | this.d);
                    return;
                }
                int n4 = !this.U ? 40 : -40;
                l2 = this.ab.a(15, 0 | this.d, 0, this.C + (n4 = n4 << 10), this.D - 18432, 0);
                if (l2 == null) break;
                --this.l;
                if (this.c == 5) {
                    l2.D += 4096;
                    this.a(9 | this.d);
                } else {
                    this.a(6 | this.d);
                }
                if (this.ab.x != 4 && l2.a(this.U)) {
                    this.ab.a(16, 0, 0, l2.C, l2.D, 0);
                    l2.b();
                    break;
                }
                l2.f();
            }
        }
        l2 = null;
    }

    public final void e(int n) {
        if (this.ab.p != 10) {
            return;
        }
        if (this.c == 13 || this.c == 19 || this.c == 15 || this.c == 16 || this.R > 0) {
            return;
        }
        this.e -= n;
        this.m = 0;
        this.R = 5;
        this.a &= 0xFFFFDFFF;
        this.a(0x17 | this.d);
        if (this.ab.x != 4) {
            this.G = 0;
        }
    }

    public final boolean g(b b2) {
        boolean bl = false;
        boolean bl2 = false;
        boolean bl3 = false;
        int n = (this.D + this.F >> 10) + -56 >> 4;
        int n2 = (this.D + this.F >> 10) - 3 >> 4;
        int n3 = this.C + this.E >> 10;
        n3 += this.U ? -16 : 16;
        n3 >>= 4;
        int n4 = n;
        while (n4 <= n2) {
            int n5 = b2.a(n3, n4, true);
            if (n5 == 1) {
                if (n4 < n + 1) {
                    this.n = 4;
                    return true;
                }
                if (n4 < n + 2 || n4 < n + 3) {
                    this.S = this.U ? (n3 << 4) + 16 << 10 : n3 << 14;
                    this.T = n4 << 14;
                    this.n = n4 == n + 1 ? 3 : 2;
                    return true;
                }
                if (n4 < n + 4) {
                    this.n = 1;
                    return true;
                }
            }
            ++n4;
        }
        this.n = 0;
        return false;
    }

    private void o() {
        if (this.ab.q == 1) {
            if (!this.U) {
                this.a(this.c | Integer.MIN_VALUE);
                return;
            }
            this.G = 0;
            return;
        }
        if (this.ab.q == 2) {
            if (this.U) {
                this.a(this.c);
                return;
            }
            this.G = 16384;
            return;
        }
        if (this.ab.q == 4) {
            if (this.c != 0) {
                this.a(0 | this.d);
                return;
            }
        } else if (this.ab.q == 8) {
            if (this.c != 5) {
                this.a(5 | this.d);
                return;
            }
        } else {
            if (this.ab.q == 16) {
                if (this.g == 0) {
                    ++this.g;
                    return;
                }
                switch (this.k) {
                    case 0: 
                    case 1: {
                        this.d(21);
                        break;
                    }
                    case 2: {
                        this.d(15);
                    }
                }
                this.g = 0;
                this.ab.q &= 0xFFFFFFEF;
                return;
            }
            if (this.ab.q == 32) {
                if (this.g > 1) {
                    switch (this.k) {
                        case 0: {
                            if (this.h != 0 || this.i != 0) break;
                            return;
                        }
                        case 1: {
                            this.h += this.l;
                            break;
                        }
                        case 2: {
                            this.i += this.l;
                        }
                    }
                    this.g = 0;
                    this.l = 0;
                    ++this.k;
                    this.f(32);
                    return;
                }
            } else if (this.ab.q == 2048) {
                if (this.g > 1) {
                    this.f(2048);
                    this.g = 0;
                    return;
                }
            } else if (this.ab.q == 1024) {
                if (this.g > 0) {
                    this.d(20);
                    this.g = 0;
                    return;
                }
            } else {
                ++this.g;
                if (this.ab.B <= 12) {
                    this.G = this.ab.t;
                }
                this.H = 0;
                this.J = 0;
            }
        }
    }

    public final boolean a(b b2, int n) {
        if (n != 100) {
            if (this.E > 0) {
                return false;
            }
        } else {
            n = 0;
        }
        int n2 = this.z;
        boolean bl = false;
        if ((this.a & 0x2000) != 0) {
            n2 = -20;
        }
        int n3 = this.D + this.F >> 10;
        int n4 = (this.C + this.E >> 10) + -9 - n >> 4;
        int n5 = n3 + n2 - 2 >> 4;
        int n6 = n3 - 10 >> 4;
        int n7 = n5;
        while (n7 <= n6) {
            n3 = b2.a(n4, n7, true);
            if (n3 == 1) {
                n3 = b2.a(n4 + 1, n7, true);
                if (n3 != 1) {
                    this.G = 0;
                    this.C &= 0xFFFFFC00;
                    this.E = ((n4 << 4) + 25 << 10) - this.C;
                }
                return true;
            }
            ++n7;
        }
        return false;
    }

    public final boolean b(b b2, int n) {
        if (n != 100) {
            if (this.E < 0) {
                return false;
            }
        } else {
            n = 0;
        }
        int n2 = this.z;
        boolean bl = false;
        if ((this.a & 0x2000) != 0) {
            n2 = -20;
        }
        int n3 = this.D + this.F >> 10;
        int n4 = (this.C + this.E >> 10) + 9 + n >> 4;
        int n5 = n3 + n2 - 2 >> 4;
        int n6 = n3 - 10 >> 4;
        int n7 = n5;
        while (n7 <= n6) {
            n3 = b2.a(n4, n7, true);
            if (n3 == 1) {
                n3 = b2.a(n4 - 1, n7, true);
                if (n3 != 1) {
                    this.G = 0;
                    this.C &= 0xFFFFFC00;
                    this.E = ((n4 << 4) - 10 << 10) - this.C;
                }
                return true;
            }
            ++n7;
        }
        return false;
    }

    public final void a(l l2) {
        if (this.c != 19 && this.c != 23 && this.c != 15 && this.c != 16) {
            switch (l2.q) {
                case 21: {
                    if (this.U && l2.G < 0) {
                        this.d = 0;
                        this.U = false;
                    } else if (!this.U && l2.G > 0) {
                        this.d = Integer.MIN_VALUE;
                        this.U = true;
                    }
                    if ((l2.t & 0xFFFFFF) != 0) break;
                    this.e(1);
                    l2.b();
                    return;
                }
                case 20: {
                    int n = l2.G > 0 ? 8192 : -8192;
                    this.ab.a(16, 0, 0, l2.C + n, l2.D + 8192, l2.d);
                    l2.b();
                    tjge.a.a(5, 1, 220);
                    return;
                }
                case 16: {
                    this.e(3);
                }
            }
        }
    }

    public final void f(int n) {
        boolean bl = false;
        if (this.k > 2) {
            this.k = 0;
        }
        while (!bl) {
            if (this.k == 1) {
                if (n == 32) {
                    if (this.h <= 0) {
                        this.k = 2;
                    } else {
                        bl = true;
                    }
                } else {
                    if (this.l >= 3 || this.h <= 0) break;
                    bl = true;
                }
            }
            if (this.k == 2) {
                if (n == 32) {
                    if (this.i == 0) {
                        this.k = 0;
                    } else {
                        bl = true;
                    }
                } else {
                    if (this.l >= 1 || this.i <= 0) break;
                    bl = true;
                }
            }
            if (this.k != 0) continue;
            if (n == 32) {
                bl = true;
                continue;
            }
            if (this.l >= 10) break;
            bl = true;
        }
        if (bl) {
            if (this.c == 5 || this.c == 28) {
                this.a(0x1C | this.d);
                return;
            }
            this.a(1 | this.d);
        }
    }

    public final void m() {
        this.k = 0;
        this.h = 6;
        this.i = 3;
        this.j = 3;
        this.l = 10;
    }

    public final void n() {
        int n = 0;
        if (this.l < 0) {
            this.l = 0;
        }
        switch (this.k) {
            case 0: {
                this.l = 10;
                return;
            }
            case 1: {
                n = 3 - this.l;
                if (this.h > n) {
                    this.h -= n;
                    this.l = 3;
                    return;
                }
                this.l += this.h;
                this.h = 0;
                return;
            }
            case 2: {
                n = 1 - this.l;
                if (this.i > n) {
                    this.i -= n;
                    this.l = 1;
                    return;
                }
                this.l += this.i;
                this.i = 0;
            }
        }
    }
}

