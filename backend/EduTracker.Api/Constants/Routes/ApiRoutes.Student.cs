namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Student
    {
        public const string Base = $"{ApiBasePath}/students";

        public const string Grades = "/{id:guid}/grades";
    }
}
