using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Security;

public sealed class RbacRolePermission : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private RbacRolePermission() { }

    public RbacRolePermission(Guid roleId, Guid permissionId, bool isActive = true)
    {
        RoleId = roleId;
        PermissionId = permissionId;
        IsActive = isActive;
        GrantedAtUtc = DateTime.UtcNow;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid RoleId { get; private set; }
    public RbacRole Role { get; private set; } = null!;

    public Guid PermissionId { get; private set; }
    public RbacPermission Permission { get; private set; } = null!;

    public bool IsActive { get; private set; } = true;
    public DateTime GrantedAtUtc { get; private set; }

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
}
