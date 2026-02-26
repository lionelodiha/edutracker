using EduTracker.Application.Models;

namespace EduTracker.Application.Services;

public interface IPaymentService
{
    Task<PaymentServiceResult> CreateSubscriptionAsync(CreatePaymentSubscriptionRequest request, CancellationToken cancellationToken = default);
    Task<PaymentServiceResult> UpdateSubscriptionAsync(UpdatePaymentSubscriptionRequest request, CancellationToken cancellationToken = default);
    Task<PaymentServiceResult> CancelSubscriptionAsync(CancelPaymentSubscriptionRequest request, CancellationToken cancellationToken = default);
}
