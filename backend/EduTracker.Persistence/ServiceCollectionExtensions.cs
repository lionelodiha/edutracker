using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Persistence;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPersistenceServices(this IServiceCollection services, string? connectionString)
    {
        var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
        // NoTypeLoading bypasses querying pg_type catalogs (e.g. for pgbouncer).
        // ServerCompatibilityMode is obsolete since Npgsql 9 — configure via the builder.
        dataSourceBuilder.ConfigureTypeLoading(x => x.EnableTypeLoading(false));
        dataSourceBuilder.ConnectionStringBuilder.Pooling = true;
        var dataSource = dataSourceBuilder.Build();

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(dataSource)
                .EnableSensitiveDataLogging(false)
                .UseSnakeCaseNamingConvention()
        );

        return services;
    }
}
