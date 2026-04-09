using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Features.Teachers.GetTeacherById;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Teachers.Handlers.GetTeacherById;

internal static class GetTeacherByIdEndpointHandler
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
        OperationResult<TeacherResponse> result = await mediator.Send(
            new GetTeacherByIdQuery(actorId, organizationId, id),
            cancellationToken
        );

        ApiResponse<TeacherResponse> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
