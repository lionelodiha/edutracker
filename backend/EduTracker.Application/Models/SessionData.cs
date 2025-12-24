using EduTracker.Domain.Enums;

namespace EduTracker.Application.Models;

public record SessionData(
    Guid SessionId,
    Guid UserId,
    DateTime ExpiresAt,
    DateTime AbsoluteExpiresAt,
    bool IsRevoked,
    bool RememberMe,
    SystemRole Role
)
{
    public bool IsActive => !IsRevoked
        && DateTime.UtcNow < ExpiresAt
        && DateTime.UtcNow < AbsoluteExpiresAt;
}
