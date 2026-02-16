using EduTracker.Domain.Enums;

namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.UpdateOrganizationSubscription;

internal sealed record UpdateOrganizationSubscriptionRequest(
    SubscriptionPlan? Plan,
    DateTime? CurrentPeriodStart,
    DateTime? CurrentPeriodEnd
);
