using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Student : IEntity, IAuditableEntity
{
    internal readonly AuditableDataHandler Audit = new();

    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public Guid SchoolId { get; private set; }

    public string? MatricNo { get; private set; }
    public string Status { get; private set; } = "active";

    // Navigation
    public User User { get; private set; } = null!;
    public School School { get; private set; } = null!;

    public ICollection<Cohort> Cohorts { get; private set; } = new List<Cohort>();

    public DateTimeOffset CreatedAt => Audit.CreatedAt;
    public DateTimeOffset UpdatedAt => Audit.UpdatedAt;

    private Student() { }
    public Student(Guid userId, Guid schoolId)
    {
        UserId = userId;
        SchoolId = schoolId;
    }

    public void UpdateAudit() => Audit.UpdateAudit();
}
