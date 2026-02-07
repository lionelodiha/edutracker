using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class PaymentMethod : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private PaymentMethod() { }

    public PaymentMethod(
        Guid organizationId,
        string provider,
        string providerCustomerId,
        string providerPaymentMethodId,
        string last4,
        string brand,
        int expMonth,
        int expYear,
        bool isDefault
    )
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("Provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(providerCustomerId))
            throw new ArgumentException("Provider customer id is required.", nameof(providerCustomerId));

        if (string.IsNullOrWhiteSpace(providerPaymentMethodId))
            throw new ArgumentException("Provider payment method id is required.", nameof(providerPaymentMethodId));

        if (string.IsNullOrWhiteSpace(last4) || last4.Length != 4)
            throw new ArgumentException("Last4 must be 4 digits.", nameof(last4));

        if (expMonth is < 1 or > 12)
            throw new ArgumentOutOfRangeException(nameof(expMonth), "ExpMonth must be between 1 and 12.");

        if (expYear < 2000)
            throw new ArgumentOutOfRangeException(nameof(expYear), "ExpYear is invalid.");

        OrganizationId = organizationId;
        Provider = provider.Trim();
        ProviderCustomerId = providerCustomerId.Trim();
        ProviderPaymentMethodId = providerPaymentMethodId.Trim();
        Last4 = last4.Trim();
        Brand = brand.Trim();
        ExpMonth = expMonth;
        ExpYear = expYear;
        IsDefault = isDefault;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Provider { get; private set; } = string.Empty;
    public string ProviderCustomerId { get; private set; } = string.Empty;
    public string ProviderPaymentMethodId { get; private set; } = string.Empty;
    public string Last4 { get; private set; } = string.Empty;
    public string Brand { get; private set; } = string.Empty;
    public int ExpMonth { get; private set; }
    public int ExpYear { get; private set; }
    public bool IsDefault { get; private set; }

    public void SetDefault(bool isDefault)
    {
        IsDefault = isDefault;
        AuditState.UpdateAudit();
    }
}
