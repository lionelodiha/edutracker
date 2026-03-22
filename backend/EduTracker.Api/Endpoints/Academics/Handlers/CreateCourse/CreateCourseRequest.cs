namespace EduTracker.Api.Endpoints.Academics.Handlers.CreateCourse;

internal sealed record CreateCourseRequest(
    Guid OrganizationId,
    string Name,
    string Code
);
