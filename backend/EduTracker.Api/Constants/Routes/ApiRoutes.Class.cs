namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Class
    {
        public const string Base = $"{ApiBasePath}/classes";

        public const string GetById = "/{id:guid}";
        public const string Enroll = "/{id:guid}/enroll";
        public const string Students = "/{id:guid}/students";
        public const string Assignments = "/{id:guid}/assignments";
    }
}
