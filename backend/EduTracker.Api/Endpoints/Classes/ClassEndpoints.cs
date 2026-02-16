using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Classes.Handlers.CreateAssignment;
using EduTracker.Api.Endpoints.Classes.Handlers.EnrollStudent;
using EduTracker.Api.Endpoints.Classes.Handlers.GetClassById;
using EduTracker.Api.Endpoints.Classes.Handlers.GetClassStudents;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Classes.Models;
using EduTracker.Application.Features.Organizations.Models;
using Scalar.AspNetCore;

namespace EduTracker.Api.Endpoints.Classes;

internal static class ClassEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapClassEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Class.Base)
                .WithTags("Classes");

            group.MapGet(ApiRoutes.Class.GetById, GetClassByIdEndpointHandler.Handle)
                .WithName(nameof(GetClassByIdEndpointHandler))
                .WithSummary("Get class by id")
                .Produces<ApiResponse<ClassResponse>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapPost(ApiRoutes.Class.Enroll, EnrollStudentEndpointHandler.Handle)
                .WithName(nameof(EnrollStudentEndpointHandler))
                .WithSummary("Enroll student")
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Class.Students, GetClassStudentsEndpointHandler.Handle)
                .WithName(nameof(GetClassStudentsEndpointHandler))
                .WithSummary("Get class students")
                .Produces<ApiResponse<IReadOnlyList<OrganizationMemberResponse>>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapPost(ApiRoutes.Class.Assignments, CreateAssignmentEndpointHandler.Handle)
                .WithName(nameof(CreateAssignmentEndpointHandler))
                .WithSummary("Create assignment")
                .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
                .RequireAuthorization();
        }
    }
}
