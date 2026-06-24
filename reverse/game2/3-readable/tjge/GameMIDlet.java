// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/GameMIDlet.java
// 标识符按 reverse/game2/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
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
import tjge.GameCanvas;

public class GameMIDlet
extends MIDlet {
    GameCanvas canvas = new GameCanvas(this);                       // 字段 a：主游戏画布（实例）
    Display display = Display.getDisplay((MIDlet)this);             // 字段 b：LCDUI 显示管理器
    public static Random random;                                   // 字段 c：全局随机数发生器
    static byte[] byteBuf1;                                         // 字段 d：1 字节读缓冲
    static byte[] byteBuf2;                                         // 字段 e：2 字节读缓冲
    static byte[] byteBuf4;                                         // 字段 f：4 字节读缓冲
    public static int soundTimeout;                                // 字段 g：音轨回收倒计时
    public static int soundTrackCount;                             // 字段 h：音轨数量（=2）
    public static Player[] soundPlayers;                           // 字段 i：MIDI 播放器数组
    public static int currentSoundIndex;                           // 字段 j：当前播放音轨索引，-1 表示无
    public static byte[] saveRecord;                               // 字段 k：5 字节存档记录，k[2]=声音开关
    static String tempText1;                                       // 字段 l：临时文本串 1
    static String tempText2;                                       // 字段 m：临时文本串 2
    static String tempText3;                                       // 字段 n：临时文本串 3
    public static final String[] menuTexts;                        // 字段 o：菜单文案表
    public static final String[] interludeTexts;                   // 字段 p：过场/结算文案表
    public static final String[] missionTexts;                     // 字段 q：任务目标文案表
    public static final String[] numeralTexts;                     // 字段 r：关卡序号文案表

    // 构造函数：初始化全局 Random 并以当前时间设种子。
    public GameMIDlet() {
        random = new Random();
        random.setSeed(System.currentTimeMillis());
    }

    // MIDlet 暂停回调：若画布处于关卡态(uiState==10)则切回菜单态并清相关计数。
    protected final void pauseApp() {
        if (this.canvas.uiState == 10) {
            this.canvas.inputAction = 0;
            this.canvas.uiState = 4;
            this.canvas.menuStartItem = 0;
            this.canvas.menuSelection = 0;
        }
    }

    // MIDlet 启动回调：将 GameCanvas 设为当前可显示对象。
    protected final void startApp() throws MIDletStateChangeException {
        this.display.setCurrent((Displayable)this.canvas);
    }

    // MIDlet 销毁回调：持久化存档、清空显示与画布引用并通知销毁。
    protected final void destroyApp(boolean bl) throws MIDletStateChangeException {
        GameMIDlet.accessSaveRecord(1);
        this.display.setCurrent(null);
        this.canvas.running = false;
        this.canvas.mainThread = null;
        this.notifyDestroyed();
    }

    // a(I)I → randomBelow：返回 [0,limit) 区间的随机整数（取随机数绝对值后取模）。
    public static final int randomBelow(int limit) {
        int value = random.nextInt();
        if (value < 0) {
            value = -value;
        }
        return value % limit;
    }

    // a(Ljava/io/InputStream;)B → readByte：从输入流读 1 字节并返回（有符号）。
    public static final byte readByte(InputStream inputStream) throws IOException {
        inputStream.read(byteBuf1);
        return byteBuf1[0];
    }

    // b(Ljava/io/InputStream;)S → readShortLE：从输入流读小端 16 位 short。
    public static final short readShortLE(InputStream inputStream) throws IOException {
        inputStream.read(byteBuf2);
        int value = byteBuf2[1];
        value <<= 8;
        return (short)(value |= byteBuf2[0] & 0xFF);
    }

    // a([BII)I → readIntLE：从字节数组按小端读取 count 字节组成 int（最高字节有符号）。
    public static final int readIntLE(byte[] byArray, int offset, int count) {
        int result = 0;
        int idx = count - 1;
        while (idx >= 0) {
            result <<= 8;
            result = idx == count - 1 ? (result |= byArray[idx + offset]) : (result |= byArray[idx + offset] & 0xFF);
            --idx;
        }
        return result;
    }

    // a()V → tickSoundTimeout：声音超时回收：倒计时 soundTimeout 到期且曲终则反分配当前音轨。
    public static final void tickSoundTimeout() {
        if (currentSoundIndex >= 0 && --soundTimeout < 0 && soundPlayers[currentSoundIndex].getState() != 400) {
            soundPlayers[currentSoundIndex].deallocate();
            currentSoundIndex = -1;
        }
    }

    // b()V → loadSounds：加载 sound.bin 中的各条 MIDI 创建 Player 数组并设音量。
    public static final void loadSounds() {
        int index = 0;
        while (index < soundTrackCount) {
            try {
                InputStream inputStream = GameMIDlet.openEntryStream("/res/sound.bin", index);
                GameMIDlet.soundPlayers[index] = Manager.createPlayer((InputStream)inputStream, (String)"audio/midi");
                soundPlayers[index].realize();
                VolumeControl volumeControl = (VolumeControl)soundPlayers[index].getControl("VolumeControl");
                if (volumeControl != null) {
                    volumeControl.setLevel(90);
                }
                inputStream.close();
            }
            catch (Exception exception) {}
            ++index;
        }
    }

    // a(II)V → playSound：按声音开关(saveRecord[2])单次播放第 trackIndex 条音轨并设回收倒计时。
    public static final void playSound(int trackIndex, int unused) {
        if (saveRecord[2] == 0) {
            return;
        }
        try {
            GameMIDlet.stopSound();
            soundPlayers[trackIndex].setLoopCount(1);
            soundPlayers[trackIndex].start();
            soundTimeout = 2;
            currentSoundIndex = trackIndex;
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    // c()V → stopSound：停止当前正在播放的音轨。
    public static final void stopSound() {
        if (currentSoundIndex < 0) {
            return;
        }
        try {
            if (soundPlayers[currentSoundIndex].getState() == 400) {
                soundPlayers[currentSoundIndex].stop();
            }
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    // b(I)V → accessSaveRecord：RMS 存档读写：mode=0 读取/1 写入/2 清零前两字节(REDDEVIL2,5字节)。
    public static final void accessSaveRecord(int mode) {
        try {
            if (mode == 2) {
                GameMIDlet.saveRecord[0] = 0;
                GameMIDlet.saveRecord[1] = 0;
                return;
            }
            RecordStore recordStore = RecordStore.openRecordStore((String)"REDDEVIL2", (boolean)true);
            RecordEnumeration recordEnumeration = recordStore.enumerateRecords(null, null, false);
            if (recordEnumeration.hasNextElement()) {
                int recordId = recordEnumeration.nextRecordId();
                if (mode == 0) {
                    saveRecord = recordStore.getRecord(recordId);
                } else if (mode == 1) {
                    recordStore.setRecord(recordId, saveRecord, 0, 5);
                }
            } else if (mode == 0) {
                GameMIDlet.saveRecord[0] = 0;
                GameMIDlet.saveRecord[1] = 0;
            } else if (mode == 1) {
                recordStore.addRecord(saveRecord, 0, 5);
            }
            recordEnumeration.destroy();
            recordStore.closeRecordStore();
            return;
        }
        catch (Exception exception) {
            return;
        }
    }

    // a(ILjava/lang/String;)V → loadTextEntry：从归档第 entryIndex 条读 UTF-16 文本，存入临时串 tempText1(<7) 或 tempText3(>=7)。
    public static final void loadTextEntry(int entryIndex, String archive) {
        byte[] bytes = GameMIDlet.readEntryBytes(archive, entryIndex);
        if (bytes != null) {
            char[] chars = new char[bytes.length / 2];
            int i = 0;
            while (i < bytes.length / 2) {
                chars[i] = (char)GameMIDlet.readIntLE(bytes, i * 2, 2);
                ++i;
            }
            if (entryIndex < 7) {
                tempText1 = new String(chars);
            } else {
                GameMIDlet.tempText3 = new String(chars);
            }
            System.gc();
        }
    }

    // a(Ljava/lang/String;I)Ljavax/microedition/lcdui/Image; → loadImage：从归档第 entryIndex 条取 PNG 字节并创建 Image。
    public static final Image loadImage(String archive, int entryIndex) {
        byte[] bytes = GameMIDlet.readEntryBytes(archive, entryIndex);
        Image image = Image.createImage((byte[])bytes, (int)0, (int)bytes.length);
        System.gc();
        return image;
    }

    // b(Ljava/lang/String;I)Ljava/io/InputStream; → openEntryStream：返回定位到归档第 entryIndex 条目起始偏移的输入流。
    static final InputStream openEntryStream(String archive, int entryIndex) {
        int entryOffset = 0;
        try {
            InputStream inputStream = archive.getClass().getResourceAsStream(archive);
            inputStream.read(byteBuf4);
            int entryCount = GameMIDlet.readIntLE(byteBuf4, 0, 4);
            int i = 0;
            while (i < entryCount) {
                inputStream.read(byteBuf4);
                if (i == entryIndex) {
                    entryOffset = GameMIDlet.readIntLE(byteBuf4, 0, 4);
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

    // c(Ljava/lang/String;I)[B → readEntryBytes：读取归档第 entryIndex 条目的完整字节切片。
    static final byte[] readEntryBytes(String archive, int entryIndex) {
        int entryOffset = 0;
        int entryLength = 0;
        try {
            byte[] bytes = null;
            InputStream inputStream = archive.getClass().getResourceAsStream(archive);
            inputStream.read(byteBuf4);
            int entryCount = GameMIDlet.readIntLE(byteBuf4, 0, 4);
            int i = 0;
            while (i < entryCount) {
                inputStream.read(byteBuf4);
                if (i == entryIndex) {
                    entryOffset = GameMIDlet.readIntLE(byteBuf4, 0, 4);
                } else if (i == entryIndex + 1) {
                    entryLength = GameMIDlet.readIntLE(byteBuf4, 0, 4) - entryOffset;
                }
                ++i;
            }
            inputStream.skip(entryOffset);
            bytes = new byte[entryLength];
            inputStream.read(bytes);
            inputStream.close();
            return bytes;
        }
        catch (Exception exception) {
            return null;
        }
    }

    // <clinit>()V → staticInit：静态初始化：建读缓冲、音轨数/数组、默认存档及全部文案表。
    static {
        byteBuf1 = new byte[1];
        byteBuf2 = new byte[2];
        byteBuf4 = new byte[4];
        soundTrackCount = 2;
        soundPlayers = new Player[soundTrackCount];
        currentSoundIndex = -1;
        saveRecord = new byte[]{0, 0, 1, 0, 6};
        menuTexts = new String[]{"返回游戏", "新游戏", "继续", "声音 开", "帮助", "关于", "退出", "声音 关"};
        interludeTexts = new String[]{"继续", "跳过", "任务", "返回", "完成", "击毙敌人:", "所用时间:", "继续次数:", "失败", "菜单", "游戏结束", "载入中", "."};
        missionTexts = new String[]{"找到船舱入口。", "找到罗斯上校。", "控制台输入锁死密码", "摧毁动力装置", "摧毁备用动力装置", "摧毁直升飞机", "摧毁导弹艇"};
        numeralTexts = new String[]{"一", "二", "三", "四", "五", "六", "七", "八", "九", "十"};
    }
}
