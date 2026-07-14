package javax.microedition.media;
import javax.microedition.media.control.VolumeControl;
public class Manager {
    public static Player createPlayer(final java.io.InputStream stream,final String type){
        // headless silent player - fully consume stream is not required
        return new Player(){
            int state=UNREALIZED;
            public void realize(){ state=REALIZED; }
            public void prefetch(){ state=PREFETCHED; }
            public void start(){ state=STARTED; }
            public void stop(){ state=PREFETCHED; }
            public void deallocate(){ state=REALIZED; }
            public void close(){ state=CLOSED; }
            public int getState(){ return state; }
            public void setLoopCount(int c){}
            public long setMediaTime(long n){ return n; }
            public long getMediaTime(){ return 0; }
            public long getDuration(){ return TIME_UNKNOWN; }
            public String getContentType(){ return type; }
            public void addPlayerListener(PlayerListener l){}
            public void removePlayerListener(PlayerListener l){}
            public Control getControl(String t){
                if(t!=null && t.contains("VolumeControl")) return new VolumeControl(){
                    int lvl=100; public int setLevel(int x){ lvl=x; return lvl; } public int getLevel(){ return lvl; }
                    public void setMute(boolean m){} public boolean isMuted(){ return false; } };
                return null;
            }
            public Control[] getControls(){ return new Control[0]; }
        };
    }
    public static Player createPlayer(String locator){ return createPlayer((java.io.InputStream)null,"audio"); }
    public static String[] getSupportedContentTypes(String protocol){ return new String[]{"audio/midi","audio/x-wav"}; }
    public static String[] getSupportedProtocols(String ct){ return new String[]{"http"}; }
    public static Object TONE_DEVICE_LOCATOR="device://tone";
    public static void playTone(int note,int duration,int volume){}
}
