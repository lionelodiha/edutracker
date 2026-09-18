using System.Text.RegularExpressions;

namespace EduTracker.Domain.Entities.Academics;

public static partial class AcademicLimits
{
    public const int CourseNameMinLength = 5;
    public const int CourseNameMaxLength = 150;

    [GeneratedRegex(@"^[A-Za-z\s\-\(\)]+$")]
    public static partial Regex CourseNameRegex();

    public const int CourseCodeMinLength = 3;
    public const int CourseCodeMaxLength = 20;

    [GeneratedRegex(@"^[A-Z0-9_-]+$")]
    public static partial Regex CourseCodeRegex();

    public const int DepartmentNameMinLength = 2;
    public const int DepartmentNameMaxLength = 100;

    [GeneratedRegex(@"^[A-Za-z0-9\s\-\&\(\)]+$")]
    public static partial Regex DepartmentNameRegex();

    public const int DepartmentDescriptionMaxLength = 500;

    public const int MinTermNumber = 1;
    public const int MaxTermNumber = 3;

    public const int MaxPastYears = 30;
    public const int MaxFutureYears = 5;
}
