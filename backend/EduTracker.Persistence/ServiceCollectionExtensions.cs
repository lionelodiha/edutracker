using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Persistence;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
    {
        // The connection string is read when the first scope resolves, not at
        // registration time. Registration-time reads freeze the value before
        // later configuration sources (test overrides, reloads) are applied.
        services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            IConfiguration config = serviceProvider.GetRequiredService<IConfiguration>();

            var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(config.GetConnectionString("Database"));
#pragma warning disable CS0618 // ServerCompatibilityMode has no DataSource-builder equivalent yet; obsolete ≠ broken. Revisit on Npgsql major upgrades.
            dataSourceBuilder.ConnectionStringBuilder.ServerCompatibilityMode = Npgsql.ServerCompatibilityMode.NoTypeLoading;
#pragma warning restore CS0618
            dataSourceBuilder.ConnectionStringBuilder.Pooling = true;
            var dataSource = dataSourceBuilder.Build();

            options.UseNpgsql(dataSource)
                .EnableSensitiveDataLogging(false)
                .UseSnakeCaseNamingConvention();
        });

        return services;
    }
}
