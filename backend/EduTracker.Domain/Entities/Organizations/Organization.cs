using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class Organization : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Organization() { }

    public Organization(string name, Guid ownerUserId)
    {
        Name = ValidateName(name);
        OwnerUserId = ownerUserId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;
    public bool IsLocked { get; private set; } = false;

    public Guid OwnerUserId { get; private set; }
    public User OwnerUser { get; private set; } = null!;

    public void SetName(string newName)
    {
        string validatedName = ValidateName(newName);

        if (Name == validatedName) return;

        Name = validatedName;
        AuditState.UpdateAudit();
    }

    public void Lock()
    {
        if (IsLocked) return;

        IsLocked = true;
        AuditState.UpdateAudit();
    }

    public void Unlock()
    {
        if (!IsLocked) return;

        IsLocked = false;
        AuditState.UpdateAudit();
    }

    private static string ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Organization name is required.", nameof(name));

        if (name.Length < OrganizationLimits.NameMinLength || name.Length > OrganizationLimits.NameMaxLength)
            throw new ArgumentException(
                $"Organization name must be between {OrganizationLimits.NameMinLength} and {OrganizationLimits.NameMaxLength} characters.",
                nameof(name)
            );

        if (!OrganizationLimits.NameRegex().IsMatch(name))
            throw new ArgumentException("Organization name contains invalid characters.", nameof(name));

        return name;
    }
}
