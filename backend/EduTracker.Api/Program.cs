using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Api.Authentication;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Endpoints.Auth;
using EduTracker.Api.Endpoints.Base;
using EduTracker.Api.Endpoints.Organizations;
using EduTracker.Api.Endpoints.Sessions;
using EduTracker.Api.Endpoints.Subscriptions;
using EduTracker.Api.Endpoints.Users;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.OpenApi;
using EduTracker.Api.Middleware;
using EduTracker.Application;
using EduTracker.Application.Configurations.Seeders;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Seeders.SeedSuperAdmin;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000") // your frontend URL
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // if you need cookies/auth
    });
});

builder.Services.AddPersistenceServices(builder.Configuration.GetConnectionString("Database"));
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices([typeof(IMediator).Assembly]);

builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthentication(AuthenticationSchemes.Session)
    .AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(
        AuthenticationSchemes.Session,
        options => { options.ClaimsIssuer = "EduTracker"; }
    );

builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, AuthenticationResultHandler>();

builder.Services.AddAuthorizationBuilder().AddCustomPolicies();

builder.Services.Configure<JsonOptions>(opts =>
{
    JsonSerializerOptions serializer = opts.SerializerOptions;

    serializer.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    serializer.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    serializer.WriteIndented = true;
    serializer.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddOpenApi(options => { options.AddCustomOpenApiTransformer(); });

WebApplication app = builder.Build();

app.UseCors("AllowFrontend");

using (IServiceScope scope = app.Services.CreateScope())
{
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

    await mediator.Send(command, CancellationToken.None);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference(options =>
    {
        options.Title = "EduTracker API";
        options.DefaultHttpClient = new(ScalarTarget.Node, ScalarClient.Fetch);
    });
}
else
{
    app.UseHttpsRedirection();
}

app.UseMiddleware<TraceIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapBaseEndpoints();
app.MapAuthEndpoints();
app.MapSessionEndpoints();
app.MapUserEndpoints();
app.MapOrganizationEndpoints();
app.MapSubscriptionEndpoints();

app.Run();
