using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Application.Extensions.Entities;

internal static class OrganizationExtensions
{
    extension(Organization organization)
    {
        public OrganizationResponse ToOrganizationResponse()
            => new(
                organization.Id,
                organization.Name,
                organization.OwnerUserId,
                organization.CreatedAt
            );
    }

    extension(OrganizationMember member)
    {
        public OrganizationMemberResponse ToOrganizationMemberResponse()
            => new(
                member.Id,
                member.UserId,
                member.Role,
                member.Status,
                member.CreatedAt
            );
    }
}
