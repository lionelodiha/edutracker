using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Enums;

namespace EduTracker.Domain.Entities.Academics;

public sealed class ClassEnrollment : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private ClassEnrollment() { }

    public ClassEnrollment(Guid classId, Guid studentMemberId)
    {
        OrganizationId = Guid.Empty;
        ClassId = classId;
        StudentMemberId = studentMemberId;
        EnrolledAt = DateTime.UtcNow;
        Status = EnrollmentStatus.Active;

        AuditState.UpdateAudit();
    }

    public ClassEnrollment(Guid organizationId, Guid classId, Guid studentMemberId, EnrollmentStatus status)
    {
        OrganizationId = organizationId;
        ClassId = classId;
        StudentMemberId = studentMemberId;
        EnrolledAt = DateTime.UtcNow;
        Status = status;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid ClassId { get; private set; }
    public Class Class { get; private set; } = null!;

    public Guid StudentMemberId { get; private set; }
    public OrganizationMember StudentMember { get; private set; } = null!;

    public DateTime EnrolledAt { get; private set; }
    public EnrollmentStatus Status { get; private set; }

    public void UpdateStatus(EnrollmentStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new ArgumentException("Invalid enrollment status.", nameof(status));

        if (Status == status) return;

        Status = status;
        AuditState.UpdateAudit();
    }
}
