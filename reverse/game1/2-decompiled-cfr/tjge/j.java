/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import java.io.InputStream;
import tjge.GameMIDlet;
import tjge.a;
import tjge.b;
import tjge.d;
import tjge.g;

public final class j {
    public static b a;
    public static d[] b;
    public static boolean[] c;
    public static g[][] d;
    public static g[] e;
    private static byte[] m;
    public byte[][] f;
    public int g;
    public short[] h;
    public short[] i;
    public int[] j;
    public boolean[] k;
    public byte[][] l;
    private int n;
    private int o;
    private int p;
    private int q;

    private j() {
    }

    public final void a(int n, int n2) {
        int n3;
        this.q = 0;
        int n4 = n2 / this.p * (a.a() / this.o) + n / this.o;
        int n5 = 0;
        while (n5 < this.k.length) {
            this.k[n5] = false;
            ++n5;
        }
        int n6 = 0;
        while (n6 < d.length) {
            if (d[n6] != null) {
                n3 = 0;
                while (n3 < d[n6].length) {
                    tjge.j.d[n6][n3].p = false;
                    ++n3;
                }
            }
            ++n6;
        }
        n3 = 0;
        while (n3 < this.f[n4].length) {
            byte by = this.f[n4][n3];
            tjge.j.e[by] = this.a(by);
            ++n3;
        }
        this.g = n4;
    }

    public final void b(int n, int n2) {
        int n3;
        int n4 = n2 / this.p * (a.a() / this.o) + n / this.o;
        if (n4 == this.g) {
            return;
        }
        int n5 = 0;
        int n6 = 0;
        int n7 = 0;
        while (n5 < this.f[this.g].length && n6 < this.f[n4].length) {
            n3 = this.f[this.g][n5];
            byte by = this.f[n4][n6];
            if (n3 == this.q) {
                ++n5;
                continue;
            }
            if (by == this.q) {
                ++n6;
                continue;
            }
            if (n3 < by) {
                if (e[n3] != null) {
                    e[n3].b();
                    tjge.j.e[n3] = null;
                }
                ++n5;
                continue;
            }
            if (n3 > by) {
                tjge.j.m[n7++] = this.f[n4][n6++];
                continue;
            }
            ++n5;
            ++n6;
            if (e[n3] == null || tjge.j.e[n3].p) continue;
            tjge.j.e[n3] = null;
        }
        while (n5 < this.f[this.g].length) {
            if (e[this.f[this.g][n5]] != null) {
                e[this.f[this.g][n5]].b();
                tjge.j.e[this.f[this.g][n5]] = null;
            }
            ++n5;
        }
        while (n6 < this.f[n4].length) {
            if (this.f[n4][n6] != 0) {
                tjge.j.m[n7++] = this.f[n4][n6];
            }
            ++n6;
        }
        n3 = 0;
        while (n3 < n7) {
            tjge.j.e[tjge.j.m[n3]] = this.a(m[n3]);
            ++n3;
        }
        this.g = n4;
    }

    public final g a(int n) {
        int n2 = this.j[n];
        int n3 = 0;
        while (n3 < d[n2].length) {
            g g2 = d[n2][n3];
            if (n == 0 || !g2.p) {
                g2.B = n;
                if (!g2.a(0, this.h[n], this.i[n], this.l[n], this.k[n])) {
                    return null;
                }
                g2.p = true;
                return g2;
            }
            ++n3;
        }
        return null;
    }

    public static final void a(a a2, int n, int n2) {
        if (d[n] != null) {
            return;
        }
        tjge.j.d[n] = new g[n2];
        int n3 = 0;
        while (n3 < n2) {
            tjge.j.d[n][n3] = a2.a(n, b[n]);
            ++n3;
        }
    }

    public static final void a() {
        int n = 1;
        while (n < 30) {
            if (!c[n]) {
                if (b[n] != null) {
                    b[n].b();
                }
                tjge.j.b[n] = null;
            }
            ++n;
        }
        System.gc();
    }

    public static final void b() {
        int n = 1;
        while (n < 30) {
            tjge.j.c[n] = tjge.a.d(n);
            ++n;
        }
        tjge.d.c();
    }

    public static final void b(int n) {
        if (b[n] == null) {
            tjge.j.b[n] = tjge.d.b(n);
        }
        tjge.j.c[n] = true;
        tjge.d.b[tjge.d.c[n]] = true;
    }

    public final void c() {
        int n;
        a.d();
        a = null;
        tjge.j.b();
        int n2 = 0;
        while (n2 < e.length) {
            tjge.j.e[n2] = null;
            ++n2;
        }
        e = null;
        int n3 = 1;
        while (n3 < d.length) {
            if (d[n3] != null) {
                n = 0;
                while (n < d[n3].length) {
                    tjge.j.d[n3][n] = null;
                    ++n;
                }
            }
            tjge.j.d[n3] = null;
            ++n3;
        }
        n = 0;
        while (n < this.f.length) {
            this.f[n] = null;
            ++n;
        }
        this.f = null;
        int n4 = 0;
        while (n4 < this.l.length) {
            this.l[n4] = null;
            ++n4;
        }
        this.l = null;
        this.i = null;
        this.h = null;
        this.j = null;
    }

    public static final void a(a a2) {
        tjge.j.b[0] = tjge.d.b(0);
        tjge.j.a(a2, 0, 1);
        tjge.j.b(8);
    }

    public static final j a(a a2, int n) {
        j j2 = new j();
        try {
            int n2;
            int n3;
            InputStream inputStream = GameMIDlet.a("/res/s.bin", n);
            int n4 = inputStream.read();
            int n5 = inputStream.read();
            int n6 = inputStream.read();
            e = new g[n6];
            int n7 = 0;
            if (n4 == 2) {
                n7 = inputStream.read();
                inputStream.read();
                inputStream.read();
            }
            int n8 = inputStream.read();
            inputStream.read();
            inputStream.read();
            if (n8 > 2) {
                n8 -= 2;
            }
            a = tjge.b.a(n8, n7, n4);
            int[] nArray = new int[30];
            int n9 = 0;
            while (n9 < 30) {
                nArray[n9] = 0;
                ++n9;
            }
            int n10 = 0;
            while (n10 < n5) {
                n3 = inputStream.read();
                tjge.j.b(n3);
                nArray[n3] = 1;
                ++n10;
            }
            n3 = 0;
            while (n3 < 30) {
                if (nArray[n3] == 1) {
                    nArray[n3] = inputStream.read();
                    tjge.j.a(a2, n3, nArray[n3]);
                }
                ++n3;
            }
            j2.j = new int[n6];
            j2.h = new short[n6];
            j2.i = new short[n6];
            j2.l = new byte[n6][];
            j2.k = new boolean[n6];
            int n11 = 0;
            while (n11 < n6) {
                j2.k[n11] = false;
                j2.j[n11] = inputStream.read();
                j2.h[n11] = GameMIDlet.a(inputStream);
                j2.i[n11] = GameMIDlet.a(inputStream);
                n2 = inputStream.read();
                if (n2 > 0) {
                    j2.l[n11] = new byte[n2];
                    inputStream.read(j2.l[n11]);
                }
                ++n11;
            }
            j2.o = 176;
            j2.p = 176;
            j2.n = a.b() / j2.p * (a.a() / j2.o);
            j2.f = new byte[j2.n][];
            n2 = 0;
            while (n2 < j2.n) {
                int n12 = inputStream.read();
                j2.f[n2] = new byte[n12];
                inputStream.read(j2.f[n2]);
                ++n2;
            }
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return j2;
    }

    static {
        b = new d[30];
        c = new boolean[30];
        d = new g[30][];
        m = new byte[40];
    }
}

