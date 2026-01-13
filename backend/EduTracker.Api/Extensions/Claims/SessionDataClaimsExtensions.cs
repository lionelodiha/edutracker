using System.Security.Claims;
using EduTracker.Application.Models;
using EduTracker.Api.Constants.Auth;

namespace EduTracker.Api.Extensions.Claims;

internal static class SessionDataClaimsExtensions
{
    public static IEnumerable<Claim> ToClaims(this SessionData session)
    {
        yield return new Claim(ClaimTypes.NameIdentifier, session.UserId.ToString("N"));
        yield return new Claim(ClaimTypes.Role, session.Role.ToString());
        yield return new Claim(SessionClaimTypes.SessionId, session.SessionId.ToString("N"));
    }
}
