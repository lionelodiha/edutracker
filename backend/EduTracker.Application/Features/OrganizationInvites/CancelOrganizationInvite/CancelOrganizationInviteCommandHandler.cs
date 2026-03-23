using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.OrganizationInvites.CancelOrganizationInvite;

internal sealed class CancelOrganizationInviteCommandHandler(
    AppDbContext db
) : IHandler<CancelOrganizationInviteCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(CancelOrganizationInviteCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        bool isActive = actor?.Status == OrganizationMemberStatus.Active;
        bool isPrivileged = actor?.Role is OrganizationMemberRole.Owner or OrganizationMemberRole.Moderator;

        if (!isActive || !isPrivileged)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationInvite invite = await db.OrganizationInvites
            .FirstOrDefaultAsync(
                i => i.Id == message.InviteId && i.OrganizationId == message.OrganizationId,
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

        invite.UpdateStatus(OrganizationInviteStatus.Cancelled);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Organization.InviteCancelled.ToOperationResult();
    }
}
