namespace EduTracker.Application.Configurations.Caching;

public sealed record CacheTimeToLiveOptions
{
    public CacheOptions AuthSessionById { get; init; } = default!;
    public CacheOptions UserAuthenticationState { get; init; } = default!;
    public CacheOptions UserProfileById { get; init; } = default!;
}
