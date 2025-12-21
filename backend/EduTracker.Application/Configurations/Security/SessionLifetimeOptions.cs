namespace EduTracker.Application.Configurations.Security;

public record SessionManagementOptions
{
    public int StandardSessionDurationHours { get; init; }
    public int ExtendedSessionDurationDays { get; init; }
    public int AbsoluteSessionLimitDays { get; init; }
    public int StandardExpiryExtensionHours { get; init; }
    public int ExtendedExpiryExtensionHours { get; init; }
    public int ExpiryExtensionTriggerPercent { get; init; }
}

public record JwtOptions
{
    public string SecretKey { get; init; } = string.Empty;
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public int AccessTokenExpirationMinutes { get; init; }
}
