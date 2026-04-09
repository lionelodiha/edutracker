using EduTracker.Application.Constants.Responses;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Helpers;

internal static class OrganizationAccessHelper
{
    public static async Task EnsureActorIsActiveMemberAsync(
        AppDbContext db,
        Guid? actorId,
        Guid organizationId,
        CancellationToken cancellationToken = default
    )
    {
        if (actorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool isActiveMember = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == organizationId
                    && item.UserId == actorId.Value
                    && item.Status == OrganizationMemberStatus.Active,
                cancellationToken
            );

        if (!isActiveMember)
            throw ResponseCatalog.Authorization.Forbidden.ToException();
    }

    public static async Task EnsureActorCanManageOrganizationAsync(
        AppDbContext db,
        Guid? actorId,
        Guid organizationId,
        CancellationToken cancellationToken = default
    )
    {
        if (actorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var organizationState = await db.Organizations
            .AsNoTracking()
            .Where(item => item.Id == organizationId)
            .Select(item => new { item.IsLocked })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        if (organizationState.IsLocked)
            throw ResponseCatalog.Organization.Locked.ToException();

        bool canManage = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == organizationId
                    && item.UserId == actorId.Value
                    && item.Status == OrganizationMemberStatus.Active
                    && (item.Role == OrganizationMemberRole.Owner || item.Role == OrganizationMemberRole.Moderator),
                cancellationToken
            );

        if (!canManage)
            throw ResponseCatalog.Authorization.Forbidden.ToException();
    }

    public static async Task EnsureOrganizationIsAvailableAsync(
        AppDbContext db,
        Guid organizationId,
        CancellationToken cancellationToken = default
    )
    {
        var organizationState = await db.Organizations
            .AsNoTracking()
            .Where(item => item.Id == organizationId)
            .Select(item => new { item.IsLocked })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        if (organizationState.IsLocked)
            throw ResponseCatalog.Organization.Locked.ToException();
    }

    public static async Task<OrganizationMember> GetOrCreateActiveMemberAsync(
        AppDbContext db,
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken = default
    )
    {
        OrganizationMember? existingMember = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                item => item.OrganizationId == organizationId && item.UserId == userId,
                cancellationToken
            );

        if (existingMember is null)
        {
            OrganizationMember newMember = new(organizationId, userId);
            db.OrganizationMembers.Add(newMember);
            return newMember;
        }

        if (existingMember.Status is not OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        return existingMember;
    }
}
