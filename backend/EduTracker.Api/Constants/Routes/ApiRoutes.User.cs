namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class User
    {
        public const string Base = $"{ApiBasePath}/users";

        public const string List = "";
        public const string GetById = "/{id:guid}";
        public const string Me = "/me";
        public const string MePassword = "/me/password";
        public const string Promote = "/{id:guid}/promote";
        public const string Demote = "/{id:guid}/demote";
        public const string Lock = "/{id:guid}/lock";
        public const string Unlock = "/{id:guid}/unlock";
    }
}
