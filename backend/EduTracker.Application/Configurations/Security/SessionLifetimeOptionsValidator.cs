using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Security;

internal sealed class SessionLifetimeOptionsValidator : IValidateOptions<SessionLifetimeOptions>
{
    public ValidateOptionsResult Validate(string? name, SessionLifetimeOptions options)
    {
        List<string> errors = [];

        if (options.StandardSessionDuration is null || options.StandardSessionDuration.Hours <= 0)
            errors.Add("SessionLifetimeOptions:StandardSessionDuration:Hours must be greater than 0.");

        if (options.ExtendedSessionDuration is null || options.ExtendedSessionDuration.Hours <= 0)
            errors.Add("SessionLifetimeOptions:ExtendedSessionDuration:Hours must be greater than 0.");

        if (options.AbsoluteSessionLimit is null || options.AbsoluteSessionLimit.Hours <= 0)
            errors.Add("SessionLifetimeOptions:AbsoluteSessionLimit:Hours must be greater than 0.");

        if (options.StandardExpiryExtension is null || options.StandardExpiryExtension.Hours < 0)
            errors.Add("SessionLifetimeOptions:StandardExpiryExtension:Hours cannot be negative.");

        if (options.ExtendedExpiryExtension is null || options.ExtendedExpiryExtension.Hours < 0)
            errors.Add("SessionLifetimeOptions:ExtendedExpiryExtension:Hours cannot be negative.");

        if (options.ExpiryExtensionTriggerPercent < 1 || options.ExpiryExtensionTriggerPercent > 100)
            errors.Add("SessionLifetimeOptions:ExpiryExtensionTriggerPercent must be between 1 and 100.");

        if (options.AbsoluteSessionLimit is not null && options.ExtendedSessionDuration is not null &&
            options.AbsoluteSessionLimit.Hours < options.ExtendedSessionDuration.Hours)
            errors.Add("SessionLifetimeOptions:AbsoluteSessionLimit:Hours must be greater than or equal to ExtendedSessionDuration:Hours.");

        if (options.AbsoluteSessionLimit is not null &&
            options.StandardSessionDuration is not null &&
            options.StandardExpiryExtension is not null &&
            options.StandardSessionDuration.Hours + options.StandardExpiryExtension.Hours > options.AbsoluteSessionLimit.Hours)
            errors.Add("SessionLifetimeOptions:Standard session duration plus extension cannot exceed the absolute session limit.");

        if (options.AbsoluteSessionLimit is not null &&
            options.ExtendedSessionDuration is not null &&
            options.ExtendedExpiryExtension is not null &&
            options.ExtendedSessionDuration.Hours + options.ExtendedExpiryExtension.Hours > options.AbsoluteSessionLimit.Hours)
            errors.Add("SessionLifetimeOptions:Extended session duration plus extension cannot exceed the absolute session limit.");

        return errors.Count is 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }
}
