namespace EduTracker.Api.Helpers;

internal static class CookieHelper
{
    public static void SetCookie(HttpResponse response, string name, string value, DateTime? expiresUtc = null, bool httpOnly = true, bool secure = false, string path = "/", string? domain = null)
    {
        CookieOptions options = new()
        {
            HttpOnly = httpOnly,
            Secure = secure,
            SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
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
        CookieOptions options = new()
        {
            Path = path,
            Expires = DateTime.UnixEpoch,
            SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
            HttpOnly = httpOnly,
            Secure = secure,
        };

        if (!string.IsNullOrWhiteSpace(domain))
            options.Domain = domain;

        response.Cookies.Delete(name, options);
    }
}
