using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Security;

internal sealed class SessionLifetimeOptionsValidator : IValidateOptions<SessionLifetimeOptions>
{
    public ValidateOptionsResult Validate(string? name, SessionLifetimeOptions options)
    {
        if (options.StandardSessionDurationHours <= 0)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:StandardSessionDurationHours must be greater than 0."
            );

        if (options.ExtendedSessionDurationDays <= 0)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:ExtendedSessionDurationDays must be greater than 0."
            );

        if (options.AbsoluteSessionLimitDays <= 0)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:AbsoluteSessionLimitDays must be greater than 0."
            );

        if (options.StandardExpiryExtensionHours < 0)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:StandardExpiryExtensionHours cannot be negative."
            );

        if (options.ExtendedExpiryExtensionHours < 0)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:ExtendedExpiryExtensionHours cannot be negative."
            );

        if (options.ExpiryExtensionTriggerPercent < 1 || options.ExpiryExtensionTriggerPercent > 100)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:ExpiryExtensionTriggerPercent must be between 1 and 100."
            );

        if (options.AbsoluteSessionLimitDays < options.ExtendedSessionDurationDays)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:AbsoluteSessionLimitDays must be greater than or equal to ExtendedSessionDurationDays."
            );

        int absoluteLimitHours = options.AbsoluteSessionLimitDays * 24;

        if (options.StandardSessionDurationHours + options.StandardExpiryExtensionHours > absoluteLimitHours)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:Standard session duration plus extension cannot exceed the absolute session limit."
            );

        if ((options.ExtendedSessionDurationDays * 24) + options.ExtendedExpiryExtensionHours > absoluteLimitHours)
            return ValidateOptionsResult.Fail(
                "SessionManagementOptions:Extended session duration plus extension cannot exceed the absolute session limit."
            );

        return ValidateOptionsResult.Success;
    }
}
