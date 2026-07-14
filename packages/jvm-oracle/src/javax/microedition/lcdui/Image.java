package javax.microedition.lcdui;
public class Image {
    static int counter=0;
    static int mutSeq=0;
    /** 审计用实例登记（纯观测，不参与任何游戏逻辑；见 harness/Audit.java）。 */
    public static final java.util.List<Image> instances=new java.util.ArrayList<>();
    public int id; public int w,h; public boolean mutable; public byte[] raw;
    /**
     * 跨端图像逻辑身份（provenance）——与 TS port 侧 `Image.oracleId` 同 schema。
     * 不可变图用「源 PNG 字节内容哈希」：两侧读同一份 /res/*.bin，字节相同→哈希必同，
     * 且与创建顺序无关（oracle 由游戏逻辑懒加载、port 由 fixtures 预载，分配序本就不同）。
     * 可变图（离屏缓冲）无源字节，用「尺寸+分配序」——两侧均由同一份游戏逻辑创建，序相同。
     */
    public String provId="?";
    private Graphics g;
    private Image(int w,int h,boolean m){ this.id=counter++; this.w=w; this.h=h; this.mutable=m; instances.add(this); }

    /** 源字节内容哈希（短 SHA-256），跨端稳定。 */
    static String sha6(byte[] d,int off,int len){
        try {
            java.security.MessageDigest md=java.security.MessageDigest.getInstance("SHA-256");
            md.update(d,off,len);
            byte[] h=md.digest();
            StringBuilder sb=new StringBuilder();
            for(int i=0;i<6;i++) sb.append(String.format("%02x",h[i]));
            return sb.toString();
        } catch(Exception e){ return "ERR"; }
    }
    public static Image createImage(int w,int h){ Image im=new Image(w,h,true); im.provId="mut:"+w+"x"+h+"#"+(mutSeq++); return im; }
    public static Image createImage(byte[] data,int off,int len){
        Image im=new Image(0,0,false);
        // decode PNG dimensions via ImageIO for realism
        try {
            java.io.ByteArrayInputStream bis=new java.io.ByteArrayInputStream(data,off,len);
            java.awt.image.BufferedImage bi=javax.imageio.ImageIO.read(bis);
            if(bi!=null){ im.w=bi.getWidth(); im.h=bi.getHeight(); }
        } catch(Exception e){}
        im.raw=new byte[len]; System.arraycopy(data,off,im.raw,0,len);
        im.provId="png:"+sha6(data,off,len);
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
