namespace EduTracker.Api.Endpoints.Students.Handlers.UpdateStudent;

internal sealed record UpdateStudentRequest(
    Guid OrganizationId,
    string StudentNumber,
    Guid? ClassId
);
