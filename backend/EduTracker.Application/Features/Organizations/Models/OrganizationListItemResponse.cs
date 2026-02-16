using EduTracker.Domain.Enums;

namespace EduTracker.Application.Features.Organizations.Models;

public sealed record OrganizationListItemResponse(
    Guid OrganizationId,
    string Name,
    OrganizationMemberRole Role,
    OrganizationMemberStatus Status
);
