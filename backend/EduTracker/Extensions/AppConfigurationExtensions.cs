using EduTracker.Configurations.Security;
using EduTracker.Data;
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
            options.UseSqlite("Data Source=app.db");
        });

        // Configure Hashing options from appsettings
        services.Configure<HashingOptions>(
            config.GetSection("Hashing")
        );

        // Configure DataEncryption options from appsettings
        builder.Services.Configure<DataEncryptionOptions>(
            builder.Configuration.GetSection("DataEncryption")
        );

        return builder;
    }
}
