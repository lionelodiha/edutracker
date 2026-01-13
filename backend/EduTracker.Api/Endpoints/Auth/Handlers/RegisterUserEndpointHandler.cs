using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.RegisterUser;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Auth.Handlers;

public static class RegisterUserEndpointHandler
{
    public static async Task<IResult> Handle([FromBody] RegisterUserRequest request, IMediator mediator)
    {
        OperationResult<Guid> result = await mediator.Send(request);

        Guid userId = result.Data;
        string location = $"{ApiRoutes.User.Base}/{userId}";

        ApiResponse<object> response = result.WithoutData()
            .ToApiResponse();

        return Results.Created(location, response);
    }
}
