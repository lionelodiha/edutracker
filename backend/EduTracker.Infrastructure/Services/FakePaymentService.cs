using EduTracker.Application.Models;
using EduTracker.Application.Services;
using Microsoft.Extensions.Logging;

namespace EduTracker.Infrastructure.Services;

internal sealed class FakePaymentService(ILogger<FakePaymentService> logger) : IPaymentService
{
    public Task<PaymentServiceResult> CreateSubscriptionAsync(CreatePaymentSubscriptionRequest request, CancellationToken cancellationToken = default)
    {
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation(
                "Fake payment create subscription. OrgId={OrganizationId}, PlanId={PlanId}, Provider={Provider}",
                request.OrganizationId,
                request.PlanId,
                request.Provider
            );

        return Task.FromResult(new PaymentServiceResult(
            Succeeded: true,
            ProviderSubscriptionId: $"fake_sub_{Guid.NewGuid():N}",
            Error: null
        ));
    }

    public Task<PaymentServiceResult> UpdateSubscriptionAsync(UpdatePaymentSubscriptionRequest request, CancellationToken cancellationToken = default)
    {
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation(
                "Fake payment update subscription. OrgId={OrganizationId}, SubscriptionId={SubscriptionId}, PlanId={PlanId}, AutoRenew={AutoRenew}",
                request.OrganizationId,
                request.SubscriptionId,
                request.PlanId,
                request.AutoRenew
            );

        return Task.FromResult(new PaymentServiceResult(
            Succeeded: true,
            ProviderSubscriptionId: $"fake_sub_{request.SubscriptionId:N}",
            Error: null
        ));
    }

    public Task<PaymentServiceResult> CancelSubscriptionAsync(CancelPaymentSubscriptionRequest request, CancellationToken cancellationToken = default)
    {
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation(
                "Fake payment cancel subscription. OrgId={OrganizationId}, SubscriptionId={SubscriptionId}, Provider={Provider}",
                request.OrganizationId,
                request.SubscriptionId,
                request.Provider
            );

        return Task.FromResult(new PaymentServiceResult(
            Succeeded: true,
            ProviderSubscriptionId: $"fake_sub_{request.SubscriptionId:N}",
            Error: null
        ));
    }
}
