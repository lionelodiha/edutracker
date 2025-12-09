namespace EduTracker.Configurations.Settings;

public record RedisOptions
{
    public string ConnectionString { get; init; } = string.Empty;
}
