using EduTracker.Domain.Abstractions;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPlan : IEntity
{
    private OrganizationPlan() { }

    public OrganizationPlan(string name)
    {
        Name = name;
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public string Name { get; private set; } = string.Empty;

    public int? MaxStudents { get; private set; }

    public bool HasAdvancedReports { get; private set; }
    public bool HasApiAccess { get; private set; }

    public bool IsStudentLimitReached(int activeStudents)
    {
        if (MaxStudents is null)
            return false;

        return activeStudents >= MaxStudents.Value;
    }
}
