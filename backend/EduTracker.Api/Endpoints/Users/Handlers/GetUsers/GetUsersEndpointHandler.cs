using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.GetUsers;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Users.Handlers.GetUsers;

internal static class GetUsersEndpointHandler
{
    public static async Task<IResult> Handle(
        [FromQuery] Guid? cursor,
        [FromQuery] int? limit,
        [FromQuery] Guid? id,
        [FromQuery] string? userName,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        OperationResult<CursorPage<UserResponse>> result = await mediator.Send(
            new GetUsersQuery(
                Cursor: cursor,
                Limit: limit,
                Id: id,
                UserName: userName
            ),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
