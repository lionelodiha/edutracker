using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.CreateClass;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Courses.Handlers.CreateClass;

internal static class CreateClassEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid courseId,
        [FromBody] CreateClassRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        CreateClassCommand command = new(
            ActorId: actorId,
            CourseId: courseId,
            TeacherMemberId: request.TeacherMemberId,
            Term: request.Term,
            Year: request.Year
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.WithoutData().ToApiResponse();
        return Results.Created($"/api/classes/{result.Data}", response);
    }
}
