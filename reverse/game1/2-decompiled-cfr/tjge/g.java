/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.a;
import tjge.b;
import tjge.d;
import tjge.l;

public class g {
    public boolean p;
    protected int q;
    protected d r;
    protected boolean s;
    protected int t;
    protected boolean u;
    protected int v;
    protected short w;
    protected int x;
    protected int y;
    protected int z;
    protected int A;
    public int B;
    public int C;
    public int D;
    public int E;
    public int F;
    public int G;
    public int H;
    public int I;
    public int J;
    public int K;
    public int L;
    public int M;
    public int N;

    public g(int n, d d2) {
        this.q = n;
        this.r = d2;
        this.p = false;
        this.s = true;
    }

    public boolean a(int n, int n2, int n3, byte[] byArray, boolean bl) {
        this.a(n);
        this.C = n2 << 10;
        this.D = n3 << 10;
        this.F = 0;
        this.E = 0;
        this.H = 0;
        this.G = 0;
        this.J = 0;
        this.I = 0;
        this.K = 12288;
        this.L = 12288;
        this.M = 0;
        this.N = 0;
        return true;
    }

    public final void b() {
        this.p = false;
    }

    public final void a(int n) {
        this.t = n;
        if ((n &= 0xFFFFFF) < 0 || n > this.r.a()) {
            return;
        }
        if ((this.t & Integer.MIN_VALUE) == 0) {
            this.x = this.r.f[n];
            this.y = this.r.g[n];
        } else {
            this.x = -this.r.g[n];
            this.y = -this.r.f[n];
        }
        if ((this.t & 0x40000000) == 0) {
            this.z = this.r.h[n];
            this.A = this.r.i[n];
        } else {
            this.z = -this.r.i[n];
            this.A = -this.r.h[n];
        }
        if (this.M == 270) {
            int n2 = 0;
            this.z = this.x = this.z;
            n2 = this.y;
            this.y = this.A;
            this.A = n2;
        }
        this.w = this.r.a(n);
        this.v = 0;
        this.u = false;
    }

    public final void c() {
        ++this.v;
        if (this.v >= this.w) {
            this.v = this.s ? 0 : --this.v;
            this.u = true;
        }
    }

    public final boolean d() {
        return this.u;
    }

    public void e() {
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
        this.C += this.E;
        this.D += this.F;
    }

    public void a() {
    }

    public void a(l l2) {
    }

    public void a(Graphics graphics, int n, int n2) {
        short s;
        short s2;
        short s3;
        short s4;
        int n3 = (this.C >> 10) - n;
        int n4 = (this.D >> 10) - n2;
        int n5 = this.t & Integer.MIN_VALUE;
        int n6 = this.t & 0x40000000;
        if (n5 != 0) {
            s4 = -this.r.k;
            s3 = -this.r.j;
        } else {
            s4 = this.r.j;
            s3 = this.r.k;
        }
        if (n3 + s3 < 0 || n3 + s4 > a.a) {
            return;
        }
        if (n6 != 0) {
            s2 = -this.r.m;
            s = -this.r.l;
        } else {
            s2 = this.r.l;
            s = this.r.m;
        }
        if (n4 + s < 0 || n4 + s2 > a.b) {
            return;
        }
        this.r.a(graphics, n3, n4, this.t, this.v, this.N, this.M);
    }

    public final boolean a(g g2) {
        if (this == g2 || this.x == this.y || this.z == this.A || g2.x == g2.y || g2.z == g2.A) {
            return false;
        }
        int n = (this.C >> 10) + this.x;
        int n2 = (this.C >> 10) + this.y;
        int n3 = (this.D >> 10) + this.z;
        int n4 = (this.D >> 10) + this.A;
        int n5 = (g2.C >> 10) + g2.x;
        int n6 = (g2.C >> 10) + g2.y;
        int n7 = (g2.D >> 10) + g2.z;
        int n8 = (g2.D >> 10) + g2.A;
        return n2 >= n5 && n <= n6 && n4 >= n7 && n3 <= n8;
    }

    public final boolean a(b b2) {
        if (this.E >= 0) {
            return false;
        }
        int n = this.D + this.F >> 10;
        int n2 = (this.C + this.E >> 10) + this.x >> 4;
        int n3 = n + this.z + 1 >> 4;
        int n4 = n + this.A - 2 >> 4;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = 0;
            while (n6 < 2) {
                n = b2.a(n2 + n6, n5, false);
                if (n == 1) {
                    this.G = 0;
                    this.C &= 0xFFFFFC00;
                    this.E = ((n2 + n6 << 4) + 15 << 10) - (this.C + (this.x << 10));
                    return true;
                }
                ++n6;
            }
            ++n5;
        }
        return false;
    }

    public final boolean b(b b2) {
        if (this.E <= 0) {
            return false;
        }
        int n = this.D + this.F >> 10;
        int n2 = (this.C + this.E >> 10) + this.y >> 4;
        int n3 = n + this.z + 1 >> 4;
        int n4 = n + this.A - 2 >> 4;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = 0;
            while (n6 < 2) {
                n = b2.a(n2 - n6, n5, false);
                if (n == 1) {
                    this.G = 0;
                    this.C &= 0xFFFFFC00;
                    this.E = ((n2 - n6 << 4) - 1 << 10) - (this.C + (this.y << 10));
                    return true;
                }
                ++n6;
            }
            ++n5;
        }
        return false;
    }

    public boolean c(b b2) {
        if (this.F < 0) {
            return false;
        }
        int n = (this.D + this.F >> 10) + this.A >> 4;
        int n2 = (this.C + this.E >> 10) + this.x + 1 >> 4;
        int n3 = (this.C + this.E >> 10) + this.y - 1 >> 4;
        int n4 = n2;
        while (n4 <= n3) {
            int n5 = b2.a(n4, n, false);
            if (n5 == 1) {
                this.J = 0;
                this.H = 0;
                this.F = ((n << 4) - this.A << 10) - this.D;
                this.D += this.F;
                this.F = 0;
                return true;
            }
            ++n4;
        }
        return false;
    }

    public final boolean d(b b2) {
        if (this.F > 0) {
            return false;
        }
        int n = this.C + this.E >> 14;
        int n2 = (this.D + this.F >> 10) + this.z - 4 >> 4;
        if (b2.a(n, n2, false) == 1) {
            this.H = 0;
            this.F = ((n2 << 4) + 15 - this.z + 4 << 10) - this.D;
            this.J = 4096;
            return true;
        }
        return false;
    }
}

