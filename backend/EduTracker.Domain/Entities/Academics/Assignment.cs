using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

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

        OrganizationId = Guid.Empty;
        ClassId = classId;
        ClassOfferingId = null;
        GradingComponentId = null;
        Title = title.Trim();
        MaxScore = maxScore;
        AssignedAtUtc = DateTime.UtcNow;
        DueDate = dueDate;
        DueAtUtc = dueDate;

        AuditState.UpdateAudit();
    }

    public Assignment(
        Guid organizationId,
        Guid classOfferingId,
        Guid gradingComponentId,
        string title,
        double maxScore,
        DateTime assignedAtUtc,
        DateTime? dueAtUtc = null,
        bool isPublished = false
    )
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Assignment title is required.", nameof(title));

        if (maxScore <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxScore), "Max score must be greater than zero.");

        if (dueAtUtc is not null && dueAtUtc.Value < assignedAtUtc)
            throw new ArgumentException("Due date cannot be earlier than assigned date.", nameof(dueAtUtc));

        OrganizationId = organizationId;
        ClassId = Guid.Empty;
        ClassOfferingId = classOfferingId;
        GradingComponentId = gradingComponentId;
        Title = title.Trim();
        MaxScore = maxScore;
        AssignedAtUtc = assignedAtUtc;
        DueDate = dueAtUtc;
        DueAtUtc = dueAtUtc;
        IsPublished = isPublished;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid ClassId { get; private set; }
    public Class Class { get; private set; } = null!;

    public Guid? ClassOfferingId { get; private set; }
    public ClassOffering? ClassOffering { get; private set; }

    public Guid? GradingComponentId { get; private set; }
    public GradingComponent? GradingComponent { get; private set; }

    public string Title { get; private set; } = string.Empty;
    public double MaxScore { get; private set; }
    public DateTime AssignedAtUtc { get; private set; }
    public DateTime? DueDate { get; private set; }
    public DateTime? DueAtUtc { get; private set; }
    public bool IsPublished { get; private set; }

    public ICollection<Grade> Grades { get; private set; } = [];

    public void UpdateDueDate(DateTime? dueAtUtc)
    {
        if (dueAtUtc is not null && dueAtUtc.Value < AssignedAtUtc)
            throw new ArgumentException("Due date cannot be earlier than assigned date.", nameof(dueAtUtc));

        DueAtUtc = dueAtUtc;
        DueDate = dueAtUtc;
        AuditState.UpdateAudit();
    }

    public void Publish()
    {
        if (IsPublished) return;

        IsPublished = true;
        AuditState.UpdateAudit();
    }
}
