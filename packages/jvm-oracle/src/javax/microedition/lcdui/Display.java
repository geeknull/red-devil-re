package javax.microedition.lcdui;
import javax.microedition.midlet.MIDlet;
public class Display {
    private static Display INSTANCE=new Display();
    public static Display getDisplay(MIDlet m){ return INSTANCE; }
    public void setCurrent(Displayable d){ System.out.println("[Display] setCurrent -> "+(d==null?"null":d.getClass().getName())); HeadlessBridge.onSetCurrent(d); }
    public Displayable getCurrent(){ return HeadlessBridge.current; }
    public boolean isColor(){ return true; }
    public int numColors(){ return 4096; }
    public void callSerially(Runnable r){ r.run(); }
    public boolean flashBacklight(int ms){ return false; }
}
