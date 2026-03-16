using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.RemoveOrganizationMember;

internal sealed class RemoveOrganizationMemberCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<RemoveOrganizationMemberCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(RemoveOrganizationMemberCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        if (actor is null || actor.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationMember member = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.Id == message.MemberId && m.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Organization.MemberNotFound.ToException();

        bool isSelf = actor.Id == member.Id;

        if (isSelf)
        {
            if (member.Role == OrganizationMemberRole.Owner)
                throw ResponseCatalog.Organization.CannotRemoveOwner.ToException();

            db.OrganizationMembers.Remove(member);
        }
        else
        {
            if (member.Role == OrganizationMemberRole.Owner)
                throw ResponseCatalog.Organization.CannotRemoveOwner.ToException();

            if (GetRoleRank(actor.Role) <= GetRoleRank(member.Role))
                throw ResponseCatalog.Organization.CannotRemoveSuperior.ToException();

            db.OrganizationMembers.Remove(member);
        }

        await db.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));

        return ResponseCatalog.Organization.MemberRemoved.ToOperationResult();
    }

    private static int GetRoleRank(OrganizationMemberRole role) => role switch
    {
        OrganizationMemberRole.Member => 1,
        OrganizationMemberRole.Moderator => 2,
        OrganizationMemberRole.Owner => 3,
        _ => 0,
    };
}
