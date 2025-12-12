using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class UserSession : IEntity
{
    private UserSession() { }

    public UserSession(Guid cohortId, Guid subjectId, DateTimeOffset startsAt, DateTimeOffset endsAt, string? topic = null)
    {
        CohortId = cohortId;
        SubjectId = subjectId;
        StartsAt = startsAt;
        EndsAt = endsAt;
        Topic = topic;
    }

    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CohortId { get; private set; }
    public Guid SubjectId { get; private set; }

    public string? Topic { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }
}
