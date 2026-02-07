namespace EduTracker.Application.Features.Courses.Models;

public sealed record CourseResponse(
    Guid Id,
    Guid OrganizationId,
    string Name,
    string? Description
);
