using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Subscriptions.Models;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Subscriptions.GetOrganizationSubscription;

public sealed class GetOrganizationSubscriptionQueryHandler(
    AppDbContext db
) : IHandler<GetOrganizationSubscriptionQuery, OperationResult<OrganizationSubscriptionResponse>>
{
    public async Task<OperationResult<OrganizationSubscriptionResponse>> Handle(GetOrganizationSubscriptionQuery message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        var subscription = await db.OrganizationSubscriptions
            .AsNoTracking()
            .Where(s => s.OrganizationId == message.OrganizationId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Subscription.NotFound.ToException();

        return ResponseCatalog.Subscription.Retrieved
            .As<OrganizationSubscriptionResponse>()
            .WithData(subscription.ToSubscriptionResponse())
            .ToOperationResult();
    }
}
