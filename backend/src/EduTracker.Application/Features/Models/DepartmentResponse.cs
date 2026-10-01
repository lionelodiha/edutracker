namespace EduTracker.Application.Features.Models;

public sealed record DepartmentResponse(
    Guid Id,
    string Name,
    string? Description,
    Guid OrganizationId,
    DateTime CreatedAt
);
