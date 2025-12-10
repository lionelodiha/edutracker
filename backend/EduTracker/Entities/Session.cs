using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Session : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CohortId { get; private set; }
    public Guid SubjectId { get; private set; }

    public string? Topic { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }

    public CohortSubject CohortSubject { get; private set; } = null!;

    private Session() { }
    public Session(Guid cohortId, Guid subjectId, DateTimeOffset startsAt, DateTimeOffset endsAt, string? topic = null)
    {
        CohortId = cohortId;
        SubjectId = subjectId;
        StartsAt = startsAt;
        EndsAt = endsAt;
        Topic = topic;
    }
}
