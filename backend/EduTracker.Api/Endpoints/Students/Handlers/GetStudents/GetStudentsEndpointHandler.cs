using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Features.Students.GetStudents;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Students.Handlers.GetStudents;

internal static class GetStudentsEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        OperationResult<IReadOnlyList<StudentResponse>> result = await mediator.Send(
            new GetStudentsQuery(actorId, organizationId),
            cancellationToken
        );

        ApiResponse<IReadOnlyList<StudentResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
