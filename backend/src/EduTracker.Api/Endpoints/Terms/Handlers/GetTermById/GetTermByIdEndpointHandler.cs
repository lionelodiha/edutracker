using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Terms.GetTermById;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Terms.Handlers.GetTermById;

internal static class GetTermByIdEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromQuery] Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();
        var result = await mediator.Send(new GetTermByIdQuery(userId, organizationId, id), cancellationToken);

        return Results.Ok(result.ToApiResponse());
    }
}
