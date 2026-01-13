using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Api;
using EduTracker.Api.Authentication;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Endpoints.Auth;
using EduTracker.Api.Endpoints.Base;
using EduTracker.Api.Endpoints.Users;
using EduTracker.Api.Extensions.OpenApi;
using EduTracker.Api.Middleware;
using EduTracker.Application;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Domain.Enums;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Json;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration, [typeof(IMediator).Assembly]);
builder.Services.AddApiServices();

builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthentication(AuthenticationSchemes.Session)
    .AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(
        AuthenticationSchemes.Session,
        options => { options.ClaimsIssuer = "EduTracker"; }
    );

builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, AuthenticationResultHandler>();

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("UserOnly", p => p.RequireRole(SystemRole.User.ToString()))
    .AddPolicy("AdminOnly", p => p.RequireRole(SystemRole.Admin.ToString(), SystemRole.SuperAdmin.ToString()))
    .AddPolicy("SuperAdminOnly", p => p.RequireRole(SystemRole.SuperAdmin.ToString()));

builder.Services.Configure<JsonOptions>(opts =>
{
    JsonSerializerOptions serializer = opts.SerializerOptions;

    serializer.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    serializer.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    serializer.WriteIndented = true;
    serializer.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddOpenApi(options =>
{
    options.AddCustomOpenApiTransformer();
});

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference(options =>
    {
        options.Title = "EduTracker API Gateway";
        options.DefaultHttpClient = new(ScalarTarget.Node, ScalarClient.Fetch);
    });
}
else
{
    app.UseHttpsRedirection();
}

app.UseMiddleware<TraceIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SessionRefreshMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapBaseEndpoints();
app.MapAuthEndpoints();
app.MapUserEndpoints();

app.Run();
