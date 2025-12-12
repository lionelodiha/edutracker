using EduTracker.Interfaces.Services;

namespace EduTracker.Services.StartupChecks;

public class RedisStartupCheck(ICacheService cache) : IHostedService
{
    private readonly ICacheService _cache = cache;

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
