using System.Reflection;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Services;
using EduTracker.Infrastructure.Configurations.Security;
using EduTracker.Infrastructure.Configurations.Settings;
using EduTracker.Infrastructure.CQRS.Messaging;
using EduTracker.Infrastructure.Services;
using FluentValidation;
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

            services.AddScoped(typeof(IHandler<,>), typeof(ValidationBehavior<,>));

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

    public static IServiceCollection AddCqrsV2(this IServiceCollection services, params Assembly[] assembliesToScan)
    {
        // Register mediator
        services.AddScoped<IMediator, Mediator>();

        foreach (var assembly in assembliesToScan)
        {
            // Register handlers
            var handlerTypes = assembly.GetTypes()
                .Where(t => !t.IsAbstract && !t.IsInterface)
                .SelectMany(t => t.GetInterfaces()
                    .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IHandler<,>))
                    .Select(i => new { Interface = i, Implementation = t }));

            foreach (var handler in handlerTypes)
            {
                var interfaceType = handler.Interface;
                var implType = handler.Implementation;

                // Register the concrete handler first
                services.AddScoped(implType);

                // Register a factory that wraps it in ValidationBehavior
                services.AddScoped(interfaceType, serviceProvider =>
                {
                    var concreteHandler = serviceProvider.GetRequiredService(implType);
                    var validatorType = typeof(IValidator<>).MakeGenericType(interfaceType.GenericTypeArguments[0]);
                    var validators = serviceProvider.GetServices(validatorType);

                    var behaviorType = typeof(ValidationBehavior<,>).MakeGenericType(interfaceType.GenericTypeArguments[0],
                                                                                   interfaceType.GenericTypeArguments[1]);

                    return Activator.CreateInstance(behaviorType, concreteHandler, validators);
                });
            }

            // Register validators
            var validatorTypes = assembly.GetTypes()
                .Where(t => !t.IsAbstract && !t.IsInterface)
                .Where(t => t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IValidator<>)));

            foreach (var validator in validatorTypes)
                services.AddScoped(validator);
        }

        return services;
    }

    public static IServiceCollection AddCqrsWithValidation(this IServiceCollection services, params Assembly[] assembliesToScan)
    {
        // Register mediator
        services.AddScoped<IMediator, Mediator>();

        foreach (var assembly in assembliesToScan)
        {
            // Register all IHandler<,>
            services.Scan(scan => scan
                .FromAssemblies(assembly)
                .AddClasses(classes => classes.AssignableTo(typeof(IHandler<,>)))
                .AsImplementedInterfaces()
                .WithScopedLifetime()
            );

            // Register all IValidator<>
            services.Scan(scan => scan
                .FromAssemblies(assembly)
                .AddClasses(classes => classes.AssignableTo(typeof(IValidator<>)))
                .AsImplementedInterfaces()
                .WithScopedLifetime()
            );
        }

        // Automatically wrap all IHandler<,> with ValidationBehavior
        services.Decorate(typeof(IHandler<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
