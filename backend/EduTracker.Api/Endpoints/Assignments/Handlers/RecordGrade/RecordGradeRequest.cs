namespace EduTracker.Api.Endpoints.Assignments.Handlers.RecordGrade;

internal sealed record RecordGradeRequest(
    Guid StudentMemberId,
    double Score
);
