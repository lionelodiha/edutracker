using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.OrganizationMembers.UpdateOrganizationMemberRole;

internal sealed class UpdateOrganizationMemberRoleCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UpdateOrganizationMemberRoleCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateOrganizationMemberRoleCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (message.Role == OrganizationMemberRole.Owner)
            throw ResponseCatalog.Organization.AlreadyOwner.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Owner)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationMember member = await db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.Id == message.MemberId && m.OrganizationId == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.MemberNotFound.ToException();

        if (member.Role == OrganizationMemberRole.Owner)
            throw ResponseCatalog.Organization.AlreadyOwner.ToException();

        member.UpdateRole(message.Role);

        await db.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));

        return ResponseCatalog.Organization.MemberRoleUpdated
            .ToOperationResult();
    }
}
