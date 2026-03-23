using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Courses.DeleteCourse;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Courses.Handlers.DeleteCourse;

internal static class DeleteCourseEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromQuery] Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new DeleteCourseCommand(actorId, organizationId, id),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
