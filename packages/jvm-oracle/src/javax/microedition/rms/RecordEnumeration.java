package javax.microedition.rms;
public interface RecordEnumeration {
    int numRecords(); byte[] nextRecord() throws RecordStoreException; int nextRecordId() throws InvalidRecordIDException;
    byte[] previousRecord() throws RecordStoreException; int previousRecordId() throws InvalidRecordIDException;
    boolean hasNextElement(); boolean hasPreviousElement(); void reset(); void rebuild(); void keepUpdated(boolean k);
    boolean isKeptUpdated(); void destroy();
}
