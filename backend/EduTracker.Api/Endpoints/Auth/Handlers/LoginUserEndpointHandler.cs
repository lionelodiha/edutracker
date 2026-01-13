using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Models;
using EduTracker.Api.Services;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.LoginUser;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Features.Auth.RevokeSession;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Auth.Handlers;

public static class LoginUserEndpointHandler
{
    public static async Task<IResult> Handle([FromBody] LoginUserRequest message, IMediator mediator, CookieService cookieService, HttpResponse response, HttpRequest request)
    {
        OperationResult<SessionResult> result = await mediator.Send(message);

        Guid? sessionId = null;
        string? rawSessionId = cookieService.GetCookie(request, CookieKeys.Session);

        if (Guid.TryParse(rawSessionId, out Guid parsedSessionId))
            sessionId = parsedSessionId;

        if (sessionId.HasValue)
            await mediator.Send(new RevokeSessionRequest(sessionId));

        SessionResult data = result.Data!;

        cookieService.SetCookie(
            response,
            CookieKeys.Session,
            data.SessionId.ToString("N"),
            expiresUtc: data.Timestamps.ExpiresAt
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
