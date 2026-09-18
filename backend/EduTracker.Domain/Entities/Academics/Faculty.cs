using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Faculty : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Faculty() { }

    public Faculty(Guid organizationId, string name, string? description)
    {
        OrganizationId = organizationId;
        Name = ValidateName(name);
        Description = ValidateDescription(description);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public IReadOnlyCollection<Department> Departments => _departments.AsReadOnly();
    private readonly List<Department> _departments = [];

    public void UpdateName(string name)
    {
        string validatedName = ValidateName(name);

        if (Name == validatedName)
            return;

        Name = validatedName;
        AuditState.UpdateAudit();
    }

    public void UpdateDescription(string? description)
    {
        string? validatedDescription = ValidateDescription(description);

        if (Description == validatedDescription)
            return;

        Description = validatedDescription;
        AuditState.UpdateAudit();
    }

    private static string ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Faculty name is required.", nameof(name));

        string normalizedName = name.Trim();
        int normalizedLength = normalizedName.Length;

        if (normalizedLength < AcademicLimits.DepartmentNameMinLength || normalizedLength > AcademicLimits.DepartmentNameMaxLength)
            throw new ArgumentException(
                $"Faculty name must be between {AcademicLimits.DepartmentNameMinLength} and {AcademicLimits.DepartmentNameMaxLength} characters.",
                nameof(name)
            );

        if (!AcademicLimits.DepartmentNameRegex().IsMatch(normalizedName))
            throw new ArgumentException(
                "Faculty name can only contain letters, numbers, spaces, hyphens, ampersands, and parentheses.",
                nameof(name)
            );

        return normalizedName;
    }

    private static string? ValidateDescription(string? description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return null;

        string normalized = description.Trim();

        if (normalized.Length > AcademicLimits.DepartmentDescriptionMaxLength)
            throw new ArgumentException(
                $"Faculty description must not exceed {AcademicLimits.DepartmentDescriptionMaxLength} characters.",
                nameof(description)
            );

        return normalized;
    }
}
