namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Session
    {
        public const string Base = $"{ApiBasePath}/sessions";

        public const string Me = "/me";
        public const string Revoke = "/{id:guid}/revoke";
        public const string RevokeAll = "/revoke-all";
    }
}
