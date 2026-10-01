using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.UpdateUser;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Users.Handlers.UpdateCurrentUser;

internal static class UpdateCurrentUserEndpointHandler
{
    public static async Task<IResult> Handle(
        [FromBody] UpdateCurrentUserRequest request,
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        UpdateUserCommand command = new(
            userId,
            request.FirstName,
            request.MiddleName,
            request.LastName,
            request.UserName
        );

        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        return Results.Ok(result.ToApiResponse());
    }
}
