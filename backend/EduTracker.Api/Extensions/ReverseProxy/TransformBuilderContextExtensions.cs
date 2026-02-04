using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Helpers;
using EduTracker.Api.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Yarp.ReverseProxy.Transforms;
using Yarp.ReverseProxy.Transforms.Builder;

namespace EduTracker.Api.Extensions.ReverseProxy;

internal static class TransformBuilderContextExtensions
{
    private const string InternalSessionHeader = "X-Internal-Session";

    extension(TransformBuilderContext builderContext)
    {
        public TransformBuilderContext AddInternalSessionAuth()
        {
            builderContext.AddRequestTransform(async context =>
            {
                context.ProxyRequest.Headers.Remove(InternalSessionHeader);
                HttpContext httpContext = context.HttpContext;

                string? rawSessionId = CookieHelper.GetCookie(httpContext.Request, CookieKeys.Session);

                if (!Guid.TryParse(rawSessionId, out Guid sessionId))
                    return;

                var sessionService = httpContext.RequestServices
                    .GetRequiredService<SessionStateService>();

                SessionData? sessionData = await sessionService.GetSessionDataAsync(sessionId, httpContext.RequestAborted);

                if (sessionData is null || sessionData.IsExpired())
                    return;

                var userAuthService = httpContext.RequestServices
                    .GetRequiredService<UserAuthenticationStateService>();

                UserAuthData? authData = await userAuthService.GetUserAuthDataAsync(sessionData.UserId, httpContext.RequestAborted);

                if (authData is null || authData.IsLocked)
                    return;

                JsonSerializerOptions jsonOptions = httpContext.RequestServices
                    .GetRequiredService<IOptions<JsonOptions>>()
                    .Value.SerializerOptions;

                InternalSessionData sessionDto = new(authData.UserId, authData.Role);

                string json = JsonSerializer.Serialize(sessionDto, jsonOptions);
                byte[] payloadBytes = Encoding.UTF8.GetBytes(json);

                string payload = WebEncoders.Base64UrlEncode(payloadBytes);

                string privateKeyPem = httpContext.RequestServices
                    .GetRequiredService<IConfiguration>()["DownstreamSessionSigningKey"]
                    ?? throw new InvalidOperationException("DownstreamSessionSigningKey is missing in the config.");

                using RSA rsa = RSA.Create();
                rsa.ImportFromPem(privateKeyPem);

                byte[] signatureBytes = rsa.SignData(
                    payloadBytes,
                    HashAlgorithmName.SHA256,
                    RSASignaturePadding.Pkcs1
                );

                string signature = WebEncoders.Base64UrlEncode(signatureBytes);

                context.ProxyRequest.Headers.Add(InternalSessionHeader, $"{payload}.{signature}");
            });

            return builderContext;
        }

        public TransformBuilderContext AddInternalTraceId()
        {
            builderContext.AddRequestTransform(context =>
            {
                string traceId = context.HttpContext.TraceIdentifier;

                context.ProxyRequest.Headers.Remove("X-Trace-Id");
                context.ProxyRequest.Headers.Add("X-Trace-Id", traceId);

                return ValueTask.CompletedTask;
            });

            return builderContext;
        }
    }
}
