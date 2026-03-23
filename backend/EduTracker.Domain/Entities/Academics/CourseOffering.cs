using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed class CourseOffering : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private CourseOffering() { }

    public CourseOffering(Guid termId, Guid courseId)
    {
        TermId = termId;
        CourseId = courseId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid TermId { get; private set; }
    public Term Term { get; private set; } = null!;

    public Guid CourseId { get; private set; }
    public Course Course { get; private set; } = null!;
}
