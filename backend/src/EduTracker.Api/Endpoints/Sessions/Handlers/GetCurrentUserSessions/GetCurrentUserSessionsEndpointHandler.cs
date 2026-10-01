using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Sessions.GetCurrentUserSessions;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Sessions.Handlers.GetCurrentUserSessions;

internal static class GetCurrentUserSessionsEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        OperationResult<IReadOnlyList<SessionData>> result = await mediator.Send(
            new GetCurrentUserSessionsQuery(userId),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
