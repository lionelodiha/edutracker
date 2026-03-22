namespace EduTracker.Api.Endpoints.Academics.Handlers.UpdateSemester;

internal sealed record UpdateSemesterRequest(
    Guid OrganizationId,
    string Session
);
