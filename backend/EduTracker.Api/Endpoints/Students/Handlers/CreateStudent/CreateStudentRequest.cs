namespace EduTracker.Api.Endpoints.Students.Handlers.CreateStudent;

internal sealed record CreateStudentRequest(
    Guid OrganizationId,
    Guid UserId,
    string StudentNumber,
    Guid? ClassId
);
