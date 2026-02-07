namespace EduTracker.Api.Endpoints.Classes.Handlers.CreateAssignment;

internal sealed record CreateAssignmentRequest(
    string Title,
    double MaxScore,
    DateTime? DueDate
);
