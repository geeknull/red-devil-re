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
import tjge.a;

public final class b {
    public int a;
    public int b;
    private byte[][] d;
    private int e;
    private int f;
    private int g;
    private int h;
    private int i;
    private int j;
    private int k;
    private int l;
    private int m;
    private int n;
    private int o;
    private int p;
    private int q;
    private int r;
    private byte[] s;
    private static Image t;
    static int c;
    private static Image u;
    private static int v;
    private static int w;
    private static Graphics x;
    private int y;
    private int z;
    private int A;
    private int B;

    private b(int n, int n2) {
        this.a = n;
        this.b = n2;
        this.i = 1;
    }

    public final void a(int n, int n2) {
        this.j = n / this.i;
        this.k = n2 / this.i;
    }

    public final int a() {
        return this.g * this.e;
    }

    public final int b() {
        return this.h * this.f;
    }

    public final void a(Graphics graphics) {
        this.a(graphics, this.j, this.k, this.a, this.b);
    }

    public final int a(int n, int n2, boolean bl) {
        if (n2 < 0) {
            return 0;
        }
        if (n2 >= this.d.length) {
            return 3;
        }
        if (n < 0 || n >= this.g * this.e / 16) {
            if (bl) {
                return 1;
            }
            return 0;
        }
        if (this.d[n2][0] == 0) {
            return 0;
        }
        try {
            int n3 = 0;
            int n4 = 2;
            do {
                n3 += this.d[n2][n4 + 1];
                if (this.d[n2][n4 + 1] < 0) {
                    n3 += 256;
                }
                n4 += 2;
            } while (n3 < n + 1);
            return this.d[n2][n4 -= 2];
        }
        catch (Exception exception) {
            return 1;
        }
    }

    protected final int b(int n, int n2) throws Exception {
        int n3 = 0;
        int n4 = (n2 %= this.o * this.m) / this.o * this.l + (n %= this.n * this.l) / this.n;
        n3 = this.s[n4];
        if (this.s[n4] < 0) {
            n3 += 256;
        }
        if (n3 < 0) {
            throw new Exception("error index");
        }
        return n3;
    }

    public final void c() {
        this.y = -1;
        this.z = -1;
    }

    private void a(boolean bl, int n, int n2) {
        if (bl) {
            if (u == null) {
                int n3 = n % this.n == 0 ? n + this.n : n - n % this.n + 2 * this.n;
                int n4 = n2 % this.o == 0 ? this.b + this.o : n2 - n2 % this.o + 2 * this.o;
                u = Image.createImage((int)n3, (int)n4);
                v = u.getWidth();
                w = u.getHeight();
                x = u.getGraphics();
            }
            this.c();
            return;
        }
        u = null;
    }

    protected final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = n2 % n6;
        int n8 = n2;
        while (n8 <= n4) {
            int n9 = n % n5;
            int n10 = n;
            while (n10 <= n3) {
                block6: {
                    int n11;
                    try {
                        n11 = this.b(n10, n8);
                    }
                    catch (Exception exception) {
                        break block6;
                    }
                    graphics.setClip(n9, n7, this.n, this.o);
                    graphics.drawImage(t, n9 - n11 % this.r * this.n, n7 - n11 / this.r * this.o, 20);
                    if ((n9 += this.n) >= n5) {
                        n9 = 0;
                    }
                }
                n10 += this.n;
            }
            if ((n7 += this.o) >= n6) {
                n7 = 0;
            }
            n8 += this.o;
        }
    }

    protected final void b(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        graphics.setClip(n5, n6, n3, n4);
        graphics.drawImage(u, n5 - n, n6 - n2, 20);
    }

    protected final void a(Graphics graphics, int n, int n2, int n3, int n4) {
        int n5;
        int n6;
        int n7 = n - n % this.n;
        int n8 = n2 - n2 % this.o;
        int n9 = n + v - this.n - (n + v - this.n) % this.n;
        int n10 = n2 + w - this.o - (n2 + w - this.o) % this.o;
        if (this.y < 0) {
            this.a(x, n7, n8, n9, n10, v, w);
            this.y = n7;
            this.z = n8;
            this.A = n9;
            this.B = n10;
        }
        if (this.y != n7) {
            if (this.y < n7) {
                n6 = this.A + this.n;
                n5 = n9;
            } else {
                n6 = n7;
                n5 = this.y - this.n;
            }
            this.a(x, n6, n8, n5, n10, v, w);
            this.y = n7;
            this.A = n9;
        }
        if (this.z != n8) {
            if (this.z < n8) {
                n6 = this.B + this.o;
                n5 = n10;
            } else {
                n6 = n8;
                n5 = this.z - this.o;
            }
            this.a(x, n7, n6, n9, n5, v, w);
            this.z = n8;
            this.B = n10;
        }
        int n11 = n % v;
        int n12 = n2 % w;
        int n13 = (n + n3) % v;
        int n14 = (n2 + n4) % w;
        if (n13 > n11) {
            if (n14 > n12) {
                this.b(graphics, n11, n12, n3, n4, 0, 0);
            } else {
                this.b(graphics, n11, n12, n3, n4 - n14, 0, 0);
                this.b(graphics, n11, 0, n3, n14, 0, n4 - n14);
            }
        } else if (n14 > n12) {
            this.b(graphics, n11, n12, n3 - n13, n4, 0, 0);
            this.b(graphics, 0, n12, n13, n4, n3 - n13, 0);
        } else {
            this.b(graphics, n11, n12, n3 - n13, n4 - n14, 0, 0);
            this.b(graphics, n11, 0, n3 - n13, n14, 0, n4 - n14);
            this.b(graphics, 0, n12, n13, n4 - n14, n3 - n13, 0);
            this.b(graphics, 0, 0, n13, n14, n3 - n13, n4 - n14);
        }
        graphics.setClip(0, 0, n3, n4);
    }

    public final void d() {
        int n = 0;
        while (n < this.d.length) {
            this.d[n] = null;
            ++n;
        }
        this.d = null;
        this.s = null;
    }

    public static final b a(int n, int n2, int n3) {
        b b2;
        try {
            b2 = new b(tjge.a.a, tjge.a.b);
            InputStream inputStream = GameMIDlet.a("/res/f.bin", n);
            byte by = GameMIDlet.b(inputStream);
            b2.l = GameMIDlet.a(inputStream);
            b2.m = GameMIDlet.a(inputStream);
            b2.n = GameMIDlet.b(inputStream);
            b2.o = GameMIDlet.b(inputStream);
            b2.p = GameMIDlet.b(inputStream);
            b2.q = GameMIDlet.b(inputStream);
            b2.s = new byte[b2.l * b2.m];
            inputStream.read(b2.s);
            if (c != by) {
                t = null;
                t = tjge.a.f(by + 4);
            }
            c = by;
            b2.r = t.getWidth() / b2.n;
            int n4 = b2.n * b2.l / b2.p;
            int n5 = b2.o * b2.m / b2.q;
            b2.e = b2.l;
            b2.f = b2.m;
            b2.g = b2.n;
            b2.h = b2.o;
            b2.d = new byte[n5][];
            int n6 = 0;
            while (n6 < n5) {
                byte by2 = GameMIDlet.b(inputStream);
                if (by2 == 0) {
                    b2.d[n6] = new byte[1];
                    b2.d[n6][0] = 0;
                } else if (by2 == 1) {
                    b2.d[n6] = new byte[1 + n4];
                    inputStream.read(b2.d[n6], 1, n4);
                    b2.d[n6][0] = 1;
                } else {
                    int n7 = GameMIDlet.b(inputStream);
                    if (n7 < 0) {
                        n7 += 256;
                    }
                    b2.d[n6] = new byte[2 + 2 * n7];
                    inputStream.read(b2.d[n6], 2, 2 * n7);
                    b2.d[n6][0] = 2;
                }
                ++n6;
            }
            inputStream.close();
            b2.a(true, tjge.a.a, tjge.a.b);
        }
        catch (Exception exception) {
            return null;
        }
        return b2;
    }

    public final void a(int n) {
        try {
            InputStream inputStream = GameMIDlet.a("/res/f.bin", n);
            int n2 = this.o * this.m / this.q;
            int n3 = this.n * this.l / this.p;
            inputStream.skip(9 + this.l * this.m);
            int n4 = 0;
            while (n4 < n2) {
                byte by = GameMIDlet.b(inputStream);
                if (by == 0) {
                    this.d[n4][0] = 0;
                } else if (by == 1) {
                    inputStream.read(this.d[n4], 1, n3);
                    this.d[n4][0] = 1;
                } else {
                    int n5 = GameMIDlet.b(inputStream);
                    if (n5 < 0) {
                        n5 += 256;
                    }
                    inputStream.read(this.d[n4], 2, 2 * n5);
                    this.d[n4][0] = 2;
                }
                ++n4;
            }
            inputStream.close();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public final boolean c(int n, int n2) {
        if (n2 < 0) {
            return false;
        }
        if (n2 >= this.d.length) {
            return false;
        }
        if (n < 0 || n >= this.g * this.e / 16) {
            return false;
        }
        if (this.d[n2][0] == 0) {
            return false;
        }
        try {
            int n3 = 0;
            int n4 = 2;
            do {
                n3 += this.d[n2][n4 + 1];
                if (this.d[n2][n4 + 1] < 0) {
                    n3 += 256;
                }
                n4 += 2;
            } while (n3 < n + 1);
            this.d[n2][n4 -= 2] = 0;
            return true;
        }
        catch (Exception exception) {
            return false;
        }
    }

    static {
        c = -1;
    }
}

