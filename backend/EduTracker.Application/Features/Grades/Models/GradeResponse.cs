namespace EduTracker.Application.Features.Grades.Models;

public sealed record GradeResponse(
    Guid Id,
    Guid AssignmentId,
    Guid StudentMemberId,
    double Score,
    DateTime GradedAt
);
