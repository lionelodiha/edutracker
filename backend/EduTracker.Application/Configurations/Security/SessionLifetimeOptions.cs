namespace EduTracker.Application.Configurations.Security;

public sealed record SessionLifetimeOptions
{
    public int StandardSessionDurationHours { get; init; }
    public int ExtendedSessionDurationDays { get; init; }
    public int AbsoluteSessionLimitDays { get; init; }
    public int StandardExpiryExtensionHours { get; init; }
    public int ExtendedExpiryExtensionHours { get; init; }
    public int ExpiryExtensionTriggerPercent { get; init; }

    public TimeSpan StandardSessionDuration => TimeSpan.FromHours(StandardSessionDurationHours);
    public TimeSpan ExtendedSessionDuration => TimeSpan.FromDays(ExtendedSessionDurationDays);
    public TimeSpan AbsoluteSessionLimit => TimeSpan.FromDays(AbsoluteSessionLimitDays);
    public TimeSpan StandardExpiryExtension => TimeSpan.FromHours(StandardExpiryExtensionHours);
    public TimeSpan ExtendedExpiryExtension => TimeSpan.FromHours(ExtendedExpiryExtensionHours);
}
