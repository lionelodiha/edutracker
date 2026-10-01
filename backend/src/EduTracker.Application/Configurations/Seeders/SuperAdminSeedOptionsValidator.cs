using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Seeders;

internal sealed class SuperAdminSeedOptionsValidator : IValidateOptions<SuperAdminSeedOptions>
{
    public ValidateOptionsResult Validate(string? name, SuperAdminSeedOptions options)
    {
        List<string> errors = [];

        if (string.IsNullOrWhiteSpace(options.FirstName))
            errors.Add("SuperAdminSeedOptions:FirstName is required.");

        if (string.IsNullOrWhiteSpace(options.LastName))
            errors.Add("SuperAdminSeedOptions:LastName is required.");

        if (string.IsNullOrWhiteSpace(options.UserName))
            errors.Add("SuperAdminSeedOptions:UserName is required.");

        if (string.IsNullOrWhiteSpace(options.Email))
            errors.Add("SuperAdminSeedOptions:Email is required.");

        if (!string.IsNullOrWhiteSpace(options.Email) && !options.Email.Contains('@'))
            errors.Add("SuperAdminSeedOptions:Email is invalid.");

        if (string.IsNullOrWhiteSpace(options.Password))
            errors.Add("SuperAdminSeedOptions:Password is required.");

        if (!string.IsNullOrWhiteSpace(options.Password) && options.Password.Length < 8)
            errors.Add("SuperAdminSeedOptions:Password must be at least 8 characters long.");

        return errors.Count is 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }
}
