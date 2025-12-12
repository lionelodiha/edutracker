using EduTracker.Common.Entities;
using EduTracker.Enums;
using EduTracker.Models;

namespace EduTracker.Entities;

public class UserSession : IEntity, IAuditableEntity, ISensitiveEntity<UserSessionSensitive>
{
    private readonly AuditableDataHandler _audit = new();
    private readonly SensitiveDataHandler<UserSessionSensitive> _sensitive = new();

    public static string Audit => nameof(_audit);
    public static string Sensitive => nameof(_sensitive);

    private UserSession() { }

    public UserSession(Guid userId, TimeSpan sessionDuration, DeviceType deviceType)
    {
        UserId = userId;
        DeviceType = deviceType;
        ExpiresAt = DateTimeOffset.UtcNow.Add(sessionDuration);
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public DateTimeOffset ExpiresAt { get; private set; }
    public bool Revoked { get; private set; }

    public DeviceType DeviceType { get; private set; }

    public DateTimeOffset CreatedAt => _audit.CreatedAt;
    public DateTimeOffset UpdatedAt => _audit.UpdatedAt;

    public byte[] EncryptedData => _sensitive.EncryptedData;
    public UserSessionSensitive? SensitiveData => _sensitive.SensitiveData;

    public void SetExpiry(DateTimeOffset expiresAt)
    {
        ExpiresAt = expiresAt;
        _audit.UpdateAudit();
    }

    public void Revoke()
    {
        Revoked = true;
        _audit.UpdateAudit();
    }

    public void SetSensitiveData(UserSessionSensitive data) => _sensitive.SetSensitiveData(data);
    public void SetEncryptedData(byte[] data) => _sensitive.SetEncryptedData(data, _audit);
    public void ClearDecryptedData() => _sensitive.ClearDecryptedData();
    public void ClearEncryptedData() => _sensitive.ClearEncryptedData();

    public void UpdateAudit() => _audit.UpdateAudit();
}
