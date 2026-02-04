using System.Security.Claims;
using EduTracker.Api.Constants.Auth;

namespace EduTracker.Api.Extensions.Claims;

internal static class ClaimsPrincipalExtensions
{
    extension(ClaimsPrincipal user)
    {
        public Guid? GetUserId()
        {
            string? rawUserId = user.FindFirstValue(ClaimTypes.NameIdentifier);

            return Guid.TryParse(rawUserId, out Guid userId)
                ? userId
                : null;
        }

        public IEnumerable<string> GetRoles()
        {
            return user
                .FindAll(ClaimTypes.Role)
                .Select(c => c.Value);
        }

        public bool IsInRole(string role)
            => user.IsInRole(role);

        public Guid? GetSessionId()
        {
            string? rawSessionId = user.FindFirstValue(SessionClaimTypes.SessionId);

            return Guid.TryParse(rawSessionId, out Guid sessionId)
                ? sessionId
                : null;
        }
    }
}
