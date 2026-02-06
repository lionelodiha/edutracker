namespace EduTracker.Application.Configurations.Caching;

public sealed record CacheTimeToLiveOptions
{
    public int AuthSessionByIdMinutes { get; init; }
    public int UserAuthenticationStateMinutes { get; init; }
    public int UserProfileByIdMinutes { get; init; }

    public TimeSpan AuthSessionByIdTtl
        => TimeSpan.FromMinutes(AuthSessionByIdMinutes);

    public TimeSpan UserAuthenticationStateTtl
        => TimeSpan.FromMinutes(UserAuthenticationStateMinutes);

    public TimeSpan UserProfileByIdTtl
        => TimeSpan.FromMinutes(UserProfileByIdMinutes);
}
