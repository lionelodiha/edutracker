using System.Text.Json.Serialization;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Billing;

public sealed class PaymentMethodSensitive : ISensitiveData
{
    [JsonConstructor]
    private PaymentMethodSensitive(string providerCustomerId, string providerPaymentMethodId)
    {
        ProviderCustomerId = providerCustomerId;
        ProviderPaymentMethodId = providerPaymentMethodId;
    }

    public string ProviderCustomerId { get; private set; }
    public string ProviderPaymentMethodId { get; private set; }

    public static PaymentMethodSensitive Create(string providerCustomerId, string providerPaymentMethodId)
    {
        if (string.IsNullOrWhiteSpace(providerCustomerId))
            throw new ArgumentException("Provider customer id is required.", nameof(providerCustomerId));

        if (string.IsNullOrWhiteSpace(providerPaymentMethodId))
            throw new ArgumentException("Provider payment method id is required.", nameof(providerPaymentMethodId));

        return new PaymentMethodSensitive(
            providerCustomerId.Trim(),
            providerPaymentMethodId.Trim()
        );
    }
}
