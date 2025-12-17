using EduTracker.Application.Features.Auth.Register;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EduTracker.Application;

public static class ServiceCollectionExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddApplicationServices(IConfiguration configuration)
        {
            services.AddValidatorsFromAssemblyContaining<RegisterUserCommandValidator>();
            return services;
        }
    }
}
