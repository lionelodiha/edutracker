using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Seeders;

internal sealed class SuperAdminSeedOptionsValidator : IValidateOptions<SuperAdminSeedOptions>
{
    public ValidateOptionsResult Validate(string? name, SuperAdminSeedOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.FirstName))
            return ValidateOptionsResult.Fail("SuperAdminSeedOptions:FirstName is required.");

        if (string.IsNullOrWhiteSpace(options.LastName))
            return ValidateOptionsResult.Fail("SuperAdminSeedOptions:LastName is required.");

        if (string.IsNullOrWhiteSpace(options.UserName))
            return ValidateOptionsResult.Fail("SuperAdminSeedOptions:UserName is required.");

        if (string.IsNullOrWhiteSpace(options.Email))
            return ValidateOptionsResult.Fail("SuperAdminSeedOptions:Email is required.");

        if (!options.Email.Contains('@'))
            return ValidateOptionsResult.Fail("SuperAdminSeedOptions:Email is invalid.");

        if (string.IsNullOrWhiteSpace(options.Password))
            return ValidateOptionsResult.Fail("SuperAdminSeedOptions:Password is required.");

        if (options.Password.Length < 8)
            return ValidateOptionsResult.Fail("SuperAdminSeedOptions:Password must be at least 8 characters long.");

        return ValidateOptionsResult.Success;
    }
}
