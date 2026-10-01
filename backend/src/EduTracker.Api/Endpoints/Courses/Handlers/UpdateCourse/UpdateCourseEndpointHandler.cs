using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Courses.UpdateCourse;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Courses.Handlers.UpdateCourse;

internal static class UpdateCourseEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateCourseRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new UpdateCourseCommand(actorId, request.OrganizationId, id, request.Name, request.Code),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
