using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.RejectOrganizationInvite;

internal sealed class RejectOrganizationInviteCommandHandler(
    AppDbContext db
) : IHandler<RejectOrganizationInviteCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(RejectOrganizationInviteCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationInvite invite = await db.OrganizationInvites
            .FirstOrDefaultAsync(
                i => i.Id == message.InviteId && i.InvitedUserId == message.ActorId.Value,
                cancellationToken
            )
            ?? throw ResponseCatalog.Organization.InviteNotFound.ToException();

        if (invite.Status != OrganizationInviteStatus.Pending)
            throw ResponseCatalog.Organization.InviteAlreadyResponded.ToException();

        DateTime now = DateTime.UtcNow;

        if (invite.ExpiresAt <= now)
        {
            invite.UpdateStatus(OrganizationInviteStatus.Expired);
            await db.SaveChangesAsync(cancellationToken);

            throw ResponseCatalog.Organization.InviteExpired.ToException();
        }

        invite.UpdateStatus(OrganizationInviteStatus.Rejected);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Organization.InviteRejected.ToOperationResult();
    }
}
