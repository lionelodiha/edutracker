namespace EduTracker.Application.Features.Organizations.Models;

public sealed record UserOrganizationInviteResponse(
    Guid Id,
    Guid OrganizationId,
    string OrganizationName,
    string InvitedByUserName,
    DateTime ExpiresAt,
    DateTime CreatedAt
);
