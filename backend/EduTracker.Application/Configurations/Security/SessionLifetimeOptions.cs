namespace EduTracker.Application.Configurations.Security;

public record SessionLifetimeOptions
{
    public int DefaultSessionHours { get; init; }
    public int RememberMeSessionDays { get; init; }
    public int GracePeriodDays { get; init; }
}
