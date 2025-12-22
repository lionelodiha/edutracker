using EduTracker.Application.Models;
using EduTracker.Domain.Entities.UserSessions;
using EduTracker.Domain.Enums;

namespace EduTracker.Application.Extensions.Entities;

public static class UserSessionExtensions
{
    extension(UserSession session)
    {
        public SessionData ToSessionData(SystemRole role)
            => new(
                session.Id,
                session.UserId,
                session.ExpiresAt,
                session.AbsoluteExpiresAt,
                session.IsRevoked,
                session.RememberMe,
                role
            );
    }
}
