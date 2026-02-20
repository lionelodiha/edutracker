using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Assignment : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Assignment() { }

    public Assignment(Guid classId, string title, double maxScore, DateTime? dueDate)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Assignment title is required.", nameof(title));

        if (maxScore <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxScore), "Max score must be greater than zero.");

        ClassId = classId;
        Title = title.Trim();
        MaxScore = maxScore;
        DueDate = dueDate;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid ClassId { get; private set; }
    public Class Class { get; private set; } = null!;

    public string Title { get; private set; } = string.Empty;
    public double MaxScore { get; private set; }
    public DateTime? DueDate { get; private set; }

    public ICollection<Grade> Grades { get; private set; } = [];
}
