/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Graphics
 */
package tjge;

import javax.microedition.lcdui.Graphics;
import tjge.GameMIDlet;
import tjge.a;
import tjge.d;
import tjge.f;
import tjge.g;
import tjge.h;
import tjge.l;

public final class c
extends g {
    a a;
    int b;
    int c;
    int d;
    int e;
    int f;
    int g;
    int h;
    int i;
    int j;
    boolean k;
    boolean l;
    boolean m;
    boolean n;
    h o;

    public c(int n, d d2, a a2) {
        super(n, d2);
        this.a = a2;
        this.o = null;
        this.n = true;
    }

    public final boolean a(int n, int n2, int n3, byte[] byArray, boolean bl) {
        if (bl) {
            return false;
        }
        super.a(n, n2, n3, byArray, bl);
        this.l = false;
        this.n = true;
        switch (this.q) {
            case 14: {
                this.c = 0;
                this.b = 15;
                break;
            }
            case 8: {
                boolean bl2 = this.k = byArray[0] == 0;
                if (this.k) {
                    this.a.j.aa = this;
                    break;
                }
                this.f = 5;
                this.c = 0;
                this.d = 0;
                this.b = 10;
                this.i = this.C;
                if (this.a.x == 6) {
                    this.a.n = this;
                    this.g = 11;
                    this.e = 1;
                } else {
                    this.g = 9;
                    this.e = 0;
                }
                this.a(Integer.MIN_VALUE);
                break;
            }
            case 17: {
                this.b = byArray[0];
                this.h = byArray[1];
                this.d = -1;
                this.i = this.C;
                this.j = this.D;
                this.s = false;
                this.a(3);
            }
        }
        return true;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    public final void a() {
        f f2 = this.a.j;
        int n = this.t & 0xFFFFFF;
        switch (this.q) {
            case 14: {
                if (this.a(f2)) {
                    this.c = 1;
                    this.a(1);
                    this.a.g.k[this.B] = true;
                }
                if (this.c != 1 || this.b-- >= 0) return;
                this.a.a(16, 0, 0, this.C, this.D, 2);
                this.b();
                tjge.a.a(5, 1, 220);
                return;
            }
            case 8: {
                int n2 = this.a.r + tjge.a.c;
                switch (this.a.x) {
                    case 3: 
                    case 6: {
                        if (!this.a.L) return;
                        if (this.b-- > 0) {
                            return;
                        }
                        if (this.f < 0) {
                            this.f = 0;
                        }
                        this.a.M = true;
                        int n3 = this.a.O = this.g < 6 ? this.f : this.f + (this.g - 6) * 5;
                        if (!this.m && this.a(f2) && this.f > 0) {
                            f2.e(3);
                            if (this.G == 0) {
                                this.c = 2;
                                this.d = 11;
                                this.a(-2147483647);
                                this.m = true;
                            }
                        } else if (this.f == 0) {
                            if (--this.g < 6) {
                                if (this.g <= 0) {
                                    this.n = false;
                                    boolean bl = false;
                                    this.a.M = false;
                                    if (this.a.x != 6) {
                                        bl = true;
                                    } else if ((f2.a & 1) != 0 && f2.D > 500000) {
                                        bl = true;
                                        this.a.p = 19;
                                    }
                                    if (!bl) return;
                                    this.b();
                                    this.a.L = false;
                                    this.a.g.k[this.B] = true;
                                    return;
                                }
                                this.f();
                                return;
                            }
                            this.f = 5;
                            this.d = 0;
                            this.c = 2;
                        }
                        if (this.G != 0 && this.l) {
                            this.l = false;
                            this.h = 0;
                        } else if (this.l) {
                            int n4 = this.C = this.C == this.i ? this.C + 2048 : this.i;
                            if (this.h++ > 5) {
                                this.l = false;
                                this.h = 0;
                                this.C = this.i;
                            }
                        }
                        switch (this.c) {
                            case 0: {
                                this.G = -2048;
                                if (this.C >= n2 - 20480) break;
                                this.c = 1;
                                this.G = 0;
                                this.a(-2147483646);
                                return;
                            }
                            case 1: {
                                if (this.d++ > 15) {
                                    int n5 = 35840;
                                    if (this.e == 0) {
                                        l l2 = this.a.a(21, Integer.MIN_VALUE, 0, this.C - n5, this.D - n5, 1);
                                        if (l2 == null) break;
                                        l2.G = -12288;
                                        this.d = 0;
                                        if (this.G == 0) {
                                            this.a(-2147483644);
                                            return;
                                        }
                                        this.a(-2147483645);
                                        return;
                                    }
                                    l l3 = this.a.a(20, 0, 0, this.C + 5120, this.D - n5, 1);
                                    if (l3 == null) break;
                                    this.d = 0;
                                    l3.b(0);
                                    if (this.G > 0) {
                                        this.a(-2147483643);
                                        return;
                                    }
                                    this.a(-2147483642);
                                    return;
                                }
                                if (this.G == 0 && this.d()) {
                                    this.a(-2147483646);
                                    return;
                                }
                                if (this.G <= 0) break;
                                if (this.d()) {
                                    this.a(Integer.MIN_VALUE);
                                }
                                if (this.C <= n2 - 20480) break;
                                this.d = 0;
                                this.G = 0;
                                if (this.a.x != 6) {
                                    this.e = 0;
                                }
                                this.m = false;
                                return;
                            }
                            case 2: {
                                if (this.d++ > 15) {
                                    this.d = 0;
                                    this.c = 3;
                                    this.G = -10240;
                                    this.a(Integer.MIN_VALUE);
                                    return;
                                }
                                if (!this.d()) break;
                                this.a(-2147483647);
                                return;
                            }
                            case 3: {
                                if (!this.a(this.a.f)) break;
                                this.G = 4096;
                                this.c = 1;
                                this.e = 1;
                            }
                        }
                        return;
                    }
                    case 4: {
                        if (this.k) return;
                        if (this.o.p && this.o.m > 0) {
                            this.o.C = this.C - 23552;
                            if ((this.C >= f2.C || this.C <= this.a.r + 32768) && (this.C <= f2.C || this.C >= this.a.r + 186368)) return;
                            this.G = this.a.t;
                            return;
                        }
                        if (this.o.o == 9 && this.o.m <= 0 && this.o.H == 0) {
                            this.o.H = 12288;
                            this.o.G = 0;
                            this.o.T = false;
                            this.G = this.C > f2.C ? this.a.t + 8192 : 0;
                            return;
                        }
                        if (this.C <= this.a.r + 210944 && this.C >= this.a.r - 30720) return;
                        this.b();
                        return;
                    }
                }
                return;
            }
            case 17: {
                if (this.b-- > 0) {
                    return;
                }
                switch (n) {
                    case 0: {
                        if (!this.d()) return;
                        this.a(1);
                        this.H = 12288;
                        return;
                    }
                    case 1: {
                        if (this.a(this.a.j)) {
                            this.a.j.e(1);
                            this.a(2);
                            this.H = 0;
                            return;
                        }
                        if (!this.c(this.a.f)) return;
                        this.a(2);
                        return;
                    }
                    case 2: {
                        if (!this.d()) return;
                        this.C = this.i;
                        this.D = this.j;
                        this.d = this.h;
                        this.a(3);
                        return;
                    }
                    case 3: {
                        if (this.d-- >= 0) return;
                        this.a(0);
                    }
                }
            }
        }
    }

    public final void a(l l2) {
        if (this.b > 0 || this.q != 8) {
            return;
        }
        switch (l2.q) {
            case 21: {
                if ((l2.t & 0xFFFFFF) != 0) break;
                l2.a(1);
                l2.G = 0;
                l2.D += 5120;
                if (this.G != 0) break;
                --this.f;
                break;
            }
            case 10: {
                if (this.G != 0) break;
                --this.f;
                break;
            }
            case 15: 
            case 20: {
                this.a.a(16, 0, 0, l2.C, l2.D, 0);
                l2.b();
                if (this.G != 0) break;
                this.f -= 3;
            }
        }
        if (!this.l) {
            this.l = true;
            this.i = this.C;
        }
    }

    private void f() {
        this.C = this.C == this.i ? this.i + 2048 : this.i;
        int n = 0;
        int n2 = this.C;
        int n3 = this.D + 5120;
        do {
            int n4 = GameMIDlet.a(36);
            n4 = 18 - n4;
            int n5 = GameMIDlet.a(20);
            n5 = 20 - n5;
            this.a.a(16, 0, 0, n2 += n4 << 10, n3 -= n5 << 10, 2);
        } while (n++ < 1);
        tjge.a.a(5, 1, 220);
    }

    public final void a(Graphics graphics, int n, int n2) {
        if (this.n) {
            super.a(graphics, n, n2);
        }
    }
}

