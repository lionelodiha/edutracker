using EduTracker.Domain.Abstractions;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPlan : IEntity
{
    private OrganizationPlan() { }

    public OrganizationPlan(string name)
    {
        SetName(name);
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public string Name { get; private set; } = string.Empty;

    public int? MaxStudents { get; private set; }

    public bool HasAdvancedReports { get; private set; }
    public bool HasApiAccess { get; private set; }

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Plan name is required.", nameof(newName));

        if (newName.Length < OrganizationLimits.PlanNameMinLength || newName.Length > OrganizationLimits.PlanNameMaxLength)
            throw new ArgumentException(
                $"Plan name must be between {OrganizationLimits.PlanNameMinLength} and {OrganizationLimits.PlanNameMaxLength} characters.",
                nameof(newName)
            );

        if (!OrganizationLimits.PlanNameRegex().IsMatch(newName))
            throw new ArgumentException("Plan name contains invalid characters.", nameof(newName));

        Name = newName;
    }

    public bool IsStudentLimitReached(int activeStudents)
    {
        if (MaxStudents is null)
            return false;

        return activeStudents >= MaxStudents.Value;
    }
}
