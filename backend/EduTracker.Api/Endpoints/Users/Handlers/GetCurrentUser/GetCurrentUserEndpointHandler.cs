using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.GetUserById;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Users.Handlers.GetCurrentUser;

internal static class GetCurrentUserEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        OperationResult<UserResponse> result = await mediator.Send(
            new GetUserByIdQuery(userId),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
