using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Api.Endpoints.OrganizationMembers.Handlers.UpdateOrganizationMemberRole;

internal sealed record UpdateOrganizationMemberRoleRequest(
    OrganizationMemberRole Role
);
