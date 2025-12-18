using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.UserSessions;

public class UserSession : IEntity, IAuditable
{
    private readonly AuditState _audit = new();

    public static string Audit => nameof(_audit);

    private UserSession() { }

    public UserSession(Guid userId, TimeSpan sessionDuration)
    {
        UserId = userId;
        ExpiresAt = DateTimeOffset.UtcNow.Add(sessionDuration);
        LastActiveAt = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public bool IsRevoked { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset LastActiveAt { get; private set; }

    public DateTimeOffset CreatedAt => _audit.CreatedAt;
    public DateTimeOffset UpdatedAt => _audit.UpdatedAt;

    public bool IsActive => !IsRevoked && ExpiresAt > DateTimeOffset.UtcNow;

    public void RefreshActivity()
    {
        LastActiveAt = DateTimeOffset.UtcNow;
        _audit.UpdateAudit();
    }

    public void ExtendSession(TimeSpan duration)
    {
        ExpiresAt = ExpiresAt.Add(duration);
        _audit.UpdateAudit();
    }

    public void Revoke()
    {
        IsRevoked = true;
        _audit.UpdateAudit();
    }

    public void UpdateAudit() => _audit.UpdateAudit();
}
