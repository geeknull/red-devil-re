package com.nokia.mid.ui;
import javax.microedition.lcdui.Image;
public interface DirectGraphics {
    int TYPE_USHORT_4444_ARGB=4444, TYPE_USHORT_1555_ARGB=1555, TYPE_INT_888_RGB=888, TYPE_BYTE_1_GRAY=1;
    int FLIP_HORIZONTAL=8192, FLIP_VERTICAL=16384;
    void drawPixels(short[] pixels,boolean transparency,int offset,int scanlength,int x,int y,int width,int height,int manipulation,int format);
    void drawPixels(int[] pixels,boolean transparency,int offset,int scanlength,int x,int y,int width,int height,int manipulation,int format);
    void drawPixels(byte[] pixels,byte[] transparencyMask,int offset,int scanlength,int x,int y,int width,int height,int manipulation,int format);
    void drawImage(Image img,int x,int y,int anchor,int manipulation);
    void setARGBColor(int argb);
    int getNativePixelFormat();
    int getAlphaComponent();
}
