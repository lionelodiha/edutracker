namespace EduTracker.Api.Endpoints.Courses.Handlers.CreateCourse;

internal sealed record CreateCourseRequest(
    string Name,
    string? Description
);
