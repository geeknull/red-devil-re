package com.nokia.mid.ui;
import javax.microedition.lcdui.Canvas;
public abstract class FullCanvas extends Canvas {
    public static final int KEY_UP_ARROW=-1,KEY_DOWN_ARROW=-2,KEY_LEFT_ARROW=-3,KEY_RIGHT_ARROW=-4,
        KEY_SOFTKEY1=-6,KEY_SOFTKEY2=-7,KEY_SOFTKEY3=-5,KEY_SEND=-10,KEY_END=-11;
    protected FullCanvas() { super(); }
}
