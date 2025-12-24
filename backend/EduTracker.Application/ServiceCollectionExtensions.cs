using EduTracker.Application.Configurations.Security;
using EduTracker.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Application;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddApplicationServices(IConfiguration configuration)
        {
            services.Configure<SessionManagementOptions>(configuration.GetSection("SessionManagement"));
            services.AddScoped<SessionManagementService>();

            services.Configure<SessionTokenOptions>(configuration.GetSection("SessionToken"));
            services.AddSingleton<JwtService>();

            return services;
        }
    }
}
