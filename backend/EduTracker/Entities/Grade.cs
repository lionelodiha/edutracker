using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Grade : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SchoolId { get; private set; }

    public string Letter { get; private set; } = null!;
    public decimal MinScore { get; private set; }
    public decimal MaxScore { get; private set; }

    public School School { get; private set; } = null!;

    private Grade() { }
    public Grade(Guid schoolId, string letter, decimal minScore, decimal maxScore)
    {
        SchoolId = schoolId;
        Letter = letter;
        MinScore = minScore;
        MaxScore = maxScore;
    }
}