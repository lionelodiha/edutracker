namespace EduTracker.Services;

public class CookieService(IHttpContextAccessor httpContext)
{
    private readonly IHttpContextAccessor _httpContext = httpContext;

    public bool SetCookie(string key, string value, TimeSpan? expires = null, bool httpOnly = true, bool secure = true)
    {
        HttpContext? context = _httpContext.HttpContext;

        if (context is null) return false;

        CookieOptions options = new()
        {
            HttpOnly = httpOnly,
            Secure = secure,
            Expires = expires.HasValue ? DateTimeOffset.UtcNow.Add(expires.Value) : null,
            SameSite = SameSiteMode.Strict
        };

        context.Response.Cookies.Append(key, value, options);
        return true;
    }

    public string? GetCookie(string key)
    {
        HttpContext? context = _httpContext.HttpContext;

        if (context is null) return null;

        return context.Request.Cookies[key];
    }

    public bool DeleteCookie(string key)
    {
        HttpContext? context = _httpContext.HttpContext;

        if (context is null) return false;

        context.Response.Cookies.Delete(key);
        return true;
    }

    public string GetCookie(HttpRequest request, string name)
    {
        return request.Cookies.TryGetValue(name, out var value) ? value : null;
    }

    public void SetCookie(HttpResponse response, string name, string value, DateTimeOffset expiresUtc, bool httpOnly = true, bool secure = true, string path = "/", string domain = null)
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

    public void DeleteCookie(HttpResponse response, string name, string path = "/", string domain = null)
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
}
