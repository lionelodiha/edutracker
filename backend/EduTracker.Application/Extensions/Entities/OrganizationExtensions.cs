using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Application.Extensions.Entities;

internal static class OrganizationExtensions
{
    public static OrganizationResponse ToOrganizationResponse(this Organization organization)
        => new(
            organization.Id,
            organization.Name,
            organization.OwnerUserId,
            organization.CreatedAt
        );

    public static OrganizationMemberResponse ToOrganizationMemberResponse(this OrganizationMember member)
        => new(
            member.Id,
            member.UserId,
            member.RoleAssignments
                .Where(ra => ra.IsActive && !ra.IsExpired())
                .Select(ra => ra.Role.Key)
                .ToList(),
            member.Status
        );
}
