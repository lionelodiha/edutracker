namespace EduTracker.Api.Helpers;

internal static class CookieHelper
{
    public static void SetCookie(HttpResponse response, string name, string value, DateTime? expiresUtc = null, bool httpOnly = true, bool secure = false, string path = "/", string? domain = null)
    {
        // The production frontend and API share an origin. Keep the session
        // first-party and require HTTPS even when TLS ends at Render's proxy.
        bool isSecure = secure || response.HttpContext.Request.IsHttps || !response.HttpContext.RequestServices
            .GetRequiredService<IHostEnvironment>().IsDevelopment();
        CookieOptions options = new()
        {
            HttpOnly = httpOnly,
            Secure = isSecure,
            SameSite = SameSiteMode.Lax,
            Expires = expiresUtc,
            Path = path,
        };

        if (!string.IsNullOrWhiteSpace(domain))
            options.Domain = domain;

        response.Cookies.Append(name, value, options);
    }

    public static string? GetCookie(HttpRequest request, string name)
        => request.Cookies.TryGetValue(name, out string? value) ? value : null;

    public static void DeleteCookie(HttpResponse response, string name, bool httpOnly = true, bool secure = false, string path = "/", string? domain = null)
    {
        bool isSecure = secure || response.HttpContext.Request.IsHttps || !response.HttpContext.RequestServices
            .GetRequiredService<IHostEnvironment>().IsDevelopment();
        CookieOptions options = new()
        {
            Path = path,
            Expires = DateTime.UnixEpoch,
            SameSite = SameSiteMode.Lax,
            HttpOnly = httpOnly,
            Secure = isSecure,
        };

        if (!string.IsNullOrWhiteSpace(domain))
            options.Domain = domain;

        response.Cookies.Delete(name, options);
    }
}
