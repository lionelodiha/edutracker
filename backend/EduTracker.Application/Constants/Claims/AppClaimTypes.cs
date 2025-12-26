using System.Security.Claims;

namespace EduTracker.Application.Constants.Claims;

public static class AppClaimTypes
{
    public const string UserId = ClaimTypes.NameIdentifier;
    public const string SessionStamp = "et:sessionstamp";
    public const string Role = ClaimTypes.Role;
}
