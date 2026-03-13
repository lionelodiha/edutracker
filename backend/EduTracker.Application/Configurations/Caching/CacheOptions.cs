namespace EduTracker.Application.Configurations.Caching;

public sealed record CacheOptions
{
    public int Minutes { get; init; }

    public TimeSpan Ttl => TimeSpan.FromMinutes(Minutes);
}
