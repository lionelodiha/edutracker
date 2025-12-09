using EduTracker.Constants.Routes;
using EduTracker.Endpoints.Users.GetUser;
using EduTracker.Endpoints.Users.RegisterUser;

namespace EduTracker.Endpoints.Users;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder routes)
    {
        RouteGroupBuilder group = routes
            .MapGroup(ApiRoutes.User.Base)
            .WithTags("Users");

        group.MapPost(ApiRoutes.User.CreateUser, RegisterUserHandler.Handle);
        group.MapGet(ApiRoutes.User.GetUserById, GetUserHandler.Handle);

        return routes;
    }
}
