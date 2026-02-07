namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Assignment
    {
        public const string Base = $"{ApiBasePath}/assignments";

        public const string Grade = "/{id:guid}/grade";
    }
}
