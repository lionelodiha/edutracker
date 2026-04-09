namespace EduTracker.Application.Features.Models;

public sealed record ClassResponse(
    Guid Id,
    string Name,
    string Code,
    Guid OrganizationId,
    DateTime CreatedAt
);
