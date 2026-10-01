using EduTracker.Persistence.Context;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Testcontainers.PostgreSql;

namespace EduTracker.Api.IntegrationTests;

public sealed class EduTrackerAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder("postgres:16-alpine").Build();

    public async Task InitializeAsync()
    {
        await _db.StartAsync();

        // Apply migrations rather than EnsureCreated. EnsureCreated builds
        // the schema from the model and would skip raw HasFilter SQL, so the
        // tests would not exercise the real database.
        using IServiceScope scope = Services.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Database"] = _db.GetConnectionString(),
                // Empty string disables Redis; RedisCacheService then no-ops
                // and every read falls through to Postgres. No Redis container
                // needed for tests.
                ["ConnectionStrings:Redis"] = string.Empty,

                // Deterministic test keys. Real ones never touch the repo.
                ["DataEncryptionOptions:CurrentKeyVersion"] = "1",
                ["DataEncryptionOptions:Keys:1"] = TestKeys.DataKeyBase64,
                ["HashingOptions:EmailHmacKey"] = TestKeys.HmacKeyBase64,
                // BCrypt cost 4 keeps the suite fast; production uses 12.
                ["HashingOptions:PasswordWorkFactor"] = "4",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // The startup hosted service validates SuperAdminSeedOptions and
            // seeds a superadmin — a deploy concern, not a test prerequisite.
            // The checked-in placeholders would fail validation and stop the
            // host, so tests remove it and create their own users instead.
            // Matched by name: the type is internal to the API assembly.
            foreach (ServiceDescriptor descriptor in services
                .Where(d => d.ServiceType == typeof(IHostedService)
                    && d.ImplementationType?.Name == "StartupTasksHostedService")
                .ToList())
            {
                services.Remove(descriptor);
            }
        });
    }

    public new async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await base.DisposeAsync();
    }
}
