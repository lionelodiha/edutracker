using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Teachers.CreateTeacher;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Teachers.Handlers.CreateTeacher;

internal static class CreateTeacherEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateTeacherRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new CreateTeacherCommand(actorId, request.OrganizationId, request.UserId, request.StaffId),
            cancellationToken
        );

        return Results.Created($"/api/teachers/{result.Data}", result.ToApiResponse());
    }
}
