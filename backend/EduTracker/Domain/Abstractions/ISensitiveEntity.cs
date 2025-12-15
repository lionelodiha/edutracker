using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Abstractions;

public interface IHasSensitiveData<TSensitive> where TSensitive : ISensitiveData
{
    byte[] EncryptedData { get; }
    TSensitive? SensitiveData { get; }

    void SetSensitiveData(TSensitive data);
    void SetEncryptedData(byte[] data);
    void ClearDecryptedData();
    void ClearEncryptedData();
}
