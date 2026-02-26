namespace EduTracker.Application.Models;

public sealed record CancelPaymentSubscriptionRequest(
    Guid OrganizationId,
    Guid SubscriptionId,
    string Provider,
    string ProviderCustomerId
);
