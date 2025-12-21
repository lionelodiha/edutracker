using EduTracker.Application.Configurations.Security;
using EduTracker.Domain.Entities.UserSessions;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Services;

public class SessionPolicy
{
    public TimeSpan StandardSessionDuration { get; }
    public TimeSpan ExtendedSessionDuration { get; }
    public TimeSpan AbsoluteSessionLimit { get; }

    public TimeSpan StandardExpiryExtension { get; }
    public TimeSpan ExtendedExpiryExtension { get; }

    public double ExpiryExtensionTriggerPercent { get; }

    public SessionPolicy(IOptions<SessionManagementOptions> optionsAccessor)
    {
        if (optionsAccessor == null) throw new ArgumentNullException(nameof(optionsAccessor));

        var options = optionsAccessor.Value ?? throw new ArgumentException("SessionManagementOptions cannot be null");

        // --- Validation ---
        if (options.StandardSessionDurationHours <= 0)
            throw new ArgumentException("StandardSessionDurationHours must be > 0");

        if (options.ExtendedSessionDurationDays <= 0)
            throw new ArgumentException("ExtendedSessionDurationDays must be > 0");

        if (options.AbsoluteSessionLimitDays < options.ExtendedSessionDurationDays)
            throw new ArgumentException("AbsoluteSessionLimitDays must be >= ExtendedSessionDurationDays");

        if (options.ExpiryExtensionTriggerPercent < 1 || options.ExpiryExtensionTriggerPercent > 100)
            throw new ArgumentException("ExpiryExtensionTriggerPercent must be between 1 and 100");

        // --- Conversion ---
        StandardSessionDuration = TimeSpan.FromHours(options.StandardSessionDurationHours);
        ExtendedSessionDuration = TimeSpan.FromDays(options.ExtendedSessionDurationDays);
        AbsoluteSessionLimit = TimeSpan.FromDays(options.AbsoluteSessionLimitDays);

        StandardExpiryExtension = TimeSpan.FromHours(options.StandardExpiryExtensionHours);
        ExtendedExpiryExtension = TimeSpan.FromHours(options.ExtendedExpiryExtensionHours);

        ExpiryExtensionTriggerPercent = options.ExpiryExtensionTriggerPercent;
    }

    public TimeSpan GetExpiryThreshold(TimeSpan sessionDuration)
    {
        return TimeSpan.FromSeconds(sessionDuration.TotalSeconds * ExpiryExtensionTriggerPercent / 100.0);
    }

    public TimeSpan GetExpiryExtension(TimeSpan sessionDuration)
    {
        return sessionDuration == StandardSessionDuration ? StandardExpiryExtension : ExtendedExpiryExtension;
    }

    // public static DateTime? GetNewExpiry(UserSession session, DateTime now)
    // {
    //     if (!session.IsActive)
    //         return null;

    //     var remaining = session.ExpiresAt - now;
    //     if (remaining <= TimeSpan.Zero)
    //         return null;

    //     var totalLifetime = session.AbsoluteExpiresAt - session.CreatedAt;
    //     var threshold = TimeSpan.FromTicks(
    //         (long)(totalLifetime.Ticks * ThresholdRatio));

    //     if (remaining > threshold)
    //         return null;

    //     var slide = session.RememberMe ? RememberSlide : NoRememberSlide;
    //     return now.Add(slide);
    // }
}
