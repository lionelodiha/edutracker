namespace EduTracker.Application.Features.Assignments.Models;

public sealed record AssignmentResponse(
    Guid Id,
    Guid ClassId,
    string Title,
    double MaxScore,
    DateTime? DueDate
);
