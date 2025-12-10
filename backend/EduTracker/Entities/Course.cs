using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Course : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SchoolId { get; private set; }

    public string Code { get; private set; } = null!;
    public string Name { get; private set; } = null!;

    public School School { get; private set; } = null!;
    public ICollection<Cohort> Cohorts { get; private set; } = new List<Cohort>();

    private Course() { }
    public Course(Guid schoolId, string code, string name)
    {
        SchoolId = schoolId;
        Code = code;
        Name = name;
    }
}
