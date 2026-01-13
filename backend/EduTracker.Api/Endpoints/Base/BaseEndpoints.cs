using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Base.Handlers;

namespace EduTracker.Api.Endpoints.Base;

public static class BaseEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapBaseEndpoints()
        {
            app.MapGet(ApiRoutes.BasePath, GetInfoEndpointHandler.Handle)
                .ExcludeFromDescription();
        }
    }
}
