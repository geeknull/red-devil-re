/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Display
 *  javax.microedition.lcdui.Displayable
 *  javax.microedition.midlet.MIDlet
 *  javax.microedition.midlet.MIDletStateChangeException
 */
package tjge;

import java.io.IOException;
import java.io.InputStream;
import java.util.Random;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.midlet.MIDlet;
import javax.microedition.midlet.MIDletStateChangeException;
import tjge.a;

public class GameMIDlet
extends MIDlet {
    a a = new a(this);
    Display b = Display.getDisplay((MIDlet)this);
    public static Random c;
    static byte[] d;
    public static final String[] e;

    public GameMIDlet() {
        c = new Random();
        c.setSeed(System.currentTimeMillis());
    }

    protected final void pauseApp() {
        if (this.a.p == 10) {
            this.a.y = 0;
            this.a.f();
            this.a.p = 13;
        }
    }

    protected final void startApp() throws MIDletStateChangeException {
        this.b.setCurrent((Displayable)this.a);
    }

    protected final void destroyApp(boolean bl) throws MIDletStateChangeException {
        this.b.setCurrent(null);
    }

    public static final int a(int n) {
        int n2 = c.nextInt();
        if (n2 < 0) {
            n2 = -n2;
        }
        return n2 % n;
    }

    public static final short a(InputStream inputStream) throws IOException {
        byte[] byArray = new byte[2];
        inputStream.read(byArray);
        short s = byArray[0];
        if (s < 0) {
            s = (short)(s + 256);
        }
        s = (short)(s + byArray[1] * 256);
        return s;
    }

    public static final byte b(InputStream inputStream) throws IOException {
        byte[] byArray = new byte[1];
        inputStream.read(byArray);
        return byArray[0];
    }

    public static final int c(InputStream inputStream) throws IOException {
        int n = 0;
        inputStream.read(d);
        int n2 = 3;
        while (n2 >= 0) {
            n <<= 8;
            n += d[n2];
            if (d[n2] < 0) {
                n += 256;
            }
            --n2;
        }
        return n;
    }

    static final InputStream a(String string, int n) {
        int n2 = 0;
        try {
            InputStream inputStream = string.getClass().getResourceAsStream(string);
            int n3 = GameMIDlet.c(inputStream);
            int n4 = 0;
            while (n4 < n3) {
                if (n4 == n) {
                    n2 = GameMIDlet.c(inputStream);
                } else {
                    inputStream.read(d);
                }
                ++n4;
            }
            inputStream.skip(n2);
            return inputStream;
        }
        catch (Exception exception) {
            return null;
        }
    }

    static {
        d = new byte[4];
        e = new String[]{"\u65b0\u6e38\u620f", "\u7ee7\u7eed", "\u9009\u62e9\u4efb\u52a1", "\u58f0\u97f3 \u5f00", "\u5e2e\u52a9", "\u5173\u4e8e", "\u9000\u51fa", "\u58f0\u97f3 \u5173", "\u8fd4\u56de\u6e38\u620f", "\u83dc\u5355"};
    }
}

