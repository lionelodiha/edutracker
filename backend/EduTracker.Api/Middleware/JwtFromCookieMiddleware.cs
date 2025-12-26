using EduTracker.Api.Constants.Cookies;

namespace EduTracker.Api.Middleware;

public class JwtFromCookieMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        // Only set the header if it's missing
        if (string.IsNullOrEmpty(context.Request.Headers.Authorization))
        {
            var token = context.Request.Cookies[CookieKeys.AccessToken]; // Use your CookieKeys.AccessToken
            if (!string.IsNullOrEmpty(token))
            {
                context.Request.Headers.Authorization = $"Bearer {token}";
            }
        }

        await _next(context);
    }
}