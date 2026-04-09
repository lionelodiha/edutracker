namespace EduTracker.Api.Endpoints.Teachers.Handlers.CreateTeacher;

internal sealed record CreateTeacherRequest(
    Guid OrganizationId,
    Guid UserId,
    string StaffId
);
