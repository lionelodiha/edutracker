using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.InviteOrganizationMember;

internal sealed record InviteOrganizationMemberRequest(
    Guid UserId,
    OrganizationMemberRole Role
);
