namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Subscription
    {
        public const string Base = $"{ApiBasePath}/organizations";

        public const string Current = "/{id:guid}/subscription";
        public const string Cancel = "/{id:guid}/subscription/cancel";
    }
}
