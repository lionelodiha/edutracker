namespace EduTracker.Application.Models;

public sealed record UpdatePaymentSubscriptionRequest(
    Guid OrganizationId,
    Guid SubscriptionId,
    Guid PlanId,
    DateTime StartsAt,
    DateTime? EndsAt,
    bool AutoRenew,
    string Provider,
    string ProviderCustomerId,
    string ProviderPaymentMethodId
);
