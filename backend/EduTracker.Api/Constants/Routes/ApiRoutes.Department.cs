namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Department
    {
        public const string Base = $"{ApiBasePath}/departments";

        public const string List = "";
        public const string Delete = "/{id:guid}";
    }
}
