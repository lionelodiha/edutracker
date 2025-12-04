using System.Security.Cryptography;
using EduTracker.Configurations.Security;
using EduTracker.Interfaces.Services;
using Microsoft.Extensions.Options;

namespace EduTracker.Services
{
    public class AesDataEncryptionService : IDataEncryptionService
    {
        private readonly byte[] _key;

        public AesDataEncryptionService(IOptions<DataEncryptionOptions> options)
        {
            string base64Key = options.Value.Key;

            if (string.IsNullOrWhiteSpace(base64Key))
                throw new ArgumentException("DataEncryption:Key must be provided in configuration.");

            _key = Convert.FromBase64String(base64Key);
        }

        public byte[] EncryptData(byte[] data)
        {
            using Aes aes = Aes.Create();
            aes.Key = _key;
            aes.GenerateIV();

            using ICryptoTransform encryptor = aes.CreateEncryptor();
            byte[] cipher = encryptor.TransformFinalBlock(data, 0, data.Length);

            byte[] result = new byte[aes.IV.Length + cipher.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(cipher, 0, result, aes.IV.Length, cipher.Length);

            return result;
        }

        public byte[] DecryptData(byte[] encryptedData)
        {
            using Aes aes = Aes.Create();
            aes.Key = _key;

            byte[] iv = new byte[aes.BlockSize / 8];
            byte[] cipher = new byte[encryptedData.Length - iv.Length];

            Buffer.BlockCopy(encryptedData, 0, iv, 0, iv.Length);
            Buffer.BlockCopy(encryptedData, iv.Length, cipher, 0, cipher.Length);

            aes.IV = iv;

            using ICryptoTransform decryptor = aes.CreateDecryptor();
            return decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
        }
    }
}
