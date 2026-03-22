namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Academic
    {
        public static class Course
        {
            public const string Base = $"{ApiBasePath}/courses";
            public const string List = "";
            public const string GetById = "/{id:guid}";
            public const string Update = "/{id:guid}";
            public const string Delete = "/{id:guid}";
        }

        public static class Semester
        {
            public const string Base = $"{ApiBasePath}/semesters";
            public const string List = "";
            public const string GetById = "/{id:guid}";
            public const string Update = "/{id:guid}";
            public const string Delete = "/{id:guid}";
        }

        public static class CourseOffering
        {
            public const string Base = $"{ApiBasePath}/course-offerings";
            public const string ListBySemester = "/semester/{semesterId:guid}";
            public const string Create = "";
            public const string Delete = "/{id:guid}";
        }
    }
}
