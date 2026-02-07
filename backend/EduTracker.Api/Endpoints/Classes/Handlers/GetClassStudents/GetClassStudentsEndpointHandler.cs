using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Enrollments.GetClassStudents;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Classes.Handlers.GetClassStudents;

internal static class GetClassStudentsEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        GetClassStudentsQuery query = new(actorId, id);
        OperationResult<IReadOnlyList<OrganizationMemberResponse>> result = await mediator.Send(query, cancellationToken);

        ApiResponse<IReadOnlyList<OrganizationMemberResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
