using EduTracker.Configurations.Security;
using EduTracker.Configurations.Settings;
using EduTracker.Data;
using EduTracker.Interfaces.Services;
using EduTracker.Services;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Extensions;

public static class AppConfigurationExtensions
{
    public static WebApplicationBuilder LoadApplicationConfiguration(this WebApplicationBuilder builder)
    {
        ConfigurationManager config = builder.Configuration;
        IServiceCollection services = builder.Services;

        // Configure Db Connection from appsettings
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(config.GetConnectionString("Database"));
        });

        // Configure Redis from appsettings
        services.Configure<RedisOptions>(
            config.GetSection("Redis")
        );

        // TODO: add redis service layer here with abstraction

        // Configure Hashing options from appsettings
        services.Configure<HashingOptions>(
            config.GetSection("Hashing")
        );

        services.AddSingleton<IHashingService, HashingService>();

        // Configure DataEncryption options from appsettings
        services.Configure<DataEncryptionOptions>(
            config.GetSection("DataEncryption")
        );

        services.AddSingleton<IDataEncryptionService, AesDataEncryptionService>();

        return builder;
    }
}
