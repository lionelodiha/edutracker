namespace EduTracker.Application.Services;

public interface IPaymentService
{
    Task<bool> ProcessPaymentAsync(Guid organizationId, decimal amount, string currency, string paymentMethodId, CancellationToken cancellationToken = default);
}
