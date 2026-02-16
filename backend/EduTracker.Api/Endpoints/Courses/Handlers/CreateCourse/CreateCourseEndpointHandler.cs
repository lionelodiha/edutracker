using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Courses.CreateCourse;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Courses.Handlers.CreateCourse;

internal static class CreateCourseEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] CreateCourseRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        CreateCourseCommand command = new(
            ActorId: actorId,
            OrganizationId: id,
            Name: request.Name,
            Description: request.Description
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.WithoutData().ToApiResponse();
        return Results.Created($"/api/courses/{result.Data}", response);
    }
}
