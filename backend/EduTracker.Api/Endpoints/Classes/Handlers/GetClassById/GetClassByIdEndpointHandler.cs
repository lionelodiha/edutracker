using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.GetClassById;
using EduTracker.Application.Features.Classes.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Classes.Handlers.GetClassById;

internal static class GetClassByIdEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        GetClassByIdQuery query = new(actorId, id);
        OperationResult<ClassResponse> result = await mediator.Send(query, cancellationToken);

        ApiResponse<ClassResponse> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
