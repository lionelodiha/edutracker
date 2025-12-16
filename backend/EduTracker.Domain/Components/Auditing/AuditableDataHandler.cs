namespace EduTracker.Domain.Components.Auditing;

public class AuditState
{
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public void UpdateAudit() => UpdatedAt = DateTimeOffset.UtcNow;
}
