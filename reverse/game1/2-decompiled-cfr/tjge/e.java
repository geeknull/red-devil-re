/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.a;
import tjge.d;
import tjge.g;
import tjge.l;

public final class e
extends g {
    int a;
    int b;
    int c;
    int d;
    int e;
    int f;
    int g;
    boolean h;
    a i;

    public e(int n, d d2, a a2) {
        super(n, d2);
        this.i = a2;
    }

    public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl) {
        if (bl) {
            return false;
        }
        super.a(n, n2, n3, byArray, bl);
        this.e = 0;
        this.h = false;
        switch (this.q) {
            case 19: {
                this.a(byArray[0]);
                break;
            }
            case 22: {
                this.b = byArray[0];
                this.c = byArray[1];
                break;
            }
            case 5: {
                this.d = 4;
            }
            case 4: {
                this.a = 0;
                break;
            }
            case 7: 
            case 9: {
                this.d = this.q == 7 ? 3 : 9;
                this.b = this.C;
                this.c = this.D;
            }
        }
        return true;
    }

    /*
     * Unable to fully structure code
     */
    public final void a() {
        var1_1 = this.i.j;
        this.f = this.t & -16777216;
        switch (this.q) {
            case 22: {
                if (this.a(var1_1)) {
                    var1_1.V = true;
                    var1_1.Z = this;
                    var1_1.O = this.b << 4;
                    var1_1.P = this.c << 4;
                    return;
                }
                if (var1_1.Z != this) break;
                var1_1.V = false;
                var1_1.Z = null;
                return;
            }
            case 12: {
                if (!this.i.E) {
                    return;
                }
                if (this.a(var1_1)) {
                    this.h = true;
                }
                if (!this.h || (var1_1.a & 1) == 0) break;
                this.b();
                this.i.p = 19;
                return;
            }
            case 9: {
                if (this.d >= 4) ** GOTO lbl28
                this.a(2);
                ** GOTO lbl32
lbl28:
                // 1 sources

                if (this.d < 7) {
                    this.a(1);
                } else {
                    this.a(0);
                }
            }
lbl32:
            // 4 sources

            case 7: {
                if (this.d <= 0) {
                    var2_2 = false;
                    if (this.q == 9) {
                        if (this.i.x == 7 && this.C >> 10 > 1720) {
                            if ((this.i.j.a & 1) != 0) {
                                var2_2 = true;
                                this.i.w = 11;
                                this.i.p = 19;
                            }
                        } else {
                            var2_2 = true;
                        }
                    } else {
                        var2_2 = true;
                    }
                    if (var2_2) {
                        if (this.q == 9) {
                            this.i.a(16, 0, 0, this.C, this.D - 5120, 2);
                            this.i.a(16, 0, 0, this.C - 10240, this.D - 20480, 2);
                            this.i.a(16, 0, 0, this.C + 5120, this.D - 10240, 2);
                        } else {
                            this.i.a(16, 0, 1, this.C, this.D - 5120, 2);
                        }
                        this.C = this.b;
                        this.D = this.c;
                        var3_4 = this.C >> 14;
                        var4_6 = this.D - 5120 >> 14;
                        while (this.i.f.a(--var3_4, var4_6, true) == 1) {
                        }
                        var5_7 = this.q == 7 ? 2 : 3;
                        var6_8 = 0;
                        while (var6_8 < var5_7) {
                            this.i.f.c(var3_4 + 1, var4_6 - var6_8);
                            ++var6_8;
                        }
                        this.b();
                        this.i.L = false;
                        this.i.g.k[this.B] = true;
                        tjge.a.a(5, 1, 220);
                    }
                    return;
                }
                if (this.h) {
                    this.g = 0;
                    v0 = this.C = this.C == this.b ? this.C + 2048 : this.b;
                    if (this.e++ <= 5) break;
                    this.h = false;
                    this.e = 0;
                    this.C = this.b;
                    return;
                }
                if (this.q != 9 || this.g++ <= 40) break;
                if (this.d < 4 && this.d > 0) {
                    this.d = 6;
                } else if (this.d < 7) {
                    this.d = 9;
                }
                this.g = 0;
                return;
            }
            case 4: {
                if (this.a(var1_1)) {
                    this.h = true;
                }
                if (!this.h || (var1_1.a & 1) == 0) break;
                this.i.p = 19;
                return;
            }
            case 5: {
                if (this.a == 1) {
                    this.a(1 | this.f);
                    var1_1.e = 0;
                    this.i.p = 20;
                    return;
                }
                if (this.h) {
                    if ((var1_1.a & 1) == 0 || var1_1.D <= 490000) break;
                    this.i.p = 19;
                    return;
                }
                if (this.i.L && this.i.B <= 0 && this.i.z <= 0) {
                    this.h = true;
                    return;
                }
                var2_3 = this.t & 0xFFFFFF;
                var3_5 = this.t & -16777216;
                if (var2_3 != 1 || !this.d()) break;
                this.a(0 | var3_5);
            }
        }
    }

    public final void a(Graphics graphics, int n, int n2) {
        if (this.q == 12 && !this.i.E) {
            return;
        }
        super.a(graphics, n, n2);
    }

    public final void a(l l2) {
        block18: {
            switch (this.q) {
                case 7: 
                case 9: {
                    switch (l2.q) {
                        case 21: {
                            if ((l2.t & 0xFFFFFF) != 0) break;
                            this.h = true;
                            this.e = 0;
                            --this.d;
                            if (l2.G > 0) {
                                l2.C += 8192;
                            } else if (l2.G < 0) {
                                l2.C -= 8192;
                            }
                            l2.G = 0;
                            l2.a(1);
                            break;
                        }
                        case 10: {
                            this.h = true;
                            this.e = 0;
                            --this.d;
                            break;
                        }
                        case 15: 
                        case 20: {
                            this.h = true;
                            this.e = 0;
                            this.i.a(16, 0, 0, l2.C, l2.D, 2);
                            l2.b();
                            this.d -= 3;
                            tjge.a.a(5, 1, 220);
                        }
                    }
                    return;
                }
                case 5: {
                    switch (l2.q) {
                        case 21: {
                            if ((l2.t & 0xFFFFFF) == 0) {
                                l2.b();
                                if (--this.d <= 0) {
                                    this.a = 1;
                                    tjge.a.a(4, 1, 200);
                                    return;
                                }
                                this.a(1 | this.f);
                                return;
                            }
                            break block18;
                        }
                        case 15: 
                        case 20: {
                            this.i.a(16, 0, 0, l2.C, l2.D + 8192, 2);
                            l2.b();
                            this.a = 1;
                            tjge.a.a(5, 1, 220);
                        }
                    }
                }
            }
        }
    }
}

