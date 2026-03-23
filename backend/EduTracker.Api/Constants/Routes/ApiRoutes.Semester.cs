namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Semester
    {
        public const string Base = $"{ApiBasePath}/semesters";

        public const string List = "";
        public const string GetById = "/{id:guid}";
        public const string Delete = "/{id:guid}";
    }
}
