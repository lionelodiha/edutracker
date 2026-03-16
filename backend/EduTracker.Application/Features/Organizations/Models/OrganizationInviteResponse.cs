namespace EduTracker.Application.Features.Organizations.Models;

using EduTracker.Domain.Entities.Organizations;

public sealed record OrganizationInviteResponse(
    Guid Id,
    Guid OrganizationId,
    string OrganizationName,
    Guid InvitedUserId,
    Guid InvitedByUserId,
    OrganizationInviteStatus Status,
    DateTime ExpiresAt,
    DateTime CreatedAt
);
