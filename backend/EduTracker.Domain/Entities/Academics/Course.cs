using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using System.Collections.ObjectModel;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Course : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();
    private readonly List<CourseOffering> _courseOfferings = [];

    private Course() { }

    public Course(string name, string code, Guid organizationId)
    {
        Name = ValidateName(name);
        Code = ValidateCode(code);
        OrganizationId = ValidateOrganizationId(organizationId);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public Guid OrganizationId { get; private set; }

    public IReadOnlyCollection<CourseOffering> CourseOfferings => new ReadOnlyCollection<CourseOffering>(_courseOfferings);

    public void UpdateDetails(string name, string code)
    {
        bool changed = false;

        string validatedName = ValidateName(name);
        if (Name != validatedName)
        {
            Name = validatedName;
            changed = true;
        }

        string validatedCode = ValidateCode(code);
        if (Code != validatedCode)
        {
            Code = validatedCode;
            changed = true;
        }

        if (!changed)
            return;

        AuditState.UpdateAudit();
    }

    private static Guid ValidateOrganizationId(Guid organizationId)
    {
        if (organizationId == Guid.Empty)
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));

        return organizationId;
    }

    private static string ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Course name is required.", nameof(name));

        string normalizedName = name.Trim();

        if (normalizedName.Length > AcademicLimits.CourseNameMaxLength)
            throw new ArgumentException(
                $"Course name cannot exceed {AcademicLimits.CourseNameMaxLength} characters.",
                nameof(name)
            );

        return normalizedName;
    }

    private static string ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Course code is required.", nameof(code));

        string normalizedCode = code.Trim().ToUpperInvariant();

        if (normalizedCode.Length > AcademicLimits.CourseCodeMaxLength)
            throw new ArgumentException(
                $"Course code cannot exceed {AcademicLimits.CourseCodeMaxLength} characters.",
                nameof(code)
            );

        return normalizedCode;
    }
}
