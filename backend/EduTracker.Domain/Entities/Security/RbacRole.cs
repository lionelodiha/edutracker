using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Security;

public sealed class RbacRole : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private RbacRole() { }

    public RbacRole(Guid? organizationId, string key, string name, string? description, bool isSystem = false, bool isActive = true)
    {
        OrganizationId = organizationId;
        SetKey(key);
        SetName(name);
        SetDescription(description);
        IsSystem = isSystem;
        IsActive = isActive;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid? OrganizationId { get; private set; }
    public Organization? Organization { get; private set; }

    public string Key { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsSystem { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<RbacRolePermission> Permissions { get; private set; } = [];
    public ICollection<OrganizationMemberRoleAssignment> OrganizationMemberAssignments { get; private set; } = [];
    public ICollection<UserRoleAssignment> UserAssignments { get; private set; } = [];

    public void SetKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Role key is required.", nameof(key));

        Key = key.Trim().ToLowerInvariant();
        AuditState.UpdateAudit();
    }

    public void SetName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Role name is required.", nameof(name));

        Name = name.Trim();
        AuditState.UpdateAudit();
    }

    public void SetDescription(string? description)
    {
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        AuditState.UpdateAudit();
    }

    public void Activate()
    {
        if (IsActive) return;

        IsActive = true;
        AuditState.UpdateAudit();
    }

    public void Deactivate()
    {
        if (!IsActive) return;

        IsActive = false;
        AuditState.UpdateAudit();
    }

    public bool HasPermission(string permissionKey)
        => Permissions.Any(
            rolePermission => rolePermission.IsActive &&
                rolePermission.Permission.IsActive &&
                rolePermission.Permission.Key.Equals(permissionKey, StringComparison.OrdinalIgnoreCase)
        );
}
