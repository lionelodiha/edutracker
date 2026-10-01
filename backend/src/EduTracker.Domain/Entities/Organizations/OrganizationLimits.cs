using System.Text.RegularExpressions;

namespace EduTracker.Domain.Entities.Organizations;

public static partial class OrganizationLimits
{
    public const int NameMinLength = 3;
    public const int NameMaxLength = 50;

    [GeneratedRegex(@"^[a-zA-Z0-9\-\.\'\&\,\(\)\/]+(?:\s[a-zA-Z0-9\-\.\'\&\,\(\)\/]+)*$")]
    public static partial Regex NameRegex();

    public const int PlanNameMinLength = 1;
    public const int PlanNameMaxLength = 100;

    [GeneratedRegex(@"^[a-zA-Z0-9\-]+(?:\s[a-zA-Z0-9\-]+)*$")]
    public static partial Regex PlanNameRegex();

    public const int ProviderMaxLength = 100;

    [GeneratedRegex(@"^[a-zA-Z0-9\-\.]+(?:\s[a-zA-Z0-9\-\.]+)*$")]
    public static partial Regex ProviderRegex();

    public const int BrandMinLength = 1;
    public const int BrandMaxLength = 50;

    [GeneratedRegex(@"^[a-zA-Z]+(?:\s[a-zA-Z]+)*$")]
    public static partial Regex BrandRegex();

    public const int MemberRoleMaxLength = 20;
    public const int MemberStatusMaxLength = 20;
    public const int InviteStatusMaxLength = 20;
}
