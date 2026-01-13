using System.Security.Claims;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Models;
using EduTracker.Api.Services;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Features.Auth.RefreshSession;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Auth.Handlers;

public static class RefreshSessionEndpointHandler
{
    public static async Task<IResult> Handle(HttpContext context, IMediator mediator, CookieService cookieService, HttpResponse response)
    {
        Guid? sessionId = null;
        string? rawSessionId = context.User.FindFirstValue(SessionClaimTypes.SessionId);

        if (Guid.TryParse(rawSessionId, out Guid parsedSessionId))
            sessionId = parsedSessionId;

        OperationResult<SessionResult> result = await mediator.Send(new RefreshSessionRequest(sessionId));

        SessionResult data = result.Data!;

        cookieService.SetCookie(
            response,
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
