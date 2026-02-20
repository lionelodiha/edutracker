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

        OrganizationId = Guid.Empty;
        AssignmentId = assignmentId;
        AssessmentId = assignmentId;
        StudentMemberId = studentMemberId;
        EnrollmentId = null;
        Score = score;
        RawScore = score;
        GradedAt = DateTime.UtcNow;
        GradedAtUtc = GradedAt;

        AuditState.UpdateAudit();
    }

    public Grade(Guid organizationId, Guid enrollmentId, Guid assessmentId, double rawScore, Guid gradedByUserId)
    {
        if (rawScore < 0)
            throw new ArgumentOutOfRangeException(nameof(rawScore), "Raw score cannot be negative.");

        OrganizationId = organizationId;
        EnrollmentId = enrollmentId;
        AssessmentId = assessmentId;
        AssignmentId = assessmentId;
        RawScore = rawScore;
        Score = rawScore;
        GradedByUserId = gradedByUserId;
        GradedAtUtc = DateTime.UtcNow;
        GradedAt = GradedAtUtc;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid? EnrollmentId { get; private set; }
    public Enrollment? Enrollment { get; private set; }

    public Guid AssessmentId { get; private set; }
    public Assessment? Assessment { get; private set; }

    public Guid AssignmentId { get; private set; }
    public Assignment Assignment { get; private set; } = null!;

    public Guid StudentMemberId { get; private set; }
    public OrganizationMember StudentMember { get; private set; } = null!;

    public double RawScore { get; private set; }
    public double Score { get; private set; }
    public Guid? GradedByUserId { get; private set; }
    public DateTime GradedAtUtc { get; private set; }
    public DateTime GradedAt { get; private set; }

    public void UpdateScore(double score)
    {
        if (score < 0)
            throw new ArgumentOutOfRangeException(nameof(score), "Score cannot be negative.");

        RawScore = score;
        Score = score;
        GradedAtUtc = DateTime.UtcNow;
        GradedAt = DateTime.UtcNow;
        AuditState.UpdateAudit();
    }

    public void UpdateRawScore(double rawScore, Guid? gradedByUserId = null)
    {
        if (rawScore < 0)
            throw new ArgumentOutOfRangeException(nameof(rawScore), "Raw score cannot be negative.");

        RawScore = rawScore;
        Score = rawScore;
        GradedByUserId = gradedByUserId;
        GradedAtUtc = DateTime.UtcNow;
        GradedAt = GradedAtUtc;
        AuditState.UpdateAudit();
    }
}
