/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Canvas
 *  javax.microedition.lcdui.Font
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 */
package tjge;

import javax.microedition.lcdui.Canvas;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import tjge.GameMIDlet;
import tjge.c;
import tjge.d;
import tjge.e;
import tjge.f;
import tjge.g;
import tjge.h;
import tjge.j;
import tjge.k;

public final class a
extends Canvas
implements Runnable {
    public static a a;
    public int b;
    public int c;
    public int d;
    public int e;
    public long f;
    public long g;
    public int h;
    private int G;
    private int H;
    public int i;
    public int j;
    public int k;
    public int l;
    public int m;
    public int n;
    public int o;
    public int p;
    public int q;
    public int r;
    private int I;
    private int J;
    private int K;
    private boolean L;
    private boolean M;
    protected boolean s;
    protected boolean t;
    private int N;
    private int O;
    private int P;
    Image u;
    Image v;
    protected Thread w;
    protected GameMIDlet x;
    public g y;
    public j z;
    private Image Q;
    private Image R;
    private Image S;
    private Image T;
    public static final int[] A;
    public static final int[] B;
    static int C;
    static int D;
    static int E;
    public static int[] F;

    public a(GameMIDlet gameMIDlet) {
        this.setFullScreenMode(true);
        a = this;
        this.x = gameMIDlet;
        this.b = 3;
        this.w = new Thread(this);
        this.w.start();
        this.s = true;
        this.t = false;
    }

    public final h a(int n, d d2) {
        switch (n) {
            case 0: {
                this.y = new g(n, d2);
                return this.y;
            }
            case 1: 
            case 2: 
            case 3: 
            case 4: 
            case 5: {
                return new f(n, d2);
            }
            case 11: 
            case 13: 
            case 17: 
            case 19: 
            case 21: {
                return new c(n, d2);
            }
            case 6: 
            case 7: 
            case 14: 
            case 15: 
            case 18: 
            case 20: 
            case 22: {
                return new e(n, d2);
            }
            case 9: 
            case 10: 
            case 12: 
            case 16: {
                return new k(n, d2);
            }
        }
        return new h(n, d2);
    }

    public final void paint(Graphics graphics) {
        ++this.i;
        this.t = true;
        graphics.setFont(Font.getFont((int)0, (int)0, (int)8));
        GameMIDlet.a();
        try {
            switch (this.b) {
                case 3: {
                    ++this.j;
                    graphics.setClip(0, 0, 176, 204);
                    if (this.j == 1) {
                        this.Q = GameMIDlet.a("/res/logo.bin", 1);
                        this.R = GameMIDlet.a("/res/logo.bin", 2);
                        this.S = GameMIDlet.a("/res/logo.bin", 3);
                        this.T = GameMIDlet.a("/res/logo.bin", 4);
                        this.u = GameMIDlet.a("/res/logo.bin", 0);
                        this.v = GameMIDlet.a("/res/logo.bin", 5);
                        break;
                    }
                    if (this.j == 2) {
                        GameMIDlet.b();
                        GameMIDlet.b(0);
                        graphics.drawImage(this.Q, 38, 60, 20);
                        this.Q = null;
                        graphics.setColor(238, 25, 33);
                        graphics.drawString("\u79fb\u52a8\u4e92\u8fde \u65e0\u9650\u53ef\u80fd", 96, 122, 17);
                        break;
                    }
                    if (this.j == 29) {
                        graphics.setColor(0xFFFFFF);
                        graphics.fillRect(0, 0, 176, 204);
                        graphics.drawImage(this.R, 15, 15, 20);
                        this.R = null;
                        graphics.drawImage(this.S, 36, 103, 20);
                        this.S = null;
                        graphics.setColor(155, 166, 173);
                        graphics.drawString("\u65b0\u6d6a\u65e0\u7ebf\u4ee3\u7406\u53d1\u884c", 40, 139, 20);
                        break;
                    }
                    if (this.j == 47) {
                        graphics.setColor(255, 255, 255);
                        graphics.fillRect(0, 0, 176, 208);
                        graphics.drawImage(this.T, 88, 45, 17);
                        this.T = null;
                        break;
                    }
                    if (this.j != 65) break;
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.drawImage(this.u, 0, 0, 20);
                    graphics.drawImage(this.v, 0, this.u.getHeight() + 2, 20);
                    this.b = 1;
                    this.j = 0;
                    GameMIDlet.a(0, 160);
                    break;
                }
                case 1: {
                    ++this.j;
                    graphics.setClip(0, 0, 176, 204);
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.drawImage(this.u, 0, 0, 20);
                    graphics.drawImage(this.v, 0, this.u.getHeight() + 2, 20);
                    graphics.setColor(0xFFFFFF);
                    graphics.drawRect(2, 194, 171, 6);
                    graphics.setColor(0);
                    graphics.fillRect(3, 195, 170, 5);
                    graphics.setColor(65280);
                    graphics.drawLine(4, 196, this.j * 168 / 23 + 3, 196);
                    graphics.setColor(47872);
                    graphics.drawLine(4, 197, this.j * 168 / 23 + 3, 197);
                    graphics.setColor(30464);
                    graphics.drawLine(4, 198, this.j * 168 / 23 + 3, 198);
                    if (!tjge.j.a(this, this.j)) break;
                    this.b = 4;
                    this.k = 0;
                    this.j = 0;
                    this.h = 1;
                    this.l = 1;
                    this.e(120);
                    break;
                }
                case 4: {
                    graphics.setClip(0, 0, 176, 204);
                    graphics.setColor(0);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.drawImage(this.u, 0, 0, 20);
                    graphics.drawImage(this.v, 0, this.u.getHeight() + 2, 20);
                    int n = this.h;
                    while (n < 7) {
                        graphics.setColor(this.l == n && this.P == 1 ? 0xFFFFFF : 65280);
                        if (n == 3) {
                            graphics.drawString(GameMIDlet.o[GameMIDlet.k[2] == 0 ? 7 : 3], 88, 60 + n * 20, 17);
                        } else {
                            graphics.drawString(GameMIDlet.o[n], 88, 60 + n * 20, 17);
                        }
                        ++n;
                    }
                    graphics.setColor(65280);
                    this.a(graphics, 88, 80 + this.l * 20);
                    if (this.c == 4) {
                        this.e(120);
                        if (--this.l < this.h) {
                            this.l = 6;
                        }
                    } else if (this.c == 8) {
                        this.e(120);
                        if (++this.l > 6) {
                            this.l = this.h;
                        }
                    } else if (this.c == 16) {
                        switch (this.l) {
                            case 0: {
                                this.b = 10;
                                break;
                            }
                            case 1: {
                                this.k = 0;
                                GameMIDlet.b(2);
                                this.e = 0;
                                this.j = 0;
                                this.b = 20;
                                tjge.g.f[1] = 6;
                                break;
                            }
                            case 2: {
                                if (GameMIDlet.k[3] == 0) {
                                    this.j = 0;
                                    this.b = 100;
                                    break;
                                }
                                this.e = 0;
                                this.j = 0;
                                this.k = GameMIDlet.k[3];
                                byte by = GameMIDlet.k[1];
                                GameMIDlet.k[1] = (byte)(by + 1);
                                if (by > 99) {
                                    GameMIDlet.k[1] = 99;
                                }
                                tjge.g.f[1] = GameMIDlet.k[4];
                                this.b = this.k == 0 ? 20 : 2;
                                break;
                            }
                            case 3: {
                                GameMIDlet.k[2] = (byte)(GameMIDlet.k[2] ^ 1);
                                if (GameMIDlet.k[2] != 0) break;
                                GameMIDlet.c();
                                break;
                            }
                            case 4: {
                                this.j = 0;
                                GameMIDlet.a(7, "/res/string.bin");
                                this.c = 0;
                                this.b = 6;
                                break;
                            }
                            case 5: {
                                GameMIDlet.a(8, "/res/string.bin");
                                this.c = 0;
                                this.b = 19;
                                break;
                            }
                            case 6: {
                                this.x.destroyApp(true);
                            }
                        }
                    }
                    this.c = 0;
                    break;
                }
                case 100: {
                    if (this.j == 0) {
                        graphics.setClip(0, 0, 176, 204);
                        graphics.setColor(0);
                        graphics.fillRect(0, 0, 176, 204);
                        graphics.drawImage(this.u, 0, 0, 20);
                        graphics.drawImage(this.v, 0, this.u.getHeight() + 6, 20);
                        tjge.j.a(graphics, 8, this.u.getHeight() + 6, 176);
                        graphics.setClip(0, 0, 176, 208);
                        graphics.setColor(65280);
                        graphics.drawString("\u6ca1\u6709\u5b58\u6863\u8bb0\u5f55!!", 88, 104, 17);
                    }
                    ++this.j;
                    if (this.j <= 15) break;
                    this.j = 0;
                    this.b = 4;
                    break;
                }
                case 2: {
                    this.a(this.k);
                    graphics.setColor(0);
                    graphics.setClip(0, 0, 176, 204);
                    graphics.fillRect(0, 0, 176, 204);
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.p[11], 88, 184, 17);
                    if (!this.M) break;
                    this.j = 0;
                    this.b = 10;
                    this.f = System.currentTimeMillis();
                    break;
                }
                case 20: {
                    this.a(graphics);
                    break;
                }
                case 22: {
                    this.z.a(graphics);
                    graphics.setClip(0, 0, 176, 204);
                    tjge.a.a(graphics, 175, 0, 0, 171, 10, this.e, 47872, 0, true);
                    this.z.b(graphics);
                    graphics.setClip(0, 0, 176, 204);
                    if (this.e < 10) {
                        if (this.j == 0) {
                            ++this.e;
                        } else {
                            --this.e;
                            if (this.e < 0) {
                                this.j = 0;
                                this.b = 10;
                            }
                        }
                        this.c = 0;
                        break;
                    }
                    tjge.a.a(graphics, 166, 40, 10, 70, 20, 20, 47872, 17408, true);
                    tjge.a.a(graphics, 166, 90, 10, 145, 20, 20, 47872, 17408, true);
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.p[2] + GameMIDlet.r[this.k], 88, 15, 17);
                    graphics.drawString(GameMIDlet.q[this.k], 88, 47, 17);
                    tjge.j.K.a(graphics, 158, 157, 39, 0, 0);
                    tjge.j.K.a(graphics, 23, 95, 29, 0, 0);
                    int[] nArray = new int[]{5, 19, 44, 58, 81, 99, 124};
                    int[] nArray2 = new int[]{90, 100, 89, 101, 101, 93, 91};
                    int n = 0;
                    while (n < 7) {
                        if (n <= this.k && (n != this.k || this.i % 4 <= 1)) {
                            tjge.j.K.a(graphics, 24 + nArray[n], 24 + nArray2[n], 28, 0, 0);
                        }
                        ++n;
                    }
                    if (this.j == 0 && this.c == 32768) {
                        this.j = 1;
                        --this.e;
                    }
                    break;
                }
                case 10: {
                    this.z.b();
                    this.z.a(graphics);
                    break;
                }
                case 18: {
                    tjge.a.a(graphics, 175, 0, 0, 203, 10, this.e, 47872, 0, true);
                    if (this.e < 10) {
                        ++this.e;
                        this.l = 0;
                        break;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.p[2] + GameMIDlet.r[this.k] + GameMIDlet.p[8], 88, 30, 17);
                    graphics.drawString(GameMIDlet.p[5], 36, 64, 20);
                    graphics.drawString(String.valueOf(tjge.a.a.z.D), 140, 64, 24);
                    graphics.drawString(GameMIDlet.p[7], 36, 90, 20);
                    graphics.drawString(String.valueOf(GameMIDlet.k[1] & 0xFF), 140, 90, 24);
                    graphics.drawString(GameMIDlet.p[6], 36, 116, 20);
                    int n = (int)this.g / 60;
                    int n2 = (int)this.g % 60;
                    String string = String.valueOf(n);
                    String string2 = String.valueOf(n2);
                    if (n < 10) {
                        string = "0" + string;
                    }
                    if (n2 < 10) {
                        string2 = "0" + string2;
                    }
                    String string3 = string + ":" + string2;
                    graphics.drawString(string3, 140, 116, 24);
                    tjge.j.b[0].a(graphics, 48, 170, 4, 0, 0, 0);
                    graphics.setClip(0, 0, 176, 204);
                    if (this.c == 4) {
                        this.e(64);
                        if (--this.l < 0) {
                            this.l = 1;
                        }
                        this.c = 0;
                    } else if (this.c == 8) {
                        this.e(64);
                        if (++this.l > 1) {
                            this.l = 0;
                        }
                        this.c = 0;
                    } else if (this.c == 16) {
                        if (this.l == 0) {
                            byte by = GameMIDlet.k[1];
                            GameMIDlet.k[1] = (byte)(by + 1);
                            if (by > 99) {
                                GameMIDlet.k[1] = 99;
                            }
                            this.b = 2;
                        } else {
                            this.h = 1;
                            this.l = 1;
                            this.b = 4;
                        }
                        this.c = 0;
                    }
                    int n3 = 0;
                    while (n3 < 2) {
                        graphics.setColor(n3 == this.l && this.P == 1 ? 0xFFFFFF : 65280);
                        if (n3 == 0) {
                            graphics.drawString(GameMIDlet.p[0], 120, 150, 17);
                        } else {
                            graphics.drawString(GameMIDlet.p[9], 120, 170, 17);
                        }
                        ++n3;
                    }
                    graphics.setColor(65280);
                    this.a(graphics, 120, 169 + this.l * 20);
                    break;
                }
                case 16: {
                    tjge.a.a(graphics, 175, 0, 0, 203, 10, this.e, 47872, 0, true);
                    if (this.e < 10) {
                        ++this.e;
                        if (this.e != 10) break;
                        GameMIDlet.a(1, 140);
                        break;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.p[2] + GameMIDlet.r[this.k] + GameMIDlet.p[4], 88, 30, 17);
                    graphics.drawString(GameMIDlet.p[5], 36, 64, 20);
                    graphics.drawString(String.valueOf(tjge.a.a.z.D), 140, 64, 24);
                    graphics.drawString(GameMIDlet.p[7], 36, 86, 20);
                    graphics.drawString(String.valueOf(GameMIDlet.k[1] & 0xFF), 140, 86, 24);
                    graphics.drawString(GameMIDlet.p[6], 36, 108, 20);
                    int n = (int)this.g / 60;
                    int n4 = (int)this.g % 60;
                    String string = String.valueOf(n);
                    String string4 = String.valueOf(n4);
                    if (n < 10) {
                        string = "0" + string;
                    }
                    if (n4 < 10) {
                        string4 = "0" + string4;
                    }
                    String string5 = string + ":" + string4;
                    graphics.drawString(string5, 140, 108, 24);
                    tjge.j.K.a(graphics, 158, 189, 40, 0, 0);
                    tjge.j.b[0].a(graphics, 88, 170, this.G, this.H, 0, 0);
                    if (this.G == 34) {
                        if (this.H++ != 4) break;
                        if (this.k == 6) {
                            this.b = 21;
                        } else {
                            ++this.k;
                            this.b = 2;
                        }
                        GameMIDlet.k[0] = (byte)this.k;
                        GameMIDlet.k[3] = (byte)this.k;
                        GameMIDlet.k[4] = (byte)tjge.g.f[1];
                        GameMIDlet.b(1);
                        break;
                    }
                    if (this.c == 32768) {
                        this.H = 0;
                        this.G = 34;
                        break;
                    }
                    ++this.H;
                    this.H %= tjge.j.b[0].a(this.G);
                    break;
                }
                case 21: {
                    ++this.j;
                    if (this.j < 16) {
                        tjge.j.a(graphics, this.j, 0, 204);
                        break;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.p[10], 88, 102, 33);
                    if (this.j <= 30) break;
                    this.h = 1;
                    this.l = 1;
                    this.b = 4;
                    this.j = 0;
                    System.gc();
                    break;
                }
                case 6: {
                    tjge.a.a(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
                    graphics.setColor(65280);
                    this.a(graphics, GameMIDlet.n, 5, 6, 19, this.j, 9);
                    tjge.j.K.a(graphics, 158, 189, 40, 0, 0);
                    tjge.j.K.a(graphics, 5, 189, 39, 0, 0);
                    if (this.c == 32768) {
                        this.j += 9;
                        if (this.j > 26) {
                            this.j = 0;
                        }
                        this.c = 0;
                        break;
                    }
                    if (this.c != 16384) break;
                    this.b = 4;
                    this.c = 0;
                    GameMIDlet.n = null;
                    System.gc();
                    break;
                }
                case 19: {
                    tjge.a.a(graphics, 175, 0, 0, 203, 10, 10, 47872, 0, true);
                    graphics.setColor(65280);
                    this.a(graphics, GameMIDlet.n, 5, 5, 18, 0, 10);
                    tjge.j.K.a(graphics, 5, 186, 39, 0, 0);
                    if (this.c != 16384) break;
                    this.b = 4;
                    this.c = 0;
                    GameMIDlet.n = null;
                    System.gc();
                }
            }
        }
        catch (Exception exception) {}
        this.t = false;
    }

    public final void a(boolean bl) {
        this.e = 0;
        this.j = 0;
        this.g = System.currentTimeMillis() - this.f;
        this.g /= 1000L;
        if (bl) {
            this.G = 0;
            this.H = 0;
            this.b = 16;
            return;
        }
        this.e(64);
        this.b = 18;
    }

    public final void hideNotify() {
        if (this.b == 10 || this.b == 22) {
            this.l = 0;
            this.h = 0;
            this.c = 0;
            this.b = 4;
        }
    }

    public final void a() {
        this.e = 0;
        this.j = 0;
        this.b = 22;
        this.z.w = 0;
    }

    private void a(Graphics graphics) {
        block17: {
            block19: {
                boolean bl;
                boolean bl2;
                block18: {
                    graphics.setColor(0);
                    graphics.setClip(0, 0, 176, 204);
                    graphics.fillRect(0, 0, 176, 204);
                    if (this.c == 32768) {
                        this.b = 2;
                        return;
                    }
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.p[1], 171, 201, 40);
                    switch (this.e) {
                        case 0: {
                            E = 0;
                            C = 0;
                            ++this.e;
                            break;
                        }
                        case 1: {
                            E = 1;
                            if (++C <= 20) break;
                            C = 20;
                            D = 0;
                            ++this.e;
                            break;
                        }
                        case 2: {
                            E = 2;
                            if (++D <= 20) break;
                            GameMIDlet.a(0, "/res/string.bin");
                            D = 20;
                            this.c = 0;
                            ++this.e;
                            tjge.a.F[0] = 0;
                            tjge.a.F[1] = 0;
                            tjge.a.F[2] = 2;
                            tjge.a.F[3] = 60;
                            break;
                        }
                        case 3: {
                            break;
                        }
                        case 4: {
                            if (--D > 0) break;
                            this.b = 2;
                        }
                    }
                    if (E > 0) {
                        tjge.a.a(graphics, 171, 5, 5, 179, 20, C, 47872, 0, true);
                    }
                    if (E > 1) {
                        tjge.a.a(graphics, 134, 72, 13, 25, 20, D, 47872, 17408, false);
                        tjge.a.a(graphics, 42, 149, 163, 102, 20, D, 47872, 17408, false);
                        tjge.j.K.a(graphics, 144, 72 - tjge.j.K.c[17], 17, 0, 0);
                        tjge.j.K.a(graphics, 15, 149 - tjge.j.K.c[14], 14, 0, 0);
                    }
                    if (this.e != 3) break block17;
                    graphics.setClip(0, 0, 176, 204);
                    graphics.setColor(65280);
                    graphics.drawString(GameMIDlet.p[0], 5, 201, 36);
                    bl2 = this.c(F[0]);
                    bl = this.a(graphics, F[1], F[2], A[F[0] % 2], B[F[0] % 2], 90, 19);
                    boolean bl3 = this.c == 16384 || this.c == 16;
                    if (bl3) break block18;
                    int n = F[3];
                    F[3] = n - 1;
                    if (n >= 0) break block19;
                }
                if (bl2) {
                    ++this.e;
                } else if (bl) {
                    F[0] = F[0] + 1;
                    tjge.a.F[1] = 0;
                    tjge.a.F[3] = 60;
                } else {
                    F[1] = F[1] + F[2];
                    tjge.a.F[3] = 60;
                }
            }
            this.c = 0;
        }
    }

    public final void b() {
        this.q = 180224;
        this.r = 176128;
        this.I = this.z.u << 10;
        this.J = this.z.v << 10;
        int n = GameMIDlet.a(this.z.m[0], 1, 2);
        int n2 = GameMIDlet.a(this.z.m[0], 3, 2);
        this.y.u = n << 10;
        this.y.v = n2 << 10;
        this.m = this.y.u - this.q * 1 / 4;
        this.n = this.y.v - this.r * 7 / 10;
        if (this.m > this.I - this.q) {
            this.m = this.I - this.q;
        }
        if (this.m < 0) {
            this.m = 0;
        }
        if (this.n > this.J - this.r) {
            this.n = this.J - this.r;
        }
        if (this.n < 0) {
            this.n = 0;
        }
        int n3 = this.m >> 10;
        int n4 = this.n >> 10;
        this.z.a(n3, n4);
    }

    public final void a(int n, int n2) {
        this.o = 0;
        this.p = 0;
        if (this.m < n) {
            if (n - this.m > 16384) {
                this.o = this.y.y + 16384;
            } else {
                this.m = n;
            }
        } else if (this.m > n) {
            if (this.m - n > 16384) {
                this.o = this.y.y - 16384;
            } else {
                this.m = n;
            }
        }
        if (this.n < n2) {
            if (n2 - this.n > 10240) {
                this.p = Math.min(this.y.z + 10240, 15360);
            } else {
                this.n = n2;
            }
        } else if (this.n > n2) {
            if (this.n - n2 > 10240) {
                this.p = Math.max(this.y.z - 10240, -15360);
            } else {
                this.n = n2;
            }
        }
        this.m += this.o;
        this.n += this.p;
        if (this.L) {
            this.m = this.K % 2 == 0 ? (this.m -= 2048) : (this.m += 2048);
            if (--this.K <= 0) {
                this.L = false;
            }
        }
        if (this.m > this.I - this.q) {
            this.m = this.I - this.q;
        }
        if (this.m < 0) {
            this.m = 0;
        }
        if (this.n > this.J - this.r) {
            this.n = this.J - this.r;
        }
        if (this.n < 0) {
            this.n = 0;
        }
    }

    public final void a(int n) {
        this.M = false;
        switch (this.j) {
            case 0: {
                if (this.z != null && tjge.j.z != n) {
                    this.z.d();
                    this.z = null;
                }
                this.j = 1;
                return;
            }
            case 1: {
                if (n != tjge.j.z) {
                    this.z = tjge.j.b(this, n);
                }
                this.j = 2;
                return;
            }
            case 2: {
                this.b();
                this.M = true;
            }
        }
    }

    public final void run() {
        try {
            long l = System.currentTimeMillis();
            while (this.w != null) {
                if (!this.s || this.t) continue;
                long l2 = System.currentTimeMillis() - l;
                if (l2 < 80L) {
                    Thread.sleep(80L - l2);
                }
                this.repaint();
                l = System.currentTimeMillis();
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    private int d(int n) {
        int n2 = 0;
        this.d = 0;
        switch (n) {
            case -1: 
            case 1: 
            case 50: {
                if (this.b == 10) {
                    n2 = 32;
                    break;
                }
                n2 = 4;
                break;
            }
            case -6: 
            case 6: 
            case 56: {
                n2 = 8;
                break;
            }
            case -2: 
            case 2: 
            case 52: {
                n2 = 1;
                break;
            }
            case -5: 
            case 5: 
            case 54: {
                n2 = 2;
                break;
            }
            case -20: 
            case 20: 
            case 53: {
                n2 = 16;
                this.d = 16;
                break;
            }
            case 55: {
                n2 = 2048;
                break;
            }
            case 35: 
            case 57: {
                n2 = 1024;
                break;
            }
            case 42: {
                n2 = 4096;
                break;
            }
            case 49: {
                n2 = 64;
                break;
            }
            case 51: {
                n2 = 128;
                break;
            }
            case -21: 
            case 21: {
                n2 = 16384;
                break;
            }
            case -22: 
            case 22: {
                n2 = this.b == 4 ? 16 : 32768;
            }
        }
        return n2;
    }

    public final void keyPressed(int n) {
        int n2;
        if (n == 21 || n == -21) {
            if (this.b == 10 || this.b == 22) {
                this.b = 4;
                this.h = 0;
                this.l = 0;
                this.c = 0;
                return;
            }
        } else if ((n == 22 || n == -22) && this.b == 10 && this.z.w == 0) {
            this.e = 0;
            this.b = 22;
        }
        this.c = n2 = this.d(n);
    }

    public final void keyReleased(int n) {
        this.c = 0;
        this.d = -1;
    }

    public final void b(int n) {
        if (!this.L) {
            this.L = true;
            this.K = n;
        }
    }

    public static final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6, int n7, int n8, boolean bl) {
        if (n6 <= 0) {
            return;
        }
        int n9 = Math.abs(n - n3);
        int n10 = Math.abs(n2 - n4);
        n9 = n9 * n6 / n5;
        n10 = n10 * n6 / n5;
        if (n > n3) {
            n -= n9;
        }
        if (n2 > n4) {
            n2 -= n10;
        }
        graphics.setColor(n7);
        graphics.drawRect(n, n2, n9, n10);
        if (n8 >= 0) {
            graphics.setColor(n8);
            graphics.fillRect(n + 1, n2 + 1, n9 - 1, n10 - 1);
        }
        if (bl) {
            graphics.setColor(0);
            graphics.drawRect(n + 1, n2 + 1, n9 - 2, n10 - 2);
            graphics.setColor(65280);
            graphics.drawRect(n + 2, n2 + 2, n9 - 4, n10 - 4);
        }
    }

    public final void a(Graphics graphics, String string, int n, int n2, int n3, int n4, int n5) {
        int n6 = 0;
        int n7 = 0;
        int n8 = 0;
        do {
            n7 = string.indexOf(13, n6);
            if (n8 >= n4) {
                if (n7 == -1) {
                    graphics.drawString(string.substring(n6), n, n2, 20);
                } else {
                    graphics.drawString(string.substring(n6, n7), n, n2, 20);
                }
                n2 += n3;
                --n5;
            }
            n6 = n7 + 2;
            ++n8;
        } while (n7 >= 0 && n5 > 0);
    }

    public final boolean c(int n) {
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        while (n4 < n) {
            if ((n2 = GameMIDlet.l.indexOf(13, n2)) == -1) {
                return true;
            }
            n2 += 2;
            ++n4;
        }
        n3 = GameMIDlet.l.indexOf(13, n2);
        GameMIDlet.m = n3 == -1 ? GameMIDlet.l.substring(n2) : GameMIDlet.l.substring(n2, n3);
        return n3 < 0;
    }

    public final boolean a(Graphics graphics, int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = 0;
        int n8 = 0;
        int n9 = GameMIDlet.m.length();
        while (n7 < n9 && n2 > 0) {
            int n10 = n3;
            int n11 = n7 + 1;
            while (n10 < n3 + n5 && n11 < n9) {
                n10 = n3 + graphics.getFont().substringWidth(GameMIDlet.m, n7, n11 - n7);
                ++n11;
            }
            if (++n8 > n) {
                graphics.drawSubstring(GameMIDlet.m, n7, n11 - n7, n3, n4, 20);
                n4 += n6;
                --n2;
            }
            n7 = n11;
        }
        return n7 >= n9;
    }

    private void e(int n) {
        this.N = n;
        this.O = 48;
        this.P = 1;
    }

    private void a(Graphics graphics, int n, int n2) {
        if (this.P == 1) {
            this.O += 10;
            if (this.O > this.N) {
                this.P = 0;
            }
        } else {
            this.O -= 10;
            if (this.O < 48) {
                this.P = 1;
            }
        }
        int n3 = this.O >>> 1;
        graphics.drawLine(n - n3, n2, n + n3, n2);
    }

    static {
        A = new int[]{17, 46};
        B = new int[]{29, 106};
        F = new int[4];
    }
}

