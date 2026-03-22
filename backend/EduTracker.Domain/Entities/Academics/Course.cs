using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Course : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Course() { }

    public Course(string name, string code, Guid organizationId)
    {
        Name = ValidateName(name);
        Code = ValidateCode(code);
        OrganizationId = organizationId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    
    public Guid OrganizationId { get; private set; }

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

        if (changed)
        {
            AuditState.UpdateAudit();
        }
    }

    private static string ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Course name is required.", nameof(name));

        name = name.Trim();

        if (name.Length > 150)
            throw new ArgumentException("Course name cannot exceed 150 characters.", nameof(name));

        return name;
    }

    private static string ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Course code is required.", nameof(code));

        code = code.Trim().ToUpperInvariant();

        if (code.Length > 20)
            throw new ArgumentException("Course code cannot exceed 20 characters.", nameof(code));

        return code;
    }
}
