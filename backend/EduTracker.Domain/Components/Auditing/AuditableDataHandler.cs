namespace EduTracker.Domain.Components.Auditing;

public class AuditState
{
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    public void UpdateAudit() => UpdatedAt = DateTime.UtcNow;
}
