using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using EduTracker.Application.Configurations.Security;
using EduTracker.Application.Exceptions;
using EduTracker.Application.Services;
using Microsoft.AspNetCore.Authorization;

namespace EduTracker.Api.Extensions.Security;

public static class AuthenticationExtensions
{
    extension(IServiceCollection services)
    {
        public IServiceCollection AddJwtAuthentication(IConfiguration configuration)
        {
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    var tokenOptions = configuration.GetSection("SessionToken")
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
                            var endpoint = context.HttpContext.GetEndpoint();
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

                            var sessionManager = context.HttpContext.RequestServices
                                .GetRequiredService<SessionManagementService>();

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
                });

            services.AddAuthorization();
            return services;
        }
    }
}
