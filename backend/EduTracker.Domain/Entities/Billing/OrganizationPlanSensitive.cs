using System.Text.Json.Serialization;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Billing;

public sealed class OrganizationPlanSensitive : ISensitiveData
{
    [JsonConstructor]
    private OrganizationPlanSensitive(
        int maxStudents,
        int maxTeachers,
        int maxClassOfferingsPerYear,
        int maxAcademicYears,
        int storageMb,
        bool enableAdvancedGrading,
        bool enableTranscriptExport,
        bool enableCustomGradeScale,
        bool enableMultiYearArchive,
        bool enableApiAccess
    )
    {
        MaxStudents = maxStudents;
        MaxTeachers = maxTeachers;
        MaxClassOfferingsPerYear = maxClassOfferingsPerYear;
        MaxAcademicYears = maxAcademicYears;
        StorageMb = storageMb;
        EnableAdvancedGrading = enableAdvancedGrading;
        EnableTranscriptExport = enableTranscriptExport;
        EnableCustomGradeScale = enableCustomGradeScale;
        EnableMultiYearArchive = enableMultiYearArchive;
        EnableApiAccess = enableApiAccess;
    }

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

    public static OrganizationPlanSensitive Create(
        int maxStudents,
        int maxTeachers,
        int maxClassOfferingsPerYear,
        int maxAcademicYears,
        int storageMb,
        bool enableAdvancedGrading,
        bool enableTranscriptExport,
        bool enableCustomGradeScale,
        bool enableMultiYearArchive,
        bool enableApiAccess
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

        return new OrganizationPlanSensitive(
            maxStudents,
            maxTeachers,
            maxClassOfferingsPerYear,
            maxAcademicYears,
            storageMb,
            enableAdvancedGrading,
            enableTranscriptExport,
            enableCustomGradeScale,
            enableMultiYearArchive,
            enableApiAccess
        );
    }
}
