using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.GetUserById;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Users.Handlers.GetUserById;

internal static class GetUserByIdEndpointHandler
{
    public static async Task<IResult> Handle(
        [FromRoute] Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        OperationResult<UserResponse> result = await mediator.Send(
            new GetUserByIdQuery(id),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
