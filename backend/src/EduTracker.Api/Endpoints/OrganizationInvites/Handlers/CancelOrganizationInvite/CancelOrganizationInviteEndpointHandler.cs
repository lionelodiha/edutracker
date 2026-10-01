using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.OrganizationInvites.CancelOrganizationInvite;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.OrganizationInvites.Handlers.CancelOrganizationInvite;

internal static class CancelOrganizationInviteEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        Guid inviteId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        CancelOrganizationInviteCommand command = new(actorId, id, inviteId);
        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
