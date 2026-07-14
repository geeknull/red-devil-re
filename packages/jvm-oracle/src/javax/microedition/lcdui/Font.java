package javax.microedition.lcdui;
public class Font {
    public static final int FACE_SYSTEM=0,FACE_MONOSPACE=32,FACE_PROPORTIONAL=64;
    public static final int STYLE_PLAIN=0,STYLE_BOLD=1,STYLE_ITALIC=2,STYLE_UNDERLINED=4;
    public static final int SIZE_SMALL=8,SIZE_MEDIUM=0,SIZE_LARGE=16;
    private static final Font DEF=new Font();
    public static Font getFont(int face,int style,int size){ return DEF; }
    public static Font getDefaultFont(){ return DEF; }
    public int getHeight(){ return 13; }
    public int getBaselinePosition(){ return 10; }
    public int stringWidth(String s){ return s==null?0:s.length()*6; }
    public int substringWidth(String s,int off,int len){ return len*6; }
    public int charWidth(char c){ return 6; }
    public int getSize(){ return SIZE_MEDIUM; }
    public int getFace(){ return FACE_SYSTEM; }
    public int getStyle(){ return STYLE_PLAIN; }
}
