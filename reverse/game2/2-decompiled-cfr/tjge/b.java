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

public final class b {
    public int a;
    public int b;
    public int c;
    public int d;
    private int h;
    private int i;
    private int j;
    private int k;
    private byte[] l;
    private byte[][] m;
    public int e;
    public int f;
    private int n;
    private int o;
    private int p;
    private int q;
    private Image r;
    private int s;
    private byte[] t;
    private int u;
    private int v;
    private int w;
    private int x;
    private Image y;
    private int z;
    private byte[] A;
    int g;
    private int B;
    private int C;
    private int D;
    private int E;
    private static Image F;
    private static Graphics G;

    public b(int n, int n2) {
        this.a = n;
        this.b = n2;
    }

    public final void a(int n, int n2) {
        this.c = n;
        this.d = n2;
    }

    public final void a() {
        this.B = -1;
        this.C = -1;
    }

    public final int b() {
        return this.p * this.h * this.j;
    }

    public final int c() {
        return this.q * this.i * this.k;
    }

    public final void a(Graphics graphics) {
        this.a(graphics, this.c, this.d, this.a, this.b);
    }

    private int e(int n, int n2) {
        int n3 = this.l[n2 / (this.i * this.q) * this.j + n / (this.h * this.p)];
        if (n3 < -1) {
            n3 += 256;
        }
        return n3;
    }

    public final int b(int n, int n2) {
        if (n2 < 0) {
            return 0;
        }
        if (n2 >= this.c()) {
            return 0;
        }
        if (n < 0 || n >= this.b()) {
            return 0;
        }
        int n3 = this.e(n, n2);
        if (n3 == -1) {
            return 0;
        }
        n = (n3 % (this.n / this.h) * this.h + n / this.p % this.h) * this.p / this.e;
        if (this.m[n2 = (n3 / (this.n / this.h) * this.i + n2 / this.q % this.i) * this.q / this.f][0] == 0) {
            return 0;
        }
        int n4 = 0;
        int n5 = 2;
        do {
            n4 += this.m[n2][n5 + 1];
            if (this.m[n2][n5 + 1] < 0) {
                n4 += 256;
            }
            n5 += 2;
        } while (n4 < n + 1);
        return this.m[n2][n5 -= 2];
    }

    protected final int c(int n, int n2) throws Exception {
        int n3 = -1;
        int n4 = this.e(n, n2);
        if (n4 != -1) {
            n = n4 % (this.n / this.h) * this.h + n / this.p % this.h;
            n2 = n4 / (this.n / this.h) * this.i + n2 / this.q % this.i;
            n4 = n2 * this.n + n;
            n3 = this.t[n4];
            if (this.t[n4] < 0) {
                n3 += 256;
            }
            if (n3 < 0) {
                throw new Exception("error index");
            }
        }
        return n3;
    }

    protected final int d(int n, int n2) throws Exception {
        int n3 = 0;
        int n4 = (n2 %= this.x * this.v) / this.x * this.u + (n %= this.w * this.u) / this.w;
        n3 = this.A[n4];
        if (this.A[n4] < 0) {
            n3 += 256;
        }
        if (n3 < 0) {
            throw new Exception("error index");
        }
        return n3;
    }

    private void f(int n, int n2) {
        if (F == null) {
            int n3 = n % this.p == 0 ? n + this.p : n - n % this.p + 2 * this.p;
            int n4 = n2 % this.q == 0 ? this.b + this.q : n2 - n2 % this.q + 2 * this.q;
            F = Image.createImage((int)n3, (int)n4);
            G = F.getGraphics();
            this.a();
        }
    }

    protected final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = 0;
        int n8 = n2 % n6;
        int n9 = this.b();
        int n10 = this.c();
        int n11 = n2;
        while (n11 <= n4) {
            int n12 = n % n5;
            int n13 = n;
            while (n13 <= n3) {
                block10: {
                    if (this.g == 2) {
                        try {
                            n7 = this.d(n13, n11);
                        }
                        catch (Exception exception) {
                            break block10;
                        }
                        graphics.setClip(n12, n8, this.w, this.x);
                        graphics.drawImage(this.y, n12 - n7 % this.z * this.w, n8 - n7 / this.z * this.x, 20);
                    }
                    try {
                        n7 = this.c(n13 % n9, n11 % n10);
                    }
                    catch (Exception exception) {
                        break block10;
                    }
                    if (n7 != -1) {
                        graphics.setClip(n12, n8, this.p, this.q);
                        graphics.drawImage(this.r, n12 - n7 % this.s * this.p, n8 - n7 / this.s * this.q, 20);
                    }
                    if ((n12 += this.p) >= n5) {
                        n12 = 0;
                    }
                }
                n13 += this.p;
            }
            if ((n8 += this.q) >= n6) {
                n8 = 0;
            }
            n11 += this.q;
        }
    }

    protected final void b(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        graphics.setClip(n5, n6, n3, n4);
        graphics.drawImage(F, n5 - n, n6 - n2, 20);
    }

    protected final void a(Graphics graphics, int n, int n2, int n3, int n4) {
        int n5;
        int n6;
        int n7 = F.getWidth();
        int n8 = F.getHeight();
        G.setColor(0xFFFFFF);
        int n9 = n - n % this.p;
        int n10 = n2 - n2 % this.q;
        int n11 = n + n7 - this.p - (n + n7 - this.p) % this.p;
        int n12 = n2 + n8 - this.q - (n2 + n8 - this.q) % this.q;
        if (this.B < 0) {
            this.a(G, n9, n10, n11, n12, n7, n8);
            this.B = n9;
            this.C = n10;
            this.D = n11;
            this.E = n12;
        }
        if (this.B != n9) {
            if (this.B < n9) {
                n6 = this.D + this.w;
                n5 = n11;
            } else {
                n6 = n9;
                n5 = this.B - this.w;
            }
            this.a(G, n6, n10, n5, n12, n7, n8);
            this.B = n9;
            this.D = n11;
        }
        if (this.C != n10) {
            if (this.C < n10) {
                n6 = this.E + this.x;
                n5 = n12;
            } else {
                n6 = n10;
                n5 = this.C - this.x;
            }
            this.a(G, n9, n6, n11, n5, n7, n8);
            this.C = n10;
            this.E = n12;
        }
        int n13 = n % n7;
        int n14 = n2 % n8;
        int n15 = (n + n3) % n7;
        int n16 = (n2 + n4) % n8;
        if (n15 > n13) {
            if (n16 > n14) {
                this.b(graphics, n13, n14, n3, n4, 0, 0);
            } else {
                this.b(graphics, n13, n14, n3, n4 - n16, 0, 0);
                this.b(graphics, n13, 0, n3, n16, 0, n4 - n16);
            }
        } else if (n16 > n14) {
            this.b(graphics, n13, n14, n3 - n15, n4, 0, 0);
            this.b(graphics, 0, n14, n15, n4, n3 - n15, 0);
        } else {
            this.b(graphics, n13, n14, n3 - n15, n4 - n16, 0, 0);
            this.b(graphics, n13, 0, n3 - n15, n16, 0, n4 - n16);
            this.b(graphics, 0, n14, n15, n4 - n16, n3 - n15, 0);
            this.b(graphics, 0, 0, n15, n16, n3 - n15, n4 - n16);
        }
        graphics.setClip(0, 0, n3, n4);
    }

    public final void d() {
        int n = 0;
        while (n < this.m.length) {
            this.m[n] = null;
            ++n;
        }
        this.m = null;
        this.l = null;
        this.A = null;
        this.y = null;
        this.t = null;
        this.r = null;
        System.gc();
    }

    public final void a(int n, int n2, int n3) {
        try {
            InputStream inputStream = GameMIDlet.b("/res/m.bin", n);
            if (GameMIDlet.a(inputStream) != 1) {
                return;
            }
            byte by = GameMIDlet.a(inputStream);
            this.h = GameMIDlet.a(inputStream);
            this.i = GameMIDlet.a(inputStream);
            this.j = GameMIDlet.b(inputStream);
            this.k = GameMIDlet.b(inputStream);
            this.l = new byte[this.j * this.k];
            inputStream.read(this.l);
            inputStream.close();
            inputStream = GameMIDlet.b("/res/p.bin", by);
            if (GameMIDlet.a(inputStream) != 0) {
                return;
            }
            by = GameMIDlet.a(inputStream);
            this.n = GameMIDlet.b(inputStream);
            this.o = GameMIDlet.b(inputStream);
            this.p = GameMIDlet.a(inputStream);
            this.q = GameMIDlet.a(inputStream);
            this.t = new byte[this.n * this.o];
            inputStream.read(this.t);
            this.e = GameMIDlet.a(inputStream);
            this.f = GameMIDlet.a(inputStream);
            int n4 = this.p * this.n / this.e;
            int n5 = this.q * this.o / this.f;
            this.m = new byte[n5][];
            int n6 = 0;
            while (n6 < n5) {
                byte by2 = GameMIDlet.a(inputStream);
                if (by2 == 0) {
                    this.m[n6] = new byte[1];
                    this.m[n6][0] = 0;
                } else if (by2 == 1) {
                    this.m[n6] = new byte[1 + n4];
                    inputStream.read(this.m[n6], 1, n4);
                    this.m[n6][0] = 1;
                } else {
                    int n7 = GameMIDlet.a(inputStream);
                    if (n7 < 0) {
                        n7 += 256;
                    }
                    this.m[n6] = new byte[2 + 2 * n7];
                    inputStream.read(this.m[n6], 2, 2 * n7);
                    this.m[n6][0] = 2;
                }
                ++n6;
            }
            inputStream.close();
            this.r = GameMIDlet.a("/res/fpng.bin", (int)by);
            this.s = this.r.getWidth() / this.p;
            this.g = n3;
            if (this.g == 2) {
                inputStream = GameMIDlet.b("/res/b.bin", n2);
                GameMIDlet.a(inputStream);
                GameMIDlet.a(inputStream);
                this.u = GameMIDlet.b(inputStream);
                this.v = GameMIDlet.b(inputStream);
                this.w = GameMIDlet.a(inputStream);
                this.x = GameMIDlet.a(inputStream);
                this.A = new byte[this.u * this.v];
                inputStream.read(this.A);
                inputStream.close();
                this.y = GameMIDlet.a("/res/bpng.bin", 0);
                this.z = this.y.getWidth() / this.w;
            }
            this.f(this.a, this.b);
            return;
        }
        catch (Exception exception) {
            return;
        }
    }
}

