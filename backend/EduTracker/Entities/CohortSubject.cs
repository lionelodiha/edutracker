namespace EduTracker.Entities;

public class CohortSubject
{
    public Guid CohortId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid? TeacherId { get; private set; }

    public Cohort Cohort { get; private set; } = null!;
    public Subject Subject { get; private set; } = null!;
    public Teacher? Teacher { get; private set; }

    public ICollection<Assessment> Assessments { get; private set; } = new List<Assessment>();
    public ICollection<Session> Sessions { get; private set; } = new List<Session>();

    private CohortSubject() { }
    public CohortSubject(Guid cohortId, Guid subjectId, Guid? teacherId = null)
    {
        CohortId = cohortId;
        SubjectId = subjectId;
        TeacherId = teacherId;
    }
}
