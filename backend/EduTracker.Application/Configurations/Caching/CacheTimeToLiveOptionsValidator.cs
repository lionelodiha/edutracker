using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Caching;

internal sealed class CacheTimeToLiveOptionsValidator : IValidateOptions<CacheTimeToLiveOptions>
{
    public ValidateOptionsResult Validate(string? name, CacheTimeToLiveOptions options)
    {
        if (options.AuthSessionByIdMinutes <= 0)
            return ValidateOptionsResult.Fail(
                "CacheTimeToLiveOptions:AuthSessionByIdMinutes must be greater than 0."
            );

        if (options.UserAuthenticationStateMinutes <= 0)
            return ValidateOptionsResult.Fail(
                "CacheTimeToLiveOptions:UserAuthenticationStateMinutes must be greater than 0."
            );

        if (options.UserProfileByIdMinutes <= 0)
            return ValidateOptionsResult.Fail(
                "CacheTimeToLiveOptions:UserProfileByIdMinutes must be greater than 0."
            );

        return ValidateOptionsResult.Success;
    }
}
