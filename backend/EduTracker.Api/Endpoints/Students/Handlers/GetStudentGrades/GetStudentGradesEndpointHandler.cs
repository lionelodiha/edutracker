using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Grades.GetStudentGrades;
using EduTracker.Application.Features.Grades.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Students.Handlers.GetStudentGrades;

internal static class GetStudentGradesEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        GetStudentGradesQuery query = new(actorId, id);
        OperationResult<IReadOnlyList<GradeResponse>> result = await mediator.Send(query, cancellationToken);

        ApiResponse<IReadOnlyList<GradeResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
