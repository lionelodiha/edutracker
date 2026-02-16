namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Course
    {
        public const string Base = $"{ApiBasePath}/organizations";

        public const string Create = "/{id:guid}/courses";
        public const string CreateClass = "/courses/{courseId:guid}/classes";
    }
}
