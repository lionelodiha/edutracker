using Microsoft.Extensions.Options;

namespace EduTracker.Infrastructure.Configurations.Security.DataEncryption;

internal sealed class DataEncryptionOptionsValidator : IValidateOptions<DataEncryptionOptions>
{
    public ValidateOptionsResult Validate(string? name, DataEncryptionOptions options)
    {
        if (options.Keys is null || options.Keys.Count is 0)
            return ValidateOptionsResult.Fail(
                "At least one key must be configured in DataEncryptionOptions:Keys."
            );

        if (!options.Keys.ContainsKey(options.CurrentKeyVersion))
            return ValidateOptionsResult.Fail(
                $"CurrentKeyVersion '{options.CurrentKeyVersion}' must exist in the configured keys."
            );

        foreach (KeyValuePair<byte, string> kvp in options.Keys)
        {
            if (string.IsNullOrWhiteSpace(kvp.Value))
                return ValidateOptionsResult.Fail($"Key '{kvp.Key}' cannot be null or empty.");

            byte[] keyBytes;

            try
            {
                keyBytes = Convert.FromBase64String(kvp.Value);
            }
            catch (FormatException)
            {
                return ValidateOptionsResult.Fail($"Key '{kvp.Key}' is not a valid Base64 string.");
            }

            if (keyBytes.Length is not 32)
                return ValidateOptionsResult.Fail($"Key '{kvp.Key}' must be 32 bytes (AES-256).");
        }

        return ValidateOptionsResult.Success;
    }
}
