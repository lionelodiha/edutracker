namespace EduTracker.Application.Configurations.Security;

public sealed record SessionLifetimeOptions
{
    public SessionDurationOptions StandardSessionDuration { get; init; } = default!;
    public SessionDurationOptions ExtendedSessionDuration { get; init; } = default!;
    public SessionDurationOptions AbsoluteSessionLimit { get; init; } = default!;
    public SessionDurationOptions StandardExpiryExtension { get; init; } = default!;
    public SessionDurationOptions ExtendedExpiryExtension { get; init; } = default!;
    public int ExpiryExtensionTriggerPercent { get; init; }
}
