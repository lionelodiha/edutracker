using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Terms.CreateTerm;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Academics.Handlers.CreateTerm;

internal static class CreateTermEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateTermRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new CreateTermCommand(actorId, request.OrganizationId, request.SemesterId, request.Ordinal),
            cancellationToken
        );

        return Results.Created($"/api/terms/{result.Data}", result.ToApiResponse());
    }
}
