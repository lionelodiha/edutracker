using System.Security.Cryptography;
using System.Text;
using BCryption = BCrypt.Net.BCrypt;
using EduTracker.Application.Services;
using Microsoft.Extensions.Options;
using EduTracker.Infrastructure.Configurations.Security.Hashing;

namespace EduTracker.Infrastructure.Services;

internal sealed class HashingService : IHashingService
{
    private readonly byte[] _emailHmacKey;
    private readonly int _passwordWorkFactor;

    public HashingService(IOptions<HashingOptions> options)
    {
        HashingOptions opts = options.Value;

        _emailHmacKey = Convert.FromBase64String(opts.EmailHmacKey);
        _passwordWorkFactor = opts.PasswordWorkFactor;
    }

    public async Task<string> HashPasswordAsync(string password)
        => await Task.FromResult(BCryption.HashPassword(password, _passwordWorkFactor));

    public async Task<bool> VerifyPasswordAsync(string password, string hashedPassword)
        => await Task.FromResult(BCryption.Verify(password, hashedPassword));

    public string HashEmail(string email)
    {
        using HMACSHA256 hmac = new(_emailHmacKey);
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(email));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public bool VerifyEmail(string email, string hashedEmail)
    {
        byte[] expected = Convert.FromHexString(hashedEmail);
        using HMACSHA256 hmac = new(_emailHmacKey);

        byte[] actual = hmac.ComputeHash(Encoding.UTF8.GetBytes(email));

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
