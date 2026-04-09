namespace EduTracker.Api.Endpoints.Teachers.Handlers.UpdateTeacher;

internal sealed record UpdateTeacherRequest(
    Guid OrganizationId,
    string StaffId
);
