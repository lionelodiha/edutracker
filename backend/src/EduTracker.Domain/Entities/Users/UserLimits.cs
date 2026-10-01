using System.Text.RegularExpressions;

namespace EduTracker.Domain.Entities.Users;

public static partial class UserLimits
{
    public const int EmailHashLength = 64;
    public const int PasswordHashLength = 60;

    public const int UserNameMinLength = 3;
    public const int UserNameMaxLength = 30;

    [GeneratedRegex(@"^[a-zA-Z0-9._]+$")]
    public static partial Regex UserNameRegex();

    public const int NameMinLength = 1;
    public const int NameMaxLength = 60;

    [GeneratedRegex(@"^[a-zA-Z'-]+$")]
    public static partial Regex NameRegex();

    public const int EmailMaxLength = 254;

    [GeneratedRegex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")]
    public static partial Regex EmailRegex();

    public const int PasswordMinLength = 8;

    [GeneratedRegex(@"^\S+$")]
    public static partial Regex PasswordNoSpacesRegex();

    public const int IdentifierMaxLength = 254;
    public const int RoleMaxLength = 20;
}
