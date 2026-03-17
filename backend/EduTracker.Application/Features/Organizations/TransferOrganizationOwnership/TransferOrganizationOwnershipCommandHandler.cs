using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.TransferOrganizationOwnership;

internal sealed class TransferOrganizationOwnershipCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<TransferOrganizationOwnershipCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(TransferOrganizationOwnershipCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        Organization organization = await db.Organizations
            .FirstOrDefaultAsync(o => o.Id == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.OrganizationId == organization.Id && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Owner)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationMember member = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.Id == message.MemberId && m.OrganizationId == organization.Id,
                cancellationToken
            )
            ?? throw ResponseCatalog.Organization.MemberNotFound.ToException();

        if (member.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Organization.MemberNotFound.ToException();

        if (member.Role == OrganizationMemberRole.Owner)
            throw ResponseCatalog.Organization.AlreadyOwner.ToException();

        OrganizationMemberRole previousMemberRole = member.Role;

        member.UpdateRole(OrganizationMemberRole.Owner);
        actor.UpdateRole(previousMemberRole);
        organization.TransferOwnership(member.UserId);

        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.OrganizationById(message.OrganizationId));
        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));

        return ResponseCatalog.Organization.OwnershipTransferred.ToOperationResult();
    }
}
