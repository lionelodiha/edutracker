namespace EduTracker.Configurations.Security;

public record HashingOptions
{
    public string EmailHmacKey { get; init; } = string.Empty;
    public int PasswordWorkFactor { get; init; } = 12;
}
