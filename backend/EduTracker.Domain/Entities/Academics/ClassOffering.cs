using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class ClassOffering : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private ClassOffering() { }

    public ClassOffering(
        Guid organizationId,
        Guid academicYearId,
        Guid? semesterId,
        Guid classId,
        Guid? courseId,
        Guid? assignedTeacherId = null
    )
    {
        OrganizationId = organizationId;
        AcademicYearId = academicYearId;
        SemesterId = semesterId;
        ClassId = classId;
        CourseId = courseId;
        AssignedTeacherId = assignedTeacherId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid AcademicYearId { get; private set; }
    public AcademicYear AcademicYear { get; private set; } = null!;

    public Guid? SemesterId { get; private set; }
    public Semester? Semester { get; private set; }

    public Guid ClassId { get; private set; }
    public Class Class { get; private set; } = null!;

    public Guid? CourseId { get; private set; }
    public Course? Course { get; private set; }

    public Guid? AssignedTeacherId { get; private set; }
    public OrganizationMember? AssignedTeacher { get; private set; }

    public Guid? GradingSchemeId { get; private set; }
    public GradingScheme? GradingScheme { get; private set; }

    public ICollection<Enrollment> Enrollments { get; private set; } = [];
    public ICollection<Assessment> Assessments { get; private set; } = [];

    public void AssignTeacher(Guid? teacherMemberId)
    {
        if (AssignedTeacherId == teacherMemberId) return;

        AssignedTeacherId = teacherMemberId;
        AuditState.UpdateAudit();
    }

    public void AssignGradingScheme(Guid? gradingSchemeId)
    {
        if (GradingSchemeId == gradingSchemeId) return;

        GradingSchemeId = gradingSchemeId;
        AuditState.UpdateAudit();
    }
}
