using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Api.Authentication;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Cors;
using EduTracker.Api.Extensions.Endpoints;
using EduTracker.Api.Extensions.OpenApi;
using EduTracker.Api.Hosting;
using EduTracker.Api.Middleware;
using EduTracker.Application;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http.Json;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCustomCors(builder.Configuration);

builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices([typeof(IMediator).Assembly]);

builder.Services.AddHttpContextAccessor();
builder.Services.AddEndpointModules();

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

// Stage 06 pull-forward (needed by Part 2): health endpoints for container
// healthchecks and rolling deploys. Liveness checks nothing external;
// readiness gates on Postgres (+ Redis when configured).
IHealthChecksBuilder healthChecks = builder.Services.AddHealthChecks();

string? databaseConnectionString = builder.Configuration.GetConnectionString("Database");
if (!string.IsNullOrWhiteSpace(databaseConnectionString))
{
    healthChecks.AddNpgSql(databaseConnectionString, name: "postgres", tags: ["ready"]);
}

string? redisConnectionString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    // Redis is cache-only (RedisCacheService no-ops when unreachable), so a
    // Redis outage must not take the instance out of rotation. Tag it
    // separately from "ready" so /health/ready stays green without it.
    healthChecks.AddRedis(redisConnectionString, name: "redis", tags: ["cache"]);
}

builder.Services.AddHostedService<StartupTasksHostedService>();

WebApplication app = builder.Build();

app.UseCustomCors();

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

app.MapEndpointModules();

// Liveness: is this process wedged? Checks NOTHING external, so a Postgres
// hiccup never causes the orchestrator to kill every replica at once.
// Readiness: can this instance serve a real request right now?
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
});

app.Run();

// Top-level statements compile into an internal Program class, which a test
// project cannot reach. WebApplicationFactory<Program> needs it public.
// One line, and it is the reason integration tests are possible at all.
public partial class Program { }
