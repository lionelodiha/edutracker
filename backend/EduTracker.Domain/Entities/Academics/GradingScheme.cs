using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class GradingScheme : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private GradingScheme() { }

    public GradingScheme(
        Guid organizationId,
        string name,
        bool isDefault = false,
        DateTime? activeFromUtc = null,
        DateTime? activeToUtc = null
    )
    {
        OrganizationId = organizationId;
        SetName(name);
        IsDefault = isDefault;
        ActiveFromUtc = activeFromUtc;
        ActiveToUtc = activeToUtc;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }
    public DateTime? ActiveFromUtc { get; private set; }
    public DateTime? ActiveToUtc { get; private set; }

    public ICollection<GradingComponent> Components { get; private set; } = [];
    public ICollection<ClassOffering> ClassOfferings { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Grading scheme name is required.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }

    public void SetDefault(bool isDefault)
    {
        if (IsDefault == isDefault) return;

        IsDefault = isDefault;
        AuditState.UpdateAudit();
    }

    public void UpdateActiveRange(DateTime? activeFromUtc, DateTime? activeToUtc)
    {
        if (activeFromUtc is not null && activeToUtc is not null && activeToUtc <= activeFromUtc)
            throw new ArgumentException("Active range end must be later than start.", nameof(activeToUtc));

        ActiveFromUtc = activeFromUtc;
        ActiveToUtc = activeToUtc;
        AuditState.UpdateAudit();
    }

    public decimal GetTotalWeightPercent() => Components.Sum(component => component.WeightPercent);

    public bool HasValidTotalWeight() => GetTotalWeightPercent() == 100m;
}
