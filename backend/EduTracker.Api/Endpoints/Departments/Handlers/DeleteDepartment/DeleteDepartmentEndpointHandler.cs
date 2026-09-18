using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Departments.DeleteDepartment;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Departments.Handlers.DeleteDepartment;

internal static class DeleteDepartmentEndpointHandler
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
            new DeleteDepartmentCommand(actorId, organizationId, id),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
