using Microsoft.Extensions.Options;

namespace EduTracker.Infrastructure.Configurations.Security.Hashing;

internal sealed class HashingOptionsValidator : IValidateOptions<HashingOptions>
{
    public ValidateOptionsResult Validate(string? name, HashingOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.EmailHmacKey))
            return ValidateOptionsResult.Fail(
                "HashingOptions:EmailHmacKey must be provided in configuration."
            );

        byte[] keyBytes;

        try
        {
            keyBytes = Convert.FromBase64String(options.EmailHmacKey);
        }
        catch
        {
            return ValidateOptionsResult.Fail(
                "HashingOptions:EmailHmacKey must be a valid Base64 string."
            );
        }

        if (keyBytes.Length < 32)
            return ValidateOptionsResult.Fail(
                "HashingOptions:EmailHmacKey must be at least 32 bytes for security."
            );

        if (options.PasswordWorkFactor <= 0)
            return ValidateOptionsResult.Fail(
                "HashingOptions:PasswordWorkFactor must be greater than 0."
            );

        if (options.PasswordWorkFactor > 20)
            return ValidateOptionsResult.Fail(
                "HashingOptions:PasswordWorkFactor must not exceed 20."
            );

        return ValidateOptionsResult.Success;
    }
}
