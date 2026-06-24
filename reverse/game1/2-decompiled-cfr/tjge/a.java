/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.nokia.mid.sound.Sound
 *  com.nokia.mid.ui.DirectGraphics
 *  com.nokia.mid.ui.DirectUtils
 *  com.nokia.mid.ui.FullCanvas
 *  javax.microedition.lcdui.Font
 *  javax.microedition.lcdui.Graphics
 *  javax.microedition.lcdui.Image
 *  javax.microedition.rms.RecordEnumeration
 *  javax.microedition.rms.RecordStore
 */
package tjge;

import com.nokia.mid.sound.Sound;
import com.nokia.mid.ui.DirectGraphics;
import com.nokia.mid.ui.DirectUtils;
import com.nokia.mid.ui.FullCanvas;
import java.io.InputStream;
import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import javax.microedition.rms.RecordEnumeration;
import javax.microedition.rms.RecordStore;
import tjge.GameMIDlet;
import tjge.b;
import tjge.c;
import tjge.d;
import tjge.e;
import tjge.f;
import tjge.g;
import tjge.h;
import tjge.j;
import tjge.k;
import tjge.l;

public final class a
extends FullCanvas
implements Runnable {
    public static int a = 176;
    public static int b = 176;
    public static int c = 180224;
    public static int d = 208;
    public static a e;
    private long W = 100L;
    private boolean X;
    private boolean Y;
    private boolean Z;
    private Thread aa;
    private GameMIDlet ab;
    protected b f;
    protected j g;
    Image h;
    Image i;
    f j;
    g[] k;
    l[][] l;
    h[][] m;
    c n;
    int o;
    int p;
    int q;
    int r;
    int s;
    int t;
    int u;
    int v;
    int w;
    int x;
    int y;
    int z;
    int A;
    int B;
    int C;
    long D;
    boolean E;
    int F;
    int G;
    int H;
    int I;
    short[] J;
    DirectGraphics K;
    boolean L;
    boolean M;
    boolean N;
    int O;
    private int ac;
    private int ad;
    private boolean ae;
    private boolean af;
    private boolean ag;
    private boolean ah;
    private boolean ai;
    private int aj;
    private int ak = -176;
    private int al = -20;
    public static int P;
    private static int[] am;
    private static int an;
    private static int ao;
    public static byte[] Q;
    public static int R;
    public static Sound[] S;
    public static int T;
    static String U;
    static String V;

    public a(GameMIDlet gameMIDlet) {
        e = this;
        this.ab = gameMIDlet;
        a = this.getWidth();
        b = this.getHeight() - 32;
        this.p = 1;
        this.aa = new Thread(this);
        this.aa.start();
        this.X = true;
        this.Y = false;
        this.ag = false;
        this.J = new short[3600];
    }

    public final g a(int n, d d2) {
        switch (n) {
            case 0: {
                this.j = new f(n, d2, this);
                return this.j;
            }
            case 10: {
                return new l(n, d2, this);
            }
            case 1: 
            case 2: 
            case 18: {
                return new h(n, d2, this);
            }
            case 4: 
            case 5: 
            case 6: 
            case 7: 
            case 9: 
            case 12: 
            case 19: 
            case 22: {
                return new e(n, d2, this);
            }
            case 3: 
            case 11: 
            case 13: {
                return new k(n, d2, this);
            }
            case 8: 
            case 14: 
            case 17: {
                return new c(n, d2, this);
            }
        }
        return new g(n, d2);
    }

    /*
     * Unable to fully structure code
     */
    public final void paint(Graphics var1_1) {
        this.Y = true;
        ++this.o;
        try {
            switch (this.p) {
                case 1: {
                    if (this.w++ == 0) {
                        this.h = tjge.a.f(8);
                        var1_1.drawImage(this.h, 29, 55, 20);
                        var1_1.setColor(238, 25, 33);
                        var1_1.setFont(Font.getFont((int)0, (int)1, (int)0));
                        var1_1.drawString("\u79fb\u52a8\u4e92\u8fde \u65e0\u9650\u53ef\u80fd", tjge.a.a / 2, 128, 17);
                        this.h = tjge.a.f(7);
                        this.i = tjge.a.f(0);
                        this.d();
                        break;
                    }
                    if (this.w == 12) {
                        tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0xFFFFFF);
                        var1_1.drawImage(this.h, 12, 12, 20);
                        var1_1.drawImage(this.i, 88, 95, 17);
                        var1_1.setColor(155, 166, 173);
                        var1_1.drawString("\u65b0\u6d6a\u65e0\u7ebf\u4ee3\u7406\u53d1\u884c", 60, 142, 20);
                        this.i = null;
                        this.h = null;
                        break;
                    }
                    if (this.w == 22) {
                        this.i = tjge.a.f(1);
                        tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                        var1_1.drawImage(this.i, 57, 80, 20);
                        var1_1.setColor(0xFFFFFF);
                        var1_1.drawString("www.tickgame.com", 88, 120, 17);
                        break;
                    }
                    if (this.w > 32 && this.w < 42) {
                        var2_2 = 0;
                        while (var2_2 < this.J.length) {
                            this.J[var2_2] = (short)(this.w - 32);
                            v0 = var2_2++;
                            this.J[v0] = (short)(this.J[v0] << 12);
                        }
                        this.K = DirectUtils.getDirectGraphics((Graphics)var1_1);
                        this.K.drawPixels(this.J, true, 0, 72, 57, 60, 72, 48, 0, 4444);
                        break;
                    }
                    if (this.w != 42) break;
                    this.w = 0;
                    this.p = 4;
                    this.H = 0;
                    this.y = 0;
                    this.G = 1;
                    this.ae = false;
                    this.i = tjge.a.f(2);
                    tjge.a.a(0, 1, 160);
                    break;
                }
                case 4: {
                    tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                    var1_1.drawImage(this.i, 18, 9, 20);
                    tjge.j.b[8].a(var1_1, 128, 190, -2147483648, this.o % 3, 0, 0);
                    tjge.j.b[0].a(var1_1, 153, 159, -2147483648, this.o % 3, 0, 0);
                    var1_1.setClip(0, 0, tjge.a.a, tjge.a.d);
                    if (this.ah) {
                        var2_3 = this.h();
                        if (var2_3 == 4) {
                            if (!this.ae) {
                                this.l();
                                if (--this.y < 0) {
                                    this.y = 6;
                                }
                                this.H = this.y;
                            } else if (--this.F < 0) {
                                this.F = tjge.a.Q[0];
                            }
                        } else if (var2_3 == 8) {
                            if (!this.ae) {
                                this.l();
                                if (++this.y > 6) {
                                    this.y = 0;
                                }
                                this.H = this.y;
                            } else if (++this.F > tjge.a.Q[0]) {
                                this.F = 0;
                            }
                        } else if (var2_3 == 16) {
                            this.w = 0;
                            if (this.ae) {
                                if (this.ag && this.x != this.F) {
                                    this.e();
                                }
                                this.x = this.F;
                                tjge.a.Q[1] = (byte)this.x;
                                tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                                this.p = 2;
                                break;
                            }
                            switch (this.y) {
                                case 0: {
                                    tjge.a.Q[0] = 0;
                                    tjge.a.Q[1] = 0;
                                    this.x = 0;
                                    this.j.m();
                                    if (this.ag) {
                                        this.e();
                                    }
                                    this.p = 2;
                                    break;
                                }
                                case 1: {
                                    this.x = tjge.a.Q[1];
                                    this.j.m();
                                    this.p = 2;
                                    break;
                                }
                                case 2: {
                                    this.ae = true;
                                    this.F = 0;
                                    this.j.m();
                                    break;
                                }
                                case 3: {
                                    tjge.a.Q[2] = tjge.a.Q[2] == 0 ? 1 : 0;
                                    break;
                                }
                                case 4: 
                                case 5: {
                                    this.p = this.y == 4 ? 6 : 3;
                                    this.q = 0;
                                    break;
                                }
                                case 6: {
                                    this.c(0);
                                    this.Y = false;
                                    this.ab.notifyDestroyed();
                                }
                            }
                            tjge.a.a(3, 1, 100);
                        }
                    }
                    if (this.ae) {
                        tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                        var1_1.setColor(65280);
                        var1_1.drawRect(0, 185, 175, 21);
                        var1_1.drawString("\u4efb\u52a1" + tjge.a.V.substring(this.F, this.F + 1), tjge.a.a / 2, 190, 17);
                        break;
                    }
                    var1_1.setFont(Font.getFont((int)64, (int)1, (int)8));
                    var2_3 = this.ah != false ? 6 : this.H;
                    var3_5 = 0;
                    var4_7 = 0;
                    while (var4_7 <= var2_3) {
                        if (this.ah && var4_7 == this.y && this.G == 0) {
                            var1_1.setColor(0xFFFFFF);
                        } else {
                            var1_1.setColor(65280);
                        }
                        var3_5 = var4_7 == 3 && tjge.a.Q[2] != 1 ? 7 : var4_7;
                        var1_1.drawString(GameMIDlet.e[var3_5], 52, 87 + var4_7 * 15, 17);
                        ++var4_7;
                    }
                    if (!this.ah) {
                        this.aj += 16;
                        if (this.aj > 64) {
                            if (++this.H > 6) {
                                this.H = this.y;
                                this.ah = true;
                                this.f();
                                this.ai = true;
                            } else {
                                this.aj = 0;
                            }
                        }
                    } else {
                        this.k();
                        this.H = this.y;
                    }
                    var1_1.setColor(65280);
                    var5_9 = this.aj >>> 1;
                    var1_1.drawLine(52 - var5_9, 100 + this.H * 15, 52 + var5_9, 100 + this.H * 15);
                    break;
                }
                case 2: {
                    this.a(this.x);
                    if (this.Z) {
                        this.w = 0;
                        this.p = 22;
                        break;
                    }
                    tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                    var1_1.setColor(0xFF0000);
                    var1_1.drawString("\u8f7d\u5165\u4e2d", 65, 192, 20);
                    var2_4 = 0;
                    while (var2_4 < this.w) {
                        var1_1.drawString(".", 110 + var2_4 * 3, 192, 20);
                        ++var2_4;
                    }
                    break;
                }
                case 22: {
                    if (this.q != 0) {
                        this.w = 71;
                    }
                    if (this.w == 0) {
                        this.g(2);
                    }
                    if (this.w++ <= 70) {
                        tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                        this.b(var1_1, this.w);
                        break;
                    }
                    if (this.w <= 70) break;
                    tjge.a.U = null;
                    System.gc();
                    this.w = 0;
                    this.q = 0;
                    if (!this.Z) {
                        this.p = 10;
                        break;
                    }
                    this.Z = false;
                    this.C = 0;
                    this.D = System.currentTimeMillis();
                    if (this.h == null) {
                        this.h = tjge.a.f(3);
                    }
                    if (this.af) {
                        if (this.x == 7) {
                            this.ac = this.r = 184320;
                            this.j.C -= 40960;
                        } else {
                            this.j.C = 0;
                            this.r = 4096;
                        }
                        this.j.G = 8192;
                        this.j.a(2);
                        this.p = 14;
                        break;
                    }
                    this.t = 0;
                    this.r = 0;
                    this.j.C = -81920;
                    this.p = 10;
                    break;
                }
                case 21: {
                    switch (this.x) {
                        case 2: {
                            if (!this.L) {
                                if (this.w++ <= 3) break;
                                this.t = 12288;
                                this.u = 0;
                                break;
                            }
                            if (this.w++ <= 9) break;
                            this.t = -16384;
                            break;
                        }
                        case 7: {
                            if (!this.L) {
                                if (this.w == 0) {
                                    this.t = -8192;
                                    break;
                                }
                                this.t = 16384;
                                if (this.r + this.t <= this.ac) break;
                                this.r = this.ac;
                                this.t = 0;
                                this.p = 10;
                                this.q = 0;
                                this.w = 0;
                                break;
                            }
                            if (this.w++ > 30) {
                                this.L = false;
                                this.u = 0;
                                break;
                            }
                            this.t = 0;
                        }
                    }
                    this.a();
                    this.a(var1_1);
                    break;
                }
                case 14: {
                    if (this.w++ != 5) ** GOTO lbl248
                    this.j.G = 0;
                    this.j.a(1);
                    ** GOTO lbl254
lbl248:
                    // 1 sources

                    if (this.w > 16) {
                        this.j.a(0);
                        this.p = this.x == 7 ? 21 : 10;
                        this.q = 0;
                        this.af = false;
                        this.w = 0;
                    }
                }
lbl254:
                // 5 sources

                case 10: {
                    this.a();
                    this.a(var1_1);
                    break;
                }
                case 18: {
                    if (this.w == 0) {
                        this.D = System.currentTimeMillis() - this.D;
                        var1_1.setColor(65280);
                        var1_1.drawString("\u4efb\u52a1" + tjge.a.V.substring(tjge.a.e.x, tjge.a.e.x + 1) + "\u5931\u8d25", tjge.a.a / 2, 35, 17);
                        var1_1.drawString("\u51fb\u6bd9\u654c\u4eba: " + this.C, 36, 74, 20);
                        var1_1.drawString("\u6240\u7528\u65f6\u95f4: " + tjge.a.a(this.D), 36, 105, 20);
                        this.b(var1_1, 0, 16, 40, 175, 0);
                        this.aj = 60;
                        ++this.w;
                        this.f();
                    } else {
                        var3_6 = this.h();
                        if (var3_6 == 4) {
                            this.l();
                            if (--this.y < 0) {
                                this.y = 1;
                            }
                        } else if (var3_6 == 8) {
                            this.l();
                            if (++this.y > 1) {
                                this.y = 0;
                            }
                        } else if (var3_6 == 16) {
                            switch (this.y) {
                                case 0: {
                                    this.j.m();
                                    this.p = 2;
                                    break;
                                }
                                case 1: {
                                    this.ae = false;
                                    this.p = 4;
                                }
                            }
                            this.w = 0;
                            this.f();
                            this.H = 0;
                            this.G = 0;
                            this.y = 0;
                            this.ag = true;
                            break;
                        }
                    }
                    tjge.a.a(var1_1, 70, 150, 106, 58, 0);
                    var3_6 = 0;
                    while (var3_6 < 2) {
                        if (var3_6 == this.y && this.G == 0) {
                            var1_1.setColor(0xFFFFFF);
                        } else {
                            var1_1.setColor(65280);
                        }
                        if (var3_6 == 0) {
                            var1_1.drawString(GameMIDlet.e[1], 120, 150, 17);
                        } else {
                            var1_1.drawString(GameMIDlet.e[9], 120, 170, 17);
                        }
                        ++var3_6;
                    }
                    var1_1.setColor(65280);
                    var4_8 = this.aj >>> 1;
                    var1_1.drawLine(120 - var4_8, 164 + this.y * 20, 120 - var4_8 + this.aj, 164 + this.y * 20);
                    this.k();
                    break;
                }
                case 15: {
                    tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                    if (this.w == 0) {
                        tjge.j.b(18);
                        this.w = 10;
                        break;
                    }
                    if (this.ak > 240) {
                        if (this.w > 0) {
                            this.w = 0;
                        }
                        var1_1.setColor(0xFF0000);
                        var1_1.setFont(Font.getFont((int)0, (int)1, (int)16));
                        var1_1.drawString("\u5267\u7ec8", 88, 100, 17);
                        if (this.w-- >= -60) break;
                        this.p = 4;
                        this.w = 0;
                        this.f();
                        this.y = 0;
                        this.ae = false;
                        this.ag = true;
                        break;
                    }
                    var5_10 = 0;
                    var6_12 = 0;
                    var7_14 = 0;
                    var8_16 = 0;
                    var9_19 = 0;
                    var10_20 = 0;
                    while (var10_20 < 4) {
                        switch (var10_20) {
                            case 0: {
                                var5_10 = 0;
                                var8_16 = 146;
                                var7_14 = this.ak - 15;
                                this.ak += 6;
                                if (var7_14 > 3 && var7_14 < 40) {
                                    var6_12 = 1;
                                    var9_19 = 8;
                                    break;
                                }
                                var6_12 = 0;
                                var9_19 = 3;
                                break;
                            }
                            case 1: {
                                var5_10 = 18;
                                var7_14 = this.al - 15;
                                var8_16 = 146;
                                this.al += 6;
                                if (this.ak < 6 || this.ak > 25) {
                                    var6_12 = -2147483648;
                                    var9_19 = 4;
                                    break;
                                }
                                var6_12 = -2147483646;
                                var9_19 = 2;
                                break;
                            }
                            case 2: 
                            case 3: {
                                var5_10 = 8;
                                var6_12 = 0;
                                var7_14 = var10_20 == 2 ? this.ak : this.al;
                                var8_16 = 176;
                                var9_19 = 3;
                            }
                        }
                        this.b(var1_1, var5_10, var6_12, var7_14, var8_16, this.w % var9_19);
                        ++var10_20;
                    }
                    ++this.w;
                    break;
                }
                case 16: {
                    if (this.q != 0 && this.w != 10) {
                        this.w = 10;
                        this.I = 0;
                        this.f();
                    }
                    this.c(var1_1);
                    if (this.w == 0) {
                        tjge.a.a(2, 1, 140);
                        this.D = System.currentTimeMillis() - this.D;
                        var1_1.setColor(65280);
                        var1_1.drawString("\u4efb\u52a1" + tjge.a.V.substring(tjge.a.e.x, tjge.a.e.x + 1) + "\u5b8c\u6210", tjge.a.a / 2, 35, 17);
                        var1_1.drawString("\u51fb\u6bd9\u654c\u4eba: " + this.C, 36, 74, 20);
                        var1_1.drawString("\u6240\u7528\u65f6\u95f4: " + tjge.a.a(this.D), 36, 105, 20);
                        this.w = 1;
                        this.I = 0;
                        break;
                    }
                    var1_1.setColor(0);
                    var1_1.fillRect(54, 125, 60, 50);
                    if (this.w == 10) {
                        if (!this.b(var1_1, 0, 14, 84, 175, this.I++)) break;
                        this.w = 0;
                        this.f();
                        if (this.x != 7) {
                            ++this.x;
                            this.e();
                            this.p = 2;
                            if ((byte)this.x > tjge.a.Q[0]) {
                                tjge.a.Q[0] = (byte)this.x;
                            }
                            tjge.a.Q[1] = (byte)this.x;
                            this.c(0);
                        } else {
                            this.p = 15;
                            this.ak = -176;
                            this.al = -20;
                        }
                        System.gc();
                        break;
                    }
                    this.b(var1_1, 0, 0, 84, 175, this.I++);
                    break;
                }
                case 19: {
                    if (this.w == 0) {
                        this.j.a(1);
                        this.j.G = tjge.a.e.x == 4 ? this.t : 0;
                        this.j.I = 0;
                        this.j.H = 0;
                        this.j.J = 0;
                    } else if (this.w == 11) {
                        switch (this.x) {
                            case 0: 
                            case 6: 
                            case 7: {
                                this.j.G = 8192;
                                this.j.a(2);
                                break;
                            }
                            case 1: 
                            case 3: {
                                ++this.w;
                                this.j.a(0 | this.j.d);
                                break;
                            }
                            case 2: {
                                this.j.G = 12288;
                                this.j.c(-10240);
                                this.j.o = 4;
                                ++this.w;
                                break;
                            }
                            case 4: {
                                this.j.G = 15360;
                            }
                        }
                    }
                    if ((this.x == 1 || this.x == 3) && this.w > 11) {
                        if (this.w++ > 23) {
                            this.p = 16;
                            this.q = 0;
                            this.w = 0;
                            break;
                        }
                        this.a(var1_1, this.w - 11);
                        break;
                    }
                    if (this.j.C > this.r + tjge.a.c + 10240) {
                        this.j.G = 0;
                        if (this.w++ > 32) {
                            this.p = 16;
                            this.q = 0;
                            this.u = 0;
                            this.w = 0;
                            break;
                        }
                        this.a(var1_1, this.w - 20);
                        break;
                    }
                    this.a();
                    this.a(var1_1);
                    if (this.w < 11) {
                        ++this.w;
                        break;
                    }
                    this.w = 20;
                    break;
                }
                case 13: {
                    if (this.w == 0) {
                        var5_11 = 0;
                        while (var5_11 < this.J.length) {
                            this.J[var5_11] = 24603;
                            ++var5_11;
                        }
                        ++this.w;
                    }
                    if ((var5_11 = this.h()) == 4) {
                        if (--this.y < 0) {
                            this.y = 3;
                        }
                    } else if (var5_11 == 8) {
                        if (++this.y > 3) {
                            this.y = 0;
                        }
                    } else if (var5_11 == 16) {
                        switch (this.y) {
                            case 0: {
                                this.q = 0;
                                this.p = 10;
                                break;
                            }
                            case 1: {
                                tjge.a.Q[2] = tjge.a.Q[2] == 0 ? 1 : 0;
                                break;
                            }
                            case 2: {
                                this.ag = true;
                                this.f();
                                this.H = 0;
                                this.G = 0;
                                this.y = 0;
                                this.ae = false;
                                this.p = 4;
                                break;
                            }
                            case 3: {
                                this.c(0);
                                this.Y = false;
                                this.ab.notifyDestroyed();
                                return;
                            }
                        }
                        this.w = 0;
                        tjge.a.a(3, 1, 100);
                        if (this.y != 1) break;
                    }
                    this.a(var1_1);
                    var1_1.setClip(0, 0, tjge.a.a, tjge.a.d);
                    var1_1.setColor(240, 176, 0);
                    var1_1.drawRect(44, 45, 88, 78);
                    this.K = DirectUtils.getDirectGraphics((Graphics)var1_1);
                    this.K.drawPixels(this.J, true, 0, 87, 45, 46, 87, 39, 0, 4444);
                    this.K.drawPixels(this.J, true, 0, 87, 45, 85, 87, 38, 0, 4444);
                    var6_13 = 0;
                    var7_15 = 0;
                    while (var7_15 < 4) {
                        if (this.y == var7_15) {
                            var1_1.setColor(0xFFFFFF);
                        } else {
                            var1_1.setColor(96, 192, 255);
                        }
                        if (var7_15 == 0) {
                            var6_13 = 8;
                        } else if (var7_15 == 1) {
                            var6_13 = tjge.a.Q[2] == 1 ? 3 : 7;
                        } else if (var7_15 == 2) {
                            var6_13 = 9;
                        } else if (var7_15 == 3) {
                            var6_13 = 6;
                        }
                        var1_1.drawString(GameMIDlet.e[var6_13], 56, 56 + var7_15 * 16, 20);
                        ++var7_15;
                    }
                    break;
                }
                case 3: 
                case 6: {
                    if (this.q != 0) {
                        this.p = 4;
                        this.ae = false;
                        this.w = 0;
                        this.f();
                        tjge.a.U = null;
                        System.gc();
                        break;
                    }
                    if (this.w == 0) {
                        if (this.p == 6) {
                            this.g(0);
                            var8_17 = 3;
                        } else {
                            this.g(1);
                            var8_17 = 25;
                        }
                        tjge.a.a(var1_1, 0, 0, tjge.a.a, tjge.a.d, 0);
                        var1_1.setFont(Font.getFont((int)0, (int)1, (int)8));
                        var1_1.setColor(65280);
                        this.a(var1_1, 20, var8_17, 14);
                        ++this.w;
                    }
                    this.c(var1_1);
                    break;
                }
                case 20: {
                    this.a(var1_1, this.w++);
                    if (this.w <= 12) break;
                    this.w = 0;
                    this.j.V = false;
                    this.j.Z = null;
                    this.y = 0;
                    this.q = 0;
                    if (this.j.O == 16 && this.j.P == 16) {
                        this.p = 16;
                        break;
                    }
                    if (this.j.e <= 0) {
                        this.p = 18;
                        break;
                    }
                    this.j.a(0);
                    this.j.d = 0;
                    this.j.C = this.j.O << 10;
                    this.j.D = this.j.P << 10;
                    var8_18 = tjge.a.b << 10;
                    tjge.a.e.r = this.j.C - tjge.a.c / 5;
                    tjge.a.e.s = this.j.D - var8_18 * 3 / 4;
                    this.f.c();
                    this.p = 10;
                }
            }
        }
        catch (Exception v1) {}
        this.Y = false;
    }

    public final void a() {
        int n;
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int[] nArray = new int[10];
        n2 = 0;
        while (n2 < this.v) {
            this.k[n2] = null;
            ++n2;
        }
        this.v = 0;
        n2 = 0;
        while (n2 < this.g.f[this.g.g].length) {
            n = this.g.f[this.g.g][n2];
            if (n != 0 && tjge.j.e[n] != null && tjge.j.e[n].p && tjge.j.e[n].q != 0) {
                if (this.b(tjge.j.e[n].q)) {
                    nArray[n4++] = n;
                } else {
                    this.k[this.v++] = tjge.j.e[n];
                }
            }
            ++n2;
        }
        if (this.x != 4) {
            this.k[this.v++] = this.j;
        }
        if (this.z > 0) {
            n2 = 0;
            while (n2 < 2) {
                n3 = 0;
                while (n3 < 3) {
                    if (this.m[n2][n3].p) {
                        if (this.m[n2][n3].X != null && this.m[n2][n3].X.p) {
                            this.k[this.v++] = this.m[n2][n3].X;
                        }
                        this.k[this.v++] = this.m[n2][n3];
                    }
                    ++n3;
                }
                ++n2;
            }
            if (this.x == 4 && this.n != null) {
                if (this.n.p) {
                    this.k[this.v++] = this.n;
                }
                if (this.n.o != null && this.n.o.p) {
                    this.k[this.v++] = this.n.o;
                }
            }
        }
        if (this.x == 4) {
            this.k[this.v++] = this.j;
        }
        n2 = 0;
        while (n2 < n4) {
            this.k[this.v++] = tjge.j.e[nArray[n2]];
            ++n2;
        }
        n3 = 0;
        while (n3 < 5) {
            if (this.l[n3] != null) {
                n2 = 0;
                while (n2 < this.l[n3].length) {
                    if (this.l[n3][n2].p) {
                        this.k[this.v++] = this.l[n3][n2];
                    }
                    ++n2;
                }
            }
            ++n3;
        }
        n2 = 0;
        while (n2 < this.v) {
            this.k[n2].e();
            ++n2;
        }
        n2 = 0;
        while (n2 < this.v) {
            this.k[n2].a();
            ++n2;
        }
        this.c();
        n = this.r >> 10;
        int n5 = this.s >> 10;
        if (this.x != 4) {
            this.g.b(n, n5);
        }
        this.f.a(n, n5);
    }

    public final void a(Graphics graphics) {
        int n;
        int n2 = this.r >> 10;
        int n3 = this.s >> 10;
        this.f.a(graphics);
        int n4 = 0;
        while (n4 < this.v) {
            this.k[n4].a(graphics, n2, n3);
            ++n4;
        }
        graphics.setClip(0, 176, 176, 32);
        graphics.drawImage(this.h, 0, 176, 20);
        graphics.setClip(25, 201, 40, 2);
        if (this.j.e > 6) {
            graphics.setColor(65280);
        } else if (this.j.e >= 4) {
            graphics.setColor(200, 200, 0);
        } else {
            graphics.setColor(0xFF0000);
        }
        graphics.fillRect(25, 201, this.j.e << 2, 2);
        graphics.setClip(161, 186, 8, 8);
        ++this.G;
        if (this.x == 4) {
            graphics.drawImage(this.h, 89, 154, 20);
        } else {
            graphics.drawImage(this.h, 161 - this.j.j * 8, 154, 20);
        }
        graphics.setColor(0);
        graphics.fillRect(80, 180, 44, 15);
        if (this.p == 10 && this.M && this.G % 2 == 0) {
            this.a(graphics, this.O, 150, 162, this.x == 7, false);
        }
        int n5 = 0;
        graphics.setClip(0, 0, a, d);
        graphics.setColor(66, 214, 198);
        switch (this.j.k) {
            case 0: {
                n5 = 99;
                break;
            }
            case 1: {
                n5 = this.j.h;
                break;
            }
            case 2: {
                n5 = this.j.i;
            }
        }
        if (this.G > 1) {
            graphics.drawRect(76 + this.j.k * 20, 195, 16, 10);
        }
        int n6 = this.j.l % 10;
        int n7 = this.j.l / 10;
        if (this.j.l != 0 || this.j.l == 0 && this.G > 1) {
            n = this.j.l == 0 ? 99 : 0;
            graphics.setClip(82, 184, 8, 8);
            graphics.drawImage(this.h, 82 - n7 * 8 - n, 152, 20);
            graphics.setClip(90, 184, 8, 8);
            graphics.drawImage(this.h, 90 - n6 * 8 - n, 152, 20);
        }
        graphics.setClip(100, 184, 8, 8);
        graphics.drawImage(this.h, 20, 152, 20);
        n = n5 % 10;
        graphics.setClip(110, 184, 8, 8);
        graphics.drawImage(this.h, 110 - (n5 /= 10) * 8, 152, 20);
        graphics.setClip(118, 184, 8, 8);
        graphics.drawImage(this.h, 118 - n * 8, 152, 20);
        if (this.G > 1) {
            graphics.setClip(5, 196, 8, 8);
            graphics.drawImage(this.h, -84, 164, 20);
        }
        if (this.G > 3) {
            this.G = -1;
        }
        if (this.x < 3) {
            graphics.setClip(0, 0, 176, 176);
            graphics.setColor(0xFFFFFF);
            int n8 = 0;
            while (n8 < 4) {
                int n9 = GameMIDlet.a(176);
                int n10 = GameMIDlet.a(176);
                if (n8 % 2 == 0) {
                    graphics.drawLine(n9, n10, n9 - 5, n10 + 11);
                } else {
                    graphics.drawLine(n9, n10, n9 - 3, n10 + 6);
                }
                ++n8;
            }
        }
    }

    public final void b() {
        int n = a << 10;
        int n2 = b << 10;
        int n3 = this.f.a();
        int n4 = this.f.b();
        n3 <<= 10;
        n4 <<= 10;
        this.j.C = this.g.h[0] << 10;
        this.j.D = this.g.i[0] << 10;
        this.r = this.j.C - n / 5;
        this.s = this.j.D - n2 * 3 / 4;
        if (this.r > n3 - n) {
            this.r = n3 - n;
        }
        if (this.r < 0) {
            this.r = 0;
        }
        if (this.s > n4 - n2) {
            this.s = n4 - n2;
        }
        if (this.s < 0) {
            this.s = 0;
        }
        int n5 = this.r >> 10;
        int n6 = this.s >> 10;
        this.g.a(n5, n6);
        this.f.c();
        this.f.a(n5, n6);
    }

    public final void c() {
        int n = b << 10;
        int n2 = this.f.a();
        int n3 = this.f.b();
        n2 <<= 10;
        n3 <<= 10;
        if (this.af) {
            this.t = 0;
            return;
        }
        switch (this.x) {
            case 0: {
                if (this.L || this.r >> 14 != 33 || this.s >> 14 != 11) break;
                this.L = true;
                this.u = 0;
                this.t = 0;
                this.r = 540672;
                this.s = 180224;
                break;
            }
            case 1: {
                if (this.L) {
                    if (this.z < 0) {
                        this.z = 0;
                    }
                    if (this.z == 0 && this.B > 0) {
                        int n4 = 425984;
                        e.b(2, 1, tjge.a.e.r + c, n4, 1, 1);
                        n4 = 507904;
                        e.b(1, 2, tjge.a.e.r + c, n4, 1, 1);
                        --this.B;
                    }
                    this.O = this.z + this.B * 3;
                    break;
                }
                int n5 = this.r >> 14;
                if (n5 != 43 && n5 != 44 || this.s >> 14 != 22) break;
                this.L = true;
                this.M = true;
                this.B = 4;
                this.t = 0;
                this.u = 0;
                this.s = 360448;
                this.r = 720896;
                break;
            }
            case 2: {
                if (this.p != 21) break;
                this.r += this.t;
                if (this.r > n2 - c) {
                    this.r = n2 - c;
                    this.t = 0;
                    this.w = 0;
                    this.L = true;
                } else if (this.r < 0 && this.L) {
                    this.r = 0;
                    this.p = 10;
                    this.q = 0;
                    this.L = false;
                    this.w = 0;
                    this.t = 0;
                }
                if (this.s < 0) {
                    this.s = 0;
                }
                return;
            }
            case 3: {
                if (this.L || this.ac != 0) break;
                int n6 = this.r >> 14;
                int n7 = this.s >> 14;
                int n8 = this.j.C >> 14;
                int n9 = this.j.D >> 14;
                if (n8 <= 66 || n9 <= 0 || n6 != 68) break;
                this.t = 0;
                if (n7 == 5) {
                    this.L = true;
                    this.u = 0;
                    this.t = 0;
                    this.r = 0x110000;
                    this.s = 81920;
                    ++this.ac;
                    break;
                }
                this.u = 8192;
                break;
            }
            case 4: {
                this.r += this.t;
                if (this.j.aa != null) {
                    this.j.aa.C = this.j.C + 23552;
                }
                if (this.B > 0) {
                    return;
                }
                if (this.z < 0) {
                    this.z = 0;
                }
                if (this.z == 0) {
                    if (this.A < 5) {
                        this.i();
                    } else if (tjge.a.e.p == 10) {
                        tjge.a.e.p = 19;
                    }
                }
                this.O = this.z + (5 - this.A) * 4;
                this.M = true;
                return;
            }
            case 6: {
                if (!this.L && this.ac == 0 && this.r >> 14 == 33) {
                    if (this.s >> 14 != 22) break;
                    this.L = true;
                    this.u = 0;
                    this.t = 0;
                    this.r = 671744;
                    this.s = 442368;
                    ++this.ac;
                    break;
                }
                if (tjge.a.e.p != 19) break;
                this.u = this.N ? -1536 : 1536;
                this.N = !this.N;
                break;
            }
            case 7: {
                if (this.p == 10 || this.p == 19) {
                    int n10 = this.r >> 10;
                    int n11 = this.j.C >> 10;
                    int n12 = n11 - this.ad;
                    if (n12 < 176) {
                        this.u = n12 > 50 ? (this.N ? -1536 : 1536) : (this.N ? -2048 : 2048);
                        boolean bl = this.N = !this.N;
                    }
                    if (this.ad == 0) {
                        this.ad = 30;
                    }
                    this.ad += 2;
                    if (n12 < 0) {
                        n12 = 0;
                    }
                    this.O = n12;
                    this.M = true;
                    if (this.ad <= n10) break;
                    int n13 = this.ad - n10;
                    if (n13 > 172) {
                        this.ad = n10 + 172;
                    }
                    this.e(n13);
                    break;
                }
                if (this.p != 21) break;
                if (this.L) {
                    this.u = this.u > 0 ? -2048 : 2048;
                    this.s += this.u;
                    if (this.w <= 12) break;
                    this.e(this.w * 3);
                    break;
                }
                this.r += this.t;
                if (this.r < 0) {
                    this.L = true;
                    this.r = 0;
                }
                return;
            }
        }
        if (!tjge.a.e.L) {
            this.r += this.t;
            this.s += this.u;
            if (this.t > 0) {
                if (this.j.C - this.r < c / 5) {
                    this.r = this.j.C - c / 5;
                }
            } else if (this.t < 0 && this.j.C - this.r > c * 4 / 5) {
                this.r = this.j.C - c * 4 / 5;
            }
            if (this.u > 0) {
                if (this.s > this.j.D - n / 3) {
                    this.s = this.j.D - n / 3;
                }
            } else if (this.u < 0 && this.s < this.j.D - n * 3 / 4) {
                this.s = this.j.D - n * 3 / 4;
            }
        }
        if (this.r > n2 - c) {
            this.r = n2 - c;
        }
        if (this.r < 0) {
            this.r = 0;
        }
        if (this.s > n3 - n + (this.x == 7 ? 2048 : 0)) {
            this.s = n3 - n;
        }
        if (this.s < 0) {
            this.s = 0;
        }
    }

    public final void d() {
        this.k = new g[40];
        this.l = new l[5][];
        tjge.j.a(this);
        tjge.a.g();
        this.c(1);
    }

    public final void a(int n) {
        this.Z = false;
        switch (this.w) {
            case 0: {
                System.gc();
                this.af = n != 4;
                this.w = 1;
                return;
            }
            case 1: {
                if (!this.ag) {
                    this.g = tjge.j.a(this, n);
                } else {
                    tjge.j.a.a(n);
                }
                this.w = 2;
                return;
            }
            case 2: {
                if (!this.ag) {
                    this.f = tjge.j.a;
                }
                this.b();
                this.w = 3;
                return;
            }
            case 3: {
                if (tjge.j.b[21] == null) {
                    tjge.j.b(21);
                    this.l[0] = new l[10];
                    int n2 = 0;
                    while (n2 < 10) {
                        this.l[0][n2] = new l(21, tjge.j.b[21], this);
                        ++n2;
                    }
                }
                this.w = 4;
                return;
            }
            case 4: {
                if (tjge.j.b[10] == null) {
                    tjge.j.b(10);
                }
                if (this.l[1] == null) {
                    this.l[1] = new l[3];
                    int n3 = 0;
                    while (n3 < 3) {
                        this.l[1][n3] = new l(10, tjge.j.b[10], this);
                        ++n3;
                    }
                }
                this.w = 5;
                return;
            }
            case 5: {
                if (tjge.j.b[20] == null) {
                    tjge.j.b(20);
                    this.l[2] = new l[6];
                    int n4 = 0;
                    while (n4 < 6) {
                        this.l[2][n4] = new l(20, tjge.j.b[20], this);
                        ++n4;
                    }
                }
                this.w = 6;
                return;
            }
            case 6: {
                if (tjge.j.b[15] == null) {
                    tjge.j.b(15);
                    this.l[3] = new l[2];
                    int n5 = 0;
                    while (n5 < 2) {
                        this.l[3][n5] = new l(15, tjge.j.b[15], this);
                        ++n5;
                    }
                }
                if (this.x == 2 || this.x == 4) {
                    tjge.j.b(6);
                }
                this.w = 7;
                return;
            }
            case 7: {
                if (tjge.j.b[16] == null) {
                    tjge.j.b(16);
                    this.l[4] = new l[10];
                    int n6 = 0;
                    while (n6 < 10) {
                        this.l[4][n6] = new l(16, tjge.j.b[16], this);
                        ++n6;
                    }
                }
                this.w = 8;
                return;
            }
            case 8: {
                switch (this.x) {
                    case 0: 
                    case 1: 
                    case 3: 
                    case 4: 
                    case 6: {
                        if (this.m == null) {
                            this.m = new h[2][];
                            tjge.j.b(2);
                            this.m[0] = new h[3];
                            int n7 = 0;
                            while (n7 < 3) {
                                this.m[0][n7] = new h(2, tjge.j.b[2], this);
                                ++n7;
                            }
                            tjge.j.b(1);
                            this.m[1] = new h[3];
                            int n8 = 0;
                            while (n8 < 3) {
                                this.m[1][n8] = new h(1, tjge.j.b[1], this);
                                ++n8;
                            }
                        }
                        if (this.x != 4 || this.n != null) break;
                        this.n = new c(8, tjge.j.b[8], this);
                        this.n.o = new h(1, tjge.j.b[1], this);
                    }
                }
                this.w = 9;
                return;
            }
            case 9: {
                tjge.j.a();
                this.j.f();
                this.j();
                this.z = 0;
                this.A = 0;
                this.B = 30;
                this.E = false;
                this.L = false;
                this.M = false;
                this.Z = true;
                this.ac = 0;
                this.w = 0;
                this.ad = 0;
            }
        }
    }

    public final void run() {
        try {
            long l2 = System.currentTimeMillis();
            while (this.aa != null) {
                if (!this.X || this.Y) continue;
                long l3 = System.currentTimeMillis() - l2;
                if (l3 < this.W) {
                    Thread.sleep(this.W - l3);
                    System.gc();
                }
                this.repaint();
                l2 = System.currentTimeMillis();
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    private int h(int n) {
        int n2 = 0;
        switch (n) {
            case -1: 
            case 1: {
                n2 = 4;
                break;
            }
            case -2: 
            case 6: {
                n2 = 8;
                break;
            }
            case -3: 
            case 2: {
                n2 = 1;
                break;
            }
            case -4: 
            case 5: {
                n2 = 2;
                break;
            }
            case -6: 
            case -5: {
                if (this.p == 10) break;
                n2 = 16;
                break;
            }
            case -7: {
                n2 = 4096;
                break;
            }
            case 42: 
            case 48: 
            case 55: 
            case 56: {
                n2 = 16;
                break;
            }
            case 35: 
            case 57: {
                if (this.p == 10) {
                    n2 = 32;
                    break;
                }
                n2 = 16;
                break;
            }
            case 51: 
            case 54: {
                if (this.p == 10) {
                    n2 = 2048;
                    break;
                }
                n2 = 16;
                break;
            }
            case 49: 
            case 50: 
            case 52: 
            case 53: {
                n2 = this.p == 10 ? 1024 : 16;
            }
        }
        return n2;
    }

    public final void keyPressed(int n) {
        int n2;
        if (n == -6 || n == -5) {
            if (this.p == 10) {
                this.f();
                this.y = 0;
                this.p = 13;
                return;
            }
            if (this.p == 4) {
                this.a(16, false);
                return;
            }
        } else if (n == -7) {
            if (this.p == 10) {
                this.f();
                this.p = 22;
                this.w = 0;
                return;
            }
            if (this.p == 13) {
                this.p = 10;
                return;
            }
        }
        this.q = n2 = this.h(n);
        this.a(n2, false);
    }

    public final void keyReleased(int n) {
        this.q = 0;
    }

    public final l a(int n, int n2, int n3, int n4, int n5, int n6) {
        int n7 = 0;
        boolean bl = false;
        switch (n) {
            case 21: {
                n7 = 0;
                break;
            }
            case 10: {
                n7 = 1;
                break;
            }
            case 20: {
                n7 = 2;
                bl = true;
                break;
            }
            case 15: {
                n7 = 3;
                bl = true;
                break;
            }
            case 16: {
                n7 = 4;
                break;
            }
            default: {
                return null;
            }
        }
        int n8 = 0;
        while (n8 < this.l[n7].length) {
            if (!this.l[n7][n8].p) {
                this.l[n7][n8].C = n4;
                this.l[n7][n8].D = n5;
                this.l[n7][n8].c = n4;
                this.l[n7][n8].a(n2);
                this.l[n7][n8].p = true;
                this.l[n7][n8].s = bl;
                this.l[n7][n8].b = 0;
                this.l[n7][n8].G = this.x == 4 ? this.t : 0;
                this.l[n7][n8].H = 0;
                this.l[n7][n8].d = n6;
                this.l[n7][n8].N = n3;
                return this.l[n7][n8];
            }
            ++n8;
        }
        return null;
    }

    public final void e() {
        int n = 0;
        while (n < this.v) {
            this.k[n] = null;
            ++n;
        }
        if (this.m != null) {
            int n2 = 0;
            while (n2 < this.m.length) {
                if (this.m[n2] != null) {
                    int n3 = 0;
                    while (n3 < this.m[n2].length) {
                        this.m[n2][n3].X = null;
                        this.m[n2][n3] = null;
                        ++n3;
                    }
                }
                this.m[n2] = null;
                ++n2;
            }
            this.m = null;
        }
        if (this.n != null) {
            this.n.o = null;
            this.n = null;
        }
        this.j.aa = null;
        this.g.c();
        this.g = null;
        this.ag = false;
        System.gc();
    }

    public final boolean b(int n) {
        switch (n) {
            case 3: 
            case 8: 
            case 11: 
            case 13: {
                return true;
            }
        }
        return false;
    }

    public final boolean b(int n, int n2, int n3, int n4, int n5, int n6) {
        if (n2 > 3 || n2 == 0) {
            return false;
        }
        int n7 = 0;
        int n8 = 0;
        if (this.z < 0) {
            this.z = 0;
        }
        int n9 = n == 2 ? 0 : 1;
        int n10 = 0;
        while (n10 < 3) {
            if (!this.m[n9][n10].p) {
                h h2 = this.m[n9][n10];
                h2.a(n5);
                h2.p = true;
                h2.s = true;
                h2.S = false;
                h2.V = this.j;
                h2.b = 0;
                h2.m = 1;
                h2.l = 5;
                h2.P = 0;
                h2.h = 0;
                h2.U = true;
                switch (n6) {
                    case 0: {
                        h2.T = false;
                        h2.d = 0;
                        int n11 = GameMIDlet.a(160);
                        h2.C = this.r + 5120 + (n11 <<= 10);
                        if (h2.C > this.r + 90112) {
                            h2.G = 7168;
                        } else {
                            h2.G = 9216;
                            h2.a(n5 | Integer.MIN_VALUE);
                        }
                        h2.H = 1024;
                        h2.D = n4 - n7;
                        n7 += 20480;
                        h2.a = 0;
                        h2.o = 0;
                        if (h2.X == null) {
                            h2.X = new e(6, tjge.j.b[6], this);
                        }
                        h2.X.p = true;
                        h2.X.C = h2.C;
                        h2.X.D = h2.D - 30720;
                        h2.X.a(0);
                        break;
                    }
                    case 1: {
                        h2.D = n4;
                        h2.G = 0;
                        h2.H = 0;
                        h2.T = true;
                        h2.f = 40960;
                        h2.g = -40960;
                        h2.o = 7;
                        h2.C = n3 + 20480;
                        h2.e = 0;
                        h2.d = 100;
                        h2.i = this.r + 61440;
                        h2.a = n8 << 3;
                        h2.j = n3 - 51200 + n8 * 20480;
                        if (n8 > 0) {
                            h2.h = 1;
                        }
                        if (n != 2) break;
                        h2.f = 122880;
                        h2.j = n3 - 30720;
                        h2.d = 0;
                    }
                }
                ++this.z;
                h2.N = h2.h;
                h2.m = h2.h + 1;
                if (++n8 == n2) {
                    return true;
                }
            }
            ++n10;
        }
        return false;
    }

    public final boolean a(int n, int n2) {
        if (this.n == null || this.n.o == null) {
            return false;
        }
        this.n.p = true;
        this.n.k = false;
        this.n.n = true;
        this.n.C = n;
        this.n.D = this.j.aa.D - 3072;
        this.n.G = n2;
        this.n.a(0);
        h h2 = this.n.o;
        this.n.o.p = true;
        h2.f = 40960;
        h2.g = -40960;
        if (n > this.j.C) {
            h2.C = this.n.C + 23552;
            h2.a(2);
        } else {
            h2.C = this.n.C - 23552;
            h2.a(-2147483646);
        }
        h2.D = this.j.D - 2048;
        h2.G = this.n.G;
        h2.H = 0;
        h2.d = 0;
        h2.m = 2;
        h2.N = 1;
        h2.h = 1;
        h2.o = 0;
        h2.V = this.j;
        h2.l = 8;
        h2.P = 0;
        h2.T = true;
        this.z = this.z < 0 ? 1 : ++this.z;
        return true;
    }

    private int h() {
        if (an == ao) {
            return 0;
        }
        int n = am[ao];
        if (++ao == P) {
            ao = 0;
        }
        return n;
    }

    private void a(int n, boolean bl) {
        tjge.a.am[tjge.a.an] = bl ? n | Integer.MIN_VALUE : n;
        if (++an >= P) {
            an = 0;
        }
        if (an == ao && ++ao >= P) {
            ao = 0;
        }
    }

    public final void f() {
        an = 0;
        ao = 0;
    }

    private void i() {
        int n;
        int n2;
        int n3;
        int n4 = n3 = this.A % 2 == 0 ? 2 : 1;
        if (this.j.C < this.r + 90112) {
            n2 = this.r + 210944;
            n = 2048;
        } else {
            n2 = this.r - 30720;
            n = this.t + 6144;
        }
        if (this.b(n3, 3, this.r, 0, 0, 0) && this.a(n2, n)) {
            ++this.A;
        }
    }

    public final void a(Graphics graphics, int n) {
        short s = (short)n;
        s = (short)(s << 12);
        int n2 = 0;
        while (n2 < this.J.length) {
            this.J[n2] = s;
            ++n2;
        }
        graphics.setClip(0, 0, a, d);
        this.b(graphics);
    }

    public final void b(Graphics graphics) {
        this.K = DirectUtils.getDirectGraphics((Graphics)graphics);
        int n = 0;
        while (n < 13) {
            this.K.drawPixels(this.J, true, 0, 176, 0, 16 * n, 176, 16, 0, 4444);
            ++n;
        }
    }

    public final void c(int n) {
        try {
            RecordStore recordStore = RecordStore.openRecordStore((String)"TGS_CT", (boolean)true);
            RecordEnumeration recordEnumeration = recordStore.enumerateRecords(null, null, false);
            if (recordEnumeration.hasNextElement()) {
                int n2 = recordEnumeration.nextRecordId();
                switch (n) {
                    case 0: {
                        recordStore.setRecord(n2, Q, 0, 3);
                        break;
                    }
                    case 1: {
                        Q = recordStore.getRecord(n2);
                    }
                }
            } else {
                switch (n) {
                    case 0: {
                        recordStore.addRecord(Q, 0, 3);
                        break;
                    }
                    case 1: {
                        tjge.a.Q[0] = 0;
                        tjge.a.Q[1] = 0;
                    }
                }
            }
            recordEnumeration.destroy();
            recordStore.closeRecordStore();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    private boolean b(Graphics graphics, int n, int n2, int n3, int n4, int n5) {
        short s = tjge.j.b[n].a(n2 & 0xFFFFFF);
        if (n5 >= s) {
            this.I = 0;
            n5 = 0;
        }
        tjge.j.b[n].a(graphics, n3, n4, n2, n5, 0, 0);
        return n5 >= s - 1;
    }

    private void j() {
        int n;
        int n2;
        if (this.l != null) {
            n2 = 0;
            while (n2 < 5) {
                if (this.l[n2] != null) {
                    n = 0;
                    while (n < this.l[n2].length) {
                        this.l[n2][n].p = false;
                        ++n;
                    }
                }
                ++n2;
            }
        }
        if (this.m != null) {
            n2 = 0;
            while (n2 < this.m.length) {
                if (this.m[n2] != null) {
                    n = 0;
                    while (n < this.m[n2].length) {
                        if (this.m[n2][n].X != null) {
                            this.m[n2][n].X.p = false;
                        }
                        this.m[n2][n].p = false;
                        ++n;
                    }
                }
                ++n2;
            }
        }
    }

    private void b(Graphics graphics, int n) {
        int n2 = 0;
        int n3 = 0;
        int n4 = 0;
        int n5 = 1;
        graphics.setColor(65280);
        switch (this.x) {
            case 2: {
                n3 = 5;
                n4 = 45;
                n2 = 5;
                graphics.drawString("\u654c\u4eba\u7ed1\u67b6\u4e86\u5316\u5b66\u4e13\u5bb6", 78, 16, 17);
                break;
            }
            case 4: {
                n3 = 8;
                n4 = 50;
                n5 = 6;
                n2 = 4;
                graphics.drawString("\u654c\u4eba\u5236\u9020\u4e86\u5de8\u578b\u70b8\u5f39", 78, 16, 17);
                break;
            }
            case 0: {
                n3 = 0;
                break;
            }
            case 1: {
                n3 = 3;
                break;
            }
            case 3: {
                n3 = 7;
                break;
            }
            case 5: {
                n3 = 10;
                break;
            }
            case 6: {
                n3 = 11;
                break;
            }
            case 7: {
                n3 = 12;
            }
        }
        if (this.x != 2 && this.x != 4) {
            n4 = 30;
            n5 = 3;
            n2 = 13;
            graphics.drawString("\u603b\u90e8\u547c\u53eb\u7ea2\u5e3d", a / 2, 16, 17);
        }
        if (tjge.j.b[n2] == null) {
            tjge.j.b[n2] = tjge.d.b(n2);
        }
        tjge.j.b[n2].a(graphics, 145, n4, 0, n % n5, 0, 0);
        tjge.a.a(graphics, 135, 0, 25, 6, 0);
        tjge.a.a(graphics, 135, 34, 25, 25, 0);
        tjge.j.b[0].a(graphics, 25, 212, 0, n % 3, 0, 0);
        tjge.a.a(graphics, 0, 200, 50, 8, 0);
        graphics.setColor(65280);
        graphics.setClip(0, 0, a, d);
        graphics.drawRect(5, 5, 166, 32);
        graphics.drawRect(5, 42, 166, 124);
        graphics.drawRect(5, 171, 166, 32);
        graphics.drawString("\u6536\u5230", 60, 180, 20);
        graphics.drawString("\u4efb\u52a1" + V.substring(tjge.a.e.x, tjge.a.e.x + 1), 15, 52, 20);
        this.b(graphics, n3, 30, 72);
        if (this.x != 3 && this.x != 5 && this.x != 6) {
            graphics.drawString("\u6ce8\u610f", 15, 110, 20);
            this.b(graphics, n3 + 1, 30, 130);
            if (this.x < 1) {
                this.b(graphics, n3 + 2, 30, 150);
            }
        }
    }

    static final boolean d(int n) {
        switch (n) {
            case 1: 
            case 2: 
            case 8: 
            case 10: 
            case 15: 
            case 16: 
            case 20: 
            case 21: {
                return true;
            }
        }
        return false;
    }

    public static final String a(long l2) {
        int n = (int)((l2 /= 1000L) / 60L);
        int n2 = (int)(l2 % 60L);
        int n3 = n2 % 10;
        return new String(n + ":" + (n2 /= 10) + "" + n3);
    }

    public final void a(Graphics graphics, int n, int n2, int n3, boolean bl, boolean bl2) {
        int n4;
        int n5 = 1000;
        int n6 = 0;
        int n7 = 0;
        int n8 = n4 = bl ? 99 : 0;
        if (bl2) {
            graphics.setClip(n2 - 10, n3, 8, 8);
            graphics.drawImage(this.h, n2 - 12 - 178, n3 - 32, 20);
        }
        if (n < 0) {
            n = 0;
        }
        int n9 = 0;
        while (n9 < 4) {
            n7 = n / n5;
            n %= n5;
            if (n7 != 0 || n7 == 0 && n6 != 0 || n9 == 3) {
                graphics.setClip(n2 + n6, n3, 8, 8);
                graphics.drawImage(this.h, n2 + n6 - n7 * 8 - n4, n3 - 32, 20);
                n6 += 8;
            }
            n5 /= 10;
            ++n9;
        }
    }

    public static final void a(Graphics graphics, int n, int n2, int n3, int n4, int n5) {
        graphics.setClip(n, n2, n3, n4);
        graphics.setColor(n5);
        graphics.fillRect(n, n2, n3, n4);
    }

    public final void e(int n) {
        int n2 = 0;
        while (n2 < 2) {
            int n3 = GameMIDlet.a(n);
            int n4 = GameMIDlet.a(160);
            e.a(16, 0, 0, this.r + (n3 <<= 10), this.s + (n4 <<= 10), 2);
            ++n2;
        }
        tjge.a.a(5, 1, 220);
    }

    private void c(Graphics graphics) {
        if (this.G++ < 4) {
            graphics.setColor(65535);
            graphics.drawString("\u6309\u4efb\u610f\u952e\u8fd4\u56de", 88, 187, 17);
            return;
        }
        graphics.setColor(0);
        graphics.fillRect(0, 187, 176, 23);
        if (this.G > 8) {
            this.G = 0;
        }
    }

    private void k() {
        if (this.ai) {
            this.aj += 8;
            this.G = 0;
            if (this.aj > 64) {
                this.ai = false;
                return;
            }
        } else {
            this.aj -= 8;
            this.G = 1;
            if (this.aj < 48) {
                this.ai = true;
            }
        }
    }

    private void l() {
        this.G = 0;
        this.aj = 42;
        this.ai = true;
    }

    public static final Image f(int n) {
        String string = "/res/image.bin";
        Image image = null;
        InputStream inputStream = string.getClass().getResourceAsStream(string);
        try {
            int n2 = GameMIDlet.c(inputStream);
            int[] nArray = new int[n2];
            int n3 = 0;
            while (n3 < n2) {
                nArray[n3] = GameMIDlet.c(inputStream);
                ++n3;
            }
            int n4 = nArray[n + 1] - nArray[n];
            byte[] byArray = new byte[n4];
            inputStream.skip(nArray[n]);
            inputStream.read(byArray);
            image = Image.createImage((byte[])byArray, (int)0, (int)n4);
            inputStream.close();
            System.gc();
        }
        catch (Exception exception) {}
        return image;
    }

    public final void hideNotify() {
        if (this.p == 10) {
            this.y = 0;
            this.f();
            this.p = 13;
        }
    }

    public static final void g() {
        int n = 0;
        try {
            byte[] byArray;
            String string = "/res/sound.bin";
            InputStream inputStream = "/res/sound.bin".getClass().getResourceAsStream(string);
            int n2 = GameMIDlet.c(inputStream);
            int[] nArray = new int[n2];
            n = 0;
            while (n < n2) {
                nArray[n] = GameMIDlet.c(inputStream);
                ++n;
            }
            n = 0;
            while (n < n2 - 1) {
                int n3 = nArray[n + 1] - nArray[n];
                int n4 = n3 < 256 ? 1 : 5;
                byArray = new byte[n3];
                inputStream.read(byArray);
                tjge.a.S[n] = new Sound(byArray, n4);
                ++n;
            }
            byArray = null;
            inputStream.close();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public static final void a(int n, int n2, int n3) {
        if (S == null || S[n] == null) {
            return;
        }
        try {
            if (Q[2] == 1) {
                if (T >= 0 && S[T].getState() == 0) {
                    return;
                }
                T = n;
                S[n].setGain(n3);
                S[n].play(1);
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public final void g(int n) {
        String string = "/res/x.bin";
        try {
            InputStream inputStream = string.getClass().getResourceAsStream(string);
            int n2 = GameMIDlet.c(inputStream);
            int[] nArray = new int[n2];
            int n3 = 0;
            while (n3 < n2) {
                nArray[n3] = GameMIDlet.c(inputStream);
                ++n3;
            }
            int n4 = (nArray[n + 1] - nArray[n]) / 2;
            inputStream.skip(nArray[n] + 2);
            char[] cArray = new char[n4 - 1];
            n3 = 0;
            while (n3 < n4 - 1) {
                cArray[n3] = (char)GameMIDlet.a(inputStream);
                ++n3;
            }
            U = new String(cArray);
            inputStream.close();
            System.gc();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public final void a(Graphics graphics, int n, int n2, int n3) {
        int n4 = 0;
        int n5 = 0;
        do {
            if ((n5 = U.indexOf(13, n4)) == -1) {
                graphics.drawString(U.substring(n4), n, n2, 20);
            } else {
                graphics.drawString(U.substring(n4, n5), n, n2, 20);
            }
            n2 += n3;
            n4 = n5 + 2;
        } while (n5 >= 0);
    }

    public final void b(Graphics graphics, int n, int n2, int n3) {
        int n4 = 0;
        int n5 = 0;
        while (true) {
            n5 = U.indexOf(13, n4);
            if (n-- <= 0) break;
            n4 = n5 + 2;
        }
        if (n5 == -1) {
            graphics.drawString(U.substring(n4), n2, n3, 20);
            return;
        }
        graphics.drawString(U.substring(n4, n5), n2, n3, 20);
    }

    static {
        P = 4;
        am = new int[P];
        ao = 0;
        an = 0;
        Q = new byte[]{0, 0, 1};
        R = 6;
        S = new Sound[R];
        T = -1;
        V = "\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b";
    }
}

