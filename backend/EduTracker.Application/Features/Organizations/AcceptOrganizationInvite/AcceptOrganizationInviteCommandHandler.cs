using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.AcceptOrganizationInvite;

internal sealed class AcceptOrganizationInviteCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<AcceptOrganizationInviteCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(AcceptOrganizationInviteCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationInvite invite = await db.OrganizationInvites
            .FirstOrDefaultAsync(
                i => i.Id == message.InviteId && i.InvitedUserId == message.ActorId.Value,
                cancellationToken
            )
            ?? throw ResponseCatalog.Organization.InviteNotFound.ToException();

        if (invite.Status is not OrganizationInviteStatus.Pending)
            throw ResponseCatalog.Organization.InviteAlreadyResponded.ToException();

        DateTime now = DateTime.UtcNow;

        if (invite.ExpiresAt <= now)
        {
            invite.UpdateStatus(OrganizationInviteStatus.Expired);
            await db.SaveChangesAsync(cancellationToken);

            throw ResponseCatalog.Organization.InviteExpired.ToException();
        }

        bool alreadyMember = await db.OrganizationMembers
            .AnyAsync(
                m => m.OrganizationId == invite.OrganizationId && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        if (alreadyMember)
            throw ResponseCatalog.Organization.AlreadyMember.ToException();

        OrganizationMember member = new(
            organizationId: invite.OrganizationId,
            userId: message.ActorId.Value
        );

        member.UpdateStatus(OrganizationMemberStatus.Active);
        invite.UpdateStatus(OrganizationInviteStatus.Accepted);

        db.OrganizationMembers.Add(member);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(invite.OrganizationId));

        return ResponseCatalog.Organization.InviteAccepted.ToOperationResult();
    }
}
