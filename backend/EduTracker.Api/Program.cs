using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Api.Authentication;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Endpoints.Auth;
using EduTracker.Api.Endpoints.Base;
using EduTracker.Api.Endpoints.Organizations;
using EduTracker.Api.Endpoints.Sessions;
using EduTracker.Api.Endpoints.Users;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Cors;
using EduTracker.Api.Extensions.OpenApi;
using EduTracker.Api.Extensions.Seeders;
using EduTracker.Api.Middleware;
using EduTracker.Application;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCustomCors(builder.Configuration);

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

app.UseCustomCors();
await app.SeedSuperAdminAsync();

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

app.Run();
