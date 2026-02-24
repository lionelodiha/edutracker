namespace EduTracker.Domain.Abstractions;

/// <summary>
/// Represents a domain entity with a unique identifier.
/// </summary>
internal interface IEntity
{
    /// <summary>
    /// Gets the unique identifier of the entity.
    /// </summary>
    Guid Id { get; }
}
