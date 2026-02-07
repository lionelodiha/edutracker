using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Students.Handlers.GetStudentGrades;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Grades.Models;
using Scalar.AspNetCore;

namespace EduTracker.Api.Endpoints.Students;

internal static class StudentEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapStudentEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Student.Base)
                .WithTags("Students");

            group.MapGet(ApiRoutes.Student.Grades, GetStudentGradesEndpointHandler.Handle)
                .WithName(nameof(GetStudentGradesEndpointHandler))
                .WithSummary("Get student grades")
                .Produces<ApiResponse<IReadOnlyList<GradeResponse>>>(StatusCodes.Status200OK)
                .RequireAuthorization();
        }
    }
}
