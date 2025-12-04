using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using EduTracker.Interfaces.Services;
using BCryption = BCrypt.Net.BCrypt;
using EduTracker.Configurations.Security;

namespace EduTracker.Services;

public class HashingService : IHashingService
{
    private readonly byte[] _emailHmacKey;
    private readonly int _passwordWorkFactor;

    public HashingService(IOptions<HashingOptions> options)
    {
        HashingOptions opts = options.Value;

        if (string.IsNullOrWhiteSpace(opts.EmailHmacKey))
            throw new ArgumentException("Hashing:EmailHmacKey must be provided in configuration.");

        _emailHmacKey = Encoding.UTF8.GetBytes(opts.EmailHmacKey);
        _passwordWorkFactor = opts.PasswordWorkFactor;
    }

    public string HashPassword(string password)
        => BCryption.HashPassword(password, _passwordWorkFactor);

    public bool VerifyPassword(string password, string hashedPassword)
        => BCryption.Verify(password, hashedPassword);

    public string HashEmail(string email)
    {
        using HMACSHA256 hmac = new(_emailHmacKey);
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(email));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public bool VerifyEmail(string email, string hashedEmail)
    {
        string computed = HashEmail(email);

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(hashedEmail)
        );
    }
}
