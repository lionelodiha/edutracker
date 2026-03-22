using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using System.Collections.ObjectModel;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Semester : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();
    private readonly List<Term> _terms = [];

    private Semester() { }

    public Semester(int startYear, Guid organizationId)
    {
        StartYear = ValidateStartYear(startYear);
        OrganizationId = ValidateOrganizationId(organizationId);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public int StartYear { get; private set; }
    public int EndYear => StartYear + 1;
    public string Session => $"{StartYear}/{EndYear}";

    public IReadOnlyCollection<Term> Terms => new ReadOnlyCollection<Term>(_terms);

    public void UpdateStartYear(int startYear)
    {
        int validatedStartYear = ValidateStartYear(startYear);

        if (StartYear == validatedStartYear)
            return;

        StartYear = validatedStartYear;
        AuditState.UpdateAudit();
    }

    public Term AddTerm(int number, DateOnly startDate, DateOnly endDate)
    {
        if (_terms.Any(item => item.Number == number))
            throw new InvalidOperationException($"Term {number} already exists for this semester.");

        if (_terms.Any(item => DatesOverlap(item.StartDate, item.EndDate, startDate, endDate)))
            throw new InvalidOperationException("Term dates cannot overlap within the same semester.");

        Term term = new(Id, number, startDate, endDate);
        _terms.Add(term);

        AuditState.UpdateAudit();
        return term;
    }

    private static Guid ValidateOrganizationId(Guid organizationId)
    {
        if (organizationId == Guid.Empty)
            throw new ArgumentException("Organization ID is required.", nameof(organizationId));

        return organizationId;
    }

    private static int ValidateStartYear(int startYear)
    {
        if (startYear < 1900 || startYear > 3000)
            throw new ArgumentOutOfRangeException(nameof(startYear), "Start year must be between 1900 and 3000.");

        return startYear;
    }

    private static bool DatesOverlap(DateOnly firstStart, DateOnly firstEnd, DateOnly secondStart, DateOnly secondEnd)
        => firstStart < secondEnd && secondStart < firstEnd;
}
