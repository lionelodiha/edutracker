namespace EduTracker.Infrastructure.Configurations.Security.DataEncryption;

internal sealed record DataEncryptionOptions
{
    public byte CurrentKeyVersion { get; init; }
    public Dictionary<byte, string> Keys { get; init; } = [];
}
