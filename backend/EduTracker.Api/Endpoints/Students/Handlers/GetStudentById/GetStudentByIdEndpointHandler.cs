using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Features.Students.GetStudentById;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Students.Handlers.GetStudentById;

internal static class GetStudentByIdEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        OperationResult<StudentResponse> result = await mediator.Send(
            new GetStudentByIdQuery(actorId, organizationId, id),
            cancellationToken
        );

        ApiResponse<StudentResponse> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
