using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPaymentMethod : IEntity, IAuditable, IHasSensitiveData<OrganizationPaymentMethodSensitive>
{
    public AuditState AuditState { get; private set; } = new();
    public SensitiveDataState<OrganizationPaymentMethodSensitive> SensitiveDataState { get; private set; } = new();

    private OrganizationPaymentMethod() { }

    public OrganizationPaymentMethod(Guid organizationId, string provider, string brand, bool isDefault)
    {
        OrganizationId = organizationId;
        Provider = ValidateProvider(provider);
        Brand = ValidateBrand(brand);
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

        if (newData.Length == 0)
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
        string validatedBrand = ValidateBrand(brand);

        if (Brand == validatedBrand) return;

        Brand = validatedBrand;
        AuditState.UpdateAudit();
    }

    private static string ValidateProvider(string provider)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("Provider is required.", nameof(provider));

        if (provider.Length > OrganizationLimits.ProviderMaxLength)
            throw new ArgumentException(
                $"Provider cannot exceed {OrganizationLimits.ProviderMaxLength} characters.",
                nameof(provider)
            );

        if (!OrganizationLimits.ProviderRegex().IsMatch(provider))
            throw new ArgumentException("Provider contains invalid characters.", nameof(provider));

        return provider;
    }

    private static string ValidateBrand(string brand)
    {
        if (string.IsNullOrWhiteSpace(brand))
            throw new ArgumentException("Brand is required.", nameof(brand));

        if (brand.Length < OrganizationLimits.BrandMinLength || brand.Length > OrganizationLimits.BrandMaxLength)
            throw new ArgumentException(
                $"Brand must be between {OrganizationLimits.BrandMinLength} and {OrganizationLimits.BrandMaxLength} characters.",
                nameof(brand)
            );

        if (!OrganizationLimits.BrandRegex().IsMatch(brand))
            throw new ArgumentException("Brand contains invalid characters.", nameof(brand));

        return brand;
    }
}
