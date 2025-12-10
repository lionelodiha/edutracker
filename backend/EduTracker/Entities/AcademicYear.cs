using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class AcademicYear : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SchoolId { get; private set; }

    public string Name { get; private set; } = null!; // e.g., 2024/2025
    public DateTime StartsOn { get; private set; }
    public DateTime EndsOn { get; private set; }

    public School School { get; private set; } = null!;
    public ICollection<AcademicTerm> Terms { get; private set; } = new List<AcademicTerm>();

    private AcademicYear() { }
    public AcademicYear(Guid schoolId, string name, DateTime startsOn, DateTime endsOn)
    {
        SchoolId = schoolId;
        Name = name;
        StartsOn = startsOn;
        EndsOn = endsOn;
    }
}