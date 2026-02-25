using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPlan : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private OrganizationPlan() { }

    public OrganizationPlan(string name, int? maxStudents = null, bool hasAdvancedReports = false, bool hasApiAccess = false)
    {
        Name = ValidateName(name);
        MaxStudents = maxStudents;
        HasAdvancedReports = hasAdvancedReports;
        HasApiAccess = hasApiAccess;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;

    public int? MaxStudents { get; private set; }

    public bool HasAdvancedReports { get; private set; }
    public bool HasApiAccess { get; private set; }

    public void SetName(string newName)
    {
        string validatedName = ValidateName(newName);

        if (Name == validatedName) return;

        Name = validatedName;
        AuditState.UpdateAudit();
    }

    public void SetMaxStudents(int? maxStudents)
    {
        if (MaxStudents == maxStudents) return;

        MaxStudents = maxStudents;
        AuditState.UpdateAudit();
    }

    public void SetAdvancedReports(bool hasAdvancedReports)
    {
        if (HasAdvancedReports == hasAdvancedReports) return;

        HasAdvancedReports = hasAdvancedReports;
        AuditState.UpdateAudit();
    }

    public void SetApiAccess(bool hasApiAccess)
    {
        if (HasApiAccess == hasApiAccess) return;

        HasApiAccess = hasApiAccess;
        AuditState.UpdateAudit();
    }

    public bool IsStudentLimitReached(int activeStudents)
    {
        if (MaxStudents is null)
            return false;

        return activeStudents >= MaxStudents.Value;
    }

    private static string ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Plan name is required.", nameof(name));

        if (name.Length < OrganizationLimits.PlanNameMinLength || name.Length > OrganizationLimits.PlanNameMaxLength)
            throw new ArgumentException(
                $"Plan name must be between {OrganizationLimits.PlanNameMinLength} and {OrganizationLimits.PlanNameMaxLength} characters.",
                nameof(name)
            );

        if (!OrganizationLimits.PlanNameRegex().IsMatch(name))
            throw new ArgumentException("Plan name contains invalid characters.", nameof(name));

        return name;
    }
}
