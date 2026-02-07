using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class ClassEnrollment : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private ClassEnrollment() { }

    public ClassEnrollment(Guid classId, Guid studentMemberId)
    {
        ClassId = classId;
        StudentMemberId = studentMemberId;
        EnrolledAt = DateTime.UtcNow;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid ClassId { get; private set; }
    public Class Class { get; private set; } = null!;

    public Guid StudentMemberId { get; private set; }
    public OrganizationMember StudentMember { get; private set; } = null!;

    public DateTime EnrolledAt { get; private set; }
}
