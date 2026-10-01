namespace EduTracker.Api.Endpoints.Courses.Handlers.UpdateCourse;

internal sealed record UpdateCourseRequest(
    Guid OrganizationId,
    string Name,
    string Code
);
