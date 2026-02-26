namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.CreateOrganizationSubscription;

internal sealed record CreateOrganizationSubscriptionRequest(
    Guid PlanId,
    DateTime StartsAt,
    DateTime? EndsAt,
    bool AutoRenew
);
