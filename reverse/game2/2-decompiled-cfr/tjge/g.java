/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.d;
import tjge.e;
import tjge.h;
import tjge.j;
import tjge.k;

public final class g
extends h {
    public static final int[] a = new int[]{8192, 4096, 8192, 8192, 8192, 8192};
    public static final int[] b = new int[]{-10240, -10240, -15360, -17408, -15360, -10240};
    public static final int[] c = new int[]{10, 1, 3};
    public static final int[] d = new int[]{99, 6, 3};
    public static int[] e = new int[3];
    public static int[] f = new int[3];
    public static int[][] Q = new int[4][];
    private static final int[][] ak;
    private static final int[][] al;
    private static final int[][][] am;
    int R;
    int S;
    int T;
    int U;
    int V;
    int W;
    int X;
    int Y;
    boolean Z;
    boolean aa;
    boolean ab;
    boolean ac;
    boolean ad;
    boolean ae;
    boolean af;
    private boolean an;
    public boolean ag;
    public boolean ah;
    public boolean ai;
    e aj;

    public g(int n, d d2) {
        super(n, d2);
        this.K = 2;
    }

    public final boolean a(byte[] byArray) {
        super.a(byArray);
        this.y();
        this.ag = false;
        this.ae = false;
        this.af = false;
        this.ab = false;
        this.ah = false;
        this.ai = false;
        this.U = 0;
        tjge.g.e[0] = c[0];
        tjge.g.e[1] = c[1];
        tjge.g.e[2] = c[2];
        tjge.g.Q[0][0] = -1;
        tjge.g.Q[1][0] = -1;
        tjge.g.Q[2][0] = -1;
        tjge.g.Q[3][0] = -1;
        this.T = 10;
        if (this.aj != null) {
            this.aj.g = false;
            this.aj = null;
        }
        if (byArray[7] > 0) {
            this.a();
        } else {
            this.aj = null;
            this.G = 1;
        }
        return true;
    }

    public final void a() {
        this.aj = (e)this.L.z.c(18, -1);
        this.aj.c(0);
        this.aj.a(0 | this.H);
        this.aj.j = false;
        this.a(0x19 | this.H);
        this.G = 4;
    }

    public final void i() {
        int n;
        int n2;
        int n3;
        this.g();
        this.w = this.y;
        this.x = this.z;
        this.y += this.A;
        if (this.A > 0 && this.y > this.C) {
            this.y = this.C;
        }
        if (this.A < 0 && this.y < -this.C) {
            this.y = -this.C;
        }
        this.z += this.B;
        if (this.B > 0 && this.z > this.D) {
            this.z = this.D;
        }
        if (this.B < 0 && this.z < -this.D) {
            this.z = -this.D;
        }
        if ((this.G & 2) != 0) {
            n3 = this.u >> 13;
            if (this.z < 0) {
                n2 = (this.v + this.x >> 10) - 30 >> 3;
                n = this.a(n3, n2);
                if ((n & 3) != 0) {
                    this.x = (n2 << 13) + 8192 - this.v;
                    this.a(0x16 | this.H);
                    this.ac = true;
                }
            } else if (this.z > 0 && ((n = this.a(n3, n2 = (this.v + this.x >> 10) + 4 >> 3)) & 4) == 0) {
                this.x = (n2 << 13) - this.v;
                this.G &= 0xFFFFFFFD;
                this.L.c = 0;
            }
            this.z = 0;
        } else if ((this.G & 4) != 0) {
            if (this.L.z.J && !this.ah) {
                n3 = this.v + (this.r << 10) + this.x;
                n2 = this.v + (this.s << 10) + this.x;
                if (n3 < this.L.n) {
                    this.x = this.L.n - (this.v + (this.r << 10));
                } else if (n2 > this.L.n + (this.L.r >> 1)) {
                    this.x = this.L.n + (this.L.r >> 1) - (this.v + (this.s << 10));
                }
            }
        } else {
            if (this.k() && this.l == 25) {
                this.a(0x10 | this.H);
            }
            if (this.j() && this.l == 25) {
                this.a(0x10 | this.H);
            }
            if (this.q()) {
                this.y();
                if ((this.G & 1) == 0) {
                    this.G = 1;
                    if (this.l != 5 && this.l != 6 && this.l != 25) {
                        this.y = 0;
                        this.a(0x10 | this.H);
                    }
                }
            } else if (!this.l()) {
                if ((this.G & 1) != 0) {
                    this.R = 1;
                    this.w = this.H == 0 ? 10240 : -10240;
                    this.x = 6144;
                    this.z = 10240;
                    this.G &= 0xFFFFFFFE;
                    this.ad = false;
                    if (this.l != 5 && this.l != 6) {
                        this.a(0x10 | this.H);
                    }
                } else if (this.l == 18 || this.l == 19 || this.l == 20 || this.l == 21) {
                    this.z = 12288;
                    this.ad = false;
                    this.a(0x10 | this.H);
                }
                this.B = 4096;
                this.u();
            }
        }
        if (this.L.z.w == 0 || this.L.z.w == 5) {
            n3 = this.u + (this.p << 10) + this.w;
            n2 = this.u + (this.q << 10) + this.w;
            n = this.L.m + 4096;
            int n4 = this.L.m + this.L.q - 4096;
            if (n3 < n) {
                this.w = n - (this.u + (this.p << 10));
            } else if (n2 > n4) {
                this.w = n4 - (this.u + (this.q << 10));
            }
        }
        this.u += this.w;
        this.v += this.x;
        if (this.aj != null) {
            this.aj.c(0);
            if (!this.aj.g) {
                this.G &= 0xFFFFFFFB;
                this.aj = null;
            }
        }
    }

    public final void c() {
        this.aj.c(1);
    }

    public final boolean o() {
        return this.an;
    }

    public final void b() {
        this.r();
        switch (this.L.z.w) {
            case 6: {
                if ((this.G & 4) != 0) {
                    this.y = 0;
                    this.z = 0;
                    this.an = true;
                    this.a(0x19 | this.H);
                    break;
                }
                if ((this.G & 1) == 0) break;
                this.y = 0;
                this.an = true;
                if (this.ae) {
                    this.a(0x21 | this.H);
                    break;
                }
                this.a(0 | this.H);
                break;
            }
            case 0: 
            case 5: {
                if (this.v()) {
                    this.c(this.L.c);
                }
                if (!this.ab) break;
                this.ab = false;
            }
        }
        if (this.L.z.w != 6) {
            this.an = false;
        }
        if (this.T <= 0 && this.l != 5 && this.l != 6 && this.l != 3 && this.l != 4 && !this.L.z.J) {
            this.a(5 | this.H);
        }
    }

    private final void r() {
        int n = this.H == 0 ? 1 : -1;
        switch (this.l) {
            case 24: {
                if (this.n > 3) {
                    this.n();
                }
            }
            case 8: 
            case 10: 
            case 27: 
            case 29: 
            case 30: 
            case 32: {
                if (!this.h()) break;
                this.a(0 | this.H);
                return;
            }
            case 7: {
                if (!this.h()) break;
                this.a(0x20 | this.H);
                return;
            }
            case 12: 
            case 13: {
                int n2;
                if (this.h()) {
                    if (this.l == 13) {
                        this.a(2 | this.H);
                        return;
                    }
                    this.a(0 | this.H);
                    return;
                }
                if (this.n != 2) break;
                int n3 = this.l == 12 ? 0 : 1;
                boolean bl = false;
                int n4 = 6 | this.H;
                int n5 = this.a(al, n3, 0);
                k k2 = tjge.k.a(10, n4, n5, n2 = this.a(al, n3, 1), 26, null);
                if (k2 == null) break;
                e[2] = e[2] - 1;
                k2.y = this.H == 0 ? 8192 : -8192;
                k2.z = -6656;
                k2.B = 1128;
                k2.D = 15360;
                return;
            }
            case 9: 
            case 11: 
            case 28: 
            case 31: {
                if (!this.h()) break;
                this.a(2 | this.H);
                return;
            }
            case 25: {
                if ((this.G & 1) != 0) {
                    this.S = 0;
                    this.y = 8192 * n;
                    this.a(0x17 | this.H);
                    return;
                }
                if ((this.G & 4) != 0) break;
                this.y = 8192 * n;
                return;
            }
            case 26: {
                if ((this.G & 4) == 0) {
                    this.y = 8192 * n;
                }
                if (!this.h()) break;
                this.a(0x19 | this.H);
                return;
            }
            case 22: {
                if (!this.h()) break;
                if (this.ac) {
                    this.v -= 8192;
                    this.G &= 0xFFFFFFFD;
                    this.a(0 | this.H);
                    this.L.c = 0;
                    return;
                }
                this.v += 24576;
                this.a(0x12 | this.H);
                return;
            }
            case 14: 
            case 15: 
            case 16: {
                if (this.Z) {
                    this.Z = false;
                    this.aa = false;
                    this.a(0x11 | this.H);
                    return;
                }
                if (this.ad) {
                    this.y = (this.aa ? a[this.W] : 5120) * n;
                } else if (--this.R < 0) {
                    this.y = 0;
                }
                if ((this.G & 1) != 0) {
                    this.y = 0;
                    this.a(0 | this.H);
                    return;
                }
                if (this.l == 15 && this.z > 3120) {
                    this.a(0x10 | this.H);
                    return;
                }
                if (this.l != 14 || this.z < 0) break;
                this.a(0xF | this.H);
                return;
            }
            case 17: {
                if (this.W < 2 || this.W > 3) {
                    this.v += -12288;
                    this.z = -15360;
                    this.S = 0;
                }
                this.a(0x23 | this.H);
                return;
            }
            case 35: {
                if (this.S++ > 2) {
                    this.a(0x10 | this.H);
                }
                this.y = (this.aa ? 8192 : 5120) * n;
                return;
            }
            case 23: {
                if (this.S++ <= 4) break;
                if (this.w()) {
                    this.a(0 | this.H);
                } else {
                    this.a(2 | this.H);
                }
                this.y = 0;
                return;
            }
            case 5: 
            case 6: {
                if ((this.G & 1) == 0 || !this.h()) break;
                if (this.T <= 0) {
                    this.a(3 | this.H);
                    return;
                }
                this.a(0 | this.H);
                return;
            }
            case 3: {
                if (!this.h()) break;
                this.a(4 | this.H);
                return;
            }
            case 4: {
                if (!this.h()) break;
                this.L.a(false);
            }
        }
    }

    public final int p() {
        int n = 0;
        while (n < Q.length) {
            if (Q[n][0] > 0) {
                int[] nArray = Q[n];
                int n2 = nArray[1];
                nArray[1] = n2 - 1;
                if (n2 > 0) {
                    this.c(Q[n][0]);
                    break;
                }
                int[] nArray2 = Q[n];
                nArray2[2] = nArray2[2] - 1;
                if (nArray2[2] < 0) {
                    tjge.g.Q[n][0] = 0;
                    return n;
                }
                this.c(0);
                break;
            }
            ++n;
        }
        return -1;
    }

    private final void c(int n) {
        ++this.V;
        int n2 = this.H == 0 ? 1 : -1;
        switch (n) {
            case 1: {
                if ((this.G & 1) != 0) {
                    if (this.l == 0 || this.l == 2) {
                        if (this.H != 0) {
                            if (this.l == 2 && !this.w()) break;
                            this.y = -8192;
                            this.a(-2147483647);
                            return;
                        }
                        this.a(this.l | Integer.MIN_VALUE);
                        return;
                    }
                    if (this.l != 1) break;
                    if (this.H == 0) {
                        this.y = 0;
                        this.a(Integer.MIN_VALUE);
                        return;
                    }
                    if (this.y != 0) break;
                    this.y = -8192;
                    return;
                }
                if ((this.G & 4) != 0) {
                    this.y = -10240;
                    this.z = 0;
                    return;
                }
                if ((this.G & 2) == 0) break;
                if (this.H == 0) {
                    this.a(this.l | Integer.MIN_VALUE);
                    this.L.c = 0;
                    return;
                }
                if (this.j()) break;
                this.ad = false;
                this.G &= 0xFFFFFFFD;
                this.u -= 8192;
                this.v += 8192;
                this.y = -8192;
                this.z = 12288;
                this.B = 4096;
                this.a(-2147483632);
                return;
            }
            case 2: {
                if ((this.G & 1) != 0) {
                    if (this.l == 0 || this.l == 2) {
                        if (this.H == 0) {
                            if (this.l == 2 && !this.w()) break;
                            this.y = 8192;
                            this.a(1);
                            return;
                        }
                        this.a(this.l);
                        return;
                    }
                    if (this.l != 1) break;
                    if (this.H != 0) {
                        this.y = 0;
                        this.a(0);
                        return;
                    }
                    if (this.y != 0) break;
                    this.y = 8192;
                    return;
                }
                if ((this.G & 4) != 0) {
                    this.y = 10240;
                    this.z = 0;
                    return;
                }
                if ((this.G & 2) == 0) break;
                if (this.H != 0) {
                    this.a(this.l);
                    this.L.c = 0;
                    return;
                }
                if (this.k()) break;
                this.ad = false;
                this.G &= 0xFFFFFFFD;
                this.u += 8192;
                this.v += 8192;
                this.y = 8192;
                this.z = 12288;
                this.B = 4096;
                this.a(16);
                return;
            }
            case 64: 
            case 128: {
                if ((this.G & 1) != 0) {
                    if (this.l == 2) {
                        if (!this.w()) break;
                        this.a(0 | this.H);
                        return;
                    }
                    if (this.H == 0 && this.L.c == 64) {
                        this.a(this.l | Integer.MIN_VALUE);
                        return;
                    }
                    if (this.H != 0 && this.L.c == 128) {
                        this.a(this.l);
                        return;
                    }
                    this.W = this.t();
                    if (this.W == 2 || this.W == 3) {
                        this.aa = false;
                        this.u = this.X;
                        this.a(0x11 | this.H);
                    } else {
                        if (this.W == 5) {
                            this.aa = false;
                        }
                        this.v -= 5120;
                        this.a(0xE | this.H);
                    }
                    this.y = a[this.W] * n2;
                    this.z = b[this.W];
                    this.ad = true;
                    this.B = 4096;
                    this.L.c = 0;
                    this.G &= 0xFFFFFFFE;
                    return;
                }
                if ((this.G & 4) != 0) {
                    this.z = -6144;
                    return;
                }
                if (this.l != 14 && this.l != 15 || !this.aa || this.X >= 0 || this.Y >= 0) break;
                this.v -= 20480;
                this.z = -5120;
                this.aa = false;
                this.a(0x19 | this.H);
                return;
            }
            case 8: {
                if ((this.G & 1) != 0) {
                    if (this.l == 2) {
                        this.S = 0;
                        this.y = 8192 * n2;
                        this.a(0x17 | this.H);
                        return;
                    }
                    if (this.d(1)) {
                        this.G = 2;
                        this.B = 0;
                        this.v += 24576;
                        this.ac = false;
                        this.a(0x16 | this.H);
                        return;
                    }
                    this.y = 0;
                    this.a(2 | this.H);
                    this.L.c = 0;
                    return;
                }
                if ((this.G & 2) != 0) {
                    this.z = 4096;
                    this.a(21 - (21 - this.l + 1) % 4 | this.H);
                    return;
                }
                if ((this.G & 4) == 0) break;
                this.z = 6144;
                return;
            }
            case 32: {
                if ((this.G & 4) != 0) {
                    this.z = -6144;
                    return;
                }
                if ((this.G & 2) != 0) {
                    this.z = -4096;
                    this.a(18 + (this.l - 18 + 1) % 4 | this.H);
                    return;
                }
                if (this.l == 2) {
                    if (this.w()) {
                        this.a(0 | this.H);
                    }
                    return;
                }
                if (this.a(false)) {
                    return;
                }
                if (this.d(0)) {
                    this.G = 2;
                    this.z = -8192;
                    this.B = 0;
                    this.a(0x12 | this.H);
                    return;
                }
            }
            case 16: {
                int n3;
                int n4;
                if (this.af) {
                    return;
                }
                if (this.L.c == 32 && (this.G & 1) != 0) {
                    this.y = 0;
                    n4 = 0;
                } else if (this.l == 0) {
                    this.y = 0;
                    n4 = 1;
                } else if (this.l == 2) {
                    this.y = 0;
                    n4 = 2;
                } else if (this.l == 25) {
                    n4 = 3;
                } else {
                    return;
                }
                if (this.L.z.J) {
                    if (this.V < 5) {
                        return;
                    }
                    this.U = 0;
                    n3 = -2147483637;
                    this.V = 0;
                } else {
                    if (e[this.U] <= 0) {
                        this.a(am[this.U][n4][2] | this.H);
                        return;
                    }
                    n3 = am[this.U][n4][0] | this.H;
                }
                boolean bl = false;
                int n5 = this.a(ak, n4, 0);
                int n6 = this.a(ak, n4, 1);
                k k2 = tjge.k.a(10, n3, n5, n6, 26, null);
                if (k2 == null) break;
                if (!k2.d) {
                    switch (n4) {
                        case 0: {
                            k2.z = -12288;
                            break;
                        }
                        case 1: 
                        case 2: {
                            k2.y = 12288 * n2;
                            break;
                        }
                        case 3: {
                            k2.y = 12288 * n2;
                            k2.z = 12288;
                        }
                    }
                }
                this.a(am[this.U][n4][1] | this.H);
                if (this.L.z.J) {
                    k2.y = 4096;
                    k2.z = 6144;
                    k2.B = 2048;
                    k2.e = true;
                } else {
                    int n7 = this.U;
                    e[n7] = e[n7] - 1;
                }
                this.L.c = 0;
                return;
            }
            case 1024: {
                if ((this.G & 1) == 0 || e[2] <= 0) break;
                if (this.l == 0) {
                    this.a(0xC | this.H);
                    return;
                }
                if (this.l != 2) break;
                this.a(0xD | this.H);
                return;
            }
            case 2048: {
                if ((this.G & 1) == 0 || this.l != 0 && this.l != 2 || !this.s()) break;
                if (this.l == 0) {
                    this.a(0x1E | this.H);
                } else {
                    this.a(0x1F | this.H);
                }
                this.y = 0;
                return;
            }
            case 4096: {
                int n8;
                if ((this.G & 1) != 0 && (this.l == 0 || this.l == 2) && e[n8 = (this.U + 1) % 2] + f[n8] > 0) {
                    this.U = n8;
                    this.s();
                    this.a((this.l == 0 ? 30 : 31) | this.H);
                }
                this.L.c = 0;
                return;
            }
            default: {
                if (this.l == 1) {
                    this.y = 0;
                    this.a(0 | this.H);
                    return;
                }
                if ((this.G & 4) == 0) break;
                this.y = 0;
                this.z = 0;
            }
        }
    }

    private final boolean s() {
        if (e[this.U] < c[this.U] && f[this.U] > 0) {
            int n = c[this.U] - e[this.U];
            if (f[this.U] >= n) {
                if (this.U != 0) {
                    int n2 = this.U;
                    f[n2] = f[n2] - n;
                }
                int n3 = this.U;
                e[n3] = e[n3] + n;
            } else {
                int n4 = this.U;
                e[n4] = e[n4] + f[this.U];
                tjge.g.f[this.U] = 0;
            }
            return true;
        }
        return false;
    }

    protected final boolean a(h h2) {
        if (!h2.b(1) || this.l == 23 || !this.d(h2)) {
            return false;
        }
        switch (h2.h) {
            case 9: 
            case 10: 
            case 12: {
                this.c(h2.m(), h2.H);
                return true;
            }
            case 1: 
            case 3: {
                if (h2.l != 7) break;
                this.w = 0;
                if (h2.H == 0) {
                    if (!this.k()) {
                        this.u += 8192;
                    }
                } else if (!this.j()) {
                    this.u -= 8192;
                }
                this.c(h2.m(), h2.H);
                break;
            }
            case 4: {
                this.c(3, h2.H);
            }
        }
        return false;
    }

    protected final void c(h h2) {
        switch (h2.h) {
            case 1: 
            case 2: 
            case 3: 
            case 4: 
            case 5: {
                if (this.l != 23 || (this.G & 1) == 0 || !this.w()) break;
                this.y = 0;
                this.a(0x18 | this.H);
                return;
            }
            case 11: 
            case 13: {
                int n = h2.H == 0 ? h2.u + (h2.p << 10) : h2.u + (h2.q << 10);
                if (this.H != h2.H) break;
                if (this.H == 0) {
                    this.u = n - (this.q << 10);
                    return;
                }
                this.u = n - (this.p << 10);
            }
        }
    }

    private final void c(int n, int n2) {
        if (this.T <= 0 || n <= 0) {
            return;
        }
        if (this.L.z.w != 0 && this.L.z.w != 5) {
            return;
        }
        this.T -= n;
        this.y = 0;
        if ((this.G & 1) != 0) {
            if (this.w()) {
                if (n2 == this.H) {
                    this.a(6 | this.H);
                } else {
                    this.a(5 | this.H);
                }
            } else if (this.T <= 0) {
                this.a(3 | this.H);
            }
        } else if ((this.G & 2) != 0) {
            this.G &= 0xFFFFFFFD;
            this.a(5 | this.H);
        } else {
            if ((this.G & 4) != 0) {
                this.z = 0;
                if (this.T <= 0) {
                    this.ai = true;
                    tjge.j.i[1] = 2;
                    this.L.z.a(1);
                }
                return;
            }
            this.z = 6144;
            this.B = 4096;
            this.a(5 | this.H);
        }
        this.aa = false;
        this.Z = false;
        this.ad = false;
        this.X = -1;
        this.Y = -1;
    }

    private final int t() {
        int n;
        int n2;
        int n3;
        if (this.H == 0) {
            n3 = this.q;
            n2 = this.q + 10;
            n = 1;
        } else {
            n3 = this.p;
            n2 = this.p - 10;
            n = -1;
        }
        int n4 = (this.u >> 10) + n3 >> 3;
        int n5 = (this.u + this.w >> 10) + n2 >> 3;
        int n6 = (this.v + this.x >> 10) - 2 >> 3;
        int n7 = n6 - 7;
        int n8 = n4;
        while (n8 != n5 + n) {
            int n9 = n7;
            while (n9 <= n6) {
                int n10 = this.a(n8, n9);
                if ((n10 & 3) != 0) {
                    int n11 = n9 - n7;
                    switch (n11) {
                        case 0: {
                            return 5;
                        }
                        case 1: 
                        case 2: {
                            if ((this.G & 1) == 0) {
                                return 5;
                            }
                        }
                        case 3: 
                        case 4: {
                            int n12 = this.a(n8 - n, n9);
                            int n13 = this.a(n8, n9 - 1);
                            if (n12 == 0 && n13 == 0) {
                                this.X = n > 0 ? n8 << 13 : (n8 << 3) + 8 << 10;
                                this.X += this.H == 0 ? -10240 : 10240;
                                this.Y = (n9 << 13) + 40960;
                                if (n11 < 3) {
                                    return 4;
                                }
                                if (n11 < 4) {
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
                ++n9;
            }
            n8 += n;
        }
        return 0;
    }

    private final void u() {
        if (!this.aa || !this.ad) {
            return;
        }
        if (this.d(0)) {
            this.z = 0;
            this.B = 0;
            this.G = 2;
            this.a(0x12 | this.H);
            return;
        }
        if (this.X < 0 && this.Y < 0) {
            this.t();
        }
        if (this.X >= 0 && this.Y >= 0) {
            if (Math.abs(this.v - this.Y) <= Math.abs(this.x)) {
                if (!this.x()) {
                    this.w = this.X - this.u;
                    this.x = this.Y - this.v;
                    this.y = 0;
                    this.z = 0;
                    this.Z = true;
                    return;
                }
            } else if (Math.abs(this.u - this.X) <= Math.abs(this.w)) {
                this.y = 0;
                this.w = 0;
            }
        }
    }

    private final boolean d(int n) {
        int n2 = this.u + this.w >> 13;
        int n3 = n == 0 ? this.r : 10;
        int n4 = (this.v >> 10) + n3 >> 3;
        if (this.a(n2, n4) == 4) {
            while (this.a(--n2, n4) == 4) {
            }
            this.u = (n2 << 3) + 16 << 10;
            this.y = 0;
            this.w = 0;
            return true;
        }
        return false;
    }

    public final boolean l() {
        if (this.x > 0) {
            return false;
        }
        int n = (this.v >> 10) + this.r >> 3;
        int n2 = (this.v + this.x >> 10) + this.r >> 3;
        int n3 = this.u + this.w >> 13;
        int n4 = n;
        while (n4 >= n2) {
            int n5 = this.a(n3, n4);
            if ((n5 & 3) != 0) {
                this.z = 0;
                this.x = ((n4 << 3) + 9 << 10) - (this.v + (this.r << 10));
                return true;
            }
            --n4;
        }
        this.B = 4096;
        return false;
    }

    public final boolean q() {
        if (this.x < 0) {
            return false;
        }
        int n = (this.v >> 10) + this.s >> 3;
        int n2 = (this.v + this.x >> 10) + this.s >> 3;
        int n3 = n;
        while (n3 <= n2) {
            int n4 = (this.u + this.w >> 10) - 3 >> 3;
            int n5 = this.u + this.w >> 10 >> 3;
            int n6 = (this.u + this.w >> 10) + 3 >> 3;
            int n7 = this.a(n5, n3);
            if ((n7 & 3) != 0) {
                n7 = this.a(n4, n3);
                int n8 = this.a(n6, n3);
                if ((n7 & 3) != 0 && (n8 & 3) != 0) {
                    this.z = 0;
                    this.x = (n3 << 13) - (this.v + (this.s << 10));
                    return true;
                }
            }
            ++n3;
        }
        this.B = 4096;
        return false;
    }

    public final boolean j() {
        if (this.w > 0) {
            return false;
        }
        int n = (this.u + this.w >> 10) + this.p >> 3;
        int n2 = (this.u >> 10) + this.p >> 3;
        int n3 = (this.v >> 10) + this.r + 2 >> 3;
        int n4 = (this.v >> 10) + this.s - 4 >> 3;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = n2;
            while (n6 >= n) {
                int n7 = this.a(n6, n5);
                if ((n7 & 3) != 0) {
                    this.y = 0;
                    this.u &= 0xFFFFFC00;
                    this.w = ((n6 << 3) + 8 << 10) - (this.u + (this.p << 10));
                    return true;
                }
                --n6;
            }
            ++n5;
        }
        return false;
    }

    public final boolean k() {
        if (this.w < 0) {
            return false;
        }
        int n = (this.u >> 10) + this.q >> 3;
        int n2 = (this.u + this.w >> 10) + this.q >> 3;
        int n3 = (this.v >> 10) + this.r + 2 >> 3;
        int n4 = (this.v >> 10) + this.s - 4 >> 3;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = n;
            while (n6 <= n2) {
                int n7 = this.a(n6, n5);
                if ((n7 & 3) != 0) {
                    this.y = 0;
                    this.u &= 0xFFFFFC00;
                    this.w = ((n6 << 3) - 1 << 10) - (this.u + (this.q << 10));
                    return true;
                }
                ++n6;
            }
            ++n5;
        }
        return false;
    }

    private final boolean v() {
        return this.T > 0 && !this.ae && (this.l == 0 || this.l == 1 || this.l == 2 || this.l == 30 || this.l == 31 || this.l == 18 || this.l == 19 || this.l == 20 || this.l == 21 || this.l == 25 || this.l == 14 || this.l == 15 || this.l == 32);
    }

    private final int a(int[][] nArray, int n, int n2) {
        int n3 = 1;
        if (this.H != 0) {
            n3 = -1;
        }
        int n4 = 0;
        if (n2 == 0) {
            n4 = (nArray[n][n2] << 10) * n3;
            n4 += this.u;
        } else {
            n4 = nArray[n][n2] << 10;
            n4 += this.v;
        }
        return n4;
    }

    protected final int m() {
        switch (this.l) {
            case 24: {
                return 10;
            }
        }
        return 0;
    }

    private final boolean w() {
        int n = this.u >> 13;
        int n2 = (this.v >> 10) + this.r >> 3;
        int n3 = 2;
        while (n3 >= 0) {
            int n4 = this.a(n, n2 - n3);
            if ((n4 & 3) != 0) break;
            --n3;
        }
        return n3 < 0;
    }

    private final boolean x() {
        int n = this.u >> 13;
        int n2 = (this.v + this.x >> 10) + this.s >> 3;
        int n3 = 0;
        while (n3 < 2) {
            int n4 = this.a(n, n2 + n3);
            if ((n4 & 3) != 0) break;
            ++n3;
        }
        return n3 < 2;
    }

    public final boolean a(boolean bl) {
        if (bl) {
            this.ab = true;
        } else if (this.ab && (this.G & 1) != 0) {
            this.y = 0;
            this.a(0x21 | this.H);
            this.L.z.a(2);
            return true;
        }
        return false;
    }

    public final void b(int n, int n2) {
        this.u = n << 14;
        this.v = n2 << 14;
        this.a(0 | this.H);
        tjge.j.a.a();
    }

    private void y() {
        this.X = -1;
        this.Y = -1;
        this.ad = false;
        this.Z = false;
        this.aa = true;
        this.W = 0;
    }

    public final void a(e e2) {
        switch (e2.l) {
            case 0: {
                f[1] = f[1] + e2.e;
                tjge.g.f[1] = Math.min(99, f[1]);
                return;
            }
            case 1: {
                e[2] = e[2] + e2.e;
                tjge.g.e[2] = Math.min(3, e[2]);
                return;
            }
            case 2: {
                this.T += e2.e;
                this.T = Math.min(10, this.T);
            }
        }
    }

    static {
        tjge.g.Q[0] = new int[3];
        tjge.g.Q[1] = new int[3];
        tjge.g.Q[2] = new int[3];
        tjge.g.Q[3] = new int[3];
        tjge.g.f[0] = d[0];
        tjge.g.f[1] = d[1];
        tjge.g.f[2] = d[2];
        ak = new int[][]{{-2, -56}, {28, -26}, {28, -16}, {30, 11}};
        al = new int[][]{{0, -32}, {0, -24}};
        am = new int[][][]{new int[][]{{0, 7, 29}, {1, 8, 27}, {1, 9, 28}, {2, 26, 25}}, new int[][]{{3, 7, 29}, {4, 10, 27}, {4, 11, 28}, {5, 26, 25}}};
    }
}

