namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Term
    {
        public const string Base = $"{ApiBasePath}/terms";

        public const string Create = "";
        public const string ListBySemester = "/semester/{semesterId:guid}";
        public const string GetById = "/{id:guid}";
        public const string Delete = "/{id:guid}";
    }
}
