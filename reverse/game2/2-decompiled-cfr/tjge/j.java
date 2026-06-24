/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import java.io.InputStream;
import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.a;
import tjge.b;
import tjge.c;
import tjge.d;
import tjge.f;
import tjge.g;
import tjge.h;
import tjge.i;
import tjge.k;

public final class j {
    public static b a;
    public static d[] b;
    public static boolean[] c;
    public static h[][] d;
    public static h[] e;
    private static byte[] P;
    public static h[] f;
    public static int g;
    public static final int[] h;
    private static int[] Q;
    private static byte[] R;
    public static int[] i;
    public static int[] j;
    public static int[] k;
    public byte[][] l;
    public byte[][] m;
    public boolean[] n;
    public boolean[] o;
    private int S;
    private int T;
    public byte[][] p;
    public byte[][] q;
    private int U;
    public int r;
    private int V;
    public int s;
    public byte[] t;
    public int u;
    public int v;
    public int w;
    public int x;
    public int y;
    public static int z;
    private int W;
    public int A;
    public int B;
    public int C;
    public int D;
    public int E;
    public int F;
    public int G;
    boolean H;
    boolean I;
    boolean J;
    private c X;
    static i K;
    a L;
    static int M;
    static int N;
    public static final int[][] O;

    private j() {
    }

    public final void a() {
        int n;
        g = 0;
        if (this.p[this.r] != null) {
            n = 0;
            while (n < this.p[this.r].length) {
                this.b(this.p[this.r][n]);
                ++n;
            }
        }
        n = 0;
        while (n < this.s) {
            if (e[n] != null && tjge.j.e[n].g) {
                tjge.j.f[tjge.j.g++] = e[n];
            }
            ++n;
        }
        n = this.s;
        while (n < e.length) {
            if (e[n] != null && tjge.j.e[n].g) {
                tjge.j.f[tjge.j.g++] = e[n];
            }
            ++n;
        }
        n = 0;
        while (n < g) {
            f[n].i();
            ++n;
        }
        n = 0;
        while (n < g) {
            f[n].b();
            ++n;
        }
    }

    public final void a(boolean bl) {
        g g2 = this.L.y;
        if (bl) {
            this.E = g2.H == 0 ? g2.u - this.L.q * 1 / 4 : g2.u - this.L.q * 3 / 4;
            int n = g2.v - this.L.r * 7 / 10;
            if (g2.z == 0 || (g2.G & 2) != 0 || g2.z > 0 && n > this.L.n || g2.z < 0 && this.L.n - n > this.L.r * 2 / 5) {
                this.F = n;
                return;
            }
        } else {
            this.E = this.A;
            this.F = this.B;
        }
    }

    public final void b() {
        this.E = this.L.m;
        this.F = this.L.n;
        this.a();
        switch (this.w) {
            case 0: {
                this.a(true);
                break;
            }
            case 5: {
                this.a(false);
                if (this.L.m != this.E || this.L.n != this.F) break;
                if (Q[0] > 0 && e[Q[0]] == null) {
                    this.w = this.x;
                    break;
                }
                if (Q[6] <= 0 || this.C > 0) break;
                if (Q[5] > 0) {
                    this.c();
                    break;
                }
                this.w = this.x;
                break;
            }
            case 6: {
                boolean bl = false;
                if (i[2] == 0) {
                    this.a(true);
                    bl = true;
                } else {
                    this.a(false);
                    if (this.L.m == this.E && this.L.n == this.F) {
                        bl = true;
                    }
                }
                if (!bl || !this.L.y.o()) break;
                this.w = 1;
                break;
            }
            case 1: {
                this.a(i[2] == 0);
                this.e();
                break;
            }
            case 4: {
                this.f();
                break;
            }
            case 2: {
                if ((this.y += 3) < 15) break;
                this.L.y.b(Q[0], Q[1]);
                this.a(true);
                this.L.m = this.E;
                this.L.n = this.F;
                this.w = 3;
                break;
            }
            case 3: {
                if ((this.y -= 3) >= 1) break;
                this.w = this.x;
            }
        }
        int n = 0;
        int n2 = 0;
        if (this.J && (this.L.y.G & 4) != 0) {
            n = this.W;
            n2 = this.L.n >> 10;
            this.W += 8;
        } else {
            this.L.a(this.E, this.F);
            n = this.L.m >> 10;
            n2 = this.L.n >> 10;
            this.b(n, n2);
        }
        a.a(n, n2);
    }

    public final void a(Graphics graphics) {
        a.a(graphics);
        graphics.setClip(0, 0, 176, 204);
        int n = 0;
        int n2 = 0;
        int n3 = 0;
        n = 0;
        while (n < g - 1) {
            n3 = n;
            n2 = n + 1;
            while (n2 < g) {
                if (tjge.j.f[n2].I < tjge.j.f[n3].I) {
                    n3 = n2;
                }
                ++n2;
            }
            if (n != n3) {
                h h2 = f[n];
                tjge.j.f[n] = f[n3];
                tjge.j.f[n3] = h2;
            }
            ++n;
        }
        graphics.setClip(0, 0, 176, 204);
        int n4 = this.L.m >> 10;
        int n5 = this.L.n >> 10;
        n = 0;
        while (n < g) {
            f[n].a(graphics, n4, n5);
            ++n;
        }
        switch (this.w) {
            case 2: 
            case 3: {
                tjge.j.a(graphics, this.y, 0, 172);
            }
            case 0: 
            case 1: 
            case 5: {
                this.b(graphics);
                return;
            }
            case 4: {
                this.c(graphics);
            }
        }
    }

    private void e() {
        g g2 = this.L.y;
        switch (i[0]) {
            case 0: {
                if (i[1] == 0) {
                    if (M == 0) {
                        ++M;
                        tjge.g.Q[0][0] = 2;
                        tjge.g.Q[0][1] = 13;
                        tjge.g.Q[0][2] = 0;
                        tjge.g.Q[1][0] = 16;
                        tjge.g.Q[1][1] = 1;
                        tjge.g.Q[1][2] = 2;
                        return;
                    }
                    if (M == 1) {
                        if (g2.p() == 1) {
                            g2.c();
                            g2.z = 8192;
                            ++M;
                        }
                        g2.y = 10240;
                        return;
                    }
                    if (M != 2 || g2.l != 0) break;
                    this.L.a();
                    return;
                }
                if (i[1] != 9) break;
                if (M == 0) {
                    ++M;
                    g2.a(0x1E | g2.H);
                    return;
                }
                if (g2.l != 0) break;
                g2.a(33);
                this.L.a(true);
                return;
            }
            case 1: {
                if (i[1] == 0) {
                    if (M == 0) {
                        ++M;
                        g2.a(0x1E | g2.H);
                        return;
                    }
                    if (g2.l != 0 || M++ <= 4) break;
                    this.L.a();
                    return;
                }
                if (i[1] == 1) {
                    if (M == 0) {
                        ++M;
                        g2.a(0x1E | g2.H);
                        return;
                    }
                    if (g2.l != 0 || M++ <= 4) break;
                    this.a(4);
                    return;
                }
                if (i[1] == 2) {
                    if (M == 0) {
                        ++M;
                        tjge.g.Q[0][0] = 1;
                        tjge.g.Q[0][1] = 50;
                        tjge.g.Q[0][2] = 0;
                        tjge.j.i[2] = 1;
                        this.A = this.E;
                        this.B = this.F;
                        return;
                    }
                    g2.p();
                    if (g2.u >= this.L.m - 20480) break;
                    this.L.a(true);
                    return;
                }
                if (i[1] != 9) break;
                if (M == 0) {
                    ++M;
                    tjge.g.Q[0][0] = 2048;
                    tjge.g.Q[0][1] = 1;
                    tjge.g.Q[0][2] = 6;
                    tjge.g.Q[1][0] = 2;
                    i[4] = i[4] << 14;
                    tjge.g.Q[1][1] = (i[4] - g2.u + 129024) / 8192;
                    tjge.g.Q[1][2] = 2;
                    tjge.g.Q[2][0] = 16;
                    tjge.g.Q[2][1] = 1;
                    tjge.g.Q[2][2] = 2;
                    tjge.g.Q[3][0] = 8;
                    tjge.g.Q[3][1] = 2;
                    tjge.g.Q[3][2] = 0;
                    g2.U = 1;
                    if (tjge.g.e[g2.U] == tjge.g.c[g2.U]) {
                        return;
                    }
                    if (tjge.g.f[g2.U] > 0) break;
                    tjge.g.f[g2.U] = 1;
                    return;
                }
                if (M == 1) {
                    if (g2.p() != 3) break;
                    ++M;
                    return;
                }
                if (M == 3) {
                    if (g2.p() != 0) break;
                    ++M;
                    return;
                }
                if (g2.l != 0) break;
                if (M == 4) {
                    tjge.j.j[0] = 0;
                    tjge.j.j[1] = 0;
                    tjge.j.j[2] = 1;
                    this.a(4);
                    return;
                }
                if (M != 2) break;
                tjge.g.Q[0][0] = 2;
                tjge.g.Q[0][1] = 4;
                tjge.g.Q[0][2] = 2;
                ++M;
                return;
            }
            case 2: {
                if (i[1] == 0) {
                    if (M == 0) {
                        ++M;
                        g2.a(0x1E | g2.H);
                        return;
                    }
                    if (g2.l != 0 || M++ <= 4) break;
                    this.L.a();
                    return;
                }
                if (i[1] != 9) break;
                if (++M == 10) {
                    g2.a(0x1E | g2.H);
                    return;
                }
                if (g2.l != 0) break;
                this.L.a(true);
                return;
            }
            case 3: {
                if (i[1] == 0) {
                    if (M == 0) {
                        ++M;
                        g2.a(0x1E | g2.H);
                        return;
                    }
                    if (g2.l != 0 || M++ <= 4) break;
                    tjge.j.j[0] = 0;
                    tjge.j.j[1] = 1;
                    tjge.j.j[2] = 0;
                    this.a(4);
                    return;
                }
                if (i[1] == 1) {
                    if (M == 0) {
                        ++M;
                        tjge.g.Q[0][0] = 2;
                        tjge.g.Q[0][1] = 50;
                        tjge.g.Q[0][2] = 0;
                        tjge.j.i[2] = 1;
                        return;
                    }
                    g2.p();
                    if (g2.u <= this.L.m + this.L.q + 20480) break;
                    g2.y = 0;
                    g2.a(0 | g2.H);
                    this.a(4);
                    return;
                }
                if (i[1] != 9) break;
                if (M == 0) {
                    ++M;
                    g2.a(0x1E | g2.H);
                    return;
                }
                if (g2.l != 0 || M++ <= 5) break;
                this.L.a(true);
                return;
            }
            case 4: {
                if (i[1] == 0) {
                    if (M == 0) {
                        ++M;
                        g2.a(0x1E | g2.H);
                        return;
                    }
                    if (g2.l != 0 || M++ <= 4) break;
                    tjge.j.j[0] = 0;
                    tjge.j.j[1] = 0;
                    tjge.j.j[2] = 1;
                    this.a(4);
                    return;
                }
                if (i[1] == 1) {
                    if (M++ == 0) {
                        g2.a(0);
                        return;
                    }
                    if (M <= 4) break;
                    this.L.a();
                    return;
                }
                if (i[1] != 9) break;
                if (M == 0) {
                    ++M;
                    g2.a(0x1E | g2.H);
                    return;
                }
                if (g2.l != 0 || M++ <= 5) break;
                this.L.a(true);
                return;
            }
            case 5: {
                if (i[1] == 0) {
                    if (M == 0) {
                        ++M;
                        g2.a(0x1E | g2.H);
                        return;
                    }
                    if (g2.l != 0 || M++ <= 4) break;
                    tjge.j.j[0] = 0;
                    tjge.j.j[1] = 0;
                    tjge.j.j[2] = 1;
                    this.a(4);
                    return;
                }
                if (i[1] == 1) {
                    if (M++ == 0) {
                        g2.a(0 | Integer.MIN_VALUE);
                        return;
                    }
                    if (M <= 4) break;
                    this.L.a();
                    return;
                }
                if (i[1] == 2) {
                    if (M == 0) {
                        this.X = (c)this.c(19, -1);
                        this.X.a();
                    } else if (M < 22) {
                        this.X.v += 4096;
                    } else if (M == 22) {
                        tjge.j.j[1] = 2;
                        tjge.j.j[2] = 0;
                        this.a(4);
                    }
                    ++M;
                    return;
                }
                if (i[1] == 3) {
                    this.A = this.L.m;
                    this.B = this.L.n;
                    tjge.j.Q[0] = this.X.t;
                    tjge.j.Q[1] = 0;
                    tjge.j.Q[2] = 38;
                    tjge.j.Q[3] = 0;
                    tjge.j.Q[4] = 2;
                    tjge.j.Q[5] = 100;
                    tjge.j.Q[6] = 0;
                    this.a(5);
                    this.X.e = false;
                    return;
                }
                if (i[1] == 4) {
                    switch (M) {
                        case 0: {
                            int n;
                            int n2;
                            this.A = this.X.u - this.L.q / 3;
                            this.B = this.X.v - this.L.r / 4;
                            if (this.L.i % 2 == 0) {
                                n2 = 5 + GameMIDlet.a(3) << 13;
                                n = GameMIDlet.a(3) << 13;
                                tjge.k.a(12, 0, this.X.u - n2, this.X.v - n, 0, null);
                            }
                            if (N == 0) {
                                N = 1;
                                n2 = 0x130000 - this.X.u;
                                n = 616448 - this.X.v;
                                this.X.y = n2 / 20;
                                this.X.z = n / 20;
                                break;
                            }
                            if (this.X.v <= 616448) break;
                            this.X.y = 0;
                            this.X.z = 0;
                            this.X.a(-2147483647);
                            M = 1;
                            break;
                        }
                        case 1: {
                            this.X.v = this.X.v + (N % 1 == 1 ? -2048 : 2048);
                            if (N++ <= 5) break;
                            M = 2;
                            this.X.y = 10240;
                            break;
                        }
                        case 2: {
                            if (this.X.u <= this.L.m + this.L.q + 61440) break;
                            this.X.y = 0;
                            this.A = g2.u - this.L.q / 2;
                            tjge.j.i[1] = 5;
                            tjge.j.i[2] = 1;
                            this.a(1);
                        }
                    }
                    return;
                }
                if (i[1] != 5) break;
                if (M == 0) {
                    if (this.L.m != this.A) break;
                    ++M;
                    g2.a(0);
                    tjge.g.Q[0][0] = 2;
                    tjge.g.Q[0][1] = (0x109000 - g2.u) / 8192;
                    tjge.g.Q[0][2] = 0;
                    tjge.g.Q[1][0] = 128;
                    tjge.g.Q[1][1] = 2;
                    tjge.g.Q[1][2] = 0;
                    tjge.g.Q[2][0] = 2;
                    tjge.g.Q[2][1] = 50;
                    tjge.g.Q[2][2] = 0;
                    tjge.j.i[2] = 0;
                    return;
                }
                if (M == 1) {
                    int n = g2.p();
                    if (n == 0) {
                        this.A = this.L.m;
                        tjge.j.i[2] = 1;
                        return;
                    }
                    if (n != 1) break;
                    g2.a();
                    ++M;
                    return;
                }
                if (M != 2) break;
                g2.p();
                if (g2.u <= this.L.m + this.L.q + 51200) break;
                this.L.a(true);
                return;
            }
            case 6: {
                if (i[1] == 0) {
                    if (M == 0) {
                        ++M;
                        tjge.g.Q[0][0] = 2;
                        tjge.g.Q[0][1] = 10;
                        tjge.g.Q[0][2] = 0;
                        return;
                    }
                    if (M != 1) break;
                    if (g2.p() == 0) {
                        g2.y = 0;
                        tjge.j.j[0] = 0;
                        tjge.j.j[1] = 0;
                        tjge.j.j[2] = 2;
                        this.a(4);
                        return;
                    }
                    g2.y = 10240;
                    return;
                }
                if (i[1] == 1) {
                    if (!g2.ag) break;
                    this.X.e();
                    this.X = null;
                    tjge.j.j[1] = 0;
                    tjge.j.j[2] = 3;
                    this.a(4);
                    return;
                }
                if (i[1] != 2) break;
                if (M == 0) {
                    g2.y = 0;
                    g2.z = 12288;
                    g2.ah = true;
                    ++M;
                    return;
                }
                if (M == 2) {
                    if (g2.ai) {
                        ++M;
                    } else {
                        tjge.j.j[1] = 3;
                        tjge.j.j[2] = 0;
                        this.a(4);
                    }
                    g2.aj.e();
                    g2.e();
                    return;
                }
                if (M == 3) {
                    this.L.a(false);
                    return;
                }
                if (g2.v <= 132 << 10) break;
                int n = 0;
                while (n < 8) {
                    h h2 = this.c(20, -1);
                    if (h2 != null) {
                        h2.u = g2.u + (g2.p << 10) + n % 4 * 14336 + n / 4 * 8192;
                        h2.v = g2.v + 14336 + n / 4 * 8192;
                        h2.a(0);
                    }
                    ++n;
                }
                ++M;
            }
        }
    }

    private void f() {
        block22: {
            block21: {
                boolean bl = this.L.c == 16;
                if (bl) break block21;
                int n = tjge.a.F[3];
                tjge.a.F[3] = n - 1;
                if (n >= 0) break block22;
            }
            if (this.H) {
                switch (i[0]) {
                    case 1: {
                        tjge.j.i[1] = 2;
                        this.a(1);
                        break;
                    }
                    case 3: {
                        this.L.a();
                        break;
                    }
                    case 4: {
                        tjge.j.i[1] = 1;
                        this.a(1);
                        break;
                    }
                    case 5: {
                        tjge.j.i[1] = 3;
                        this.a(1);
                        break;
                    }
                    case 6: {
                        this.L.a(true);
                    }
                }
            } else if (this.I) {
                tjge.a.F[0] = tjge.a.F[0] + 1;
                tjge.a.F[1] = 0;
                tjge.a.F[3] = 60;
                int n = j[1];
                tjge.j.j[1] = j[2];
                tjge.j.j[2] = n;
                j[0] = j[0] + 1;
                switch (i[0]) {
                    case 1: {
                        if (j[0] != 6) break;
                        tjge.j.i[1] = 1;
                        this.a(1);
                        break;
                    }
                    case 3: {
                        if (j[0] != 4) break;
                        tjge.j.i[1] = 1;
                        this.a(1);
                        break;
                    }
                    case 5: {
                        if (j[0] != 2) break;
                        tjge.j.i[1] = 1;
                        this.a(1);
                        break;
                    }
                    case 6: {
                        if (j[0] == 2) {
                            this.X = tjge.c.f;
                            this.X.e = false;
                            this.L.a();
                            break;
                        }
                        if (j[0] != 6) break;
                        tjge.j.i[1] = 2;
                        this.a(1);
                    }
                }
            } else {
                tjge.a.F[1] = tjge.a.F[1] + tjge.a.F[2];
                tjge.a.F[3] = 60;
            }
        }
        this.H = false;
        this.I = false;
    }

    private void c(Graphics graphics) {
        int[] nArray = new int[]{14, 134, 134, 134};
        int[] nArray2 = new int[]{36, 14, 14, 14};
        int[] nArray3 = new int[]{14, 15, 16, 17};
        graphics.setColor(17408);
        graphics.setClip(0, 172, 176, 32);
        graphics.fillRect(0, 172, 176, 32);
        K.a(graphics, 0, 172, 30, 0, 0);
        K.a(graphics, 159, 172, 31, 0, 0);
        K.a(graphics, 12, 172, 32, 0, 0);
        K.a(graphics, 12, 202, 33, 0, 0);
        K.a(graphics, nArray[j[1]], 170, nArray3[j[1]], 0, 0);
        graphics.setColor(65280);
        graphics.setClip(0, 172, 176, 32);
        this.H = this.L.c(tjge.a.F[0]);
        this.I = this.L.a(graphics, tjge.a.F[1], tjge.a.F[2], nArray2[j[1]], 178, 90, 19);
        this.L.c = 0;
    }

    public final void a(int n) {
        switch (n) {
            case 2: {
                this.y = 0;
                break;
            }
            case 4: {
                this.H = false;
                this.I = false;
                this.L.c = 0;
                tjge.a.F[0] = j[0];
                tjge.a.F[1] = 0;
                tjge.a.F[2] = 1;
                tjge.a.F[3] = 60;
            }
        }
        this.x = this.w;
        this.w = n;
        M = 0;
        N = 0;
    }

    public final void b(Graphics graphics) {
        g g2 = this.L.y;
        K.a(graphics, 0, 172, 0, 0, 0);
        K.a(graphics, 12, 164, 14, 0, 0);
        int n = Math.max(0, g2.T);
        int n2 = 0;
        while (n2 < n) {
            K.a(graphics, 14 + n2 * 4, 199 - tjge.j.K.c[18 + n2], 18 + n2, 0, 0);
            ++n2;
        }
        n2 = 0;
        while (n2 < tjge.g.e[2]) {
            K.a(graphics, 127 + n2 * 9, 181, 12, 0, 0);
            ++n2;
        }
        tjge.j.a(graphics, 84, 179, tjge.g.e[0 + g2.U], false, true);
        K.a(graphics, 86, 179, 11, 0, 0);
        tjge.j.a(graphics, 112, 179, tjge.g.f[0 + g2.U], false, true);
        if (this.L.i % 4 > 1) {
            graphics.setColor(65280);
            graphics.setClip(0, 0, 176, 204);
            graphics.drawRect(65 + g2.U * 27, 192, 23, 8);
            K.a(graphics, 0, 195, 13, 0, 0);
        }
    }

    public static final void a(Graphics graphics, int n, int n2, int n3) {
        graphics.setColor(0);
        graphics.setClip(0, n2, 176, n3);
        graphics.fillRect(0, n2, 176, n3);
    }

    public static final int a(Graphics graphics, int n, int n2, int n3, boolean bl, boolean bl2) {
        int n4 = 0;
        boolean bl3 = false;
        n3 = Math.max(0, n3);
        int n5 = 0;
        while (n5 < 5) {
            n4 = n3 % 10;
            K.a(graphics, n -= 8, n2, 1 + n4, 0, 0);
            if ((n3 /= 10) == 0) {
                if (n5 != 0 || !bl2) break;
                K.a(graphics, n -= 8, n2, 1, 0, 0);
                break;
            }
            ++n5;
        }
        if (bl) {
            K.a(graphics, n - 8, n2, 38, 0, 0);
        }
        graphics.setClip(0, 0, 176, 208);
        return n;
    }

    public final void a(int n, int n2) {
        this.C = 0;
        this.D = 0;
        this.w = 0;
        int n3 = n2 / this.T * (a.b() / this.S) + n / this.S;
        int n4 = 0;
        while (n4 < this.n.length) {
            this.n[n4] = false;
            ++n4;
        }
        n4 = 0;
        while (n4 < this.o.length) {
            this.o[n4] = false;
            ++n4;
        }
        n4 = 0;
        while (n4 < e.length) {
            tjge.j.e[n4] = null;
            ++n4;
        }
        n4 = 0;
        while (n4 < d.length) {
            if (d[n4] != null) {
                int n5 = 0;
                while (n5 < d[n4].length) {
                    tjge.j.d[n4][n5].g = false;
                    ++n5;
                }
            }
            ++n4;
        }
        n4 = 0;
        while (n4 < this.t.length) {
            this.c(-1, this.t[n4]);
            ++n4;
        }
        n4 = 0;
        while (this.q[n3] != null && n4 < this.q[n3].length) {
            this.c(-1, this.q[n3][n4]);
            ++n4;
        }
        this.r = n3;
        a.a();
        a.a(n, n2);
        this.W = 0;
        tjge.j.k[0] = -1;
        this.J = this.L.k == 6;
    }

    public final void b(int n) {
        int n2;
        int n3;
        int n4;
        if (this.o[n]) {
            return;
        }
        int n5 = GameMIDlet.a(this.l[n], 10, 2);
        if (this.L.y.a(n5, n4 = GameMIDlet.a(this.l[n], 12, 2), n3 = GameMIDlet.a(this.l[n], 14, 2), n2 = GameMIDlet.a(this.l[n], 16, 2))) {
            this.a(n, true);
            return;
        }
        this.a(n, false);
    }

    public final void b(int n, int n2) {
        byte by;
        int n3 = n2 / this.T * (a.b() / this.S) + n / this.S;
        if (n3 == this.r) {
            return;
        }
        int n4 = 0;
        int n5 = 0;
        byte by2 = 0;
        while (this.q[this.r] != null && this.q[n3] != null && n4 < this.q[this.r].length && n5 < this.q[n3].length) {
            by = this.q[this.r][n4];
            byte by3 = this.q[n3][n5];
            if (by < by3) {
                if (e[by] != null) {
                    if (tjge.j.e[by].h >= 1 && tjge.j.e[by].h <= 5) {
                        if (Math.abs(tjge.j.e[this.q[this.r][n4]].u - this.L.y.u) >= 180224 || Math.abs(tjge.j.e[this.q[this.r][n4]].v - this.L.y.v) >= 180224) {
                            e[by].e();
                            tjge.j.e[by] = null;
                        }
                    } else {
                        e[by].e();
                        tjge.j.e[by] = null;
                    }
                }
                ++n4;
                continue;
            }
            if (by > by3) {
                tjge.j.P[by2++] = this.q[n3][n5++];
                continue;
            }
            ++n4;
            ++n5;
            if (e[by] == null || tjge.j.e[by].g) continue;
            if (tjge.j.e[by].h >= 1 && tjge.j.e[by].h <= 5) {
                if (Math.abs(tjge.j.e[this.q[this.r][n4]].u - this.L.y.u) < 180224 && Math.abs(tjge.j.e[this.q[this.r][n4]].v - this.L.y.v) < 180224) continue;
                tjge.j.e[by] = null;
                continue;
            }
            tjge.j.e[by] = null;
        }
        while (this.q[this.r] != null && n4 < this.q[this.r].length) {
            if (e[this.q[this.r][n4]] != null) {
                if (tjge.j.e[this.q[this.r][n4]].h >= 1 && tjge.j.e[this.q[this.r][n4]].h <= 5) {
                    if (Math.abs(tjge.j.e[this.q[this.r][n4]].u - this.L.y.u) >= 180224 || Math.abs(tjge.j.e[this.q[this.r][n4]].v - this.L.y.v) >= 180224) {
                        e[this.q[this.r][n4]].e();
                        tjge.j.e[this.q[this.r][n4]] = null;
                    }
                } else {
                    e[this.q[this.r][n4]].e();
                    tjge.j.e[this.q[this.r][n4]] = null;
                }
            }
            ++n4;
        }
        while (this.q[n3] != null && n5 < this.q[n3].length) {
            if (this.q[n3][n5] != 0) {
                tjge.j.P[by2++] = this.q[n3][n5];
            }
            ++n5;
        }
        by = 0;
        while (by < by2) {
            if (e[P[by]] == null) {
                this.c(-1, P[by]);
            }
            ++by;
        }
        this.r = n3;
    }

    public final h c(int n, int n2) {
        if (n < 0) {
            n = this.m[n2][0];
        }
        int n3 = 0;
        while (n3 < d[n].length) {
            h h2 = d[n][n3];
            if (!h2.g) {
                if (n2 >= 0) {
                    h2.t = n2;
                    if (!h2.a(this.m[n2])) {
                        return null;
                    }
                    h2.g = true;
                    tjge.j.e[n2] = h2;
                    return h2;
                }
                int n4 = this.s;
                while (n4 < e.length) {
                    if (e[n4] == null) {
                        h2.t = n4;
                        h2.g = true;
                        tjge.j.e[n4] = h2;
                        h2.I = h[n];
                        return h2;
                    }
                    ++n4;
                }
            }
            ++n3;
        }
        return null;
    }

    public final void a(int n, boolean bl) {
        int n2 = GameMIDlet.a(this.l[n], 0, 1);
        if (bl) {
            switch (n2) {
                case 0: {
                    tjge.j.Q[0] = GameMIDlet.a(this.l[n], 18, 1);
                    tjge.j.Q[1] = GameMIDlet.a(this.l[n], 19, 1);
                    if (Q[0] < 0) {
                        Q[0] = Q[0] + 256;
                    }
                    if (Q[1] < 0) {
                        Q[1] = Q[1] + 256;
                    }
                    this.L.y.a(true);
                    break;
                }
                case 1: {
                    this.o[n] = true;
                    this.A = GameMIDlet.a(this.l[n], 18, 1);
                    this.B = GameMIDlet.a(this.l[n], 19, 1);
                    if (this.A < 0) {
                        this.A += 256;
                    }
                    if (this.B < 0) {
                        this.B += 256;
                    }
                    this.A <<= 14;
                    this.B <<= 14;
                    tjge.j.Q[0] = GameMIDlet.a(this.l[n], 20, 1);
                    tjge.j.Q[1] = GameMIDlet.a(this.l[n], 21, 1);
                    tjge.j.Q[2] = GameMIDlet.a(this.l[n], 22, 1);
                    tjge.j.Q[3] = GameMIDlet.a(this.l[n], 23, 1);
                    tjge.j.Q[4] = GameMIDlet.a(this.l[n], 24, 1);
                    tjge.j.Q[5] = GameMIDlet.a(this.l[n], 25, 1);
                    tjge.j.Q[6] = Q[5];
                    this.a(5);
                    break;
                }
                case 2: {
                    if (this.L.k == 5 && (this.L.y.G & 1) == 0) {
                        return;
                    }
                    tjge.j.i[3] = GameMIDlet.a(this.l[n], 19, 1);
                    if (i[3] > 0 && e[i[3]] != null) {
                        tjge.j.i[4] = tjge.j.e[tjge.j.i[3]].u >> 14;
                        if (e[i[3]].d()) {
                            return;
                        }
                    }
                    this.o[n] = true;
                    tjge.j.i[0] = GameMIDlet.a(this.l[n], 18, 1);
                    tjge.j.i[2] = GameMIDlet.a(this.l[n], 20, 1);
                    this.A = GameMIDlet.a(this.l[n], 14, 2);
                    this.A <<= 10;
                    this.A -= this.L.q;
                    if (this.A < 0) {
                        this.A = 0;
                    }
                    this.B = this.L.n;
                    tjge.j.i[1] = i[0] % 10;
                    i[0] = i[0] / 10;
                    this.a(6);
                    break;
                }
                case 3: {
                    if (k[0] != -1) {
                        return;
                    }
                    int n3 = GameMIDlet.a(this.l[n], 18, 1);
                    int n4 = GameMIDlet.a(this.l[n], 19, 1);
                    n3 <<= 14;
                    n4 <<= 14;
                    int n5 = GameMIDlet.a(this.l[n], 20, 1);
                    tjge.j.k[0] = n;
                    int n6 = 0;
                    while (n6 < n5) {
                        h h2 = this.c(22, -1);
                        if (h2 != null) {
                            h2.u = n3 + n6 * 16384;
                            h2.v = n4;
                            h2.a(GameMIDlet.a(this.l[n], 21 + n6, 1));
                            tjge.j.k[n6 + 1] = h2.t;
                        }
                        ++n6;
                    }
                    break;
                }
            }
            return;
        }
        if (n2 == 3 && n == k[0]) {
            int n7 = GameMIDlet.a(this.l[n], 20, 1);
            int n8 = 0;
            while (n8 < n7) {
                if (e[k[n8 + 1]] != null) {
                    e[k[n8 + 1]].e();
                }
                ++n8;
            }
            tjge.j.k[0] = -1;
        }
    }

    public final void c() {
        int n = Q[2] << 4;
        int n2 = 0;
        int n3 = Q[3];
        int n4 = Q[4];
        int n5 = 0;
        if (n4 == 0) {
            n4 = 1 + GameMIDlet.a(3);
        }
        n5 = 1 + GameMIDlet.a(3);
        if (n3 == 0) {
            int[] nArray = new int[]{1, 3, 4};
            n3 = nArray[GameMIDlet.a(3)];
        }
        int n6 = 0;
        int n7 = 0;
        int n8 = 0;
        int n9 = 0;
        this.C = 0;
        while (n2 < n4) {
            f f2 = (f)this.c(n3, -1);
            if (f2 != null) {
                int n10;
                if (n5 == 3) {
                    if (this.G > 0) {
                        n10 = 1;
                        this.G = 0;
                    } else {
                        n10 = 2;
                        this.G = 1;
                    }
                } else {
                    n10 = n5;
                }
                if (n10 == 1) {
                    n6 = this.L.m - ++n8 * 15360;
                    n7 = 0;
                } else if (n10 == 2) {
                    n6 = this.L.m + this.L.q + ++n9 * 15060;
                    n7 = -128;
                }
                tjge.j.R[0] = (byte)n3;
                tjge.j.R[1] = (byte)(n6 >>= 10);
                tjge.j.R[2] = (byte)(n6 >> 8);
                tjge.j.R[3] = (byte)n;
                tjge.j.R[4] = (byte)(n >> 8);
                tjge.j.R[5] = (byte)(0 | n7);
                tjge.j.R[6] = 1;
                tjge.j.R[7] = 60;
                tjge.j.R[8] = 22;
                tjge.j.R[9] = (byte)GameMIDlet.a(3);
                if (f2.a(R)) {
                    ++this.C;
                    if (Q[6] > 0 && Q[6] < 100) {
                        Q[5] = Q[5] - 1;
                    }
                }
            }
            ++n2;
        }
    }

    public final void d() {
        if (a != null) {
            a.d();
            a = null;
        }
        if (this.X != null) {
            this.X.e();
            this.X = null;
        }
        int n = 0;
        while (n < e.length) {
            tjge.j.e[n] = null;
            ++n;
        }
        e = null;
        int n2 = 0;
        while (n2 < this.q.length) {
            this.q[n2] = null;
            ++n2;
        }
        this.q = null;
        int n3 = 0;
        while (n3 < this.m.length) {
            this.m[n3] = null;
            ++n3;
        }
        this.m = null;
        int n4 = 0;
        while (n4 < this.l.length) {
            this.l[n4] = null;
            ++n4;
        }
        this.l = null;
        this.o = null;
        GameMIDlet.l = null;
        GameMIDlet.m = null;
        System.gc();
    }

    public static final void a(a a2, int n, int n2) {
        if (d[n] != null) {
            return;
        }
        tjge.j.d[n] = new h[n2];
        int n3 = 0;
        while (n3 < n2) {
            tjge.j.d[n][n3] = a2.a(n, b[n]);
            ++n3;
        }
    }

    public static final void c(int n) {
        if (b[n] == null) {
            tjge.j.b[n] = tjge.d.b(n);
        }
        tjge.j.c[n] = true;
        tjge.d.b[tjge.d.c[n]] = true;
    }

    public static final boolean a(a a2, int n) {
        int n2 = 0;
        n2 = 0;
        while (n2 < n && n2 < O.length) {
            tjge.j.c(O[n2][0]);
            tjge.j.a(a2, O[n2][0], O[n2][1]);
            ++n2;
        }
        if (n == 3) {
            K = tjge.i.a(6);
        }
        return n2 >= O.length;
    }

    public static final j b(a a2, int n) {
        j j2 = new j();
        try {
            int n2;
            int n3;
            int n4;
            byte by;
            InputStream inputStream = GameMIDlet.b("/res/s.bin", n);
            j2.S = GameMIDlet.b(inputStream);
            j2.T = GameMIDlet.b(inputStream);
            byte by2 = GameMIDlet.a(inputStream);
            byte by3 = 0;
            boolean bl = false;
            if (by2 == 2) {
                GameMIDlet.a(inputStream);
                by3 = GameMIDlet.a(inputStream);
            }
            GameMIDlet.a(inputStream);
            byte by4 = GameMIDlet.a(inputStream);
            a = new b(176, 172);
            a.a(by4, by3, by2);
            boolean bl2 = false;
            int n5 = inputStream.read();
            int n6 = 0;
            while (n6 < n5) {
                by = GameMIDlet.a(inputStream);
                tjge.j.c(by);
                GameMIDlet.a(inputStream);
                n4 = GameMIDlet.a(inputStream);
                tjge.j.a(a2, by, n4);
                ++n6;
            }
            by = GameMIDlet.a(inputStream);
            j2.l = new byte[by][];
            j2.o = new boolean[by];
            n4 = 0;
            while (n4 < by) {
                n3 = GameMIDlet.a(inputStream);
                j2.l[n4] = new byte[n3 += 18];
                inputStream.read(j2.l[n4]);
                ++n4;
            }
            j2.s = n3 = inputStream.read();
            j2.m = new byte[n3][];
            j2.n = new boolean[n3];
            e = new h[n3 + 30];
            int n7 = 0;
            while (n7 < n3) {
                j2.n[n7] = false;
                n2 = GameMIDlet.a(inputStream);
                j2.m[n7] = new byte[n2 += 7];
                inputStream.read(j2.m[n7]);
                ++n7;
            }
            j2.U = a.c() / j2.T * (a.b() / j2.S);
            j2.p = new byte[j2.U][];
            n2 = 0;
            while (n2 < j2.U) {
                byte by5 = GameMIDlet.a(inputStream);
                n3 = by5;
                if (by5 > 0) {
                    j2.p[n2] = new byte[n3];
                    inputStream.read(j2.p[n2]);
                }
                ++n2;
            }
            j2.V = GameMIDlet.a(inputStream);
            j2.t = new byte[j2.V];
            inputStream.read(j2.t);
            j2.q = new byte[j2.U][];
            int n8 = 0;
            while (n8 < j2.U) {
                n3 = inputStream.read();
                j2.q[n8] = new byte[n3];
                inputStream.read(j2.q[n8]);
                ++n8;
            }
            inputStream.close();
            j2.u = a.b();
            j2.v = a.c();
            j2.L = a2;
            if (n != 0 && n != 2) {
                GameMIDlet.a(n, "/res/string.bin");
            }
            z = n;
        }
        catch (Exception exception) {
            return null;
        }
        return j2;
    }

    static {
        h = new int[]{5, 3, 3, 3, 3, 3, 3, 8, 6, 9, 9, 1, 9, 7, 0, 0, 9, 1, 4, 3, 8, 0, 1};
        b = new d[28];
        d = new h[28][];
        P = new byte[28];
        c = new boolean[28];
        f = new h[40];
        Q = new int[7];
        R = new byte[11];
        i = new int[5];
        j = new int[3];
        k = new int[4];
        z = -1;
        O = new int[][]{{0, 1}, {1, 10}, {2, 5}, {3, 10}, {4, 10}, {5, 5}, {6, 1}, {7, 5}, {8, 3}, {9, 5}, {10, 20}, {11, 3}, {12, 20}, {13, 5}, {14, 10}, {15, 10}, {16, 6}, {17, 10}, {18, 1}, {19, 1}, {20, 10}, {21, 1}, {22, 4}};
    }
}

