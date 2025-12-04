namespace EduTracker.Common.Entities;

public class SensitiveDataHandler<TSensitive> where TSensitive : ISensitiveData
{
    public byte[] EncryptedData { get; private set; } = [];
    public TSensitive? SensitiveData { get; private set; }

    public void SetSensitiveData(TSensitive data) => SensitiveData = data;
    public void SetEncryptedData(byte[] data) => EncryptedData = data;

    public void ClearDecryptedData() => SensitiveData = default;
    public void ClearEncryptedData() => EncryptedData = [];
}
