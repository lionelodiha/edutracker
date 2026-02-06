using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Persistence;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddPersistenceServices(string? connectionString)
        {
            if (string.IsNullOrEmpty(connectionString))
                throw new ArgumentException("Connection string cannot be null or empty", nameof(connectionString));

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString)
                    .EnableSensitiveDataLogging(false)
            );

            return services;
        }
    }
}
