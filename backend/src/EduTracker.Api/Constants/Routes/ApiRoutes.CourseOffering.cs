namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class CourseOffering
    {
        public const string Base = $"{ApiBasePath}/course-offerings";

        public const string Create = "";
        public const string ListBySemester = "/semester/{semesterId:guid}";
        public const string Delete = "/{id:guid}";
    }
}
