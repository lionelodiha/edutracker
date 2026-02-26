namespace EduTracker.Application.Features.Organizations.Models;

using EduTracker.Domain.Entities.Organizations;

public sealed record OrganizationMemberResponse(
    Guid Id,
    Guid UserId,
    OrganizationMemberRole Role,
    OrganizationMemberStatus Status,
    DateTime JoinedAt
);
