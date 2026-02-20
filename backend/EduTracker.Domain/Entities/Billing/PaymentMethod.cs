using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Billing;

public sealed class PaymentMethod : IEntity, IAuditable, IHasSensitiveData<PaymentMethodSensitive>
{
    public readonly AuditState AuditState = new();
    public readonly SensitiveDataState<PaymentMethodSensitive> SensitiveDataState = new();

    private PaymentMethod() { }

    public PaymentMethod(
        Guid organizationId,
        string provider,
        string providerCustomerId,
        string providerPaymentMethodId,
        string last4,
        string? brand,
        int expMonth,
        int expYear,
        bool isDefault = false
    )
    {
        OrganizationId = organizationId;
        SetProvider(provider);
        SetProviderIdentifiers(providerCustomerId, providerPaymentMethodId);
        SetLast4(last4);
        SetBrand(brand);
        SetExpiration(expMonth, expYear);
        IsDefault = isDefault;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public byte[] EncryptedData => SensitiveDataState.EncryptedData;
    public PaymentMethodSensitive? SensitiveData => SensitiveDataState.SensitiveData;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Provider { get; private set; } = string.Empty;
    public string ProviderCustomerId { get; private set; } = string.Empty;
    public string ProviderPaymentMethodId { get; private set; } = string.Empty;
    public string Last4 { get; private set; } = string.Empty;
    public string? Brand { get; private set; }
    public int ExpMonth { get; private set; }
    public int ExpYear { get; private set; }
    public bool IsDefault { get; private set; }

    public void SetEncryptedData(byte[] data)
    {
        ArgumentNullException.ThrowIfNull(data);

        if (data.Length == 0)
            throw new ArgumentException("Data cannot be empty.", nameof(data));

        SensitiveDataState.SetEncryptedData(data);
        AuditState.UpdateAudit();
    }

    public void SetSensitiveData(PaymentMethodSensitive data) => SensitiveDataState.SetSensitiveData(data);
    public void ClearSensitiveData() => SensitiveDataState.ClearSensitiveData();

    public void SetProvider(string provider)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("Provider is required.", nameof(provider));

        Provider = provider.Trim();
        AuditState.UpdateAudit();
    }

    public void SetProviderIdentifiers(string providerCustomerId, string providerPaymentMethodId)
    {
        PaymentMethodSensitive sensitive = PaymentMethodSensitive.Create(providerCustomerId, providerPaymentMethodId);

        ProviderCustomerId = sensitive.ProviderCustomerId;
        ProviderPaymentMethodId = sensitive.ProviderPaymentMethodId;
        SetSensitiveData(sensitive);
        AuditState.UpdateAudit();
    }

    public void RedactProviderIdentifiers()
    {
        ProviderCustomerId = "***";
        ProviderPaymentMethodId = "***";
        AuditState.UpdateAudit();
    }

    public void SetLast4(string last4)
    {
        if (string.IsNullOrWhiteSpace(last4))
            throw new ArgumentException("Last4 is required.", nameof(last4));

        string normalized = last4.Trim();

        if (normalized.Length != 4 || !normalized.All(char.IsDigit))
            throw new ArgumentException("Last4 must be exactly 4 digits.", nameof(last4));

        Last4 = normalized;
        AuditState.UpdateAudit();
    }

    public void SetBrand(string? brand)
    {
        Brand = string.IsNullOrWhiteSpace(brand) ? null : brand.Trim();
        AuditState.UpdateAudit();
    }

    public void SetExpiration(int expMonth, int expYear)
    {
        if (expMonth < 1 || expMonth > 12)
            throw new ArgumentOutOfRangeException(nameof(expMonth), "Expiration month must be between 1 and 12.");

        if (expYear < DateTime.UtcNow.Year)
            throw new ArgumentOutOfRangeException(nameof(expYear), "Expiration year cannot be in the past.");

        ExpMonth = expMonth;
        ExpYear = expYear;
        AuditState.UpdateAudit();
    }

    public void SetDefault(bool isDefault)
    {
        if (IsDefault == isDefault) return;

        IsDefault = isDefault;
        AuditState.UpdateAudit();
    }
}
