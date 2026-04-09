using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Teachers.UpdateTeacher;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Teachers.Handlers.UpdateTeacher;

internal static class UpdateTeacherEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateTeacherRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new UpdateTeacherCommand(actorId, request.OrganizationId, id, request.StaffId),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
