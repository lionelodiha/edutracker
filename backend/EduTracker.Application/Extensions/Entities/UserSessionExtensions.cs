using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.UserSessions;

namespace EduTracker.Application.Extensions.Entities;

internal static class UserSessionExtensions
{
    extension(UserSession session)
    {
        public SessionData ToSessionData() => new(
            SessionId: session.Id,
            UserId: session.UserId,
            CreatedAt: session.CreatedAt,
            ExpiresAt: session.ExpiresAt,
            AbsoluteExpiresAt: session.AbsoluteExpiresAt,
            IsRevoked: session.IsRevoked,
            RememberMe: session.RememberMe
        );

        public SessionTimestampsResponse ToTimestampsResponse() => new(
            session.ExpiresAt,
            session.AbsoluteExpiresAt
        );
    }
}
