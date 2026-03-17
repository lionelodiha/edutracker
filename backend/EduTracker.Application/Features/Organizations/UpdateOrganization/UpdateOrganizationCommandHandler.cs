using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.UpdateOrganization;

internal sealed class UpdateOrganizationCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UpdateOrganizationCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateOrganizationCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        Organization organization = await db.Organizations
            .FirstOrDefaultAsync(o => o.Id == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        if (organization.IsLocked)
            throw ResponseCatalog.Organization.Locked.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.OrganizationId == organization.Id && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Owner)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        organization.SetName(message.Name);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.OrganizationById(message.OrganizationId));

        return ResponseCatalog.Organization.Updated.ToOperationResult();
    }
}
