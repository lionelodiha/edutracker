using System.Reflection;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Services;
using EduTracker.Infrastructure.Configurations.Security;
using EduTracker.Infrastructure.Configurations.Settings;
using EduTracker.Infrastructure.CQRS.Messaging;
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
            services.Configure<RedisOptions>(configuration.GetSection("Redis"));
            services.AddSingleton<ICacheService, RedisCacheService>();

            services.Configure<HashingOptions>(configuration.GetSection("Hashing"));
            services.AddSingleton<IHashingService, HashingService>();

            services.Configure<DataEncryptionOptions>(configuration.GetSection("DataEncryption"));
            services.AddSingleton<IDataEncryptionService, AesDataEncryptionService>();

            return services;
        }
    }

    public static IServiceCollection AddCqrs(this IServiceCollection services, params Assembly[] assembliesToScan)
    {
        // Register the mediator itself
        services.AddScoped<IMediator, Mediator>();

        foreach (var assembly in assembliesToScan)
        {
            // Find all concrete types that implement IHandler<,>
            var handlerTypes = assembly.GetTypes()
                .Where(t => !t.IsAbstract && !t.IsInterface)
                .SelectMany(t => t.GetInterfaces()
                    .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IHandler<,>))
                    .Select(i => new { Interface = i, Implementation = t }));

            foreach (var handler in handlerTypes)
            {
                services.AddScoped(handler.Interface, handler.Implementation);
            }
        }

        return services;
    }
}
