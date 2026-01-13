using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.UserSessions;
using EduTracker.Domain.Enums;

namespace EduTracker.Application.Extensions.Entities;

internal static class UserSessionExtensions
{
    extension(UserSession session)
    {
        public SessionData ToSessionData(SystemRole role, bool isLocked)
            => new(
                SessionId: session.Id,
                UserId: session.UserId,
                ExpiresAt: session.ExpiresAt,
                AbsoluteExpiresAt: session.AbsoluteExpiresAt,
                IsRevoked: session.IsRevoked,
                RememberMe: session.RememberMe,
                IsLocked: isLocked,
                Role: role
            );

        public SessionTimestampsResponse ToTimestampsResponse()
        {
            return new SessionTimestampsResponse(
                session.ExpiresAt,
                session.AbsoluteExpiresAt
            );
        }
    }
}
