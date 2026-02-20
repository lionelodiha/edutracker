using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Enums;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Enrollment : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Enrollment() { }

    public Enrollment(Guid organizationId, Guid classOfferingId, Guid studentId, EnrollmentStatus status = EnrollmentStatus.Active)
    {
        OrganizationId = organizationId;
        ClassOfferingId = classOfferingId;
        StudentId = studentId;
        Status = status;
        EnrolledAtUtc = DateTime.UtcNow;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid ClassOfferingId { get; private set; }
    public ClassOffering ClassOffering { get; private set; } = null!;

    public Guid StudentId { get; private set; }
    public OrganizationMember Student { get; private set; } = null!;

    public DateTime EnrolledAtUtc { get; private set; }
    public EnrollmentStatus Status { get; private set; }

    public ICollection<Grade> Grades { get; private set; } = [];

    public void UpdateStatus(EnrollmentStatus newStatus)
    {
        if (!Enum.IsDefined(newStatus))
            throw new ArgumentException("Invalid enrollment status.", nameof(newStatus));

        if (Status == newStatus) return;

        Status = newStatus;
        AuditState.UpdateAudit();
    }
}
