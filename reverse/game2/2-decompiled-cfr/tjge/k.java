/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import tjge.a;
import tjge.d;
import tjge.e;
import tjge.h;

public final class k
extends h {
    public static final int[] a = new int[]{1, 1, 1, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0};
    public int b;
    private int f;
    public int c;
    private boolean Q;
    public boolean d;
    private boolean R;
    public boolean e;

    public k(int n, d d2) {
        super(n, d2);
    }

    public final void b() {
        switch (this.h) {
            case 10: {
                switch (this.l) {
                    case 9: {
                        if (Math.abs(this.z) <= 2048) {
                            this.a(0xA | this.H);
                        }
                    }
                    case 10: {
                        if (this.z > 3072) {
                            this.a(0xB | this.H);
                        }
                    }
                    case 0: 
                    case 1: 
                    case 2: 
                    case 3: 
                    case 4: 
                    case 5: 
                    case 11: 
                    case 12: {
                        ++this.f;
                    }
                    case 6: {
                        if (this.h == 6 && !this.b(1)) {
                            if (this.b-- <= 0) {
                                this.y = 0;
                            }
                        } else if (this.f > 30) {
                            this.R = true;
                        }
                        this.n();
                        boolean bl = false;
                        if (this.y > 0) {
                            if (this.k()) {
                                this.d = true;
                            } else if (this.u > this.L.m + this.L.q + 8192) {
                                this.R = true;
                            }
                        } else if (this.y < 0) {
                            if (this.j()) {
                                this.d = true;
                            } else if (this.u < this.L.m - 8192) {
                                this.R = true;
                            }
                        }
                        if (this.z < 0) {
                            if (this.l()) {
                                this.d = true;
                            } else if (this.v < this.L.n - 8192) {
                                this.R = true;
                            }
                        } else if (this.z > 0) {
                            if (this.a()) {
                                this.d = true;
                            } else if (this.v > this.L.n + this.L.r + 8192) {
                                this.R = true;
                            }
                        }
                        if ((this.Q || this.d) && (this.l == 6 || this.l == 9 || this.l == 10 || this.l == 11 || this.l == 12)) {
                            tjge.k.a(12, 0, this.u, this.v, this.K, null);
                            this.e();
                            break;
                        }
                        if (this.l == 11 && this.e && this.v > 149504) {
                            e e2 = (e)this.L.z.c(20, -1);
                            ((e)this.L.z.c(20, -1)).u = this.u;
                            e2.v = this.v + 10240;
                            e2.y = 0;
                            e2.z = 0;
                            e2.B = 0;
                            e2.a(0);
                            e2.M = false;
                            this.B = 0;
                            this.z = 0;
                            this.y = 0;
                            this.e();
                            break;
                        }
                        if (this.Q) {
                            this.y = 0;
                            this.z = 0;
                            this.B = 0;
                            this.j = false;
                            this.a(7 | this.H);
                            break;
                        }
                        if (this.d) {
                            if (this.y > 0) {
                                this.u += 2048;
                            } else if (this.y < 0) {
                                this.u -= 2048;
                            } else if (this.z < 0) {
                                this.v -= 2048;
                            } else if (this.z > 0) {
                                this.v += 2048;
                            }
                            this.y = 0;
                            this.z = 0;
                            this.B = 0;
                            this.j = false;
                            this.a(8 | this.H);
                            break;
                        }
                        if (!this.R) break;
                        this.e();
                        break;
                    }
                    case 7: 
                    case 8: {
                        if (!this.h()) break;
                        this.e();
                    }
                }
                return;
            }
            case 16: {
                if (this.Q) {
                    this.e();
                    return;
                }
                if (!(this.y < 0 && this.j() || this.y > 0 && this.k() || !this.a()) && !this.b(this.L.y)) break;
                tjge.k.a(12, 0, this.u, this.v, 255, null);
                this.Q = true;
                return;
            }
            case 12: {
                if (this.h()) {
                    this.e();
                    return;
                }
                this.n();
                return;
            }
            case 9: {
                ++this.b;
                if (this.b == 8) {
                    int n = this.L.y.u - this.u;
                    int n2 = Math.abs(this.v - this.L.y.v);
                    int n3 = Math.abs(n);
                    if (n3 > n2 * 4 / 3) {
                        this.y = this.u > this.L.y.u ? -8192 : 8192;
                        this.z = -(n2 / (n3 / 8192));
                    } else {
                        this.z = -10240;
                        this.y = n / (n2 / 10240);
                    }
                    this.B = 0;
                    if (this.y < -4096) {
                        this.a(1);
                    } else if (this.y > 4096) {
                        this.a(-2147483647);
                    }
                }
                if (this.e) {
                    if (this.b(this.L.y)) {
                        this.L.y.ag = true;
                        this.L.y.T = 0;
                        this.Q = true;
                    }
                } else {
                    this.n();
                }
                if (this.Q) {
                    tjge.k.a(12, 0, this.u, this.v, 0, null);
                    tjge.k.a(12, 0, this.u + 2048, this.v - 4096, 0, null);
                    this.e();
                    return;
                }
                if (this.u >= this.L.m - 10240 && this.v >= this.L.n - 10240 && this.u <= this.L.m + this.L.q + 10240) break;
                this.e();
            }
        }
    }

    protected final void c(h h2) {
        switch (this.h) {
            case 10: {
                if (h2.h == 11 || h2.h == 17 || h2.h == 21 || h2.h == 13 || h2.h == 19) {
                    this.d = true;
                    return;
                }
                this.Q = true;
                return;
            }
            case 9: {
                this.Q = true;
            }
        }
    }

    public static final k a(int n, int n2, int n3, int n4, int n5, int[] nArray) {
        k k2 = (k)tjge.a.a.z.c(n, -1);
        if (k2 != null) {
            k2.u = n3;
            k2.v = n4;
            k2.y = 0;
            k2.z = 0;
            k2.A = 0;
            k2.B = 0;
            k2.D = 15360;
            k2.E = 0;
            k2.f = 0;
            k2.Q = false;
            k2.d = false;
            k2.R = false;
            k2.j = true;
            k2.e = false;
            k2.a(n2);
            k2.c = 3;
            k2.K = n5;
            switch (n) {
                case 10: {
                    if (k2.l == 9) break;
                    if (k2.l != 6) {
                        k2.c = 1;
                    }
                    int n6 = (k2.u >> 10) + k2.p >> 3;
                    int n7 = (k2.u >> 10) + k2.q >> 3;
                    int n8 = k2.v >> 10 >> 3;
                    while (n6 < n7) {
                        if (k2.a(n6, n8) == 1) {
                            k2.d = true;
                            break;
                        }
                        ++n6;
                    }
                    k2.b();
                    break;
                }
                case 12: {
                    k2.j = false;
                    break;
                }
                case 9: {
                    k2.y = 0;
                    k2.z = -2048;
                    k2.b = 0;
                    k2.a(0);
                }
            }
        }
        return k2;
    }

    protected final int m() {
        switch (this.h) {
            case 10: {
                return a[this.l];
            }
            case 12: {
                return 3;
            }
            case 9: {
                return 2;
            }
        }
        return 0;
    }

    public final boolean a() {
        if (this.x < 0) {
            return false;
        }
        int n = (this.v >> 10) + this.s >> 3;
        int n2 = (this.v + this.x >> 10) + this.s >> 3;
        int n3 = (this.u + this.w >> 10) + this.p + 1 >> 3;
        int n4 = (this.u + this.w >> 10) + this.q - 1 >> 3;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = n;
            while (n6 <= n2) {
                int n7 = this.a(n5, n6);
                if ((n7 & this.c) != 0) {
                    this.z = 0;
                    this.x = (n6 << 13) - (this.v + (this.s << 10));
                    return true;
                }
                ++n6;
            }
            ++n5;
        }
        return false;
    }
}

