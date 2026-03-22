using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed class CourseOffering : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private CourseOffering() { }

    public CourseOffering(Guid semesterId, Guid courseId, Guid organizationId)
    {
        SemesterId = semesterId;
        CourseId = courseId;
        OrganizationId = organizationId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid SemesterId { get; private set; }
    public Semester Semester { get; private set; } = null!;

    public Guid CourseId { get; private set; }
    public Course Course { get; private set; } = null!;

    public Guid OrganizationId { get; private set; }
}
