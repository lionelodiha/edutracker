using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Course : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Course() { }

    public Course(Guid organizationId, string name, string code)
    {
        OrganizationId = organizationId;
        Name = ValidateName(name);
        Code = ValidateCode(code);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public void UpdateName(string name)
    {
        string validatedName = ValidateName(name);

        if (Name == validatedName)
            return;

        Name = validatedName;
        AuditState.UpdateAudit();
    }

    public void UpdateCode(string code)
    {
        string validatedCode = ValidateCode(code);

        if (Code == validatedCode)
            return;

        Code = validatedCode;
        AuditState.UpdateAudit();
    }

    private static string ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Course name is required.", nameof(name));

        string normalizedName = name.Trim();
        int normalizedLength = normalizedName.Length;

        if (normalizedLength < AcademicLimits.CourseNameMinLength || normalizedLength > AcademicLimits.CourseNameMaxLength)
            throw new ArgumentException(
                $"Course name must be between {AcademicLimits.CourseNameMinLength} and {AcademicLimits.CourseNameMaxLength} characters.",
                nameof(name)
            );

        if (!AcademicLimits.CourseNameRegex().IsMatch(normalizedName))
            throw new ArgumentException(
                "Course name can only contain letters, spaces, hyphens, and parentheses.",
                nameof(name)
            );

        return normalizedName;
    }

    private static string ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Course code is required.", nameof(code));

        string normalizedCode = code.Trim().ToUpperInvariant();
        int normalizedCodeLength = normalizedCode.Length;

        if (normalizedCodeLength < AcademicLimits.CourseCodeMinLength || normalizedCodeLength > AcademicLimits.CourseCodeMaxLength)
            throw new ArgumentException(
                $"Course code must be between {AcademicLimits.CourseCodeMinLength} and {AcademicLimits.CourseCodeMaxLength} characters.",
                nameof(code)
            );

        if (!AcademicLimits.CourseCodeRegex().IsMatch(normalizedCode))
            throw new ArgumentException(
                "Course code can only contain uppercase letters, numbers, hyphens, and underscores.",
                nameof(code)
            );

        return normalizedCode;
    }
}
