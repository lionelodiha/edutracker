using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.OrganizationInvites.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.OrganizationInvites.GetUserInvites;

internal sealed class GetUserInvitesQueryHandler(
    AppDbContext db
) : IHandler<GetUserInvitesQuery, OperationResult<IReadOnlyList<UserOrganizationInviteResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<UserOrganizationInviteResponse>>> Handle(GetUserInvitesQuery message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        List<OrganizationInvite> invites = await db.OrganizationInvites
            .Include(i => i.Organization)
            .Include(i => i.InvitedByUser)
            .Where(i => i.InvitedUserId == message.UserId.Value && i.Status == OrganizationInviteStatus.Pending)
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

        List<UserOrganizationInviteResponse> response = [.. invites
            .Where(invite => invite.Status == OrganizationInviteStatus.Pending)
            .Select(invite => new UserOrganizationInviteResponse(
                invite.Id,
                invite.OrganizationId,
                invite.Organization.Name,
                invite.InvitedByUser.UserName,
                invite.ExpiresAt,
                invite.CreatedAt
            ))];

        return ResponseCatalog.Organization.InvitesRetrieved
            .As<IReadOnlyList<UserOrganizationInviteResponse>>()
            .WithData(response)
            .ToOperationResult();
    }
}
