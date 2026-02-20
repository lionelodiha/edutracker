using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Enums;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationMember : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private OrganizationMember() { }

    public OrganizationMember(Guid organizationId, Guid userId, OrganizationMemberRole role, OrganizationMemberStatus status)
    {
        if (!Enum.IsDefined(role))
            throw new ArgumentException("Invalid organization role.", nameof(role));

        if (!Enum.IsDefined(status))
            throw new ArgumentException("Invalid organization member status.", nameof(status));

        OrganizationId = organizationId;
        UserId = userId;
        Role = role;
        Status = status;
        JoinedAt = DateTime.UtcNow;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public OrganizationMemberRole Role { get; private set; }
    public OrganizationMemberStatus Status { get; private set; }

    public DateTime JoinedAt { get; private set; }

    public void UpdateRole(OrganizationMemberRole role)
    {
        if (!Enum.IsDefined(role))
            throw new ArgumentException("Invalid organization role.", nameof(role));

        Role = role;
        AuditState.UpdateAudit();
    }

    public void UpdateStatus(OrganizationMemberStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new ArgumentException("Invalid organization member status.", nameof(status));

        Status = status;
        AuditState.UpdateAudit();
    }
}
