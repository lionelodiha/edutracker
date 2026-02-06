using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.UnlockUser;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Users.Handlers.UnlockUser;

internal static class UnlockUserEndpointHandler
{
    public static async Task<IResult> Handle(
        [FromRoute] Guid id,
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        UnlockUserCommand command = new(actorId, id);
        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        return Results.Ok(result.ToApiResponse());
    }
}
