using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Caching;

internal sealed class CacheTimeToLiveOptionsValidator : IValidateOptions<CacheTimeToLiveOptions>
{
    public ValidateOptionsResult Validate(string? name, CacheTimeToLiveOptions options)
    {
        List<string> errors = [];

        if (options.AuthSessionById is null || options.AuthSessionById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:AuthSessionById:Minutes must be greater than 0.");

        if (options.UserAuthenticationState is null || options.UserAuthenticationState.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:UserAuthenticationState:Minutes must be greater than 0.");

        if (options.UserProfileById is null || options.UserProfileById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:UserProfileById:Minutes must be greater than 0.");

        if (options.OrganizationById is null || options.OrganizationById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:OrganizationById:Minutes must be greater than 0.");

        if (options.OrganizationMembers is null || options.OrganizationMembers.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:OrganizationMembers:Minutes must be greater than 0.");

        return errors.Count is 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }
}
