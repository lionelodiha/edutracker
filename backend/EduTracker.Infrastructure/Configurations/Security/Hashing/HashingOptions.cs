namespace EduTracker.Infrastructure.Configurations.Security.Hashing;

public sealed record HashingOptions
{
    public string EmailHmacKey { get; init; } = string.Empty;
    public int PasswordWorkFactor { get; init; }
}
