namespace EduTracker.Application.Models;

public sealed record CreatePaymentSubscriptionRequest(
    Guid OrganizationId,
    Guid PlanId,
    DateTime StartsAt,
    DateTime? EndsAt,
    bool AutoRenew,
    string Provider,
    string ProviderCustomerId,
    string ProviderPaymentMethodId
);
