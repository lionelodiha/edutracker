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
}
