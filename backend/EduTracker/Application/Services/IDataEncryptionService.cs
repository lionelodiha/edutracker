namespace EduTracker.Application.Services;

public interface IDataEncryptionService
{
	byte[] EncryptData(byte[] data);
	byte[] DecryptData(byte[] encryptedData);
}
