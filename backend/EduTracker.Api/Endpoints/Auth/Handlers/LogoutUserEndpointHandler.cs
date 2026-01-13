using System.Security.Claims;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Api.Services;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Logout;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Auth.Handlers;

public static class LogoutUserEndpointHandler
{
    public static async Task<IResult> Handle(HttpContext context, HttpResponse response, IMediator mediator, CookieService cookieService)
    {
        Guid? sessionId = null;
        string? rawSessionId = context.User.FindFirstValue(SessionClaimTypes.SessionId);

        if (Guid.TryParse(rawSessionId, out Guid parsedSessionId))
            sessionId = parsedSessionId;

        OperationResult<object> result = await mediator.Send(new LogoutUserRequest(sessionId));

        cookieService.DeleteCookie(response, CookieKeys.Session);

        ApiResponse<object> apiResponse = result.ToApiResponse();

        return Results.Ok(apiResponse);
    }
}
