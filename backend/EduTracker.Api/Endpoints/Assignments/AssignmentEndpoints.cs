using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Assignments.Handlers.RecordGrade;
using EduTracker.Api.Models;
using Scalar.AspNetCore;

namespace EduTracker.Api.Endpoints.Assignments;

internal static class AssignmentEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapAssignmentEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Assignment.Base)
                .WithTags("Assignments");

            group.MapPost(ApiRoutes.Assignment.Grade, RecordGradeEndpointHandler.Handle)
                .WithName(nameof(RecordGradeEndpointHandler))
                .WithSummary("Record grade")
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .RequireAuthorization();
        }
    }
}
