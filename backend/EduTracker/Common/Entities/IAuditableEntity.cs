namespace EduTracker.Common.Entities;

public interface IAuditableEntity
{
    DateTimeOffset CreatedAt { get; }
    DateTimeOffset UpdatedAt { get; }

    void UpdateAudit();
}
