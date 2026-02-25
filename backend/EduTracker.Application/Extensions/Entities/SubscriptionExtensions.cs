using EduTracker.Application.Features.Subscriptions.Models;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Application.Extensions.Entities;

internal static class OrganizationSubscriptionExtensions
{
    extension(OrganizationSubscription subscription)
    {
        public OrganizationSubscriptionResponse ToSubscriptionResponse() => new(
            subscription.Id,
            subscription.OrganizationId,
            subscription.PlanId,
            subscription.StartsAt,
            subscription.EndsAt,
            subscription.AutoRenew,
            subscription.CancelledAt,
            subscription.IsActive(),
            subscription.IsExpired(),
            subscription.IsCancelled()
        );
    }
}
