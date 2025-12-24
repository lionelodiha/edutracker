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
                SessionId: session.Id,
                UserId: session.UserId,
                SessionStamp: session.SessionStamp,
                ExpiresAt: session.ExpiresAt,
                AbsoluteExpiresAt: session.AbsoluteExpiresAt,
                IsRevoked: session.IsRevoked,
                RememberMe: session.RememberMe,
                Role: role
            );
    }
}
