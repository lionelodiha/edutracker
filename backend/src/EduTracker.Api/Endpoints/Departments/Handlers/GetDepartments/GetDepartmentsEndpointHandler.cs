using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Departments.GetDepartments;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Departments.Handlers.GetDepartments;

internal static class GetDepartmentsEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromQuery] Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        var result = await mediator.Send(
            new GetDepartmentsQuery(userId, organizationId),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
