using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.RegisterUser;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Auth.Handlers.RegisterUser;

internal static class RegisterUserEndpointHandler
{
    public static async Task<IResult> Handle(
        [FromBody] RegisterUserCommand request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        OperationResult<Guid> result = await mediator.Send(request, cancellationToken);

        Guid userId = result.Data;
        string location = $"{ApiRoutes.User.Base}/{userId}";

        ApiResponse<object> response = result.WithoutData()
            .ToApiResponse();

        return Results.Created(location, response);
    }
}
