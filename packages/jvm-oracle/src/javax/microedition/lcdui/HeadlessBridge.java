package javax.microedition.lcdui;
public class HeadlessBridge {
    public static volatile Displayable current;
    public static volatile int repaintCount=0;
    public static void onSetCurrent(Displayable d){ current=d; }
    public static void onRepaint(Canvas c){ repaintCount++; }
}
