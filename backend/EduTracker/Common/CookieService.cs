namespace EduTracker.Infrastructure.Services;

public class CookieService()
{
    // --- Core methods using explicit HttpResponse/HttpRequest ---
    public void SetCookie(
        HttpResponse response,
        string name,
        string value,
        DateTimeOffset? expiresUtc = null,
        bool httpOnly = true,
        bool secure = true,
        string path = "/",
        string? domain = null)
    {
        var options = new CookieOptions
        {
            HttpOnly = httpOnly,
            Secure = secure,
            SameSite = SameSiteMode.Strict,
            Expires = expiresUtc,
            Path = path
        };

        if (!string.IsNullOrWhiteSpace(domain))
            options.Domain = domain;

        response.Cookies.Append(name, value, options);
    }

    public string? GetCookie(HttpRequest request, string name)
    {
        return request.Cookies.TryGetValue(name, out var value) ? value : null;
    }

    public void DeleteCookie(HttpResponse response, string name, string path = "/", string? domain = null)
    {
        var options = new CookieOptions
        {
            Path = path,
            Expires = DateTimeOffset.UnixEpoch,
            SameSite = SameSiteMode.Strict
        };

        if (!string.IsNullOrWhiteSpace(domain))
            options.Domain = domain;

        response.Cookies.Delete(name, options);
    }

    // --- Convenience methods using IHttpContextAccessor ---
    public void SetCookie(string name, string value, TimeSpan? expires = null, bool httpOnly = true, bool secure = true)
    {
        var context = _httpContext?.HttpContext;
        if (context == null) return;

        SetCookie(
            context.Response,
            name,
            value,
            expires.HasValue ? DateTimeOffset.UtcNow.Add(expires.Value) : null,
            httpOnly,
            secure
        );
    }

    public string? GetCookie(string name)
    {
        var context = _httpContext?.HttpContext;
        if (context == null) return null;

        return GetCookie(context.Request, name);
    }

    public void DeleteCookie(string name)
    {
        var context = _httpContext?.HttpContext;
        if (context == null) return;

        DeleteCookie(context.Response, name);
    }
}
