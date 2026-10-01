using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.OrganizationMembers.RemoveOrganizationMember;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.OrganizationMembers.Handlers.RemoveOrganizationMember;

internal static class RemoveOrganizationMemberEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        Guid memberId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        RemoveOrganizationMemberCommand command = new(actorId, id, memberId);
        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
