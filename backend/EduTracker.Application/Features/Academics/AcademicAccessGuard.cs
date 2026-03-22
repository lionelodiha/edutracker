using EduTracker.Application.Constants.Responses;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics;

internal static class AcademicAccessGuard
{
    public static async Task EnsureActiveMember(
        AppDbContext db,
        Guid organizationId,
        Guid? userId,
        CancellationToken cancellationToken
    )
    {
        if (userId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool isActiveMember = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                member => member.OrganizationId == organizationId
                    && member.UserId == userId.Value
                    && member.Status == OrganizationMemberStatus.Active,
                cancellationToken
            );

        if (!isActiveMember)
            throw ResponseCatalog.Authorization.Forbidden.ToException();
    }

    public static async Task EnsureCanManage(
        AppDbContext db,
        Guid organizationId,
        Guid? actorId,
        CancellationToken cancellationToken
    )
    {
        if (actorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        Organization organization = await db.Organizations
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        if (organization.IsLocked)
            throw ResponseCatalog.Organization.Locked.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                member => member.OrganizationId == organizationId && member.UserId == actorId.Value,
                cancellationToken
            );

        if (actor is null
            || actor.Status != OrganizationMemberStatus.Active
            || actor.Role is not (OrganizationMemberRole.Owner or OrganizationMemberRole.Moderator))
        {
            throw ResponseCatalog.Authorization.Forbidden.ToException();
        }
    }
}
