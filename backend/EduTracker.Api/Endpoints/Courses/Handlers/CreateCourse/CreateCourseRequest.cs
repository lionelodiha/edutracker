namespace EduTracker.Api.Endpoints.Courses.Handlers.CreateCourse;

internal sealed record CreateCourseRequest(
    Guid OrganizationId,
    string Name,
    string Code
);
