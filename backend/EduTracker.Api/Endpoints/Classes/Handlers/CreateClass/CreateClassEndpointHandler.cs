using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.CreateClass;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Classes.Handlers.CreateClass;

internal static class CreateClassEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateClassRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new CreateClassCommand(actorId, request.OrganizationId, request.Name, request.Code),
            cancellationToken
        );

        return Results.Created($"/api/classes/{result.Data}", result.ToApiResponse());
    }
}
