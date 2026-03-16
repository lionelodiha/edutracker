using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.AcceptOrganizationInvite;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.AcceptOrganizationInvite;

internal static class AcceptOrganizationInviteEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid inviteId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        AcceptOrganizationInviteCommand command = new(actorId, inviteId);
        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
