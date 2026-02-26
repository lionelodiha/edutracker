namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.UpdateOrganizationSubscription;

internal sealed record UpdateOrganizationSubscriptionRequest(
    Guid? PlanId,
    DateTime? StartsAt,
    DateTime? EndsAt,
    bool? AutoRenew
);
