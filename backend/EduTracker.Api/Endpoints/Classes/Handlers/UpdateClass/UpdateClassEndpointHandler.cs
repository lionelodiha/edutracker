using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.UpdateClass;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Classes.Handlers.UpdateClass;

internal static class UpdateClassEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateClassRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new UpdateClassCommand(actorId, request.OrganizationId, id, request.Name, request.Code),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
