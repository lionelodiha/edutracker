namespace EduTracker.Application.Features.Academics.Models;

public sealed record CourseResponse(
    Guid Id,
    string Name,
    string Code,
    Guid OrganizationId,
    DateTime CreatedAt
);
