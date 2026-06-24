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
        int n10 = 0;
        while (n10 < n9) {
            int n11 = this.q[s][n10] & 0xFFFF;
            byte by = this.d[s][n10];
            if (n7 != 0) {
                by = -by;
            }
            byte by2 = this.e[s][n10];
            if (n8 != 0) {
                by2 = -by2;
            }
            this.u.a(graphics, n + by, n2 + by2, n11 | n7 | n8, n5, n6);
            ++n10;
        }
    }

    public static final d b(int n) {
        d d2 = new d();
        try {
            int n2;
            InputStream inputStream = GameMIDlet.b("/res/a.bin", n);
            byte by = GameMIDlet.a(inputStream);
            d2.n = GameMIDlet.a(inputStream);
            d2.o = GameMIDlet.b(inputStream);
            d2.p = new short[d2.o];
            d2.q = new short[d2.o][];
            d2.d = new byte[d2.o][];
            d2.e = new byte[d2.o][];
            int n3 = 0;
            while (n3 < d2.o) {
                d2.p[n3] = GameMIDlet.b(inputStream);
                d2.q[n3] = new short[d2.p[n3]];
                d2.d[n3] = new byte[d2.p[n3]];
                d2.e[n3] = new byte[d2.p[n3]];
                n2 = 0;
                while (n2 < d2.p[n3]) {
                    d2.q[n3][n2] = GameMIDlet.b(inputStream);
                    d2.d[n3][n2] = GameMIDlet.a(inputStream);
                    d2.e[n3][n2] = GameMIDlet.a(inputStream);
                    ++n2;
                }
                ++n3;
            }
            inputStream.read();
            inputStream.read();
            inputStream.read();
            inputStream.read();
            d2.r = GameMIDlet.b(inputStream);
            d2.f = new byte[d2.r];
            d2.g = new byte[d2.r];
            d2.h = new byte[d2.r];
            d2.i = new byte[d2.r];
            d2.s = new short[d2.r];
            d2.t = new short[d2.r][];
            n2 = 0;
            while (n2 < d2.r) {
                d2.f[n2] = GameMIDlet.a(inputStream);
                d2.g[n2] = GameMIDlet.a(inputStream);
                d2.h[n2] = GameMIDlet.a(inputStream);
                d2.i[n2] = GameMIDlet.a(inputStream);
                d2.s[n2] = GameMIDlet.b(inputStream);
                d2.t[n2] = new short[d2.s[n2]];
                int n4 = 0;
                while (n4 < d2.s[n2]) {
                    d2.t[n2][n4] = GameMIDlet.a(inputStream);
                    if (d2.t[n2][n4] < 0) {
                        short[] sArray = d2.t[n2];
                        int n5 = n4;
                        sArray[n5] = (short)(sArray[n5] + 256);
                    }
                    ++n4;
                }
                ++n2;
            }
            d2.j = GameMIDlet.b(inputStream);
            d2.k = GameMIDlet.b(inputStream);
            d2.l = GameMIDlet.b(inputStream);
            d2.m = GameMIDlet.b(inputStream);
            inputStream.close();
            tjge.d.b[d2.n] = true;
            tjge.d.c[by] = d2.n;
            if (a[d2.n] == null) {
                tjge.d.a[d2.n] = tjge.i.a(d2.n);
            }
            d2.u = a[d2.n];
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

