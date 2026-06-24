/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.GameMIDlet;
import tjge.c;
import tjge.d;
import tjge.g;
import tjge.h;
import tjge.j;
import tjge.k;

public final class f
extends h {
    private static final int[][] af = new int[][]{{-6, -56, 0, -10, 0}, {28, -26, 10, 0, 1}, {28, -15, 10, 0, 1}, {4, 4, 0, 10, 0x40000000}};
    private static final int[][] ag = new int[][]{{0, -32}, {0, -24}};
    private static final int[] ah = new int[]{16, 0, 0, 8192};
    int a;
    int b;
    int c;
    int d;
    int e;
    int f;
    int Q;
    int R;
    int S;
    int T;
    int U;
    int V;
    int W;
    boolean X;
    int Y;
    int Z;
    int aa;
    boolean ab;
    boolean ac;
    g ad;
    c ae;

    public f(int n, d d2) {
        super(n, d2);
        this.K = 1;
    }

    public final boolean a(byte[] byArray) {
        if (!super.a(byArray)) {
            return false;
        }
        this.c = 0;
        this.W = 0;
        this.V = 4;
        this.Y = this.u;
        this.Z = this.u;
        this.G = 0;
        switch (this.h) {
            case 1: 
            case 3: {
                this.aa = 1 + GameMIDlet.a(3);
                this.d = byArray[7] & 0xFF;
                this.e = byArray[8];
                this.f = byArray[9];
                this.W = byArray[10];
                this.a = this.f + 1;
                if (this.d <= 0) break;
                if (this.H == 0) {
                    this.Z = this.u + (this.d << 10);
                } else {
                    this.Y = this.u - (this.d << 10);
                }
                if (this.e != 22) break;
                this.G = 8;
                break;
            }
            case 4: {
                this.d = byArray[7] & 0xFF;
                this.e = byArray.length > 8 ? byArray[8] : 0;
                this.a = 2;
                if (this.d <= 0) break;
                if (this.e == 22) {
                    this.Y = this.L.m - (this.p << 10);
                    this.Z = this.L.m + this.L.q - (this.q << 10);
                    break;
                }
                if (this.H == 0) {
                    this.Z = this.u + (this.d << 10);
                    break;
                }
                this.Y = this.u - (this.d << 10);
                break;
            }
            case 5: {
                this.S = byArray[7];
                this.a = 1;
                this.c = 5;
                break;
            }
            case 2: {
                byte by = byArray[7];
                this.S = byArray[8];
                this.d = byArray[9];
                this.Y = byArray[9];
                if (tjge.j.e[by] == null) break;
                this.ae = (c)tjge.j.e[by];
            }
        }
        this.T = this.H;
        this.ad = this.L.y;
        this.ac = false;
        this.X = false;
        return true;
    }

    public final void b() {
        this.b = this.H == 0 ? 1 : -1;
        switch (this.h) {
            case 1: 
            case 3: 
            case 4: {
                this.a();
                break;
            }
            case 2: 
            case 5: {
                this.c();
            }
        }
        if (this.G != 6 && this.G != 7 && this.a > 0 && this.ad.l == 23 && Math.abs(this.ad.v - this.v) <= 10240 && Math.abs(this.ad.u - this.u) <= 25600) {
            this.ad.c(this);
        }
    }

    private final void a() {
        this.Q = this.o();
        if (this.Q != this.R) {
            this.ac = false;
            this.R = this.Q;
        }
        if (this.Q > 0) {
            this.ab = this.H == 0 && this.u > this.ad.u || this.H != 0 && this.u < this.ad.u;
            if (!this.ac) {
                this.y = 0;
                this.ac = true;
                this.c = this.Q == 4 && !this.X ? 0 : this.V;
                this.G = 0;
            }
        } else {
            this.ac = false;
        }
        switch (this.G) {
            case 0: {
                if (this.ac) {
                    if (this.ab) {
                        this.H ^= Integer.MIN_VALUE;
                    }
                    this.p();
                    break;
                }
                if (this.c-- < 0 && this.d > 0) {
                    this.G = 4;
                }
                if (this.l == 0) break;
                this.a(0 | (this.d > 0 ? this.H : this.T));
                break;
            }
            case 1: {
                if (this.h()) {
                    this.G = 0;
                    this.c = 8;
                    if (this.h == 3) {
                        this.c = 16;
                    }
                    this.V = this.c;
                    this.a((this.l == 8 ? 0 : 4) | this.H);
                } else if (this.h == 3 && this.n == 2) {
                    int n = this.l == 8 ? 0 : 1;
                    int n2 = 6 | this.H;
                    int n3 = this.u + (ag[n][0] << 10) * this.b;
                    int n4 = this.v + (ag[n][1] << 10);
                    this.a(tjge.k.a(10, n2, n3, n4, 25, null));
                }
                this.X = false;
                break;
            }
            case 2: {
                if (this.c-- >= 0) break;
                this.G = 4;
                this.H ^= Integer.MIN_VALUE;
                this.a(0 | this.H);
                break;
            }
            case 4: 
            case 8: {
                this.y = 4096 * this.b;
                this.X = false;
                if (this.b > 0 && this.u > this.Z || this.b < 0 && this.u < this.Y) {
                    if (this.G == 8) {
                        this.Y = this.L.m + 20480;
                        this.Z = this.L.m + this.L.q - 20480;
                        this.U = 0;
                        this.G = 4;
                    } else {
                        this.G = 2;
                        this.y = 0;
                        this.c = 15;
                    }
                    this.a(0 | this.H);
                    break;
                }
                if (this.l == 3) break;
                this.a(3 | this.H);
                break;
            }
            case 5: {
                this.V = 8;
                if (this.l == 7) {
                    this.X = true;
                    if (this.b(this.ad)) {
                        this.ad.a(this);
                    }
                    if (!this.h()) break;
                    this.G = this.U == 8 ? this.U : 0;
                    this.a(0 | this.H);
                    break;
                }
                if (this.h == 1) {
                    int n = this.l - 8;
                    int n5 = af[n][4] | this.H;
                    int n6 = this.u + (af[n][0] << 10) * this.b;
                    int n7 = this.v + (af[n][1] << 10);
                    k k2 = tjge.k.a(10, n5, n6, n7, 25, null);
                    if (k2 == null) break;
                    if (!k2.d) {
                        k2.y = (af[n][2] << 10) * this.b;
                        k2.z = af[n][3] << 10;
                    }
                    this.G = 1;
                    this.a(this.l | this.H);
                    break;
                }
                if (this.h != 3) break;
                this.a((this.l == 0 ? 8 : 9) | this.H);
                this.G = 1;
                this.V = this.c = 16;
                break;
            }
            case 6: {
                if (!this.h()) break;
                if (this.a > 0) {
                    this.X = false;
                    this.G = this.U == 8 ? this.U : 0;
                    this.a(0 | this.H);
                    break;
                }
                this.G = 7;
                this.a(1 | this.H);
                this.J = 10;
                break;
            }
            case 7: {
                if (!this.h()) break;
                if (this.l == 1) {
                    this.a(2 | this.H);
                    break;
                }
                if (this.l != 2 || this.J > 1) break;
                if (this.t >= this.L.z.s) {
                    --this.L.z.C;
                }
                ++this.L.z.D;
                this.f();
            }
        }
        if (this.h == 4 && this.G != 6 && this.G != 7 && this.ad.T > 0 && this.b(this.ad)) {
            this.b(10, 0);
            this.ad.a(this);
        }
    }

    private void c() {
        if (this.h == 2 && this.ae != null && this.ae.c <= 0) {
            this.b(10, 0);
            this.ae = null;
            return;
        }
        switch (this.G) {
            case 0: {
                if (this.l != 0) {
                    this.a(0 | this.H);
                }
                if (this.o() <= 0) break;
                if (this.h == 5) {
                    if (this.H == 0 && this.u > this.ad.u || this.H != 0 && this.u < this.ad.u) {
                        this.H ^= Integer.MIN_VALUE;
                        this.a(this.l | this.H);
                    }
                    if (this.c-- >= 0) break;
                    this.G = 5;
                    return;
                }
                this.G = 5;
                return;
            }
            case 1: {
                if (this.c-- < 0) {
                    this.c = 5;
                    this.G = 0;
                    return;
                }
                if (!this.h()) break;
                this.a(0 | this.H);
                return;
            }
            case 5: {
                if (this.h == 5) {
                    int n = ah[2] | this.H;
                    int n2 = this.u + (ah[0] << 10) * this.b;
                    int n3 = this.v + (ah[1] << 10);
                    k k2 = tjge.k.a(16, n, n2, n3, 1, null);
                    if (k2 == null) break;
                    k2.y = ah[3] * this.b;
                    this.G = 1;
                    this.c = 12;
                    this.a(3 | this.H);
                    return;
                }
                if (this.h != 2) break;
                if (this.ae != null && this.ae.c()) {
                    this.a(3 | this.H);
                    --this.Y;
                }
                if (this.Y > 0) break;
                this.Y = this.d;
                this.c = this.S;
                this.G = 1;
                return;
            }
            case 6: {
                if (!this.h()) break;
                if (this.a > 0) {
                    this.c = 5;
                    this.G = 0;
                    this.a(0 | this.H);
                    return;
                }
                this.G = 7;
                this.a(1 | this.H);
                this.J = 10;
                return;
            }
            case 7: {
                if (!this.h()) break;
                if (this.l == 1) {
                    this.a(2 | this.H);
                    return;
                }
                if (this.l != 2 || this.J > 1) break;
                ++this.L.z.D;
                this.f();
            }
        }
    }

    private final int o() {
        if (this.G == 6 || this.G == 7 || this.G == 5 || this.G == 1 || this.ad.T <= 0) {
            return 0;
        }
        boolean bl = false;
        int n = 0;
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int n5 = 2;
        int n6 = 2;
        boolean bl2 = false;
        if (this.H == 0) {
            n5 = 1;
        } else {
            n6 = 1;
        }
        n = this.L.q * 9 / 10 / (2 / n5);
        n2 = this.L.q * 9 / 10 / (2 / n6);
        n3 = 20480;
        n4 = 20480;
        switch (this.h) {
            case 1: 
            case 3: {
                int n7 = this.u - 30720;
                int n8 = this.u + 30720;
                int n9 = this.v - 20480;
                int n10 = this.v + 20480;
                if (this.ad.u > n7 && this.ad.u < n8 && this.ad.v > n9 && this.ad.v < n10 && this.ad.l != 23 && this.ad.l != 24) {
                    return 4;
                }
                if (this.G == 8) {
                    return 0;
                }
                if (this.e <= 0) break;
                if (this.h == 3) {
                    n3 = this.L.r;
                    n4 = this.L.r;
                    break;
                }
                n7 = n >> 2;
                n8 = n2 >> 2;
                n9 = this.L.r;
                n10 = this.L.r;
                if (this.ad.u < this.u - n7 / this.aa || this.ad.u > this.u + n8 / this.aa) break;
                if (this.ad.v > this.v - n9 && this.ad.v < this.v - (n9 >> 2)) {
                    return 2;
                }
                if (this.ad.v >= this.v + n10 || this.ad.v <= this.v + (n10 >> 2)) break;
                return 3;
            }
        }
        if (this.ad.u < this.u - n || this.ad.u > this.u + n2 || this.ad.v < this.v - n3 || this.ad.v > this.v + n4) {
            return 0;
        }
        return 1;
    }

    protected final boolean a(h h2) {
        if (!h2.b(2) || !this.d(h2) || this.G == 7) {
            return false;
        }
        switch (h2.h) {
            case 0: {
                if (h2.l != 24) break;
                this.b(h2.m(), h2.H);
                break;
            }
            case 10: 
            case 12: {
                this.b(h2.m(), h2.H);
                return true;
            }
        }
        return false;
    }

    private final void b(int n, int n2) {
        if (n <= 0) {
            return;
        }
        this.a -= n;
        this.y = 0;
        this.U = this.G;
        switch (this.h) {
            case 1: 
            case 3: {
                this.G = 6;
                if (n2 == this.H) {
                    this.a(6 | this.H);
                    return;
                }
                this.a(5 | this.H);
                return;
            }
            case 2: {
                this.G = 6;
                this.a(4 | this.H);
                return;
            }
            case 4: {
                if (this.a > 0 || this.G == 6 || this.G == 7) break;
                tjge.k.a(12, 0, this.u - 5120, this.v - 10240, 0, null);
                tjge.k.a(12, 0, this.u + 5120, this.v - 20480, 0, null);
                this.G = 6;
                this.a(0 | this.H);
                return;
            }
            case 5: {
                this.G = 6;
                this.a(1 | this.H);
            }
        }
    }

    public final void a(k k2) {
        if (k2 == null) {
            return;
        }
        int n = 0;
        int n2 = 0;
        int n3 = Math.abs(this.ad.u - k2.u);
        n3 = Math.max(40960, n3);
        int n4 = n3 / 5120;
        int n5 = n4 >>> 1;
        int n6 = 0;
        while (n6 < n5) {
            n2 += n6;
            ++n6;
        }
        n3 = (n3 >>> 2) * 3;
        n2 = (n3 >>> 1) / n2;
        n = (n5 - 1) * n2;
        n = Math.min(15360, n);
        k2.y = this.b * 5120;
        k2.z = -n;
        k2.B = n2;
        k2.D = n;
        k2.b = n4;
    }

    private final void p() {
        if (this.Q == 4) {
            this.y = 0;
            if (--this.W < 0 && --this.c < 0) {
                this.G = 5;
                this.a(7 | this.H);
                return;
            }
            this.a(0 | this.H);
            return;
        }
        switch (this.h) {
            case 1: {
                int[] nArray = new int[]{9, 10, 8, 11};
                if (this.Q == 1) {
                    if (this.c == this.V) {
                        if (this.f > 0) {
                            this.a(nArray[GameMIDlet.a(2)] | this.H);
                        } else {
                            this.a(nArray[0] | this.H);
                        }
                    } else {
                        this.a(this.l | this.H);
                    }
                } else {
                    this.a(nArray[this.Q] | this.H);
                }
                if (this.ad.l == 24 || this.c-- >= 0) break;
                if (this.f == 1 && this.l == nArray[this.f]) {
                    this.ac = false;
                    return;
                }
                if (--this.W >= 0) break;
                this.G = 5;
                return;
            }
            case 3: {
                int[] nArray = new int[]{0, 4};
                if (this.c == this.V && this.f > 0) {
                    this.a(nArray[GameMIDlet.a(2)] | this.H);
                }
                if (this.ad.l == 24 || this.c-- >= 0) break;
                if (this.f == 1 && this.l == nArray[this.f]) {
                    this.ac = false;
                    return;
                }
                if (--this.W >= 0) break;
                this.G = 5;
                return;
            }
            case 4: {
                this.G = 4;
                this.a(3 | this.H);
            }
        }
    }

    protected final int m() {
        if (this.l == 7) {
            return 1;
        }
        return 0;
    }
}

