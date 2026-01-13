using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.GetUserById;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Users.Handlers;

public static class GetUserByIdEndpointHandler
{
    public static async Task<IResult> Handle([FromRoute] Guid id, IMediator mediator)
    {
        OperationResult<UserResponse> result = await mediator.Send(new GetUserByIdRequest(id));

        return Results.Ok(result.ToApiResponse());
    }
}
