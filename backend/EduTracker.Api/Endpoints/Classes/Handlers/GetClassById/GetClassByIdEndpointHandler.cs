using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.GetClassById;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Classes.Handlers.GetClassById;

internal static class GetClassByIdEndpointHandler
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
        OperationResult<ClassResponse> result = await mediator.Send(
            new GetClassByIdQuery(actorId, organizationId, id),
            cancellationToken
        );

        ApiResponse<ClassResponse> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
