using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using System.Collections.ObjectModel;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Term : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();
    private readonly List<CourseOffering> _courseOfferings = [];

    private Term() { }

    public Term(Guid semesterId, int number, DateOnly startDate, DateOnly endDate)
    {
        SemesterId = ValidateSemesterId(semesterId);
        Number = ValidateNumber(number);
        (StartDate, EndDate) = ValidateDates(startDate, endDate);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid SemesterId { get; private set; }
    public Semester Semester { get; private set; } = null!;

    public int Number { get; private set; }
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }

    public IReadOnlyCollection<CourseOffering> CourseOfferings => new ReadOnlyCollection<CourseOffering>(_courseOfferings);

    public void UpdateSchedule(DateOnly startDate, DateOnly endDate)
    {
        (DateOnly validatedStartDate, DateOnly validatedEndDate) = ValidateDates(startDate, endDate);

        if (StartDate == validatedStartDate && EndDate == validatedEndDate)
            return;

        StartDate = validatedStartDate;
        EndDate = validatedEndDate;
        AuditState.UpdateAudit();
    }

    public void Renumber(int number)
    {
        int validatedNumber = ValidateNumber(number);

        if (Number == validatedNumber)
            return;

        Number = validatedNumber;
        AuditState.UpdateAudit();
    }

    private static Guid ValidateSemesterId(Guid semesterId)
    {
        if (semesterId == Guid.Empty)
            throw new ArgumentException("Semester ID is required.", nameof(semesterId));

        return semesterId;
    }

    private static int ValidateNumber(int number)
    {
        if (number < AcademicLimits.MinTermNumber || number > AcademicLimits.MaxTermNumber)
            throw new ArgumentException(
                $"Term number must be between {AcademicLimits.MinTermNumber} and {AcademicLimits.MaxTermNumber}.",
                nameof(number)
            );

        return number;
    }

    private static (DateOnly StartDate, DateOnly EndDate) ValidateDates(DateOnly startDate, DateOnly endDate)
    {
        if (endDate <= startDate)
            throw new ArgumentException("Term end date must be after the start date.");

        return (startDate, endDate);
    }
}
