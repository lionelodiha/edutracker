using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Students.UpdateStudent;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Students.Handlers.UpdateStudent;

internal static class UpdateStudentEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateStudentRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new UpdateStudentCommand(actorId, request.OrganizationId, id, request.StudentNumber, request.ClassId),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
