using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class AcademicTerm : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    // public Guid SchoolId { get; private set; }
    public Guid AcademicYearId { get; private set; }

    public string Name { get; private set; } = null!; // e.g., Term 1
    public DateTime StartsOn { get; private set; }
    public DateTime EndsOn { get; private set; }

    // public School School { get; private set; } = null!;
    public AcademicYear AcademicYear { get; private set; } = null!;

    private AcademicTerm() { }
    public AcademicTerm(Guid schoolId, Guid academicYearId, string name, DateTime startsOn, DateTime endsOn)
    {
        // SchoolId = schoolId;
        AcademicYearId = academicYearId;
        Name = name;
        StartsOn = startsOn;
        EndsOn = endsOn;
    }
}
