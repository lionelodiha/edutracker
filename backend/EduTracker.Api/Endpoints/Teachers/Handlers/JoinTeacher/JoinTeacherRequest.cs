namespace EduTracker.Api.Endpoints.Teachers.Handlers.JoinTeacher;

internal sealed record JoinTeacherRequest(
    Guid OrganizationId,
    string StaffId
);
