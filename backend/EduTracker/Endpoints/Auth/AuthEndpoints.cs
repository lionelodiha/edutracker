using EduTracker.Constants.Routes;
using EduTracker.Endpoints.Auth.LoginUser;

namespace EduTracker.Endpoints.Auth;

public static class AuthEndpoints
{
    extension(IEndpointRouteBuilder routes)
    {
        public IEndpointRouteBuilder MapAuthEndpoints()
        {
            RouteGroupBuilder group = routes
                .MapGroup(ApiRoutes.Auth.Base)
                .WithTags("Auth");

            group.MapPost(ApiRoutes.Auth.Login, LoginUserHandler.Handle);

            return routes;
        }
    }
}
