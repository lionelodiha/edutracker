namespace EduTracker.Api.Endpoints.Academics.Handlers.UpdateCourse;

internal sealed record UpdateCourseRequest(
    Guid OrganizationId,
    string Name,
    string Code
);
