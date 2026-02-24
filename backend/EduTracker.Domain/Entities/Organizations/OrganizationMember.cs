using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationMember : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private OrganizationMember() { }

    public OrganizationMember(Guid organizationId, Guid userId)
    {
        OrganizationId = organizationId;
        UserId = userId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public OrganizationMemberRole Role { get; private set; } = OrganizationMemberRole.Member;
    public OrganizationMemberStatus Status { get; private set; } = OrganizationMemberStatus.Active;

    public void UpdateRole(OrganizationMemberRole newRole)
    {
        if (!Enum.IsDefined(newRole))
            throw new ArgumentException("Invalid organization role.", nameof(newRole));

        if (Role == newRole) return;

        Role = newRole;
        AuditState.UpdateAudit();
    }

    public void UpdateStatus(OrganizationMemberStatus newStatus)
    {
        if (!Enum.IsDefined(newStatus))
            throw new ArgumentException("Invalid organization member status.", nameof(newStatus));

        if (Status == newStatus) return;

        Status = newStatus;
        AuditState.UpdateAudit();
    }
}
