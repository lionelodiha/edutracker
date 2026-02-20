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
        Title = Name;
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Active = true;

        AuditState.UpdateAudit();
    }

    public Course(Guid organizationId, string code, string title, string? description, bool active = true)
    {
        OrganizationId = organizationId;
        SetCode(code);
        SetTitle(title);
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Active = active;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public string? Code { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool Active { get; private set; } = true;

    public ICollection<Class> Classes { get; private set; } = [];
    public ICollection<ClassOffering> ClassOfferings { get; private set; } = [];

    public void UpdateDetails(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Course name is required.", nameof(name));

        Name = name.Trim();
        Title = Name;
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        AuditState.UpdateAudit();
    }

    public void SetCode(string? code)
    {
        Code = string.IsNullOrWhiteSpace(code) ? null : code.Trim().ToUpperInvariant();
        AuditState.UpdateAudit();
    }

    public void SetTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Course title is required.", nameof(title));

        Title = title.Trim();
        Name = Title;
        AuditState.UpdateAudit();
    }

    public void SetActive(bool active)
    {
        if (Active == active) return;

        Active = active;
        AuditState.UpdateAudit();
    }
}
