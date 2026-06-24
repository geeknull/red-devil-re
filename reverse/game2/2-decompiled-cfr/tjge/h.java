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
import tjge.j;

public class h {
    public boolean g;
    protected int h;
    protected d i;
    protected boolean j;
    protected int k;
    protected int l;
    protected boolean m;
    protected int n;
    protected short o;
    protected int p;
    protected int q;
    protected int r;
    protected int s;
    public int t;
    public int u;
    public int v;
    public int w;
    public int x;
    public int y;
    public int z;
    public int A;
    public int B;
    public int C;
    public int D;
    public int E;
    public int F;
    public int G;
    public int H;
    public int I;
    protected int J;
    protected int K;
    protected a L;
    private static int N = 0;
    private int O;
    private int P;
    public boolean M = true;

    public h(int n, d d2) {
        this.h = n;
        this.i = d2;
        this.g = false;
        this.j = true;
        this.L = a.a;
        this.O = N;
        N += 1000000;
    }

    public boolean a(byte[] byArray) {
        boolean bl = false;
        if (this.t < this.L.z.s && this.L.z.n[this.t]) {
            if (this.h == 13) {
                bl = true;
            } else {
                return false;
            }
        }
        int n = bl ? 4 : byArray[5] & 0x7F;
        int n2 = (byArray[5] & 0x80) << 24;
        int n3 = (byArray[5] & 0x40) << 24;
        this.a(n | n2 | n3);
        int n4 = GameMIDlet.a(byArray, 1, 2);
        int n5 = GameMIDlet.a(byArray, 3, 2);
        this.u = n4 << 10;
        this.v = n5 << 10;
        this.F = byArray[6];
        this.E = 0;
        this.x = 0;
        this.w = 0;
        this.z = 0;
        this.y = 0;
        this.A = 0;
        this.B = 0;
        this.C = 15360;
        this.D = 15360;
        this.J = 0;
        this.j = true;
        this.I = tjge.j.h[this.h];
        return true;
    }

    public final void e() {
        this.g = false;
        tjge.j.e[this.t] = null;
    }

    public final void f() {
        this.e();
        if (this.t < this.L.z.s) {
            this.L.z.n[this.t] = true;
        }
    }

    public final void a(int n) {
        this.k = n;
        this.H = n & 0xFF000000;
        this.l = n &= 0xFFFFFF;
        if (n < 0 || n > this.i.a()) {
            return;
        }
        if ((this.k & Integer.MIN_VALUE) == 0) {
            this.p = this.i.f[n];
            this.q = this.i.g[n];
        } else {
            this.p = -this.i.g[n];
            this.q = -this.i.f[n];
        }
        if ((this.k & 0x40000000) == 0) {
            this.r = this.i.h[n];
            this.s = this.i.i[n];
        } else {
            this.r = -this.i.i[n];
            this.s = -this.i.h[n];
        }
        this.o = this.i.a(n);
        this.n = 0;
        this.m = false;
        ++this.O;
    }

    public final void g() {
        ++this.n;
        if (this.n >= this.o) {
            this.n = this.j ? 0 : --this.n;
            this.m = true;
        }
    }

    public final boolean h() {
        return this.m;
    }

    public void i() {
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
        this.u += this.w;
        this.v += this.x;
    }

    public void b() {
    }

    public void a(Graphics graphics, int n, int n2) {
        if (!this.M) {
            this.M = true;
            return;
        }
        if (this.J == 0 || --this.J > 0 && (this.J & 1) != 0) {
            short s;
            short s2;
            short s3;
            short s4;
            int n3 = (this.u >> 10) - n;
            int n4 = (this.v >> 10) - n2;
            int n5 = this.k & Integer.MIN_VALUE;
            int n6 = this.k & 0x40000000;
            if (n5 != 0) {
                s4 = -this.i.k;
                s3 = -this.i.j;
            } else {
                s4 = this.i.j;
                s3 = this.i.k;
            }
            if (n3 + s3 < 0 || n3 + s4 > 176) {
                return;
            }
            if (n6 != 0) {
                s2 = -this.i.m;
                s = -this.i.l;
            } else {
                s2 = this.i.l;
                s = this.i.m;
            }
            if (n4 + s < 0 || n4 + s2 > 172) {
                return;
            }
            this.i.a(graphics, n3, n4, this.k, this.n, this.F, this.E);
        }
    }

    public final boolean a(int n, int n2, int n3, int n4) {
        int n5 = (this.u >> 10) + this.p;
        int n6 = (this.u >> 10) + this.q;
        int n7 = (this.v >> 10) + this.r;
        int n8 = (this.v >> 10) + this.s;
        return n6 >= n && n5 <= n3 && n8 >= n2 && n7 <= n4;
    }

    public final boolean b(h h2) {
        if (this.p == this.q || this.r == this.s || h2.p == h2.q || h2.r == h2.s) {
            return false;
        }
        int n = (h2.u >> 10) + h2.p;
        int n2 = (h2.u >> 10) + h2.q;
        int n3 = (h2.v >> 10) + h2.r;
        int n4 = (h2.v >> 10) + h2.s;
        return this.a(n, n3, n2, n4);
    }

    public boolean j() {
        if (this.w > 0) {
            return false;
        }
        int n = (this.u + this.w >> 10) + this.p >> 3;
        int n2 = (this.u >> 10) + this.p >> 3;
        int n3 = (this.v + this.x >> 10) + this.r + 1 >> 3;
        int n4 = (this.v + this.x >> 10) + this.s - 1 >> 3;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = n2;
            while (n6 >= n) {
                int n7 = this.a(n6, n5);
                if (n7 == 1) {
                    this.y = 0;
                    this.u &= 0xFFFFFC00;
                    this.w = ((n6 << 3) + 9 << 10) - (this.u + (this.p << 10));
                    return true;
                }
                --n6;
            }
            ++n5;
        }
        return false;
    }

    public boolean k() {
        if (this.w < 0) {
            return false;
        }
        int n = (this.u >> 10) + this.q >> 3;
        int n2 = (this.u + this.w >> 10) + this.q >> 3;
        int n3 = (this.v + this.x >> 10) + this.r + 1 >> 3;
        int n4 = (this.v + this.x >> 10) + this.s - 1 >> 3;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = n;
            while (n6 <= n2) {
                int n7 = this.a(n6, n5);
                if (n7 == 1) {
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

    public boolean l() {
        if (this.x > 0) {
            return false;
        }
        int n = (this.v >> 10) + this.r >> 3;
        int n2 = (this.v + this.x >> 10) + this.r >> 3;
        int n3 = (this.u + this.w >> 10) + this.p + 1 >> 3;
        int n4 = (this.u + this.w >> 10) + this.q - 1 >> 3;
        int n5 = n3;
        while (n5 <= n4) {
            int n6 = n;
            while (n6 >= n2) {
                int n7 = this.a(n5, n6);
                if (n7 == 1) {
                    this.z = 0;
                    this.x = ((n6 << 3) + 9 << 10) - (this.v + (this.r << 10));
                    return true;
                }
                --n6;
            }
            ++n5;
        }
        return false;
    }

    protected final boolean b(int n) {
        return (this.K & n) != 0;
    }

    protected int m() {
        return 0;
    }

    protected boolean a(h h2) {
        return false;
    }

    protected void c(h h2) {
    }

    protected boolean d() {
        return true;
    }

    protected final void n() {
        if (this.K == 0) {
            return;
        }
        int n = 0;
        while (n < tjge.j.g) {
            h h2 = tjge.j.f[n];
            if (h2 != null && h2 != this && h2.g && this.b(h2) && h2.a(this)) {
                this.c(h2);
            }
            ++n;
        }
    }

    protected final boolean d(h h2) {
        if (h2.O != this.P) {
            this.P = h2.O;
            return true;
        }
        return false;
    }

    protected final int a(int n, int n2) {
        return tjge.j.a.b(n << 3, n2 << 3);
    }
}

