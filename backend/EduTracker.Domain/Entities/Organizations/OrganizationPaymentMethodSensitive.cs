using System.Text.Json.Serialization;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPaymentMethodSensitive : ISensitiveData
{
    [JsonConstructor]
    private OrganizationPaymentMethodSensitive(string providerCustomerId, string providerPaymentMethodId, string last4, int expMonth, int expYear)
    {
        ProviderCustomerId = providerCustomerId;
        ProviderPaymentMethodId = providerPaymentMethodId;
        Last4 = last4;
        ExpMonth = expMonth;
        ExpYear = expYear;
    }

    public string ProviderCustomerId { get; private set; }
    public string ProviderPaymentMethodId { get; private set; }
    public string Last4 { get; private set; }
    public int ExpMonth { get; private set; }
    public int ExpYear { get; private set; }

    public static OrganizationPaymentMethodSensitive Create(string providerCustomerId, string providerPaymentMethodId, string last4, int expMonth, int expYear)
    {
        if (string.IsNullOrWhiteSpace(providerCustomerId))
            throw new ArgumentException("Provider customer id is required.", nameof(providerCustomerId));

        if (string.IsNullOrWhiteSpace(providerPaymentMethodId))
            throw new ArgumentException("Provider payment method id is required.", nameof(providerPaymentMethodId));

        if (string.IsNullOrWhiteSpace(last4) || last4.Length != 4 || !last4.All(char.IsDigit))
            throw new ArgumentException("Last4 must be exactly 4 digits.", nameof(last4));

        if (expMonth is < 1 or > 12)
            throw new ArgumentOutOfRangeException(nameof(expMonth), "ExpMonth must be between 1 and 12.");

        if (expYear < 2000)
            throw new ArgumentOutOfRangeException(nameof(expYear), "ExpYear is invalid.");

        return new OrganizationPaymentMethodSensitive(
            providerCustomerId.Trim(),
            providerPaymentMethodId.Trim(),
            last4.Trim(),
            expMonth,
            expYear
        );
    }

    public void UpdatePaymentDetails(string providerCustomerId, string providerPaymentMethodId, string last4, int expMonth, int expYear)
    {
        OrganizationPaymentMethodSensitive updated = Create(
            providerCustomerId,
            providerPaymentMethodId,
            last4,
            expMonth,
            expYear
        );

        ProviderCustomerId = updated.ProviderCustomerId;
        ProviderPaymentMethodId = updated.ProviderPaymentMethodId;
        Last4 = updated.Last4;
        ExpMonth = updated.ExpMonth;
        ExpYear = updated.ExpYear;
    }
}
