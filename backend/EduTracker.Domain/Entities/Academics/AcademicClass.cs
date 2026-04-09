using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class AcademicClass : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private AcademicClass() { }

    public AcademicClass(Guid organizationId, string name, string code)
    {
        OrganizationId = organizationId;
        Name = ValidateName(name);
        Code = ValidateCode(code);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;

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
            throw new ArgumentException("Class name is required.", nameof(name));

        string normalizedName = name.Trim();

        if (normalizedName.Length < AcademicLimits.ClassNameMinLength || normalizedName.Length > AcademicLimits.ClassNameMaxLength)
            throw new ArgumentException(
                $"Class name must be between {AcademicLimits.ClassNameMinLength} and {AcademicLimits.ClassNameMaxLength} characters.",
                nameof(name)
            );

        if (!AcademicLimits.ClassNameRegex().IsMatch(normalizedName))
            throw new ArgumentException(
                "Class name can only contain letters, numbers, spaces, hyphens, and parentheses.",
                nameof(name)
            );

        return normalizedName;
    }

    private static string ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Class code is required.", nameof(code));

        string normalizedCode = code.Trim().ToUpperInvariant();

        if (normalizedCode.Length < AcademicLimits.ClassCodeMinLength || normalizedCode.Length > AcademicLimits.ClassCodeMaxLength)
            throw new ArgumentException(
                $"Class code must be between {AcademicLimits.ClassCodeMinLength} and {AcademicLimits.ClassCodeMaxLength} characters.",
                nameof(code)
            );

        if (!AcademicLimits.ClassCodeRegex().IsMatch(normalizedCode))
            throw new ArgumentException(
                "Class code can only contain uppercase letters, numbers, hyphens, and underscores.",
                nameof(code)
            );

        return normalizedCode;
    }
}
