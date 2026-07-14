package javax.microedition.rms;
import java.util.*;
public class RecordStore {
    private static final Map<String,RecordStore> STORES=new HashMap<>();
    private final Map<Integer,byte[]> records=new LinkedHashMap<>();
    private int nextId=1; private String name;
    private RecordStore(String n){ this.name=n; }
    public static RecordStore openRecordStore(String name,boolean createIfNecessary) throws RecordStoreException {
        RecordStore rs=STORES.get(name);
        if(rs==null){ if(!createIfNecessary) throw new RecordStoreNotFoundException(); rs=new RecordStore(name); STORES.put(name,rs); }
        return rs;
    }
    public void closeRecordStore(){}
    public static void deleteRecordStore(String name){ STORES.remove(name); }
    public int addRecord(byte[] data,int off,int len){ int id=nextId++; byte[] b=new byte[len]; System.arraycopy(data,off,b,0,len); records.put(id,b); return id; }
    public byte[] getRecord(int id){ return records.get(id); }
    public int getRecord(int id,byte[] buf,int off){ byte[] b=records.get(id); System.arraycopy(b,0,buf,off,b.length); return b.length; }
    public void setRecord(int id,byte[] data,int off,int len){ byte[] b=new byte[len]; System.arraycopy(data,off,b,0,len); records.put(id,b); }
    public void deleteRecord(int id){ records.remove(id); }
    public int getNumRecords(){ return records.size(); }
    public int getNextRecordID(){ return nextId; }
    public int getRecordSize(int id){ return records.get(id).length; }
    public RecordEnumeration enumerateRecords(RecordFilter f,RecordComparator c,boolean keepUpdated){
        final List<Integer> ids=new ArrayList<>();
        for(Map.Entry<Integer,byte[]> e:records.entrySet()){ if(f==null||f.matches(e.getValue())) ids.add(e.getKey()); }
        return new RecordEnumeration(){
            int idx=0;
            public int numRecords(){ return ids.size(); }
            public byte[] nextRecord(){ return records.get(ids.get(idx++)); }
            public int nextRecordId(){ return ids.get(idx++); }
            public byte[] previousRecord(){ return records.get(ids.get(--idx)); }
            public int previousRecordId(){ return ids.get(--idx); }
            public boolean hasNextElement(){ return idx<ids.size(); }
            public boolean hasPreviousElement(){ return idx>0; }
            public void reset(){ idx=0; } public void rebuild(){} public void keepUpdated(boolean k){}
            public boolean isKeptUpdated(){ return false; } public void destroy(){}
        };
    }
    public static String[] listRecordStores(){ return STORES.keySet().toArray(new String[0]); }
}
