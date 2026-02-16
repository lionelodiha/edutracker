using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Assignments.CreateAssignment;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Classes.Handlers.CreateAssignment;

internal static class CreateAssignmentEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] CreateAssignmentRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        CreateAssignmentCommand command = new(
            ActorId: actorId,
            ClassId: id,
            Title: request.Title,
            MaxScore: request.MaxScore,
            DueDate: request.DueDate
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.WithoutData().ToApiResponse();
        return Results.Created($"/api/assignments/{result.Data}", response);
    }
}
