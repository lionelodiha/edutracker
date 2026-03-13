using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Configurations.Security;
using EduTracker.Application.Configurations.Seeders;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Seeders.SeedSuperAdmin;
using EduTracker.Infrastructure.Configurations.Security.DataEncryption;
using EduTracker.Infrastructure.Configurations.Security.Hashing;
using Microsoft.Extensions.Options;

namespace EduTracker.Api.Hosting;

internal sealed class StartupTasksHostedService(
    IServiceProvider serviceProvider,
    IHostApplicationLifetime appLifetime,
    ILogger<StartupTasksHostedService> logger
) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        appLifetime.ApplicationStarted.Register(() =>
        {
            _ = Task.Run(async () =>
            {
                using IServiceScope scope = serviceProvider.CreateScope();

                List<string> failures = [];

                ValidateOptions(scope.ServiceProvider.GetRequiredService<IOptions<CacheTimeToLiveOptions>>(), failures);
                ValidateOptions(scope.ServiceProvider.GetRequiredService<IOptions<SessionLifetimeOptions>>(), failures);
                ValidateOptions(scope.ServiceProvider.GetRequiredService<IOptions<SuperAdminSeedOptions>>(), failures);
                ValidateOptions(scope.ServiceProvider.GetRequiredService<IOptions<DataEncryptionOptions>>(), failures);
                ValidateOptions(scope.ServiceProvider.GetRequiredService<IOptions<HashingOptions>>(), failures);

                if (failures.Count > 0)
                {
                    List<string> distinctFailures = [.. failures.Distinct()];

                    logger.LogError(
                        "Configuration validation failed with {FailureCount} error(s): {Failures}",
                        distinctFailures.Count,
                        distinctFailures
                    );

                    Environment.ExitCode = 1;
                    appLifetime.StopApplication();
                    return;
                }

                SuperAdminSeedOptions options = scope.ServiceProvider
                    .GetRequiredService<IOptions<SuperAdminSeedOptions>>()
                    .Value;

                IMediator mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                SeedSuperAdminCommand command = new(
                    options.FirstName,
                    options.MiddleName,
                    options.LastName,
                    options.UserName,
                    options.Email,
                    options.Password
                );

                await mediator.Send(command, cancellationToken);
            });
        });

        await Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static void ValidateOptions<T>(IOptions<T> options, List<string> failures) where T : class
    {
        try
        {
            _ = options.Value;
        }
        catch (OptionsValidationException ex)
        {
            failures.AddRange(ex.Failures);
        }
    }
}
