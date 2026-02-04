using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Base.Handlers.GetInfo;

namespace EduTracker.Api.Endpoints.Base;

internal static class BaseEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapBaseEndpoints()
        {
            app.MapGet(ApiRoutes.ApiBasePath, GetInfoEndpointHandler.Handle)
                .ExcludeFromDescription();
        }
    }
}
