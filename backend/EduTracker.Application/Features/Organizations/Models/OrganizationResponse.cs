namespace EduTracker.Application.Features.Organizations.Models;

public sealed record OrganizationResponse(
    Guid Id,
    string Name,
    Guid OwnerUserId,
    DateTime CreatedAt
);
