using EduTracker.Application.Features.Subscriptions.Models;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Application.Extensions.Entities;

internal static class SubscriptionExtensions
{
    extension(OrganizationSubscription subscription)
    {
        public OrganizationSubscriptionResponse ToSubscriptionResponse()
            => new(
                subscription.Id,
                subscription.OrganizationId,
                subscription.OwnerUserId,
                subscription.Plan,
                subscription.Status,
                subscription.TrialEndsAt,
                subscription.CurrentPeriodStart,
                subscription.CurrentPeriodEnd
            );
    }
}
