package javax.microedition.lcdui;
public class Graphics {
    public static final int HCENTER=1,VCENTER=2,LEFT=4,RIGHT=8,TOP=16,BOTTOM=32,BASELINE=64;
    public static final int SOLID=0,DOTTED=1;
    private int color=0; private Font font=Font.getDefaultFont();
    public java.util.List<String> ops = new java.util.ArrayList<>();
    /** 与 TS port 的模块级 tap 对称：离屏缓冲 Graphics 的绘制也必须被收集。 */
    private void rec(String op){ ops.add(op); OpTap.record(op); }
    public void setColor(int rgb){ this.color=rgb; rec("setColor "+(rgb&0xFFFFFF)); }
    public void setColor(int r,int g,int b){ this.color=(r<<16)|(g<<8)|b; rec("setColor3 "+r+","+g+","+b); }
    public int getColor(){ return color; }
    public void setFont(Font f){ this.font=f; rec("setFont"); }
    public Font getFont(){ return font; }
    public void setClip(int x,int y,int w,int h){ rec("setClip "+x+","+y+","+w+","+h); }
    public int getClipX(){return 0;} public int getClipY(){return 0;}
    public int getClipWidth(){return ScreenConfig.WIDTH;} public int getClipHeight(){return ScreenConfig.HEIGHT;}
    public void clipRect(int x,int y,int w,int h){}
    public void drawLine(int x1,int y1,int x2,int y2){ rec("drawLine "+x1+","+y1+","+x2+","+y2); }
    public void drawRect(int x,int y,int w,int h){ rec("drawRect "+x+","+y+","+w+","+h); }
    public void fillRect(int x,int y,int w,int h){ rec("fillRect "+x+","+y+","+w+","+h); }
    // 规范 op `drawStr`：drawString(s,x,y,a) 语义上 === drawSubstring(s,0,len,x,y,a)，两者归一。
    // TS port 的 drawString 内部委托给 drawSubstring，归一后两侧对同一 game 调用恰好各产生一条同形 op。
    public void drawString(String s,int x,int y,int anchor){ rec("drawStr ["+s+"] "+x+","+y+","+anchor); }
    public void drawSubstring(String s,int off,int len,int x,int y,int anchor){ rec("drawStr ["+s.substring(off,off+len)+"] "+x+","+y+","+anchor); }
    public void drawImage(Image img,int x,int y,int anchor){ rec("drawImage "+img.provId+" "+x+","+y+","+anchor); }
    public void drawRegion(Image img,int sx,int sy,int sw,int sh,int transform,int dx,int dy,int anchor){ rec("drawRegion "+img.provId+" src="+sx+","+sy+","+sw+","+sh+" t="+transform+" d="+dx+","+dy); }
    public void setStrokeStyle(int s){}
    public void translate(int x,int y){}
    public int getTranslateX(){return 0;} public int getTranslateY(){return 0;}
    public void drawChar(char c,int x,int y,int a){ rec("drawChar "+c); }
    public void fillArc(int x,int y,int w,int h,int sa,int aa){}
    public void drawArc(int x,int y,int w,int h,int sa,int aa){}
}
