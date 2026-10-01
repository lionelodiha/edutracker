using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.DeleteOrganization;

internal sealed class DeleteOrganizationCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteOrganizationCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteOrganizationCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        if (actor is null || actor.Status is not OrganizationMemberStatus.Active || actor.Role is not OrganizationMemberRole.Owner)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        Organization organization = await db.Organizations
            .FirstOrDefaultAsync(o => o.Id == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        db.Organizations.Remove(organization);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.OrganizationById(message.OrganizationId));
        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));

        return ResponseCatalog.Organization.Deleted.ToOperationResult();
    }
}
