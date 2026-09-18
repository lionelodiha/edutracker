using EduTracker.Application.Configurations.Organizations;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.OrganizationInvites.InviteOrganizationMember;

internal sealed class InviteOrganizationMemberCommandHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<OrganizationInviteOptions> inviteOptions
) : IHandler<InviteOrganizationMemberCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(InviteOrganizationMemberCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool organizationExists = await db.Organizations
            .AnyAsync(o => o.Id == message.OrganizationId, cancellationToken);

        if (!organizationExists)
            throw ResponseCatalog.Organization.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        bool isActive = actor?.Status == OrganizationMemberStatus.Active;
        bool isPrivilegedRole = actor?.Role is OrganizationMemberRole.Owner or OrganizationMemberRole.Moderator;

        if (!isActive || !isPrivilegedRole)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        Guid targetUserId;

        if (message.UserId.HasValue)
        {
            bool targetExists = await db.Users.AnyAsync(u => u.Id == message.UserId.Value, cancellationToken);
            if (!targetExists)
                throw ResponseCatalog.User.NotFound.ToException();
            targetUserId = message.UserId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(message.UserName))
        {
            string normalizedUserName = message.UserName.Trim().ToLowerInvariant();
            Guid foundId = await db.Users
                .Where(u => u.UserName.ToLower() == normalizedUserName)
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (foundId == default)
                throw ResponseCatalog.User.NotFound.ToException();
            targetUserId = foundId;
        }
        else
        {
            throw ResponseCatalog.User.NotFound.ToException();
        }

        bool alreadyMember = await db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == targetUserId, cancellationToken);

        if (alreadyMember)
            throw ResponseCatalog.Organization.AlreadyMember.ToException();

        DateTime now = DateTime.UtcNow;

        OrganizationInvite? existingInvite = await db.OrganizationInvites
            .FirstOrDefaultAsync(
                i => i.OrganizationId == message.OrganizationId
                    && i.InvitedUserId == targetUserId
                    && i.Status == OrganizationInviteStatus.Pending,
                cancellationToken
            );

        if (existingInvite is not null)
        {
            if (existingInvite.ExpiresAt <= now)
            {
                existingInvite.UpdateStatus(OrganizationInviteStatus.Expired);
                await db.SaveChangesAsync(cancellationToken);
            }
            else
            {
                throw ResponseCatalog.Organization.InviteAlreadyResponded.ToException();
            }
        }

        int expiryDays = inviteOptions.Value.ExpiryDays;
        DateTime expiresAt = now.AddDays(expiryDays);

        OrganizationInvite invite = new(
            organizationId: message.OrganizationId,
            invitedUserId: targetUserId,
            invitedByUserId: message.ActorId.Value,
            expiresAt: expiresAt
        );

        db.OrganizationInvites.Add(invite);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));

        return ResponseCatalog.Organization.MemberInvited
            .As<Guid>()
            .WithData(invite.Id)
            .ToOperationResult();
    }
}
