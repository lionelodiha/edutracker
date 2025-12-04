namespace EduTracker.Constants.Routes;

public partial class ApiRoutes
{
    public class User
    {
        public const string Base = $"{BasePath}/users";

        public const string CreateUser = "";
        public const string GetUserById = "/{id:guid}";
    }
}
