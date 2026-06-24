/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.GameMIDlet;
import tjge.d;
import tjge.h;
import tjge.j;
import tjge.k;

public final class c
extends h {
    public static final int[][] a = new int[][]{{-12, -50, 9, 1, -10, -10}, {-30, -34, -2147483647, 3, -10, 0}};
    public static final int[][] b = new int[][]{{-8, -8, 1, 1, -10, 0, 2}, {0, 4, 0x40000000, 4, 0, 10, 5}};
    public int c;
    private int N;
    private int O;
    private int P;
    private int Q;
    private int R;
    private int S;
    private int T;
    private int U;
    private int V;
    public boolean d;
    private boolean W;
    private boolean X;
    public boolean e;
    private h Y;
    public static c f;

    public c(int n, d d2) {
        super(n, d2);
    }

    public final boolean a(byte[] byArray) {
        if (!super.a(byArray)) {
            return false;
        }
        switch (this.h) {
            case 11: {
                this.c = 10;
                this.N = this.u;
                break;
            }
            case 17: {
                this.O = byArray[7];
                this.P = byArray[7];
                this.S = byArray[8];
                this.c = 3;
                if (this.S == 0) {
                    this.Q = this.u;
                    this.R = this.u + (byArray[9] << 10);
                    this.y = 2048;
                    break;
                }
                if (this.S != 1) break;
                this.Q = this.v;
                this.R = this.v + (byArray[9] << 10);
                this.z = 2048;
                break;
            }
            case 13: {
                this.c = 3;
                break;
            }
            case 21: {
                this.c = 10;
                this.N = this.u;
                this.P = byArray[7];
                break;
            }
            case 19: {
                this.e = true;
                this.S = 0;
                this.c = 200;
                this.N = 0;
                this.V = 0;
                this.P = this.O = 10;
                this.T = 0;
                this.Q = this.L.m - (this.p << 10);
                this.R = this.L.m + this.L.q - (this.q << 10);
                f = this;
            }
        }
        this.d = false;
        this.W = false;
        this.X = true;
        this.Y = null;
        return true;
    }

    public final void a() {
        this.u = this.L.m + this.L.q / 2;
        this.v = this.L.n - 20480;
        this.c = 16;
        this.N = 0;
        this.O = 10;
        this.P = 16;
        this.Q = this.L.m - 819200;
        this.R = this.L.m + this.L.q + 819200;
        this.S = 1;
        this.d = false;
        this.W = false;
        this.X = true;
        this.Y = null;
        this.e = true;
        this.a(0);
        this.V = 3;
    }

    public final void b() {
        switch (this.h) {
            case 11: {
                if (this.W) {
                    int n;
                    int n2;
                    int n3;
                    int n4;
                    k k2;
                    this.W = false;
                    this.X = false;
                    int n5 = 0;
                    if (this.l >= 2) {
                        n5 = 1;
                    }
                    if ((k2 = tjge.k.a(10, n4 = a[n5][2], n3 = this.u + (a[n5][0] << 10) * (n2 = this.H == 0 ? 1 : -1), n = this.v + (a[n5][1] << 10), 1, null)) != null) {
                        if (n5 == 1) {
                            k2.y = (a[n5][4] << 10) * n2;
                            k2.z = a[n5][5] << 10;
                        } else {
                            this.a(k2);
                        }
                    }
                    this.a(a[n5][3] | this.H);
                } else if (this.h()) {
                    if (this.l == 1) {
                        this.a(0 | this.H);
                    } else if (this.l == 3) {
                        this.a(2 | this.H);
                    }
                    this.X = true;
                }
                if (this.d) {
                    if (this.u == this.N) {
                        this.u += 2048;
                    } else {
                        this.u = this.N;
                        this.d = false;
                    }
                }
                if (this.c <= 0) {
                    this.f();
                    return;
                }
                if (!this.b(this.L.y)) break;
                this.L.y.c(this);
                return;
            }
            case 17: {
                int n;
                int n6;
                int n7;
                int n8;
                int n9;
                k k3;
                if (this.S == 0) {
                    if (this.u < this.Q) {
                        this.y = 2048;
                    } else if (this.u > this.R) {
                        this.y = -2048;
                    }
                } else if (this.S == 1) {
                    if (this.v < this.Q) {
                        this.z = 2048;
                    } else if (this.v > this.R) {
                        this.z = -2048;
                    }
                }
                if (this.P-- < 0 && (k3 = tjge.k.a(10, n9 = b[n8 = this.l / 3][2] | this.H ^ Integer.MIN_VALUE, n7 = this.u + this.y + (b[n8][0] << 10) * (n6 = this.H == 0 ? 1 : -1), n = this.v + this.z + (b[n8][1] << 10), 1, null)) != null) {
                    k3.y = (b[n8][4] << 10) * n6;
                    k3.z = b[n8][5] << 10;
                    this.a(b[n8][3] | this.H);
                    this.P = this.O;
                }
                if (this.l == b[this.l / 3][6]) {
                    if (this.h()) {
                        this.d = false;
                        this.a(b[this.l / 3][6] - 2 | this.H);
                    }
                } else if (this.d) {
                    this.a(b[this.l / 3][6] | this.H);
                } else if (this.l == b[this.l / 3][3] && this.h()) {
                    this.a(b[this.l / 3][3] - 1 | this.H);
                }
                if (this.c > 0) break;
                this.f();
                return;
            }
            case 13: {
                switch (this.l) {
                    case 1: {
                        if (this.c <= 0) {
                            this.L.b(2);
                            this.a(3 | this.H);
                            this.L.z.n[this.t] = true;
                        } else if (this.c < 2) {
                            this.a(2 | this.H);
                        }
                        if (!this.b(this.L.y)) break;
                        this.L.y.c(this);
                        break;
                    }
                    case 2: {
                        if (this.c <= 0) {
                            this.L.b(2);
                            this.a(3 | this.H);
                            this.L.z.n[this.t] = true;
                        }
                        if (!this.b(this.L.y)) break;
                        this.L.y.c(this);
                        break;
                    }
                    case 3: {
                        if (!this.h()) break;
                        this.a(4 | this.H);
                        break;
                    }
                    case 4: {
                        this.I = 10;
                    }
                }
                return;
            }
            case 21: {
                if (this.P == 0) {
                    if (this.b(this.L.y)) {
                        if (this.Y == null) {
                            this.Y = this.L.z.c(22, -1);
                            this.Y.a(5);
                            this.Y.u = this.u;
                            this.Y.v = this.v + (this.r - 10 << 10);
                        }
                        this.L.y.af = true;
                        if (this.L.d != 16) break;
                        this.c = 0;
                        this.L.y.ae = true;
                        return;
                    }
                    this.L.y.af = false;
                    if (this.Y == null) break;
                    this.Y.e();
                    this.Y = null;
                    return;
                }
                if (this.d) {
                    if (this.u == this.N) {
                        this.u += 1024;
                    } else {
                        this.u = this.N;
                        this.d = false;
                    }
                }
                if (this.c > 0) break;
                this.f();
                return;
            }
            case 19: {
                int n;
                int n10;
                if (this.e) {
                    return;
                }
                if (this.l == 0) {
                    boolean bl = false;
                    switch (this.V) {
                        case 0: {
                            if (this.U-- >= 0) break;
                            this.L.z.c();
                            this.a(this.l | (this.H ^= Integer.MIN_VALUE));
                            this.S ^= 1;
                            this.V = 1;
                            break;
                        }
                        case 1: {
                            if (this.L.z.C > 0) break;
                            this.P = 32;
                            bl = true;
                            this.O = 6;
                            this.V = 2;
                            break;
                        }
                        case 2: {
                            if (this.P == 26) {
                                if (this.O-- >= 0) break;
                                bl = true;
                                this.N = 0;
                                this.V = 3;
                                break;
                            }
                            bl = true;
                            break;
                        }
                        case 3: {
                            k k4;
                            if (this.N % 4 < 2 && (this.P > 7 || this.P < 3) && (k4 = tjge.k.a(10, 12, this.u, this.v, 1, null)) != null) {
                                k4.y = 0;
                                k4.z = 8192;
                                k4.B = 1024;
                                k4.D = 10240;
                            }
                            if (this.v < this.L.n - 5120) {
                                this.u = this.S > 0 ? this.L.m - 30720 : this.L.m + this.L.q + 30720;
                                this.U = 20;
                                this.V = 0;
                            } else {
                                bl = true;
                            }
                            ++this.N;
                            this.N %= 4;
                        }
                    }
                    if (bl) {
                        boolean bl2 = false;
                        this.y = this.S > 0 ? -6144 : 6144;
                        this.z = (this.P - 16) * 512;
                        --this.P;
                    } else {
                        this.y = 0;
                        this.z = 0;
                    }
                    if (!this.d) break;
                    this.z = 0;
                    this.y = 0;
                    this.e = true;
                    tjge.j.i[1] = 4;
                    tjge.j.i[2] = 1;
                    this.L.z.a(6);
                    return;
                }
                this.W = false;
                if (this.d) {
                    if (this.l != 5) {
                        this.a(5 | this.H);
                    }
                    if (this.h()) {
                        this.L.z.A = this.L.m;
                        this.L.z.B = this.L.n;
                        tjge.j.i[1] = 1;
                        tjge.j.i[2] = 1;
                        this.L.z.a(6);
                        this.f();
                    } else {
                        n10 = this.v - (2 + GameMIDlet.a(Math.abs(this.r)) << 10);
                        n = 0;
                        while (n < 2) {
                            int n11 = this.u + (this.q - GameMIDlet.a(this.q * 2) << 10);
                            tjge.k.a(12, 0, n11, n10, 0, null);
                            ++n;
                        }
                    }
                    this.y = 0;
                    if (this.N == 1) {
                        this.W = true;
                    }
                    ++this.N;
                } else {
                    if (this.h()) {
                        this.a(1 | this.H);
                    }
                    if (this.P-- < 0) {
                        this.W = true;
                    }
                    if (this.u < this.Q) {
                        this.y = 0;
                        this.u = this.Q;
                    } else if (this.u > this.R) {
                        this.y = 0;
                        this.u = this.R;
                    }
                    if (this.T++ > 5) {
                        this.T = 0;
                        int n12 = this.y = GameMIDlet.a(2) > 0 ? 4096 : -4096;
                    }
                }
                if (!this.W) break;
                int[] nArray = new int[]{-12, -28, -42};
                n10 = this.u + (nArray[this.V] << 10);
                n = this.v - 35840;
                this.y = 0;
                this.a(2 + this.V | this.H);
                k k5 = tjge.k.a(9, 0, n10, n, 1, null);
                if (this.d) {
                    k5.e = true;
                }
                ++this.V;
                this.V %= 3;
                if (this.V == 0) {
                    this.P = this.O * 4;
                    return;
                }
                this.P = this.O;
            }
        }
    }

    public final boolean c() {
        if (this.W || !this.X) {
            return false;
        }
        this.W = true;
        return true;
    }

    protected final boolean a(h h2) {
        if (!h2.b(8) || !this.d(h2)) {
            return false;
        }
        if (h2.h == 10 || h2.h == 12) {
            switch (this.h) {
                case 11: {
                    if (h2.v >= this.v - 20480 || Math.abs(this.u - this.L.m) > 153600) {
                        return true;
                    }
                }
                case 21: {
                    if (this.h == 21 && this.P == 0) {
                        return true;
                    }
                    this.c -= h2.m();
                    if (this.c <= 0) {
                        int n = 0;
                        while (n < 6) {
                            int n2 = 30 - GameMIDlet.a(60);
                            int n3 = 16 + GameMIDlet.a(32);
                            tjge.k.a(12, 0, this.u + (n2 <<= 10), this.v - (n3 <<= 10), 2, null);
                            ++n;
                        }
                        this.L.b(4);
                    } else {
                        this.d = true;
                    }
                    return true;
                }
                case 17: {
                    this.c -= h2.m();
                    if (this.c <= 0) {
                        tjge.k.a(12, 0, this.u, this.v, 0, null);
                    } else {
                        this.d = true;
                    }
                    return true;
                }
                case 13: {
                    if (this.l <= 0 || this.l >= 4) break;
                    if (h2.b(2)) {
                        this.c -= h2.m();
                    }
                    return true;
                }
                case 19: {
                    this.c -= h2.m();
                    if (this.c <= 0 && this.S == 0 && this.u > this.L.m && this.u < this.L.m + this.L.q - 20480) {
                        this.d = true;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    protected final boolean d() {
        if (this.h == 21) {
            return this.c > 0;
        }
        return true;
    }

    public final void a(k k2) {
        if (k2 == null) {
            return;
        }
        int n = 0;
        int n2 = 1;
        int n3 = Math.abs(this.L.y.u - k2.u);
        if (n3 < 40960) {
            k2.y = this.H == 0 ? -2048 : 2048;
            k2.z = -5120;
            k2.B = 2048;
            k2.D = 10240;
            return;
        }
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
        k2.y = this.H == 0 ? -5120 : 5120;
        k2.z = -n + 2048;
        k2.B = n2;
        k2.D = n;
    }
}

