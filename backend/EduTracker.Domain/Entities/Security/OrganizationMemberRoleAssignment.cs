using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Security;

public sealed class OrganizationMemberRoleAssignment : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private OrganizationMemberRoleAssignment() { }

    public OrganizationMemberRoleAssignment(Guid organizationMemberId, Guid roleId, Guid assignedByUserId, DateTime? expiresAtUtc = null)
    {
        OrganizationMemberId = organizationMemberId;
        RoleId = roleId;
        AssignedByUserId = assignedByUserId;
        AssignedAtUtc = DateTime.UtcNow;
        ExpiresAtUtc = expiresAtUtc;
        IsActive = true;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationMemberId { get; private set; }
    public OrganizationMember OrganizationMember { get; private set; } = null!;

    public Guid RoleId { get; private set; }
    public RbacRole Role { get; private set; } = null!;

    public Guid AssignedByUserId { get; private set; }
    public DateTime AssignedAtUtc { get; private set; }
    public DateTime? ExpiresAtUtc { get; private set; }
    public bool IsActive { get; private set; }

    public bool IsExpired() => ExpiresAtUtc is not null && ExpiresAtUtc.Value <= DateTime.UtcNow;

    public void Extend(DateTime? newExpiresAtUtc)
    {
        ExpiresAtUtc = newExpiresAtUtc;
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
}
