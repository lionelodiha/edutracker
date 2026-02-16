using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Grade : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Grade() { }

    public Grade(Guid assignmentId, Guid studentMemberId, double score)
    {
        if (score < 0)
            throw new ArgumentOutOfRangeException(nameof(score), "Score cannot be negative.");

        AssignmentId = assignmentId;
        StudentMemberId = studentMemberId;
        Score = score;
        GradedAt = DateTime.UtcNow;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid AssignmentId { get; private set; }
    public Assignment Assignment { get; private set; } = null!;

    public Guid StudentMemberId { get; private set; }
    public OrganizationMember StudentMember { get; private set; } = null!;

    public double Score { get; private set; }
    public DateTime GradedAt { get; private set; }

    public void UpdateScore(double score)
    {
        if (score < 0)
            throw new ArgumentOutOfRangeException(nameof(score), "Score cannot be negative.");

        Score = score;
        GradedAt = DateTime.UtcNow;
        AuditState.UpdateAudit();
    }
}
