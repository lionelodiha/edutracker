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
    public Task StartAsync(CancellationToken cancellationToken)
    {
        appLifetime.ApplicationStarted.Register(() =>
        {
            _ = Task.Run(() => RunStartupTasksAsync(cancellationToken));
        });

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task RunStartupTasksAsync(CancellationToken cancellationToken)
    {
        using IServiceScope scope = serviceProvider.CreateScope();

        if (!ValidateConfiguration(scope.ServiceProvider))
        {
            Environment.ExitCode = 1;
            appLifetime.StopApplication();
            return;
        }

        try
        {
            await SeedSuperAdminAsync(scope.ServiceProvider, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Super admin seeding failed. Shutting down application.");

            Environment.ExitCode = 1;
            appLifetime.StopApplication();
        }
    }

    private bool ValidateConfiguration(IServiceProvider services)
    {
        List<string> failures = [];

        ValidateOptions(services.GetRequiredService<IOptions<CacheTimeToLiveOptions>>(), failures);
        ValidateOptions(services.GetRequiredService<IOptions<SessionLifetimeOptions>>(), failures);
        ValidateOptions(services.GetRequiredService<IOptions<SuperAdminSeedOptions>>(), failures);
        ValidateOptions(services.GetRequiredService<IOptions<DataEncryptionOptions>>(), failures);
        ValidateOptions(services.GetRequiredService<IOptions<HashingOptions>>(), failures);

        if (failures.Count is 0)
            return true;

        List<string> distinctFailures = [.. failures.Distinct()];

        logger.LogError(
            "Configuration validation failed with {FailureCount} error(s): {Failures}",
            distinctFailures.Count,
            distinctFailures
        );

        return false;
    }

    private static async Task SeedSuperAdminAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        SuperAdminSeedOptions options = services
            .GetRequiredService<IOptions<SuperAdminSeedOptions>>()
            .Value;

        IMediator mediator = services.GetRequiredService<IMediator>();

        SeedSuperAdminCommand command = new(
            options.FirstName,
            options.MiddleName,
            options.LastName,
            options.UserName,
            options.Email,
            options.Password
        );

        await mediator.Send(command, cancellationToken);
    }

    private static void ValidateOptions<T>(IOptions<T> options, List<string> failures)
        where T : class
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
