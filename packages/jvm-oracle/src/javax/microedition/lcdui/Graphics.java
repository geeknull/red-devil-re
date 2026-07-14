package javax.microedition.lcdui;
public class Graphics {
    public static final int HCENTER=1,VCENTER=2,LEFT=4,RIGHT=8,TOP=16,BOTTOM=32,BASELINE=64;
    public static final int SOLID=0,DOTTED=1;
    private int color=0; private Font font=Font.getDefaultFont();
    public java.util.List<String> ops = new java.util.ArrayList<>();
    public void setColor(int rgb){ this.color=rgb; ops.add("setColor "+(rgb&0xFFFFFF)); }
    public void setColor(int r,int g,int b){ this.color=(r<<16)|(g<<8)|b; ops.add("setColor3 "+r+","+g+","+b); }
    public int getColor(){ return color; }
    public void setFont(Font f){ this.font=f; ops.add("setFont"); }
    public Font getFont(){ return font; }
    public void setClip(int x,int y,int w,int h){ ops.add("setClip "+x+","+y+","+w+","+h); }
    public int getClipX(){return 0;} public int getClipY(){return 0;}
    public int getClipWidth(){return ScreenConfig.WIDTH;} public int getClipHeight(){return ScreenConfig.HEIGHT;}
    public void clipRect(int x,int y,int w,int h){}
    public void drawLine(int x1,int y1,int x2,int y2){ ops.add("drawLine "+x1+","+y1+","+x2+","+y2); }
    public void drawRect(int x,int y,int w,int h){ ops.add("drawRect "+x+","+y+","+w+","+h); }
    public void fillRect(int x,int y,int w,int h){ ops.add("fillRect "+x+","+y+","+w+","+h); }
    public void drawString(String s,int x,int y,int anchor){ ops.add("drawString ["+s+"] "+x+","+y+","+anchor); }
    public void drawSubstring(String s,int off,int len,int x,int y,int anchor){ ops.add("drawSubstring ["+s.substring(off,off+len)+"] "+x+","+y); }
    public void drawImage(Image img,int x,int y,int anchor){ ops.add("drawImage "+img.id+" "+x+","+y+","+anchor); }
    public void drawRegion(Image img,int sx,int sy,int sw,int sh,int transform,int dx,int dy,int anchor){ ops.add("drawRegion "+img.id+" src="+sx+","+sy+","+sw+","+sh+" t="+transform+" d="+dx+","+dy); }
    public void setStrokeStyle(int s){}
    public void translate(int x,int y){}
    public int getTranslateX(){return 0;} public int getTranslateY(){return 0;}
    public void drawChar(char c,int x,int y,int a){ ops.add("drawChar "+c); }
    public void fillArc(int x,int y,int w,int h,int sa,int aa){}
    public void drawArc(int x,int y,int w,int h,int sa,int aa){}
}
