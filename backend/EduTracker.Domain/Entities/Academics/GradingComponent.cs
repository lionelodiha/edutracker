using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class GradingComponent : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private GradingComponent() { }

    public GradingComponent(
        Guid organizationId,
        Guid gradingSchemeId,
        string name,
        int order,
        decimal weightPercent,
        double maxScore
    )
    {
        if (order <= 0)
            throw new ArgumentOutOfRangeException(nameof(order), "Component order must be greater than zero.");

        if (weightPercent < 0 || weightPercent > 100)
            throw new ArgumentOutOfRangeException(nameof(weightPercent), "Weight percent must be between 0 and 100.");

        if (maxScore <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxScore), "Max score must be greater than zero.");

        OrganizationId = organizationId;
        GradingSchemeId = gradingSchemeId;
        SetName(name);
        Order = order;
        WeightPercent = weightPercent;
        MaxScore = maxScore;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid GradingSchemeId { get; private set; }
    public GradingScheme GradingScheme { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public int Order { get; private set; }
    public decimal WeightPercent { get; private set; }
    public double MaxScore { get; private set; }

    public ICollection<Assessment> Assessments { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Component name is required.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }

    public void UpdateWeight(decimal weightPercent)
    {
        if (weightPercent < 0 || weightPercent > 100)
            throw new ArgumentOutOfRangeException(nameof(weightPercent), "Weight percent must be between 0 and 100.");

        WeightPercent = weightPercent;
        AuditState.UpdateAudit();
    }

    public void UpdateMaxScore(double maxScore)
    {
        if (maxScore <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxScore), "Max score must be greater than zero.");

        MaxScore = maxScore;
        AuditState.UpdateAudit();
    }
}
