using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Assessment : IEntity, IAuditableEntity
{
    internal readonly AuditableDataHandler Audit = new();

    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CohortId { get; private set; }
    public Guid SubjectId { get; private set; }

    public string Title { get; private set; } = null!;
    public decimal MaxScore { get; private set; }
    public DateTimeOffset Date { get; private set; }

    public CohortSubject CohortSubject { get; private set; } = null!;

    public DateTimeOffset CreatedAt => Audit.CreatedAt;
    public DateTimeOffset UpdatedAt => Audit.UpdatedAt;

    private Assessment() { }
    public Assessment(Guid cohortId, Guid subjectId, string title, decimal maxScore, DateTimeOffset date)
    {
        CohortId = cohortId;
        SubjectId = subjectId;
        Title = title;
        MaxScore = maxScore;
        Date = date;
    }

    public void UpdateAudit() => Audit.UpdateAudit();
}
