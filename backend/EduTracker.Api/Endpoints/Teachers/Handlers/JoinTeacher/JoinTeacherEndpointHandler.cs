using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Teachers.JoinTeacher;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Teachers.Handlers.JoinTeacher;

internal static class JoinTeacherEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] JoinTeacherRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new JoinTeacherCommand(actorId, request.OrganizationId, request.StaffId),
            cancellationToken
        );

        return Results.Created($"/api/teachers/{result.Data}", result.ToApiResponse());
    }
}
