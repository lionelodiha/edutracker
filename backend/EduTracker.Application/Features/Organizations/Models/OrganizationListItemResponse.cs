namespace EduTracker.Application.Features.Organizations.Models;

using EduTracker.Domain.Entities.Organizations;

public sealed record OrganizationListItemResponse(
    Guid OrganizationId,
    string Name,
    OrganizationMemberRole Role,
    OrganizationMemberStatus Status
);
