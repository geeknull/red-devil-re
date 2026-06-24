/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.nokia.mid.ui.DirectGraphics
 *  com.nokia.mid.ui.DirectUtils
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import com.nokia.mid.ui.DirectGraphics;
import com.nokia.mid.ui.DirectUtils;
import java.io.InputStream;
import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;

public final class i {
    public static int a = Integer.MIN_VALUE;
    public static int b = 0x40000000;
    public static int c = 4096;
    private short g;
    private short[] h;
    private short[] i;
    public short[] d;
    public short[] e;
    private byte[] j;
    private int k;
    private int l;
    private byte[] m;
    private short[][] n;
    private int o;
    static short[] f = new short[c];

    private i() {
    }

    public final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5) {
        int n6 = n3 & 0xFF000000;
        n3 &= 0xFFFFFF;
        int n7 = 0;
        DirectGraphics directGraphics = DirectUtils.getDirectGraphics((Graphics)graphics);
        if ((n6 & a) != 0) {
            n7 = 8192;
        }
        if ((n6 & b) != 0) {
            n7 |= 0x4000;
        }
        n7 |= n5;
        int n8 = 0;
        int n9 = this.j[n3] << 4;
        boolean bl = this.h[n3] % 2 == 1;
        int n10 = this.d[n3];
        boolean bl2 = (n10 - this.h[n3] % 2) % 2 == 1;
        n10 /= 2;
        int n11 = this.h[n3] / 2;
        if (bl && !bl2) {
            ++n10;
        }
        int n12 = this.i[n3];
        while (n12 < this.i[n3] + this.e[n3]) {
            int n13;
            if (bl) {
                tjge.i.f[n8] = this.n[n4][n9 + (this.m[n12 * this.k + n11] & 0xF)];
                ++n8;
                n13 = 1;
            } else {
                n13 = 0;
            }
            while (n13 < n10) {
                byte by = this.m[n12 * this.k + n13 + n11];
                tjge.i.f[n8] = this.n[n4][n9 + (by >> 4 & 0xF)];
                tjge.i.f[++n8] = this.n[n4][n9 + (by & 0xF)];
                ++n8;
                ++n13;
            }
            if (bl2) {
                tjge.i.f[n8] = this.n[n4][n9 + (this.m[n12 * this.k + n13 + n11] >> 4 & 0xF)];
                ++n8;
            }
            ++n12;
        }
        if ((n6 & a) != 0) {
            n -= this.d[n3];
        }
        if ((n6 & b) != 0) {
            n2 -= this.e[n3];
        }
        directGraphics.drawPixels(f, true, 0, (int)this.d[n3], n, n2, (int)this.d[n3], (int)this.e[n3], n7, 4444);
    }

    public static final i a(int n) {
        i i2 = new i();
        try {
            InputStream inputStream = GameMIDlet.a("/res/t.bin", n);
            i2.g = GameMIDlet.a(inputStream);
            i2.h = new short[i2.g];
            i2.i = new short[i2.g];
            i2.d = new short[i2.g];
            i2.e = new short[i2.g];
            i2.j = new byte[i2.g];
            int n2 = 0;
            while (n2 < i2.g) {
                i2.j[n2] = GameMIDlet.b(inputStream);
                i2.h[n2] = GameMIDlet.a(inputStream);
                i2.i[n2] = GameMIDlet.a(inputStream);
                i2.d[n2] = GameMIDlet.b(inputStream);
                if (i2.d[n2] < 0) {
                    int n3 = n2;
                    i2.d[n3] = (short)(i2.d[n3] + 256);
                }
                i2.e[n2] = GameMIDlet.b(inputStream);
                if (i2.e[n2] < 0) {
                    int n4 = n2;
                    i2.e[n4] = (short)(i2.e[n4] + 256);
                }
                ++n2;
            }
            i2.o = GameMIDlet.b(inputStream);
            byte by = GameMIDlet.b(inputStream);
            i2.n = new short[i2.o][by << 4];
            n2 = 0;
            while (n2 < i2.o) {
                int n5 = 0;
                while (n5 < by << 4) {
                    i2.n[n2][n5] = GameMIDlet.a(inputStream);
                    ++n5;
                }
                ++n2;
            }
            i2.k = GameMIDlet.a(inputStream);
            i2.l = GameMIDlet.a(inputStream);
            i2.k /= 2;
            i2.m = new byte[i2.k * i2.l];
            inputStream.read(i2.m);
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return i2;
    }
}

