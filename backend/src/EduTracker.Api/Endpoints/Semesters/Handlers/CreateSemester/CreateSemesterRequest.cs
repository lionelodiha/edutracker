namespace EduTracker.Api.Endpoints.Semesters.Handlers.CreateSemester;

internal sealed record CreateSemesterRequest(
    Guid OrganizationId,
    int StartYear
);
