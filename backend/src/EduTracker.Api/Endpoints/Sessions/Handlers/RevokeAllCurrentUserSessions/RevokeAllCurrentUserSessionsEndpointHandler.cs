using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Sessions.RevokeAllUserSessions;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Sessions.Handlers.RevokeAllCurrentUserSessions;

internal static class RevokeAllCurrentUserSessionsEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        IMediator mediator,
        [FromQuery] bool keepCurrentUserSession = false,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        Guid? sessionIdToKeep = keepCurrentUserSession ? httpContext.User.GetSessionId() : null;

        RevokeAllUserSessionsCommand command = new(
            ActorId: actorId,
            UserId: actorId,
            SessionId: sessionIdToKeep
        );

        OperationResult<object> result = await mediator.Send(
            command,
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
