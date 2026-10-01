using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Term : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Term() { }

    public Term(Guid semesterId, int ordinal)
    {
        SemesterId = semesterId;
        Ordinal = ValidateOrdinalNumber(ordinal);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid SemesterId { get; private set; }
    public Semester Semester { get; private set; } = null!;

    public int Ordinal { get; private set; } = 1;

    private static int ValidateOrdinalNumber(int number)
    {
        if (number < AcademicLimits.MinTermNumber || number > AcademicLimits.MaxTermNumber)
            throw new ArgumentException(
                $"Term ordinal must be between {AcademicLimits.MinTermNumber} and {AcademicLimits.MaxTermNumber}.",
                nameof(number)
            );

        return number;
    }
}
