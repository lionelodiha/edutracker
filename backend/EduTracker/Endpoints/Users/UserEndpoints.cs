using EduTracker.Constants.Routes;
using EduTracker.Endpoints.Users.GetUser;

namespace EduTracker.Endpoints.Users;

public static class UserEndpoints
{
    extension(IEndpointRouteBuilder routes)
    {
        public IEndpointRouteBuilder MapUserEndpoints()
        {
            RouteGroupBuilder group = routes
                .MapGroup(ApiRoutes.User.Base)
                .WithTags("Users").AddEndpointFilter<RequireAuthFilter>();

            group.MapGet(ApiRoutes.User.GetUserById, GetUserHandler.Handle)
                .AllowAnonymous();

            return routes;
        }
    }
}
