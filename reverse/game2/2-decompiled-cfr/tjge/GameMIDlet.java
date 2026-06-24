/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.microedition.lcdui.Display
 *  javax.microedition.lcdui.Displayable
 *  javax.microedition.lcdui.Image
 *  javax.microedition.media.Manager
 *  javax.microedition.media.Player
 *  javax.microedition.media.control.VolumeControl
 *  javax.microedition.midlet.MIDlet
 *  javax.microedition.midlet.MIDletStateChangeException
 *  javax.microedition.rms.RecordEnumeration
 *  javax.microedition.rms.RecordStore
 */
package tjge;

import java.io.IOException;
import java.io.InputStream;
import java.util.Random;
import javax.microedition.lcdui.Display;
import javax.microedition.lcdui.Displayable;
import javax.microedition.lcdui.Image;
import javax.microedition.media.Manager;
import javax.microedition.media.Player;
import javax.microedition.media.control.VolumeControl;
import javax.microedition.midlet.MIDlet;
import javax.microedition.midlet.MIDletStateChangeException;
import javax.microedition.rms.RecordEnumeration;
import javax.microedition.rms.RecordStore;
import tjge.a;

public class GameMIDlet
extends MIDlet {
    a a = new a(this);
    Display b = Display.getDisplay((MIDlet)this);
    public static Random c;
    static byte[] d;
    static byte[] e;
    static byte[] f;
    public static int g;
    public static int h;
    public static Player[] i;
    public static int j;
    public static byte[] k;
    static String l;
    static String m;
    static String n;
    public static final String[] o;
    public static final String[] p;
    public static final String[] q;
    public static final String[] r;

    public GameMIDlet() {
        c = new Random();
        c.setSeed(System.currentTimeMillis());
    }

    protected final void pauseApp() {
        if (this.a.b == 10) {
            this.a.c = 0;
            this.a.b = 4;
            this.a.h = 0;
            this.a.l = 0;
        }
    }

    protected final void startApp() throws MIDletStateChangeException {
        this.b.setCurrent((Displayable)this.a);
    }

    protected final void destroyApp(boolean bl) throws MIDletStateChangeException {
        GameMIDlet.b(1);
        this.b.setCurrent(null);
        this.a.s = false;
        this.a.w = null;
        this.notifyDestroyed();
    }

    public static final int a(int n) {
        int n2 = c.nextInt();
        if (n2 < 0) {
            n2 = -n2;
        }
        return n2 % n;
    }

    public static final byte a(InputStream inputStream) throws IOException {
        inputStream.read(d);
        return d[0];
    }

    public static final short b(InputStream inputStream) throws IOException {
        inputStream.read(e);
        int n = e[1];
        n <<= 8;
        return (short)(n |= e[0] & 0xFF);
    }

    public static final int a(byte[] byArray, int n, int n2) {
        int n3 = 0;
        int n4 = n2 - 1;
        while (n4 >= 0) {
            n3 <<= 8;
            n3 = n4 == n2 - 1 ? (n3 |= byArray[n4 + n]) : (n3 |= byArray[n4 + n] & 0xFF);
            --n4;
        }
        return n3;
    }

    public static final void a() {
        if (j >= 0 && --g < 0 && i[j].getState() != 400) {
            i[j].deallocate();
            j = -1;
        }
    }

    public static final void b() {
        int n = 0;
        while (n < h) {
            try {
                InputStream inputStream = GameMIDlet.b("/res/sound.bin", n);
                GameMIDlet.i[n] = Manager.createPlayer((InputStream)inputStream, (String)"audio/midi");
                i[n].realize();
                VolumeControl volumeControl = (VolumeControl)i[n].getControl("VolumeControl");
                if (volumeControl != null) {
                    volumeControl.setLevel(90);
                }
                inputStream.close();
            }
            catch (Exception exception) {}
            ++n;
        }
    }

    public static final void a(int n, int n2) {
        if (k[2] == 0) {
            return;
        }
        try {
            GameMIDlet.c();
            i[n].setLoopCount(1);
            i[n].start();
            g = 2;
            j = n;
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public static final void c() {
        if (j < 0) {
            return;
        }
        try {
            if (i[j].getState() == 400) {
                i[j].stop();
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public static final void b(int n) {
        try {
            if (n == 2) {
                GameMIDlet.k[0] = 0;
                GameMIDlet.k[1] = 0;
                return;
            }
            RecordStore recordStore = RecordStore.openRecordStore((String)"REDDEVIL2", (boolean)true);
            RecordEnumeration recordEnumeration = recordStore.enumerateRecords(null, null, false);
            if (recordEnumeration.hasNextElement()) {
                int n2 = recordEnumeration.nextRecordId();
                if (n == 0) {
                    k = recordStore.getRecord(n2);
                } else if (n == 1) {
                    recordStore.setRecord(n2, k, 0, 5);
                }
            } else if (n == 0) {
                GameMIDlet.k[0] = 0;
                GameMIDlet.k[1] = 0;
            } else if (n == 1) {
                recordStore.addRecord(k, 0, 5);
            }
            recordEnumeration.destroy();
            recordStore.closeRecordStore();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    public static final void a(int n, String string) {
        byte[] byArray = GameMIDlet.c(string, n);
        if (byArray != null) {
            char[] cArray = new char[byArray.length / 2];
            int n2 = 0;
            while (n2 < byArray.length / 2) {
                cArray[n2] = (char)GameMIDlet.a(byArray, n2 * 2, 2);
                ++n2;
            }
            if (n < 7) {
                l = new String(cArray);
            } else {
                GameMIDlet.n = new String(cArray);
            }
            System.gc();
        }
    }

    public static final Image a(String string, int n) {
        byte[] byArray = GameMIDlet.c(string, n);
        Image image = Image.createImage((byte[])byArray, (int)0, (int)byArray.length);
        System.gc();
        return image;
    }

    static final InputStream b(String string, int n) {
        int n2 = 0;
        try {
            InputStream inputStream = string.getClass().getResourceAsStream(string);
            inputStream.read(f);
            int n3 = GameMIDlet.a(f, 0, 4);
            int n4 = 0;
            while (n4 < n3) {
                inputStream.read(f);
                if (n4 == n) {
                    n2 = GameMIDlet.a(f, 0, 4);
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

    static final byte[] c(String string, int n) {
        int n2 = 0;
        int n3 = 0;
        try {
            byte[] byArray = null;
            InputStream inputStream = string.getClass().getResourceAsStream(string);
            inputStream.read(f);
            int n4 = GameMIDlet.a(f, 0, 4);
            int n5 = 0;
            while (n5 < n4) {
                inputStream.read(f);
                if (n5 == n) {
                    n2 = GameMIDlet.a(f, 0, 4);
                } else if (n5 == n + 1) {
                    n3 = GameMIDlet.a(f, 0, 4) - n2;
                }
                ++n5;
            }
            inputStream.skip(n2);
            byArray = new byte[n3];
            inputStream.read(byArray);
            inputStream.close();
            return byArray;
        }
        catch (Exception exception) {
            return null;
        }
    }

    static {
        d = new byte[1];
        e = new byte[2];
        f = new byte[4];
        h = 2;
        i = new Player[h];
        j = -1;
        k = new byte[]{0, 0, 1, 0, 6};
        o = new String[]{"\u8fd4\u56de\u6e38\u620f", "\u65b0\u6e38\u620f", "\u7ee7\u7eed", "\u58f0\u97f3 \u5f00", "\u5e2e\u52a9", "\u5173\u4e8e", "\u9000\u51fa", "\u58f0\u97f3 \u5173"};
        p = new String[]{"\u7ee7\u7eed", "\u8df3\u8fc7", "\u4efb\u52a1", "\u8fd4\u56de", "\u5b8c\u6210", "\u51fb\u6bd9\u654c\u4eba:", "\u6240\u7528\u65f6\u95f4:", "\u7ee7\u7eed\u6b21\u6570:", "\u5931\u8d25", "\u83dc\u5355", "\u6e38\u620f\u7ed3\u675f", "\u8f7d\u5165\u4e2d", "."};
        q = new String[]{"\u627e\u5230\u8239\u8231\u5165\u53e3\u3002", "\u627e\u5230\u7f57\u65af\u4e0a\u6821\u3002", "\u63a7\u5236\u53f0\u8f93\u5165\u9501\u6b7b\u5bc6\u7801", "\u6467\u6bc1\u52a8\u529b\u88c5\u7f6e", "\u6467\u6bc1\u5907\u7528\u52a8\u529b\u88c5\u7f6e", "\u6467\u6bc1\u76f4\u5347\u98de\u673a", "\u6467\u6bc1\u5bfc\u5f39\u8247"};
        r = new String[]{"\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d", "\u4e03", "\u516b", "\u4e5d", "\u5341"};
    }
}

