using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Assessment : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Assessment() { }

    public Assessment(
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
        if (maxScore <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxScore), "Max score must be greater than zero.");

        if (dueAtUtc is not null && dueAtUtc.Value < assignedAtUtc)
            throw new ArgumentException("Due date cannot be earlier than assigned date.", nameof(dueAtUtc));

        OrganizationId = organizationId;
        ClassOfferingId = classOfferingId;
        GradingComponentId = gradingComponentId;
        SetTitle(title);
        MaxScore = maxScore;
        AssignedAtUtc = assignedAtUtc;
        DueAtUtc = dueAtUtc;
        IsPublished = isPublished;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid ClassOfferingId { get; private set; }
    public ClassOffering ClassOffering { get; private set; } = null!;

    public Guid GradingComponentId { get; private set; }
    public GradingComponent GradingComponent { get; private set; } = null!;

    public string Title { get; private set; } = string.Empty;
    public double MaxScore { get; private set; }
    public DateTime AssignedAtUtc { get; private set; }
    public DateTime? DueAtUtc { get; private set; }
    public bool IsPublished { get; private set; }

    public ICollection<Grade> Grades { get; private set; } = [];

    public void SetTitle(string newTitle)
    {
        if (string.IsNullOrWhiteSpace(newTitle))
            throw new ArgumentException("Assessment title is required.", nameof(newTitle));

        Title = newTitle.Trim();
        AuditState.UpdateAudit();
    }

    public void UpdateMaxScore(double maxScore)
    {
        if (maxScore <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxScore), "Max score must be greater than zero.");

        MaxScore = maxScore;
        AuditState.UpdateAudit();
    }

    public void UpdateDueDate(DateTime? dueAtUtc)
    {
        if (dueAtUtc is not null && dueAtUtc.Value < AssignedAtUtc)
            throw new ArgumentException("Due date cannot be earlier than assigned date.", nameof(dueAtUtc));

        DueAtUtc = dueAtUtc;
        AuditState.UpdateAudit();
    }

    public void Publish()
    {
        if (IsPublished) return;

        IsPublished = true;
        AuditState.UpdateAudit();
    }

    public void Unpublish()
    {
        if (!IsPublished) return;

        IsPublished = false;
        AuditState.UpdateAudit();
    }
}
