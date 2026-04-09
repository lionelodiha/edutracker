using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Students.JoinStudent;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Students.Handlers.JoinStudent;

internal static class JoinStudentEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] JoinStudentRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new JoinStudentCommand(actorId, request.OrganizationId, request.StudentNumber, request.ClassId),
            cancellationToken
        );

        return Results.Created($"/api/students/{result.Data}", result.ToApiResponse());
    }
}
