using System.Text.RegularExpressions;

namespace EduTracker.Domain.Entities.Organizations;

public partial class OrganizationLimits
{
    public const int NameMinLength = 1;
    public const int NameMaxLength = 60;
    public const int SlugMinLength = 3;
    public const int SlugMaxLength = 80;

    [GeneratedRegex(@"^[a-zA-Z0-9 '-]+$")]
    public static partial Regex NameRegex();

    [GeneratedRegex(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public static partial Regex SlugRegex();
}
