using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Course : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Course() { }

    public Course(Guid organizationId, string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Course name is required.", nameof(name));

        OrganizationId = organizationId;
        Name = name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    public ICollection<Class> Classes { get; private set; } = [];

    public void UpdateDetails(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Course name is required.", nameof(name));

        Name = name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        AuditState.UpdateAudit();
    }
}
