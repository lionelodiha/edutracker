using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Helpers;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Features.Auth.RefreshSession;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Auth.Handlers.RefreshSession;

internal static class RefreshSessionEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? sessionId = httpContext.User.GetSessionId();

        OperationResult<SessionResult> result = await mediator.Send(
            new RefreshSessionCommand(sessionId),
            cancellationToken
        );

        SessionResult data = result.Data!;

        CookieHelper.SetCookie(
            httpContext.Response,
            CookieKeys.Session,
            data.SessionId.ToString("N"),
            data.Timestamps.ExpiresAt
        );

        ApiResponse<SessionTimestampsResponse> apiResponse = new(
            Success: true,
            MessageId: result.MessageId,
            Message: result.Message,
            Details: result.Details,
            Data: data.Timestamps
        );

        return Results.Ok(apiResponse);
    }
}
