using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.CourseOfferings.CreateCourseOffering;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Academics.Handlers.CreateCourseOffering;

internal static class CreateCourseOfferingEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateCourseOfferingRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new CreateCourseOfferingCommand(actorId, request.OrganizationId, request.CourseId, request.TermId),
            cancellationToken
        );

        return Results.Created($"/api/course-offerings/{result.Data}", result.ToApiResponse());
    }
}
