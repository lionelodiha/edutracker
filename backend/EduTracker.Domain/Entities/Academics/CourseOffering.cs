using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed class CourseOffering : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private CourseOffering() { }

    public CourseOffering(Guid semesterId, Guid courseId, Guid organizationId)
    {
        SemesterId = ValidateRequiredId(semesterId, nameof(semesterId), "Semester ID is required.");
        CourseId = ValidateRequiredId(courseId, nameof(courseId), "Course ID is required.");
        OrganizationId = ValidateRequiredId(organizationId, nameof(organizationId), "Organization ID is required.");

        AuditState.UpdateAudit();
    }

    public CourseOffering(Guid semesterId, Guid termId, Guid courseId, Guid organizationId)
        : this(semesterId, courseId, organizationId)
    {
        TermId = ValidateRequiredId(termId, nameof(termId), "Term ID is required.");
        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid SemesterId { get; private set; }
    public Semester Semester { get; private set; } = null!;

    public Guid? TermId { get; private set; }
    public Term? Term { get; private set; }

    public Guid CourseId { get; private set; }
    public Course Course { get; private set; } = null!;

    public Guid OrganizationId { get; private set; }

    public void AssignTerm(Guid termId, Guid semesterId)
    {
        Guid validatedTermId = ValidateRequiredId(termId, nameof(termId), "Term ID is required.");
        Guid validatedSemesterId = ValidateRequiredId(semesterId, nameof(semesterId), "Semester ID is required.");

        if (TermId == validatedTermId && SemesterId == validatedSemesterId)
            return;

        TermId = validatedTermId;
        SemesterId = validatedSemesterId;
        AuditState.UpdateAudit();
    }

    private static Guid ValidateRequiredId(Guid value, string parameterName, string message)
    {
        if (value == Guid.Empty)
            throw new ArgumentException(message, parameterName);

        return value;
    }
}
