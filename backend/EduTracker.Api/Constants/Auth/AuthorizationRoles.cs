using EduTracker.Domain.Entities.Security;

namespace EduTracker.Api.Constants.Auth;

internal static class AuthorizationRoles
{
    public const string User = RoleKeys.User;
    public const string Admin = RoleKeys.Admin;
    public const string SuperAdmin = RoleKeys.SuperAdmin;
}
