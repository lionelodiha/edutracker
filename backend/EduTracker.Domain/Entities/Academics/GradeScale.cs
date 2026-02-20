using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class GradeScale : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private GradeScale() { }

    public GradeScale(Guid organizationId, string name)
    {
        OrganizationId = organizationId;
        SetName(name);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;

    public ICollection<GradeScaleItem> Items { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Grade scale name is required.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }
}
