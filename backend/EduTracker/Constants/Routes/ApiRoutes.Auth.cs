namespace EduTracker.Constants.Routes;

public partial class ApiRoutes
{
    public static class Auth
    {
        public const string Base = $"{BasePath}/auth";

        public const string Register = "/register";
        public const string Login = "/login";
    }
}
