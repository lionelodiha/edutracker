using EduTracker.Domain.Enums;

namespace EduTracker.Application.Features.Organizations.Models;

public sealed record OrganizationMemberResponse(
    Guid Id,
    Guid UserId,
    OrganizationMemberRole Role,
    OrganizationMemberStatus Status,
    DateTime JoinedAt
);
