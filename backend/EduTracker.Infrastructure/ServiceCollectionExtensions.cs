using System.Reflection;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Services;
using EduTracker.Infrastructure.CQRS.Messaging;
using EduTracker.Infrastructure.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using EduTracker.Infrastructure.CQRS.Decorators;
using EduTracker.Application.CQRS.Decorators;
using Microsoft.Extensions.Options;
using EduTracker.Infrastructure.Configurations.Security.Hashing;
using EduTracker.Infrastructure.Configurations.Security.DataEncryption;

namespace EduTracker.Infrastructure;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddInfrastructureServices(params Assembly[] assembliesToScan)
        {
            services.AddOptions<DataEncryptionOptions>()
                .BindConfiguration(nameof(DataEncryptionOptions))
                .ValidateOnStart();

            services.AddSingleton<IValidateOptions<DataEncryptionOptions>, DataEncryptionOptionsValidator>();
            services.AddSingleton<IDataEncryptionService, AesGcmDataEncryptionService>();

            services.AddOptions<HashingOptions>()
                .BindConfiguration(nameof(HashingOptions))
                .ValidateOnStart();

            services.AddSingleton<IValidateOptions<HashingOptions>, HashingOptionsValidator>();
            services.AddSingleton<IHashingService, HashingService>();
            services.AddScoped<IPaymentService, FakePaymentService>();

            services.AddSingleton<ICacheService, RedisCacheService>();
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
                    .AddClasses(classes => classes.AssignableTo(typeof(IHandler<,>)), publicOnly: false)
                    .AsImplementedInterfaces()
                    .WithScopedLifetime()
                );

                services.Scan(scan => scan
                    .FromAssemblies(assembly)
                    .AddClasses(classes => classes.AssignableTo(typeof(IValidator<>)), publicOnly: false)
                    .AsImplementedInterfaces()
                    .WithScopedLifetime()
                );
            }

            services.AddScoped(typeof(IPipelineBehavior<,>), typeof(RetryBehavior<,>));
            services.AddScoped(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        }
    }
}
