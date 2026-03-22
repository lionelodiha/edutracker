using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Courses.CreateCourse;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Academics.Handlers.CreateCourse;

internal static class CreateCourseEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateCourseRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new CreateCourseCommand(actorId, request.OrganizationId, request.Name, request.Code),
            cancellationToken
        );

        return Results.Created($"/api/courses/{result.Data}", result.ToApiResponse());
    }
}
