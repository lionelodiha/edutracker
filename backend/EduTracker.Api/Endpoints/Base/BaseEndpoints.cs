using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Base.Handlers.GetInfo;

namespace EduTracker.Api.Endpoints.Base;

internal sealed class BaseEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        app.MapGet(ApiRoutes.ApiBasePath, GetInfoEndpointHandler.Handle)
            .ExcludeFromDescription();
    }
}
