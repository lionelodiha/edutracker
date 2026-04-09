namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Student
    {
        public const string Base = $"{ApiBasePath}/students";

        public const string List = "";
        public const string GetById = "/{id:guid}";
        public const string Update = "/{id:guid}";
        public const string Delete = "/{id:guid}";
        public const string Join = "/join";
    }
}
