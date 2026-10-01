using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Helpers;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.LogoutUser;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Auth.Handlers.LogoutUser;

internal static class LogoutUserEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? sessionId = httpContext.User.GetSessionId();

        OperationResult<object> result = await mediator.Send(
            new LogoutUserCommand(sessionId),
            cancellationToken
        );

        CookieHelper.DeleteCookie(httpContext.Response, CookieKeys.Session);

        ApiResponse<object> apiResponse = result.ToApiResponse();

        return Results.Ok(apiResponse);
    }
}
