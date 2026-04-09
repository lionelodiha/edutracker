using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Features.Teachers.GetTeachers;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Teachers.Handlers.GetTeachers;

internal static class GetTeachersEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        OperationResult<IReadOnlyList<TeacherResponse>> result = await mediator.Send(
            new GetTeachersQuery(actorId, organizationId),
            cancellationToken
        );

        ApiResponse<IReadOnlyList<TeacherResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
