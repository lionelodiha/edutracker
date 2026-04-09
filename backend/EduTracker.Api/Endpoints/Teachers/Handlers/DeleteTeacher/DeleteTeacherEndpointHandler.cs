using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Teachers.DeleteTeacher;

namespace EduTracker.Api.Endpoints.Teachers.Handlers.DeleteTeacher;

internal static class DeleteTeacherEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new DeleteTeacherCommand(actorId, organizationId, id),
            cancellationToken
        );

        return Results.Ok(result.ToApiResponse());
    }
}
