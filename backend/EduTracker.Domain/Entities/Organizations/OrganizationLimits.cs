using System.Text.RegularExpressions;

namespace EduTracker.Domain.Entities.Organizations;

public static partial class OrganizationLimits
{
    public const int NameMinLength = 3;
    public const int NameMaxLength = 50;

    [GeneratedRegex(@"^[a-zA-Z0-9\s\-\.\'\&\,\(\)\/]+$")]
    public static partial Regex NameRegex();
}
