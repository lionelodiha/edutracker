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
using EduTracker.Persistence.Context;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCustomCors(builder.Configuration);

builder.Services.AddPersistenceServices(builder.Configuration.GetConnectionString("Database"));
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
app.MapGet("/api/client-config", (HttpContext context) =>
{
    context.Response.Headers["Cache-Control"] = "no-store";
    return Results.Ok(new { demoMode = app.Configuration.GetValue<bool>("DemoMode:Enabled") });
});
app.MapGet("/health", async (AppDbContext db, CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new { status = "ok" })
        : Results.StatusCode(StatusCodes.Status503ServiceUnavailable));

// Serve the production frontend and API on one origin for first-party cookies.
if (app.Environment.WebRootFileProvider.GetFileInfo("index.html").Exists)
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallback("/api/{**path}", () => Results.NotFound());
    app.MapFallbackToFile("index.html");
}

app.Run();
