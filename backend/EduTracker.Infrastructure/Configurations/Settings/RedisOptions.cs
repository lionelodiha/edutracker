namespace EduTracker.Infrastructure.Configurations.Settings;

public record RedisOptions
{
    public string ConnectionString { get; init; } = string.Empty;
}
