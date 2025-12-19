using EduTracker.Domain.Enums;

namespace EduTracker.Application.Models;

public record SessionData
(
    Guid SessionId,
    Guid UserId,
    DateTime ExpiresAt,
    bool IsRevoked,
    SystemRole Role
)
{
    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}
