using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.GetCurrentUser;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;
using System.Security.Claims;

namespace EduTracker.Api.Endpoints.Users.Handlers;

public static class GetCurrentUserEndpointHandler
{
    public static async Task<IResult> Handle(HttpContext context, IMediator mediator)
    {
        string? rawUserId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? userId = Guid.TryParse(rawUserId, out Guid parsedUserId) ? parsedUserId : null;

        OperationResult<UserResponse> result = await mediator.Send(new GetCurrentUserRequest(userId));

        return Results.Ok(result.ToApiResponse());
    }
}
