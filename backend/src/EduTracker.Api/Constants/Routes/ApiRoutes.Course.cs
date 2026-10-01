namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Course
    {
        public const string Base = $"{ApiBasePath}/courses";

        public const string List = "";
        public const string GetById = "/{id:guid}";
        public const string Update = "/{id:guid}";
        public const string Delete = "/{id:guid}";
    }
}
