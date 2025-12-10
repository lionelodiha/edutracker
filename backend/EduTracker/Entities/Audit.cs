using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Audit : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid? ActorUserId { get; private set; }
    public string Action { get; private set; } = null!;
    public string EntityName { get; private set; } = null!;
    public Guid EntityId { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; } = DateTimeOffset.UtcNow;
    public string? Details { get; private set; }

    private Audit() { }
    public Audit(string action, string entityName, Guid entityId, Guid? actorUserId = null, string? details = null)
    {
        Action = action;
        EntityName = entityName;
        EntityId = entityId;
        ActorUserId = actorUserId;
        Details = details;
    }
}