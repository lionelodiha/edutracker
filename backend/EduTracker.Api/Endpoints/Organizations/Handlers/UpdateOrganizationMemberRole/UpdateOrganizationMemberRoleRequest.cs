using EduTracker.Domain.Enums;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganizationMemberRole;

internal sealed record UpdateOrganizationMemberRoleRequest(
    OrganizationMemberRole Role
);
