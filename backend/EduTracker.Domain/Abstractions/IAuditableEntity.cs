namespace EduTracker.Domain.Abstractions;

internal interface IAuditable
{
    DateTimeOffset CreatedAt { get; }
    DateTimeOffset UpdatedAt { get; }

    void UpdateAudit();
}
