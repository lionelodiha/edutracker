using EduTracker.Domain.Enums;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.InviteOrganizationMember;

internal sealed record InviteOrganizationMemberRequest(
    Guid UserId,
    OrganizationMemberRole Role
);
