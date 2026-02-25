using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Subscriptions.CancelOrganizationSubscription;

public sealed class CancelOrganizationSubscriptionCommandHandler(
    AppDbContext db
) : IHandler<CancelOrganizationSubscriptionCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(CancelOrganizationSubscriptionCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Admin)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        var subscription = await db.OrganizationSubscriptions
            .Where(s => s.OrganizationId == message.OrganizationId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Subscription.NotFound.ToException();

        subscription.UpdateStatus(SubscriptionStatus.Canceled);

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Subscription.Canceled.ToOperationResult();
    }
}
