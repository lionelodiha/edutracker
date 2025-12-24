using System.Reflection;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Services;
using EduTracker.Infrastructure.Configurations.Security;
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
        public IServiceCollection AddInfrastructureServices(IConfiguration configuration, params Assembly[] assembliesToScan)
        {
            services.AddSingleton<ICacheService, RedisCacheService>();

            services.Configure<HashingOptions>(configuration.GetSection("Hashing"));
            services.AddSingleton<IHashingService, HashingService>();

            services.Configure<DataEncryptionOptions>(configuration.GetSection("DataEncryption"));
            services.AddSingleton<IDataEncryptionService, AesGcmDataEncryptionService>();

            services.AddCqrsWithValidation(assembliesToScan);

            return services;
        }

        private void AddCqrsWithValidation(Assembly[] assembliesToScan)
        {
            services.AddScoped<IMediator, Mediator>();

            foreach (Assembly assembly in assembliesToScan)
            {
                services.Scan(scan => scan
                    .FromAssemblies(assembly)
                    .AddClasses(classes => classes.AssignableTo(typeof(IHandler<,>)))
                    .AsImplementedInterfaces()
                    .WithScopedLifetime()
                );

                services.Scan(scan => scan
                    .FromAssemblies(assembly)
                    .AddClasses(classes => classes.AssignableTo(typeof(IValidator<>)))
                    .AsImplementedInterfaces()
                    .WithScopedLifetime()
                );
            }

            services.Decorate(typeof(IHandler<,>), typeof(ValidationDecorator<,>));
        }
    }
}
