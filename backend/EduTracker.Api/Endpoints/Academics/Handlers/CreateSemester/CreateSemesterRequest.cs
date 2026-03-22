namespace EduTracker.Api.Endpoints.Academics.Handlers.CreateSemester;

internal sealed record CreateSemesterRequest(
    Guid OrganizationId,
    string Session
);
