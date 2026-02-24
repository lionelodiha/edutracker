namespace EduTracker.Domain.Abstractions;

/// <summary>
/// Represents an entity that maintains auditing information,
/// including when it was created and last modified.
/// </summary>
internal interface IAuditable
{
    /// <summary>
    /// Gets the date and time (in UTC) when the entity was first created.
    /// </summary>
    DateTime CreatedAt { get; }

    /// <summary>
    /// Gets the date and time (in UTC) when the entity was last updated.
    /// </summary>
    DateTime UpdatedAt { get; }
}
