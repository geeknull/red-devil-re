package com.nokia.mid.ui;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
public class DirectUtils {
    public static DirectGraphics getDirectGraphics(final Graphics g){
        return new DirectGraphics(){
            public void drawPixels(short[] p,boolean t,int off,int sl,int x,int y,int w,int h,int m,int fmt){ javax.microedition.lcdui.OpTap.record("drawPixels16 "+w+"x"+h+" @"+x+","+y+" fmt="+fmt+" n="+p.length); }
            public void drawPixels(int[] p,boolean t,int off,int sl,int x,int y,int w,int h,int m,int fmt){ javax.microedition.lcdui.OpTap.record("drawPixels32 "+w+"x"+h+" @"+x+","+y); }
            public void drawPixels(byte[] p,byte[] tm,int off,int sl,int x,int y,int w,int h,int m,int fmt){ javax.microedition.lcdui.OpTap.record("drawPixels8 "+w+"x"+h); }
            public void drawImage(Image img,int x,int y,int a,int m){ javax.microedition.lcdui.OpTap.record("directDrawImage "+img.id); }
            public void setARGBColor(int argb){ g.setColor(argb); }
            public int getNativePixelFormat(){ return DirectGraphics.TYPE_USHORT_4444_ARGB; }
            public int getAlphaComponent(){ return 255; }
        };
    }
    public static Image createImage(int w,int h,int argb){ return Image.createImage(w,h); }
    public static Image createImage(byte[] data,int off,int len){ return Image.createImage(data,off,len); }
}
