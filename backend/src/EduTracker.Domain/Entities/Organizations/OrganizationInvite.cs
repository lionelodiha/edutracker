using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationInvite : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private OrganizationInvite() { }

    public OrganizationInvite(Guid organizationId, Guid invitedUserId, Guid invitedByUserId, DateTime expiresAt)
    {
        OrganizationId = organizationId;
        InvitedUserId = invitedUserId;
        InvitedByUserId = invitedByUserId;
        ExpiresAt = expiresAt;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid InvitedUserId { get; private set; }
    public User InvitedUser { get; private set; } = null!;

    public Guid InvitedByUserId { get; private set; }
    public User InvitedByUser { get; private set; } = null!;

    public OrganizationInviteStatus Status { get; private set; } = OrganizationInviteStatus.Pending;
    public DateTime ExpiresAt { get; private set; }

    public void UpdateStatus(OrganizationInviteStatus newStatus)
    {
        OrganizationInviteStatus validatedStatus = ValidateStatus(newStatus);

        if (Status == validatedStatus)
            return;

        Status = validatedStatus;
        AuditState.UpdateAudit();
    }

    private static OrganizationInviteStatus ValidateStatus(OrganizationInviteStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new ArgumentException("Invalid organization invite status.", nameof(status));

        return status;
    }
}
