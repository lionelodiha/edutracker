using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Semesters.UpdateSemester;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Academics.Handlers.UpdateSemester;

internal static class UpdateSemesterEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateSemesterRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new UpdateSemesterCommand(actorId, request.OrganizationId, id, request.Session),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
