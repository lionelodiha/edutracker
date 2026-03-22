using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.CourseOfferings.GetCourseOfferingsBySemester;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Academics.Handlers.GetCourseOfferingsBySemester;

internal static class GetCourseOfferingsBySemesterEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid semesterId,
        [FromQuery] Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new GetCourseOfferingsBySemesterQuery(userId, organizationId, semesterId),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
