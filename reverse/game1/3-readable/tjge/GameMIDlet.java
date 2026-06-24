// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/GameMIDlet.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
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
import tjge.GameScreen; // 原 tjge.a

public class GameMIDlet
extends MIDlet {
    GameScreen screen = new GameScreen(this);                  // a : 主游戏 Canvas/屏幕实例，构造时传入本 MIDlet
    Display display = Display.getDisplay((MIDlet)this);         // b : 为本 MIDlet 取得的 LCDUI Display
    public static Random random;                               // c : 静态全局伪随机数发生器，构造时以系统时间播种
    static byte[] readBuffer;                                  // d : 静态共享 4 字节临时缓冲，供小端读取/归档定位
    public static final String[] menuTexts;                    // e : 静态菜单/UI 文本表（中文）

    // 原 GameMIDlet() ()V → GameMIDlet
    // 构造：创建全局 Random 并以当前系统时间播种。
    public GameMIDlet() {
        random = new Random();
        random.setSeed(System.currentTimeMillis());
    }

    // 原 pauseApp ()V → pauseApp
    // MIDlet 生命周期暂停钩子：若屏幕处于关卡内游玩状态(state==10)，
    // 保存/停止音频后将屏幕切到暂停状态(state=13)。
    protected final void pauseApp() {
        if (this.screen.state == 10) {          // a.p
            this.screen.menuSelection = 0;      // a.y
            this.screen.clearInputQueue();      // a.f()
            this.screen.state = 13;             // a.p
        }
    }

    // 原 startApp ()V → startApp
    // MIDlet 生命周期启动钩子：把 GameScreen 设为当前 Displayable。
    protected final void startApp() throws MIDletStateChangeException {
        this.display.setCurrent((Displayable)this.screen);
    }

    // 原 destroyApp (Z)V → destroyApp
    // MIDlet 生命周期销毁钩子：清空当前 Displayable（设为 null）。
    protected final void destroyApp(boolean bl) throws MIDletStateChangeException {
        this.display.setCurrent(null);
    }

    // 原 a (I)I → nextRandomMod
    // 返回 [0, n) 内的非负伪随机 int：取 abs(Random.nextInt()) 对 n 取模。
    public static final int nextRandomMod(int n) {
        int value = random.nextInt();
        if (value < 0) {
            value = -value;
        }
        return value % n;
    }

    // 原 a (Ljava/io/InputStream;)S → readU16Le
    // 从流读取小端 16 位值（低字节无符号、高字节有符号）并以 short 返回。
    public static final short readU16Le(InputStream inputStream) throws IOException {
        byte[] byArray = new byte[2];
        inputStream.read(byArray);
        short s = byArray[0];
        if (s < 0) {
            s = (short)(s + 256);
        }
        s = (short)(s + byArray[1] * 256);
        return s;
    }

    // 原 b (Ljava/io/InputStream;)B → readByte
    // 从流读取单个有符号字节。
    public static final byte readByte(InputStream inputStream) throws IOException {
        byte[] byArray = new byte[1];
        inputStream.read(byArray);
        return byArray[0];
    }

    // 原 c (Ljava/io/InputStream;)I → readI32Le
    // 用共享 4 字节缓冲 readBuffer 从流读取小端 32 位整数。
    public static final int readI32Le(InputStream inputStream) throws IOException {
        int result = 0;
        inputStream.read(readBuffer);
        int i = 3;
        while (i >= 0) {
            result <<= 8;
            result += readBuffer[i];
            if (readBuffer[i] < 0) {
                result += 256;
            }
            --i;
        }
        return result;
    }

    // 原 a (Ljava/lang/String;I)Ljava/io/InputStream; → openArchiveEntryStream
    // 把命名资源当作 .bin 归档打开，读取条目数与偏移表后返回定位到第 n 条目起始处的流；失败返回 null。
    static final InputStream openArchiveEntryStream(String string, int entryIndex) {
        int entryOffset = 0;
        try {
            InputStream inputStream = string.getClass().getResourceAsStream(string);
            int entryCount = GameMIDlet.readI32Le(inputStream);
            int i = 0;
            while (i < entryCount) {
                if (i == entryIndex) {
                    entryOffset = GameMIDlet.readI32Le(inputStream);
                } else {
                    inputStream.read(readBuffer);
                }
                ++i;
            }
            inputStream.skip(entryOffset);
            return inputStream;
        }
        catch (Exception exception) {
            return null;
        }
    }

    // 原 <clinit> ()V → staticInit
    // 静态初始化块：分配 4 字节共享缓冲 readBuffer，填充中文菜单文本表 menuTexts
    // （新游戏 / 继续 / 选择任务 / 声音 开 / 帮助 / 关于 / 退出 / 声音 关 / 返回游戏 / 菜单）。
    static {
        readBuffer = new byte[4];
        menuTexts = new String[]{"新游戏", "继续", "选择任务", "声音 开", "帮助", "关于", "退出", "声音 关", "返回游戏", "菜单"};
    }
}
