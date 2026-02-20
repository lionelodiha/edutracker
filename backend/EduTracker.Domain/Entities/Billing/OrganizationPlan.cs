using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Enums;

namespace EduTracker.Domain.Entities.Billing;

public sealed class OrganizationPlan : IEntity, IAuditable, IHasSensitiveData<OrganizationPlanSensitive>
{
    public readonly AuditState AuditState = new();
    public readonly SensitiveDataState<OrganizationPlanSensitive> SensitiveDataState = new();

    private OrganizationPlan() { }

    public OrganizationPlan(
        string name,
        string? description,
        int maxStudents,
        int maxTeachers,
        int maxClassOfferingsPerYear,
        int maxAcademicYears,
        int storageMb,
        bool enableAdvancedGrading,
        bool enableTranscriptExport,
        bool enableCustomGradeScale,
        bool enableMultiYearArchive,
        bool enableApiAccess,
        bool isActive = true
    )
    {
        SetName(name);
        SetDescription(description);
        SetLimits(maxStudents, maxTeachers, maxClassOfferingsPerYear, maxAcademicYears, storageMb);

        EnableAdvancedGrading = enableAdvancedGrading;
        EnableTranscriptExport = enableTranscriptExport;
        EnableCustomGradeScale = enableCustomGradeScale;
        EnableMultiYearArchive = enableMultiYearArchive;
        EnableApiAccess = enableApiAccess;
        IsActive = isActive;
        RefreshSensitiveSnapshot();

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public byte[] EncryptedData => SensitiveDataState.EncryptedData;
    public OrganizationPlanSensitive? SensitiveData => SensitiveDataState.SensitiveData;

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    public int MaxStudents { get; private set; }
    public int MaxTeachers { get; private set; }
    public int MaxClassOfferingsPerYear { get; private set; }
    public int MaxAcademicYears { get; private set; }
    public int StorageMb { get; private set; }

    public bool EnableAdvancedGrading { get; private set; }
    public bool EnableTranscriptExport { get; private set; }
    public bool EnableCustomGradeScale { get; private set; }
    public bool EnableMultiYearArchive { get; private set; }
    public bool EnableApiAccess { get; private set; }

    public bool IsActive { get; private set; } = true;

    public ICollection<OrganizationSubscription> Subscriptions { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Plan name is required.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }

    public void SetDescription(string? newDescription)
    {
        Description = string.IsNullOrWhiteSpace(newDescription) ? null : newDescription.Trim();
        AuditState.UpdateAudit();
    }

    public void SetLimits(
        int maxStudents,
        int maxTeachers,
        int maxClassOfferingsPerYear,
        int maxAcademicYears,
        int storageMb
    )
    {
        if (maxStudents < 0)
            throw new ArgumentOutOfRangeException(nameof(maxStudents), "MaxStudents cannot be negative.");

        if (maxTeachers < 0)
            throw new ArgumentOutOfRangeException(nameof(maxTeachers), "MaxTeachers cannot be negative.");

        if (maxClassOfferingsPerYear < 0)
            throw new ArgumentOutOfRangeException(nameof(maxClassOfferingsPerYear), "MaxClassOfferingsPerYear cannot be negative.");

        if (maxAcademicYears < 0)
            throw new ArgumentOutOfRangeException(nameof(maxAcademicYears), "MaxAcademicYears cannot be negative.");

        if (storageMb < 0)
            throw new ArgumentOutOfRangeException(nameof(storageMb), "StorageMb cannot be negative.");

        MaxStudents = maxStudents;
        MaxTeachers = maxTeachers;
        MaxClassOfferingsPerYear = maxClassOfferingsPerYear;
        MaxAcademicYears = maxAcademicYears;
        StorageMb = storageMb;

        RefreshSensitiveSnapshot();

        AuditState.UpdateAudit();
    }

    public void SetFeatureFlag(FeatureFlag featureFlag, bool enabled)
    {
        switch (featureFlag)
        {
            case FeatureFlag.AdvancedGrading:
                EnableAdvancedGrading = enabled;
                break;
            case FeatureFlag.TranscriptExport:
                EnableTranscriptExport = enabled;
                break;
            case FeatureFlag.CustomGradeScale:
                EnableCustomGradeScale = enabled;
                break;
            case FeatureFlag.MultiYearArchive:
                EnableMultiYearArchive = enabled;
                break;
            case FeatureFlag.ApiAccess:
                EnableApiAccess = enabled;
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(featureFlag), featureFlag, "Unknown feature flag.");
        }

        RefreshSensitiveSnapshot();

        AuditState.UpdateAudit();
    }

    public void SetEncryptedData(byte[] data)
    {
        ArgumentNullException.ThrowIfNull(data);

        if (data.Length == 0)
            throw new ArgumentException("Data cannot be empty.", nameof(data));

        SensitiveDataState.SetEncryptedData(data);
        AuditState.UpdateAudit();
    }

    public void SetSensitiveData(OrganizationPlanSensitive data) => SensitiveDataState.SetSensitiveData(data);
    public void ClearSensitiveData() => SensitiveDataState.ClearSensitiveData();

    private void RefreshSensitiveSnapshot()
        => SetSensitiveData(
            OrganizationPlanSensitive.Create(
                MaxStudents,
                MaxTeachers,
                MaxClassOfferingsPerYear,
                MaxAcademicYears,
                StorageMb,
                EnableAdvancedGrading,
                EnableTranscriptExport,
                EnableCustomGradeScale,
                EnableMultiYearArchive,
                EnableApiAccess
            )
        );

    public void Activate()
    {
        if (IsActive) return;

        IsActive = true;
        AuditState.UpdateAudit();
    }

    public void Deactivate()
    {
        if (!IsActive) return;

        IsActive = false;
        AuditState.UpdateAudit();
    }
}
