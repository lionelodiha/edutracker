using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Courses.GetCourses;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Academics.Handlers.GetCourses;

internal static class GetCoursesEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromQuery] Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();
        var result = await mediator.Send(new GetCoursesQuery(userId, organizationId), cancellationToken);

        return Results.Ok(result.ToApiResponse());
    }
}
