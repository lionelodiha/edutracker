using EduTracker.Domain.Enums;

namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.CreateOrganizationSubscription;

internal sealed record CreateOrganizationSubscriptionRequest(
    SubscriptionPlan Plan,
    DateTime? TrialEndsAt,
    DateTime CurrentPeriodStart,
    DateTime CurrentPeriodEnd
);
