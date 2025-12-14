using EduTracker.Data;
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
