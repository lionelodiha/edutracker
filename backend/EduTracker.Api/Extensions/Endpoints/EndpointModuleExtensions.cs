using EduTracker.Api.Endpoints;

namespace EduTracker.Api.Extensions.Endpoints;

internal static class EndpointModuleExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddEndpointModules()
        {
            services.Scan(scan => scan
                .FromAssemblyOf<IEndpointModule>()
                .AddClasses(classes => classes.AssignableTo<IEndpointModule>(), publicOnly: false)
                .AsImplementedInterfaces()
                .WithSingletonLifetime()
            );

            return services;
        }
    }

    extension(WebApplication app)
    {
        public WebApplication MapEndpointModules()
        {
            IEnumerable<IEndpointModule> modules = app.Services
                .GetRequiredService<IEnumerable<IEndpointModule>>()
                .OrderBy(m => m.GetType().Name, StringComparer.Ordinal);

            foreach (IEndpointModule module in modules)
                module.MapEndpoints(app);

            return app;
        }
    }
}
