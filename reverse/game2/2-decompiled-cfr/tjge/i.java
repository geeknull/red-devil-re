/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 */
package tjge;

import java.io.InputStream;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import tjge.GameMIDlet;

public final class i {
    public static int a = Integer.MIN_VALUE;
    public static int b = 0x40000000;
    private short g;
    private short[] h;
    private short[] i;
    private short[] j;
    public short[] c;
    public Image[] d;
    public Image e;
    public static final int[][] f = new int[][]{{0, 2, 1, 3}, {5, 4, 7, 6}, {3, 1, 2, 0}, {6, 7, 4, 5}};

    private i() {
    }

    public final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5) {
        int n6 = 0;
        int n7 = 0;
        if ((n3 >> 31 & 1 ^ n3 >> 15 & 1) != 0) {
            n7 = 1;
        }
        if ((n3 >> 30 & 1 ^ n3 >> 14 & 1) != 0) {
            n7 = n7 > 0 ? 3 : 2;
        }
        int n8 = n3;
        short s = this.j[n3 &= 0xFFF];
        short s2 = this.c[n3];
        switch (n8 & 0x3000) {
            case 4096: {
                s = this.c[n3];
                s2 = this.j[n3];
                n6 = f[3][n7];
                break;
            }
            case 8192: {
                n6 = f[2][n7];
                break;
            }
            case 12288: {
                s = this.c[n3];
                s2 = this.j[n3];
                n6 = f[1][n7];
                break;
            }
            default: {
                n6 = f[0][n7];
            }
        }
        if ((n8 & a) != 0) {
            n -= s;
        }
        if ((n8 & b) != 0) {
            n2 -= s2;
        }
        graphics.setClip(n, n2, (int)s, (int)s2);
        this.e = this.d[n4];
        graphics.drawRegion(this.e, (int)this.h[n3], (int)this.i[n3], (int)this.j[n3], (int)this.c[n3], n6, n, n2, 20);
    }

    public static final i a(int n) {
        i i2 = new i();
        try {
            InputStream inputStream = GameMIDlet.b("/res/t.bin", n);
            GameMIDlet.b(inputStream);
            i2.g = GameMIDlet.b(inputStream);
            i2.h = new short[i2.g];
            i2.i = new short[i2.g];
            i2.j = new short[i2.g];
            i2.c = new short[i2.g];
            int n2 = 0;
            while (n2 < i2.g) {
                i2.h[n2] = GameMIDlet.b(inputStream);
                i2.i[n2] = GameMIDlet.b(inputStream);
                i2.j[n2] = GameMIDlet.a(inputStream);
                if (i2.j[n2] < 0) {
                    int n3 = n2;
                    i2.j[n3] = (short)(i2.j[n3] + 256);
                }
                i2.c[n2] = GameMIDlet.a(inputStream);
                if (i2.c[n2] < 0) {
                    int n4 = n2;
                    i2.c[n4] = (short)(i2.c[n4] + 256);
                }
                ++n2;
            }
            int n5 = GameMIDlet.a(inputStream);
            short s = 0;
            short s2 = 0;
            byte[] byArray = null;
            i2.d = new Image[n5];
            if (n5 > 1) {
                s = GameMIDlet.b(inputStream);
                s2 = GameMIDlet.b(inputStream);
            }
            byte[] byArray2 = GameMIDlet.c("/res/actorPng.bin", n);
            int n6 = 0;
            while (n6 < n5) {
                if (n6 > 0) {
                    if (byArray == null) {
                        byArray = new byte[s2];
                    }
                    inputStream.read(byArray);
                    System.arraycopy(byArray, 0, byArray2, s, s2);
                }
                i2.d[n6] = Image.createImage((byte[])byArray2, (int)0, (int)byArray2.length);
                ++n6;
            }
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return i2;
    }
}

