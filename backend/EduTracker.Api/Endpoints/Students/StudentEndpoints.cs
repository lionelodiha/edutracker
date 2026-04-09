using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Students.Handlers.CreateStudent;
using EduTracker.Api.Endpoints.Students.Handlers.DeleteStudent;
using EduTracker.Api.Endpoints.Students.Handlers.GetStudentById;
using EduTracker.Api.Endpoints.Students.Handlers.GetStudents;
using EduTracker.Api.Endpoints.Students.Handlers.JoinStudent;
using EduTracker.Api.Endpoints.Students.Handlers.UpdateStudent;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.Students;

internal sealed class StudentEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Student.Base)
            .WithTags("Students");

        group.MapPost(ApiRoutes.Student.List, CreateStudentEndpointHandler.Handle)
            .WithName(nameof(CreateStudentEndpointHandler))
            .WithSummary("Create student")
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Student.Join, JoinStudentEndpointHandler.Handle)
            .WithName(nameof(JoinStudentEndpointHandler))
            .WithSummary("Join as student")
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Student.List, GetStudentsEndpointHandler.Handle)
            .WithName(nameof(GetStudentsEndpointHandler))
            .WithSummary("List students")
            .Produces<ApiResponse<IReadOnlyList<StudentResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Student.GetById, GetStudentByIdEndpointHandler.Handle)
            .WithName(nameof(GetStudentByIdEndpointHandler))
            .WithSummary("Get student by id")
            .Produces<ApiResponse<StudentResponse>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapPatch(ApiRoutes.Student.Update, UpdateStudentEndpointHandler.Handle)
            .WithName(nameof(UpdateStudentEndpointHandler))
            .WithSummary("Update student")
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapDelete(ApiRoutes.Student.Delete, DeleteStudentEndpointHandler.Handle)
            .WithName(nameof(DeleteStudentEndpointHandler))
            .WithSummary("Delete student")
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();
    }
}
