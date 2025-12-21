using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.UserSessions;

public class UserSession : IEntity, IAuditable
{
    private readonly AuditState _audit = new();

    public static string Audit => nameof(_audit);

    private UserSession() { }

    public UserSession(Guid userId, TimeSpan initialLifetime, TimeSpan absoluteLifetime)
    {
        DateTime now = DateTime.UtcNow;

        UserId = userId;
        ExpiresAt = now.Add(initialLifetime);
        AbsoluteExpiresAt = now.Add(absoluteLifetime);

        _audit.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public bool IsRevoked { get; private set; } = false;
    public DateTime? RevokedAt { get; private set; }

    public DateTime ExpiresAt { get; private set; }
    public DateTime AbsoluteExpiresAt { get; private set; }

    public DateTime CreatedAt => _audit.CreatedAt;
    public DateTime UpdatedAt => _audit.UpdatedAt;

    public bool IsActive => !IsRevoked
        && DateTime.UtcNow < ExpiresAt
        && DateTime.UtcNow < AbsoluteExpiresAt;

    public void ExtendSession(DateTime newExpiry)
    {
        if (newExpiry > AbsoluteExpiresAt)
            newExpiry = AbsoluteExpiresAt;

        if (newExpiry > ExpiresAt)
        {
            ExpiresAt = newExpiry;
            _audit.UpdateAudit();
        }
    }

    public void Revoke()
    {
        if (IsRevoked) return;

        IsRevoked = true;
        RevokedAt = DateTime.UtcNow;
        _audit.UpdateAudit();
    }
}
