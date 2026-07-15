package com.nokia.mid.ui;
import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
public class DirectUtils {
    public static DirectGraphics getDirectGraphics(final Graphics g){
        return new DirectGraphics(){
            public void drawPixels(short[] p,boolean t,int off,int sl,int x,int y,int w,int h,int m,int fmt){
                // 规范 op `blitSprite`：与 TS port 的 createRGBImage+drawRegion 归一（见 NokiaManip 类注释）。
                // 原版走 Nokia DirectGraphics.drawPixels，移植走 createRGBImage+drawRegion（浏览器无
                // DirectGraphics，属已文档化的必要偏差）。两者几何与变换可比；像素内容本就是偏差，不比。
                javax.microedition.lcdui.OpTap.record("blitSprite "+w+"x"+h+" t="+NokiaManip.toTransform(m)+" d="+x+","+y);
            }
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
