using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.Extensions;

internal static class SessionDataExtensions
{
    extension(SessionData sessionData)
    {
        public SessionTimestampsResponse ToTimestampsResponse() => new(
            sessionData.ExpiresAt,
            sessionData.AbsoluteExpiresAt
        );
    }
}
