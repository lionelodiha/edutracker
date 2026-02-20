using EduTracker.Application.Services;
using Microsoft.Extensions.Logging;

namespace EduTracker.Infrastructure.Services;

public sealed class FakePaymentService(ILogger<FakePaymentService> logger) : IPaymentService
{
    public Task<bool> ProcessPaymentAsync(Guid organizationId, decimal amount, string currency, string paymentMethodId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Processing fake payment of {Amount} {Currency} for organization {OrganizationId} with method {PaymentMethodId}", amount, currency, organizationId, paymentMethodId);

        return Task.FromResult(true);
    }
}
