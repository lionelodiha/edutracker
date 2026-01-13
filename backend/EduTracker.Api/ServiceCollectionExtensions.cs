using EduTracker.Api.Services;

namespace EduTracker.Api;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddApiServices()
        {
            services.AddSingleton<CookieService>();

            return services;
        }
    }
}
