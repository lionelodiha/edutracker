using EduTracker.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace EduTracker.Api.Authentication;

internal sealed class AuthenticationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(RequestDelegate next, HttpContext httpContext, AuthorizationPolicy policy, PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Succeeded)
        {
            await next(httpContext);
            return;
        }

        httpContext.Response.ContentType = "application/json";

        if (authorizeResult.Challenged)
        {
            await WriteErrorResponse(httpContext, StatusCodes.Status401Unauthorized, "AUTH_UNAUTHORIZED", "Authentication is required to access this resource.");
            return;
        }

        if (authorizeResult.Forbidden)
        {
            await WriteErrorResponse(httpContext, StatusCodes.Status403Forbidden, "AUTH_FORBIDDEN", "You do not have the necessary permissions to access this resource.");
            return;
        }

        // fallback to default handler if something unexpected happens
        await _defaultHandler.HandleAsync(next, httpContext, policy, authorizeResult);
    }

    private static Task WriteErrorResponse(HttpContext httpContext, int statusCode, string messageId, string message)
    {
        httpContext.Response.StatusCode = statusCode;

        ApiResponse<object> response = new(
            Success: false,
            MessageId: messageId,
            Message: message,
            Details: [],
            Data: null
        );

        return httpContext.Response.WriteAsJsonAsync(response);
    }
}
