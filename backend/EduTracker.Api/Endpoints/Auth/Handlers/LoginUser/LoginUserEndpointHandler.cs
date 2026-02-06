using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Helpers;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.LoginUser;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Auth.Handlers.LoginUser;

internal static class LoginUserEndpointHandler
{
    public static async Task<IResult> Handle(
        [FromBody] LoginUserRequest message,
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        string? rawSessionId = CookieHelper.GetCookie(httpContext.Request, CookieKeys.Session);

        Guid? activeSessionId = Guid.TryParse(rawSessionId, out Guid sessionId)
            ? sessionId
            : null;

        LoginUserCommand command = new(
            Identifier: message.Identifier,
            Password: message.Password,
            RememberMe: message.RememberMe,
            ActiveSessionId: activeSessionId
        );

        OperationResult<SessionResult> result = await mediator.Send(command, cancellationToken);
        SessionResult data = result.Data!;

        CookieHelper.SetCookie(
            httpContext.Response,
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
