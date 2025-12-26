using System.Security.Claims;
using EduTracker.Application.Constants.Claims;

namespace EduTracker.Api.Extensions;

internal static class ClaimsPrincipalExtensions
{
    extension(ClaimsPrincipal user)
    {
        public Guid? GetUserId()
        {
            string? value = user.FindFirstValue(AppClaimTypes.UserId);
            return Guid.TryParse(value, out Guid id) ? id : null;
        }

        public string GetRole()
        {
            return user.FindFirstValue(AppClaimTypes.Role) ?? string.Empty;
            // return [.. user.FindAll(AppClaimTypes.Role).Select(c => c.Value)];
        }

        public Guid? GetSecurityStamp()
        {
            string? value = user.FindFirstValue(AppClaimTypes.SessionStamp);
            return Guid.TryParse(value, out Guid stamp) ? stamp : null;
        }

        public Dictionary<string, List<string>> GetAllClaims()
        {
            return user.Claims
                .GroupBy(c => c.Type)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(c => c.Value ?? string.Empty).ToList()
                );
        }

        public void LogClaims(string? prefix = null)
        {
            prefix ??= "[Claims]";

            foreach (Claim claim in user.Claims)
            {
                Console.WriteLine($"{prefix} {claim.Type}: {claim.Value}");
            }
        }
    }
}