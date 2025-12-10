using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Cohort : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SchoolId { get; private set; }
    public Guid CourseId { get; private set; }
    public Guid AcademicYearId { get; private set; }

    public string Name { get; private set; } = null!;

    public School School { get; private set; } = null!;
    public Course Course { get; private set; } = null!;
    public AcademicYear AcademicYear { get; private set; } = null!;

    public ICollection<CohortSubject> CohortSubjects { get; private set; } = new List<CohortSubject>();
    public ICollection<Student> Students { get; private set; } = new List<Student>();

    private Cohort() { }
    public Cohort(Guid schoolId, Guid courseId, Guid academicYearId, string name)
    {
        SchoolId = schoolId;
        CourseId = courseId;
        AcademicYearId = academicYearId;
        Name = name;
    }
}
