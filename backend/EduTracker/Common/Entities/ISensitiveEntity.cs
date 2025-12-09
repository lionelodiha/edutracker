namespace EduTracker.Common.Entities;

public interface ISensitiveEntity<TSensitive> where TSensitive : ISensitiveData
{
    byte[] EncryptedData { get; }
    TSensitive? SensitiveData { get; }

    void SetSensitiveData(TSensitive data);
    void SetEncryptedData(byte[] data);
    void ClearDecryptedData();
    void ClearEncryptedData();
}
