namespace EduTracker.Application.Services;

public interface IPaymentService
{
    Task<PaymentServiceResult> CreateSubscriptionAsync(CreatePaymentSubscriptionRequest request, CancellationToken cancellationToken = default);
    Task<PaymentServiceResult> UpdateSubscriptionAsync(UpdatePaymentSubscriptionRequest request, CancellationToken cancellationToken = default);
    Task<PaymentServiceResult> CancelSubscriptionAsync(CancelPaymentSubscriptionRequest request, CancellationToken cancellationToken = default);
}

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

public sealed record CancelPaymentSubscriptionRequest(
    Guid OrganizationId,
    Guid SubscriptionId,
    string Provider,
    string ProviderCustomerId
);

public sealed record PaymentServiceResult(
    bool Succeeded,
    string? ProviderSubscriptionId,
    string? Error
);
