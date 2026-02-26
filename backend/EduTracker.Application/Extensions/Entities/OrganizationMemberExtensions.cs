using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Application.Extensions.Entities;

internal static class OrganizationMemberExtensions
{
    extension(OrganizationMember member)
    {
        public OrganizationMemberResponse ToOrganizationMemberResponse() => new(
            member.Id,
            member.UserId,
            member.Role,
            member.Status,
            member.CreatedAt
        );
    }
}
