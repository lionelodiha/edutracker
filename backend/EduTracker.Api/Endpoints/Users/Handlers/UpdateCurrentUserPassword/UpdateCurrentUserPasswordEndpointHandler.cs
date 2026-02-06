using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.UpdateUserPassword;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Users.Handlers.UpdateCurrentUserPassword;

internal static class UpdateCurrentUserPasswordEndpointHandler
{
    public static async Task<IResult> Handle(
        [FromBody] UpdateCurrentUserPasswordRequest request,
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();
        Guid? sessionId = httpContext.User.GetSessionId();

        UpdateUserPasswordCommand command = new(
            UserId: userId,
            SessionId: sessionId,
            CurrentPassword: request.CurrentPassword,
            NewPassword: request.NewPassword,
            LogoutAll: request.LogoutAll
        );

        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        return Results.Ok(result.ToApiResponse());
    }
}
