package javax.microedition.lcdui;
public class Image {
    static int counter=0;
    /** 审计用实例登记（纯观测，不参与任何游戏逻辑；见 harness/Audit.java）。 */
    public static final java.util.List<Image> instances=new java.util.ArrayList<>();
    public int id; public int w,h; public boolean mutable; public byte[] raw;
    private Graphics g;
    private Image(int w,int h,boolean m){ this.id=counter++; this.w=w; this.h=h; this.mutable=m; instances.add(this); }
    public static Image createImage(int w,int h){ return new Image(w,h,true); }
    public static Image createImage(byte[] data,int off,int len){
        Image im=new Image(0,0,false);
        // decode PNG dimensions via ImageIO for realism
        try {
            java.io.ByteArrayInputStream bis=new java.io.ByteArrayInputStream(data,off,len);
            java.awt.image.BufferedImage bi=javax.imageio.ImageIO.read(bis);
            if(bi!=null){ im.w=bi.getWidth(); im.h=bi.getHeight(); }
        } catch(Exception e){}
        im.raw=new byte[len]; System.arraycopy(data,off,im.raw,0,len);
        return im;
    }
    public static Image createImage(Image src){ Image im=new Image(src.w,src.h,false); return im; }
    public static Image createImage(java.io.InputStream is) throws java.io.IOException {
        java.io.ByteArrayOutputStream bos=new java.io.ByteArrayOutputStream(); byte[] b=new byte[4096]; int n;
        while((n=is.read(b))>0) bos.write(b,0,n); return createImage(bos.toByteArray(),0,bos.size());
    }
    public Graphics getGraphics(){ if(g==null) g=new Graphics(); return g; }
    public int getWidth(){ return w; }
    public int getHeight(){ return h; }
    public boolean isMutable(){ return mutable; }
    public void getRGB(int[] rgb,int off,int sl,int x,int y,int w,int h){}
}
