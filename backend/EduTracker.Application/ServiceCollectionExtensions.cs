using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Configurations.Security;
using EduTracker.Application.Configurations.Seeders;
using EduTracker.Application.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace EduTracker.Application;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddApplicationServices()
        {
            services.AddOptions<CacheTimeToLiveOptions>()
                .BindConfiguration(nameof(CacheTimeToLiveOptions))
                .ValidateOnStart();

            services.AddSingleton<IValidateOptions<CacheTimeToLiveOptions>, CacheTimeToLiveOptionsValidator>();

            services.AddOptions<SessionLifetimeOptions>()
                .BindConfiguration(nameof(SessionLifetimeOptions))
                .ValidateOnStart();

            services.AddSingleton<IValidateOptions<SessionLifetimeOptions>, SessionLifetimeOptionsValidator>();
            services.AddScoped<SessionStateService>();

            services.AddOptions<SuperAdminSeedOptions>()
                .BindConfiguration(nameof(SuperAdminSeedOptions))
                .ValidateOnStart();

            services.AddScoped<UserAuthenticationStateService>();

            return services;
        }
    }
}
