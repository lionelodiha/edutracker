using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Teachers.Handlers.CreateTeacher;
using EduTracker.Api.Endpoints.Teachers.Handlers.DeleteTeacher;
using EduTracker.Api.Endpoints.Teachers.Handlers.GetTeacherById;
using EduTracker.Api.Endpoints.Teachers.Handlers.GetTeachers;
using EduTracker.Api.Endpoints.Teachers.Handlers.JoinTeacher;
using EduTracker.Api.Endpoints.Teachers.Handlers.UpdateTeacher;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.Teachers;

internal sealed class TeacherEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Teacher.Base)
            .WithTags("Teachers");

        group.MapPost(ApiRoutes.Teacher.List, CreateTeacherEndpointHandler.Handle)
            .WithName(nameof(CreateTeacherEndpointHandler))
            .WithSummary("Create teacher")
            .WithDescription(
                $"""
                Creates a teacher profile for a user in an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.
                **Access**: Only organization owners and moderators can create teachers.
                If the user is not yet an organization member, they are added as an active member.
                """
            )
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Teacher.Join, JoinTeacherEndpointHandler.Handle)
            .WithName(nameof(JoinTeacherEndpointHandler))
            .WithSummary("Join as teacher")
            .WithDescription(
                $"""
                Lets the current user join an organization as a teacher.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.
                If the current user is not yet an organization member, they are added as an active member first.
                """
            )
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Teacher.List, GetTeachersEndpointHandler.Handle)
            .WithName(nameof(GetTeachersEndpointHandler))
            .WithSummary("List teachers")
            .Produces<ApiResponse<IReadOnlyList<TeacherResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Teacher.GetById, GetTeacherByIdEndpointHandler.Handle)
            .WithName(nameof(GetTeacherByIdEndpointHandler))
            .WithSummary("Get teacher by id")
            .Produces<ApiResponse<TeacherResponse>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapPatch(ApiRoutes.Teacher.Update, UpdateTeacherEndpointHandler.Handle)
            .WithName(nameof(UpdateTeacherEndpointHandler))
            .WithSummary("Update teacher")
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapDelete(ApiRoutes.Teacher.Delete, DeleteTeacherEndpointHandler.Handle)
            .WithName(nameof(DeleteTeacherEndpointHandler))
            .WithSummary("Delete teacher")
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();
    }
}
