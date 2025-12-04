namespace EduTracker.Common.Entities;

public class AuditableDataHandler
{
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public void UpdateAudit() => UpdatedAt = DateTimeOffset.UtcNow;
}
