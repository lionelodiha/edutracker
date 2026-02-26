using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganizationMemberRole;

internal sealed record UpdateOrganizationMemberRoleRequest(
    OrganizationMemberRole Role
);
