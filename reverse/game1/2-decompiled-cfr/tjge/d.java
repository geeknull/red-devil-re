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
import tjge.i;

public final class d {
    public static i[] a = new i[32];
    public static boolean[] b = new boolean[32];
    public static int[] c = new int[32];
    private short o;
    private short[] p;
    private short[][] q;
    public byte[][] d;
    public byte[][] e;
    private short r;
    private short[] s;
    private short[][] t;
    public byte[] f;
    public byte[] g;
    public byte[] h;
    public byte[] i;
    public short j;
    public short k;
    public short l;
    public short m;
    public short n;
    private i u;

    private d() {
    }

    public final short a() {
        return this.r;
    }

    public final short a(int n) {
        return this.s[n];
    }

    public final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = n3 & Integer.MIN_VALUE;
        int n8 = n3 & 0x40000000;
        short s = this.t[n3 &= 0xFFFFFF][n4];
        int n9 = this.p[s];
        graphics.setClip(0, 0, 176, 208);
        int n10 = 0;
        while (n10 < n9) {
            int n11;
            int n12;
            short s2 = this.q[s][n10];
            byte by = this.d[s][n10];
            if (n7 != 0) {
                by = -by;
            }
            byte by2 = this.e[s][n10];
            if (n8 != 0) {
                by2 = -by2;
            }
            byte by3 = by;
            byte by4 = by2;
            int n13 = by4 + this.u.e[s2];
            if (n6 == 270) {
                n12 = n - n13;
                n11 = n2 + by3;
            } else {
                n12 = n + by;
                n11 = n2 + by2;
            }
            this.u.a(graphics, n12, n11, s2 | n7 | n8, n5, n6);
            ++n10;
        }
    }

    public final void b() {
        this.f = null;
        this.g = null;
        this.h = null;
        this.i = null;
        int n = 0;
        while (n < this.t.length) {
            this.t[n] = null;
            ++n;
        }
        this.t = null;
        int n2 = 0;
        while (n2 < this.q.length) {
            this.q[n2] = null;
            this.d[n2] = null;
            this.e[n2] = null;
            ++n2;
        }
        this.q = null;
        this.d = null;
        this.e = null;
        this.p = null;
        this.s = null;
        this.u = null;
    }

    public static final void c() {
        int n = 1;
        while (n < 32) {
            tjge.d.b[tjge.d.c[n]] = tjge.a.d(n);
            ++n;
        }
    }

    public static final d b(int n) {
        d d2 = new d();
        try {
            int n2;
            InputStream inputStream = GameMIDlet.a("/res/a.bin", n);
            d2.n = GameMIDlet.a(inputStream);
            if (a[d2.n] == null) {
                tjge.d.a[d2.n] = tjge.i.a(d2.n);
            }
            tjge.d.b[d2.n] = true;
            d2.u = a[d2.n];
            tjge.d.c[n] = d2.n;
            d2.o = GameMIDlet.a(inputStream);
            d2.p = new short[d2.o];
            d2.q = new short[d2.o][];
            d2.d = new byte[d2.o][];
            d2.e = new byte[d2.o][];
            int n3 = 0;
            while (n3 < d2.o) {
                d2.p[n3] = GameMIDlet.a(inputStream);
                d2.q[n3] = new short[d2.p[n3]];
                d2.d[n3] = new byte[d2.p[n3]];
                d2.e[n3] = new byte[d2.p[n3]];
                n2 = 0;
                while (n2 < d2.p[n3]) {
                    d2.q[n3][n2] = GameMIDlet.b(inputStream);
                    if (d2.q[n3][n2] < 0) {
                        short[] sArray = d2.q[n3];
                        int n4 = n2;
                        sArray[n4] = (short)(sArray[n4] + 256);
                    }
                    d2.d[n3][n2] = GameMIDlet.b(inputStream);
                    d2.e[n3][n2] = GameMIDlet.b(inputStream);
                    ++n2;
                }
                ++n3;
            }
            inputStream.read();
            inputStream.read();
            inputStream.read();
            inputStream.read();
            d2.r = GameMIDlet.a(inputStream);
            d2.f = new byte[d2.r];
            d2.g = new byte[d2.r];
            d2.h = new byte[d2.r];
            d2.i = new byte[d2.r];
            d2.s = new short[d2.r];
            d2.t = new short[d2.r][];
            n2 = 0;
            while (n2 < d2.r) {
                d2.f[n2] = GameMIDlet.b(inputStream);
                d2.g[n2] = GameMIDlet.b(inputStream);
                d2.h[n2] = GameMIDlet.b(inputStream);
                d2.i[n2] = GameMIDlet.b(inputStream);
                d2.s[n2] = GameMIDlet.a(inputStream);
                d2.t[n2] = new short[d2.s[n2]];
                int n5 = 0;
                while (n5 < d2.s[n2]) {
                    d2.t[n2][n5] = GameMIDlet.b(inputStream);
                    if (d2.t[n2][n5] < 0) {
                        short[] sArray = d2.t[n2];
                        int n6 = n5;
                        sArray[n6] = (short)(sArray[n6] + 256);
                    }
                    ++n5;
                }
                ++n2;
            }
            d2.j = GameMIDlet.a(inputStream);
            d2.k = GameMIDlet.a(inputStream);
            d2.l = GameMIDlet.a(inputStream);
            d2.m = GameMIDlet.a(inputStream);
            d2.n = 0;
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return d2;
    }

    static {
        tjge.d.b[0] = true;
    }
}

