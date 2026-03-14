using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationMember : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

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
    public User? User { get; private set; }

    public OrganizationMemberRole Role { get; private set; } = OrganizationMemberRole.Member;
    public OrganizationMemberStatus Status { get; private set; } = OrganizationMemberStatus.Active;

    public void UpdateRole(OrganizationMemberRole newRole)
    {
        OrganizationMemberRole validatedRole = ValidateRole(newRole);

        if (Role == validatedRole)
            return;

        Role = validatedRole;
        AuditState.UpdateAudit();
    }

    public void UpdateStatus(OrganizationMemberStatus newStatus)
    {
        OrganizationMemberStatus validatedStatus = ValidateStatus(newStatus);

        if (Status == validatedStatus)
            return;

        Status = validatedStatus;
        AuditState.UpdateAudit();
    }

    private static OrganizationMemberRole ValidateRole(OrganizationMemberRole role)
    {
        if (!Enum.IsDefined(role))
            throw new ArgumentException("Invalid organization role.", nameof(role));

        return role;
    }

    private static OrganizationMemberStatus ValidateStatus(OrganizationMemberStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new ArgumentException("Invalid organization member status.", nameof(status));

        return status;
    }
}
