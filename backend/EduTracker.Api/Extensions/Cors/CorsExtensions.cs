namespace EduTracker.Api.Extensions.Cors;

internal static class CorsExtensions
{
    private const string AllowFrontendPolicyName = "AllowFrontend";

    extension(IServiceCollection services)
    {
        public IServiceCollection AddCustomCors(IConfiguration configuration)
        {
            string[] allowedCorsOrigins = configuration
                .GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

            services.AddCors(options =>
            {
                options.AddPolicy(AllowFrontendPolicyName, policy =>
                {
                    policy
                        .WithOrigins(allowedCorsOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            return services;
        }
    }

    extension(WebApplication app)
    {
        public WebApplication UseCustomCors()
        {
            app.UseCors(AllowFrontendPolicyName);
            return app;
        }
    }
}
