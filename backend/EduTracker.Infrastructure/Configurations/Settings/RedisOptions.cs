namespace EduTracker.Infrastructure.Configurations.Settings;

internal record RedisOptions
{
    public string ConnectionString { get; init; } = string.Empty;
}
