using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Enrollments.EnrollStudent;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Classes.Handlers.EnrollStudent;

internal static class EnrollStudentEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] EnrollStudentRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        EnrollStudentCommand command = new(
            ActorId: actorId,
            ClassId: id,
            StudentMemberId: request.StudentMemberId
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.WithoutData().ToApiResponse();
        return Results.Ok(response);
    }
}
