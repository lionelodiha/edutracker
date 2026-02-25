using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Subscriptions.UpdateOrganizationSubscription;

public sealed class UpdateOrganizationSubscriptionCommandHandler(
    AppDbContext db
) : IHandler<UpdateOrganizationSubscriptionCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateOrganizationSubscriptionCommand message, CancellationToken cancellationToken = default)
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

        if (message.Plan is not null)
            subscription.UpdatePlan(message.Plan.Value);

        if (message.CurrentPeriodStart is not null && message.CurrentPeriodEnd is not null)
            subscription.UpdatePeriod(message.CurrentPeriodStart.Value, message.CurrentPeriodEnd.Value);

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Subscription.Updated.ToOperationResult();
    }
}
