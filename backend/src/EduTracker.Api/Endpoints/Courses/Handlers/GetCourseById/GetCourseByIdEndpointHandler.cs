using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Courses.GetCourseById;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Courses.Handlers.GetCourseById;

internal static class GetCourseByIdEndpointHandler
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
        var result = await mediator.Send(new GetCourseByIdQuery(userId, organizationId, id), cancellationToken);

        return Results.Ok(result.ToApiResponse());
    }
}
