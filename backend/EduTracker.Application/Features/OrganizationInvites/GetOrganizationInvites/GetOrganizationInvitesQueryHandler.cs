using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.OrganizationInvites.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.OrganizationInvites.GetOrganizationInvites;

internal sealed class GetOrganizationInvitesQueryHandler(
    AppDbContext db
) : IHandler<GetOrganizationInvitesQuery, OperationResult<IReadOnlyList<OrganizationInviteResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<OrganizationInviteResponse>>> Handle(GetOrganizationInvitesQuery message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(
                m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        bool isActive = actor?.Status is OrganizationMemberStatus.Active;
        bool isPrivileged = actor?.Role is OrganizationMemberRole.Owner or OrganizationMemberRole.Moderator;

        if (!isActive || !isPrivileged)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        List<OrganizationInvite> invites = await db.OrganizationInvites
            .Include(i => i.Organization)
            .Where(i => i.OrganizationId == message.OrganizationId && i.Status == OrganizationInviteStatus.Pending)
            .ToListAsync(cancellationToken);

        DateTime now = DateTime.UtcNow;
        bool updated = false;

        foreach (OrganizationInvite invite in invites)
        {
            if (invite.ExpiresAt <= now)
            {
                invite.UpdateStatus(OrganizationInviteStatus.Expired);
                updated = true;
            }
        }

        if (updated)
            await db.SaveChangesAsync(cancellationToken);

        List<OrganizationInviteResponse> response = [.. invites
            .Where(invite => invite.Status == OrganizationInviteStatus.Pending)
            .Select(invite => new OrganizationInviteResponse(
                invite.Id,
                invite.OrganizationId,
                invite.Organization.Name,
                invite.InvitedUserId,
                invite.InvitedByUserId,
                invite.Status,
                invite.ExpiresAt,
                invite.CreatedAt
            ))];

        return ResponseCatalog.Organization.InvitesRetrieved
            .As<IReadOnlyList<OrganizationInviteResponse>>()
            .WithData(response)
            .ToOperationResult();
    }
}
