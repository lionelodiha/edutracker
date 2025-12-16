using EduTracker.Application.Services;
using EduTracker.Infrastructure.Configurations.Security;
using EduTracker.Infrastructure.Configurations.Settings;
using EduTracker.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Infrastructure;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddInfrastructureServices(IConfiguration configuration)
        {
            // Configure DbContext
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlServer(configuration.GetConnectionString("Database"));
            });

            // Configure Redis
            services.Configure<RedisOptions>(configuration.GetSection("Redis"));
            services.AddSingleton<ICacheService, RedisCacheService>();

            // Configure Hashing
            services.Configure<HashingOptions>(configuration.GetSection("Hashing"));
            services.AddSingleton<IHashingService, HashingService>();

            // Configure Data Encryption
            services.Configure<DataEncryptionOptions>(configuration.GetSection("DataEncryption"));
            services.AddSingleton<IDataEncryptionService, AesDataEncryptionService>();

            return services;
        }
    }
}
