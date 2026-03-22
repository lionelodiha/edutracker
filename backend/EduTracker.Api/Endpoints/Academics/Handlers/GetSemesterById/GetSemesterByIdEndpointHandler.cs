using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Semesters.GetSemesterById;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Academics.Handlers.GetSemesterById;

internal static class GetSemesterByIdEndpointHandler
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
        var result = await mediator.Send(new GetSemesterByIdQuery(userId, organizationId, id), cancellationToken);

        return Results.Ok(result.ToApiResponse());
    }
}
