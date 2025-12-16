using Microsoft.EntityFrameworkCore;

namespace EduTracker.Middleware;

public class SessionAuthenticationMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (!context.Request.Cookies.TryGetValue("edutracker_session", out var sessionIdRaw) ||
            !Guid.TryParse(sessionIdRaw, out var sessionId))
        {
            await _next(context);
            return;
        }

        var session = await db.UserSessions
            .Include(s => s.User)
            .SingleOrDefaultAsync(s =>
                s.Id == sessionId &&
                !s.IsRevoked &&
                s.ExpiresAt > DateTimeOffset.UtcNow);

        if (session is null)
        {
            await _next(context);
            return;
        }

        context.Items["User"] = session.User;
        context.Items["Session"] = session;

        await _next(context);
    }
}

public class SessionAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ICookieService _cookies;
    private readonly ISessionService _sessions;

    private const string SessionCookieName = "sid";

    public SessionAuthMiddleware(RequestDelegate next, ICookieService cookies, ISessionService sessions)
    {
        _next = next;
        _cookies = cookies;
        _sessions = sessions;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sid = _cookies.GetCookie(context.Request, SessionCookieName);
        if (!string.IsNullOrWhiteSpace(sid) && Guid.TryParse(sid, out var sessionId))
        {
            var session = await _sessions.ValidateAsync(sessionId);
            if (session != null)
            {
                // Build ClaimsPrincipal from session data
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, session.UserId.ToString()),
                    new Claim("sid", session.SessionId.ToString())
                };

                var roleClaims = session.Roles ?? Array.Empty<string>();
                var identity = new ClaimsIdentity(claims, authenticationType: "Session");
                foreach (var role in roleClaims)
                    identity.AddClaim(new Claim(ClaimTypes.Role, role));

                context.User = new ClaimsPrincipal(identity);
            }
        }

        await _next(context);
    }
}
