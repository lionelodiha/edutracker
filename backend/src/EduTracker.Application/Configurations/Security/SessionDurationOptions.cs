namespace EduTracker.Application.Configurations.Security;

public sealed record SessionDurationOptions
{
    public int Hours { get; init; }

    public TimeSpan Duration => TimeSpan.FromHours(Hours);
}
