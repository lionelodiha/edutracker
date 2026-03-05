using EduTracker.Application.Configurations.Seeders;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Seeders.SeedSuperAdmin;
using Microsoft.Extensions.Options;

namespace EduTracker.Api.Extensions.Seeders;

internal static class WebApplicationSeederExtensions
{
    extension(WebApplication app)
    {
        public async Task SeedSuperAdminAsync(CancellationToken cancellationToken = default)
        {
            using IServiceScope scope = app.Services.CreateScope();

            SuperAdminSeedOptions options = scope.ServiceProvider
                .GetRequiredService<IOptions<SuperAdminSeedOptions>>()
                .Value;

            IMediator mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

            SeedSuperAdminCommand command = new(
                options.FirstName,
                options.MiddleName,
                options.LastName,
                options.UserName,
                options.Email,
                options.Password
            );

            await mediator.Send(command, cancellationToken);
        }
    }
}
