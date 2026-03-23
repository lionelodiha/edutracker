using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Semester : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Semester() { }

    public Semester(Guid organizationId, int startYear)
    {
        OrganizationId = organizationId;
        StartYear = ValidateStartYear(startYear);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public int StartYear { get; private set; }
    public int EndYear => StartYear + 1;
    public string Session => $"{StartYear}/{EndYear}";

    private static int ValidateStartYear(int startYear)
    {
        int currentYear = DateTime.UtcNow.Year;

        int minYear = currentYear - AcademicLimits.MaxPastYears;
        int maxYear = currentYear + AcademicLimits.MaxFutureYears;

        if (startYear < minYear || startYear > maxYear)
            throw new ArgumentOutOfRangeException(
                nameof(startYear),
                $"Start year must be between {minYear} and {maxYear}."
            );

        return startYear;
    }
}
