namespace EduTracker.Api.Endpoints.Students.Handlers.JoinStudent;

internal sealed record JoinStudentRequest(
    Guid OrganizationId,
    string StudentNumber,
    Guid? ClassId
);
