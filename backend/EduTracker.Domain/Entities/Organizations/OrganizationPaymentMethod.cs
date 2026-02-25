using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPaymentMethod : IEntity, IAuditable, IHasSensitiveData<OrganizationPaymentMethodSensitive>
{
    public readonly AuditState AuditState = new();
    public readonly SensitiveDataState<OrganizationPaymentMethodSensitive> SensitiveDataState = new();

    private OrganizationPaymentMethod() { }

    public OrganizationPaymentMethod(Guid organizationId, string provider, string brand, bool isDefault)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("Provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(brand))
            throw new ArgumentException("Brand is required.", nameof(brand));

        OrganizationId = organizationId;
        Provider = provider.Trim();
        Brand = brand.Trim();
        IsDefault = isDefault;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public byte[] EncryptedData => SensitiveDataState.EncryptedData;
    public OrganizationPaymentMethodSensitive? SensitiveData => SensitiveDataState.SensitiveData;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Provider { get; private set; } = string.Empty;
    public string Brand { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }

    public void SetEncryptedData(byte[] newData)
    {
        ArgumentNullException.ThrowIfNull(newData);

        if (newData.Length is 0)
            throw new ArgumentException("Data cannot be empty.", nameof(newData));

        SensitiveDataState.SetEncryptedData(newData);
        AuditState.UpdateAudit();
    }

    public void SetSensitiveData(OrganizationPaymentMethodSensitive data) => SensitiveDataState.SetSensitiveData(data);
    public void ClearSensitiveData() => SensitiveDataState.ClearSensitiveData();

    public void SetDefault(bool isDefault)
    {
        if (IsDefault == isDefault) return;

        IsDefault = isDefault;
        AuditState.UpdateAudit();
    }

    public void UpdateBrand(string brand)
    {
        if (string.IsNullOrWhiteSpace(brand))
            throw new ArgumentException("Brand is required.", nameof(brand));

        if (Brand == brand.Trim()) return;

        Brand = brand.Trim();
        AuditState.UpdateAudit();
    }
}
