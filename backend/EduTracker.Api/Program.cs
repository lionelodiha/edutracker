using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Api.Endpoints;
using EduTracker.Api.Extensions;
using EduTracker.Api.Middleware;
using EduTracker.Api.Services;
using EduTracker.Application;
using EduTracker.Application.Configurations.Security;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Exceptions;
using EduTracker.Application.Services;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration, [typeof(IHandler<,>).Assembly]);

builder.Services.AddScoped<CookieService>();

builder.Services.AddOpenApi();

builder.Services.Configure<JsonOptions>(opts =>
{
    opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    opts.SerializerOptions.WriteIndented = true;
    opts.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var tokenOptions = builder.Configuration
            .GetSection("SessionToken")
            .Get<SessionTokenOptions>()!;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenOptions.SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = tokenOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = tokenOptions.Audience,
            ValidateLifetime = true
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Endpoint? endpoint = context.HttpContext.GetEndpoint();
                bool hasAuthorize = endpoint?.Metadata?.GetMetadata<IAuthorizeData>() is not null;

                if (hasAuthorize)
                    throw new AppException("UNAUTHORIZED", 401, "You are not authorized.");

                context.NoResult();
                return Task.CompletedTask;
            },

            OnTokenValidated = async context =>
            {
                if (context.Principal is null)
                    throw new AppException("UNAUTHORIZED", 401, "You are not authorized.");

                Guid? userId = context.Principal.GetUserId();
                Guid? securityStamp = context.Principal.GetSecurityStamp();

                if (userId is null || securityStamp is null)
                    throw new AppException("UNAUTHORIZED", 401, "You are not authorized.");

                var sessionManager = context.HttpContext.RequestServices.GetRequiredService<SessionManagementService>();

                var sessionData = await sessionManager.GetSessionDataAsync(userId.Value)
                    ?? throw new AppException("UNAUTHORIZED", 401, "You are not authorized.");

                string userRoles = sessionData.Role.ToString();

                if (userRoles == context.Principal.GetRole())
                    throw new AppException("UNAUTHORIZED", 401, "You are not authorized.");

                if (sessionData.SessionStamp != securityStamp)
                    throw new AppException("UNAUTHORIZED", 401, "You are not authorized.");
            },

            OnForbidden = context =>
            {
                throw new AppException("FORBIDDEN", 403, "You do not have permission to access this resource.");
            }
        };
    }
);

builder.Services.AddAuthorization();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseMiddleware<JwtFromCookieMiddleware>();
app.UseMiddleware<TraceIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();

app.Run();
