using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class Organization : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Organization() { }

    public Organization(string name, Guid ownerUserId)
    {
        SetName(name);
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

    public ICollection<OrganizationMember> Members { get; private set; } = [];
    // public ICollection<OrganizationSubscription> Subscriptions { get; private set; } = [];
    // public ICollection<PaymentMethod> PaymentMethods { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Organization name is required.", nameof(newName));

        string trimmedName = newName.Trim();
        int nameLength = trimmedName.Length;

        if (nameLength < OrganizationLimits.NameMinLength || nameLength > OrganizationLimits.NameMaxLength)
            throw new ArgumentException(
                $"Organization name must be between {OrganizationLimits.NameMinLength} and {OrganizationLimits.NameMaxLength} characters.",
                nameof(newName)
            );

        if (!OrganizationLimits.NameRegex().IsMatch(trimmedName))
            throw new ArgumentException("Organization name contains invalid characters.", nameof(newName));

        Name = trimmedName;
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
}
