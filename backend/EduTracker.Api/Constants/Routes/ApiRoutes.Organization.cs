namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Organization
    {
        public const string Base = $"{ApiBasePath}/organizations";

        public const string List = "";
        public const string GetById = "/{id:guid}";
        public const string Invite = "/{id:guid}/invite";
        public const string Members = "/{id:guid}/members";
        public const string UpdateMemberRole = "/{id:guid}/members/{memberId:guid}/role";
    }
}
