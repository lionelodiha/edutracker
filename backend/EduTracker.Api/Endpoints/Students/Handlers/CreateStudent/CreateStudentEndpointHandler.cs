using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Students.CreateStudent;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Students.Handlers.CreateStudent;

internal static class CreateStudentEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateStudentRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new CreateStudentCommand(actorId, request.OrganizationId, request.UserId, request.StudentNumber, request.ClassId),
            cancellationToken
        );

        return Results.Created($"/api/students/{result.Data}", result.ToApiResponse());
    }
}
