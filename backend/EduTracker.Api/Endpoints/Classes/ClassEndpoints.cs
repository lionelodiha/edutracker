using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Classes.Handlers.CreateClass;
using EduTracker.Api.Endpoints.Classes.Handlers.DeleteClass;
using EduTracker.Api.Endpoints.Classes.Handlers.GetClassById;
using EduTracker.Api.Endpoints.Classes.Handlers.GetClasses;
using EduTracker.Api.Endpoints.Classes.Handlers.UpdateClass;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.Classes;

internal sealed class ClassEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Class.Base)
            .WithTags("Classes");

        group.MapPost(ApiRoutes.Class.List, CreateClassEndpointHandler.Handle)
            .WithName(nameof(CreateClassEndpointHandler))
            .WithSummary("Create class")
            .WithDescription(
                $"""
                Creates a new academic class for an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.
                **Access**: Only organization owners and moderators can create classes.
                """
            )
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Class.List, GetClassesEndpointHandler.Handle)
            .WithName(nameof(GetClassesEndpointHandler))
            .WithSummary("List classes")
            .WithDescription(
                $"""
                Retrieves all classes for an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.
                **Access**: Any active organization member can view classes.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<ClassResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Class.GetById, GetClassByIdEndpointHandler.Handle)
            .WithName(nameof(GetClassByIdEndpointHandler))
            .WithSummary("Get class by id")
            .Produces<ApiResponse<ClassResponse>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapPatch(ApiRoutes.Class.Update, UpdateClassEndpointHandler.Handle)
            .WithName(nameof(UpdateClassEndpointHandler))
            .WithSummary("Update class")
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapDelete(ApiRoutes.Class.Delete, DeleteClassEndpointHandler.Handle)
            .WithName(nameof(DeleteClassEndpointHandler))
            .WithSummary("Delete class")
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();
    }
}
