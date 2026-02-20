using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationMember : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private OrganizationMember() { }

    public OrganizationMember(Guid organizationId, Guid userId, OrganizationMemberStatus status)
    {
        OrganizationId = organizationId;
        UserId = userId;
        UpdateStatus(status);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public OrganizationMemberStatus Status { get; private set; }
    public ICollection<OrganizationMemberRoleAssignment> RoleAssignments { get; private set; } = [];

    public void UpdateStatus(OrganizationMemberStatus newStatus)
    {
        if (!Enum.IsDefined(newStatus))
            throw new ArgumentException("Invalid organization member status.", nameof(newStatus));

        if (newStatus == Status) return;

        Status = newStatus;
        AuditState.UpdateAudit();
    }

    public void AssignRole(Guid roleId, Guid assignedByUserId, DateTime? expiresAtUtc = null)
    {
        bool alreadyActive = RoleAssignments.Any(
            assignment => assignment.RoleId == roleId && assignment.IsActive && !assignment.IsExpired()
        );

        if (alreadyActive) return;

        RoleAssignments.Add(new OrganizationMemberRoleAssignment(Id, roleId, assignedByUserId, expiresAtUtc));
        AuditState.UpdateAudit();
    }

    public void RevokeRole(Guid roleId)
    {
        OrganizationMemberRoleAssignment? activeAssignment = RoleAssignments.FirstOrDefault(
            assignment => assignment.RoleId == roleId && assignment.IsActive
        );

        if (activeAssignment is null) return;

        activeAssignment.Deactivate();
        AuditState.UpdateAudit();
    }

    public bool HasRole(string roleKey)
        => RoleAssignments.Any(
            assignment => assignment.IsActive &&
                !assignment.IsExpired() &&
                assignment.Role.Key.Equals(roleKey, StringComparison.OrdinalIgnoreCase)
        );
}
