using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed class GradeScaleItem : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private GradeScaleItem() { }

    public GradeScaleItem(Guid gradeScaleId, double min, double max, string letter, decimal points)
    {
        if (max < min)
            throw new ArgumentException("Maximum score must be greater than or equal to minimum.", nameof(max));

        if (points < 0)
            throw new ArgumentOutOfRangeException(nameof(points), "Points cannot be negative.");

        GradeScaleId = gradeScaleId;
        Min = min;
        Max = max;
        SetLetter(letter);
        Points = points;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid GradeScaleId { get; private set; }
    public GradeScale GradeScale { get; private set; } = null!;

    public double Min { get; private set; }
    public double Max { get; private set; }
    public string Letter { get; private set; } = string.Empty;
    public decimal Points { get; private set; }

    public void UpdateRange(double min, double max)
    {
        if (max < min)
            throw new ArgumentException("Maximum score must be greater than or equal to minimum.", nameof(max));

        Min = min;
        Max = max;
        AuditState.UpdateAudit();
    }

    public void SetLetter(string letter)
    {
        if (string.IsNullOrWhiteSpace(letter))
            throw new ArgumentException("Letter is required.", nameof(letter));

        Letter = letter.Trim().ToUpperInvariant();
        AuditState.UpdateAudit();
    }

    public void UpdatePoints(decimal points)
    {
        if (points < 0)
            throw new ArgumentOutOfRangeException(nameof(points), "Points cannot be negative.");

        Points = points;
        AuditState.UpdateAudit();
    }
}
