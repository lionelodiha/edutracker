using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.RejectOrganizationInvite;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.RejectOrganizationInvite;

internal static class RejectOrganizationInviteEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid inviteId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        RejectOrganizationInviteCommand command = new(actorId, inviteId);
        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
