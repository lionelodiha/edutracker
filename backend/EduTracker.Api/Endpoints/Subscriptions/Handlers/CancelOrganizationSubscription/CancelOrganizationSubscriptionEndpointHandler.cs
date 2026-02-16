using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Subscriptions.CancelOrganizationSubscription;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.CancelOrganizationSubscription;

internal static class CancelOrganizationSubscriptionEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        CancelOrganizationSubscriptionCommand command = new(actorId, id);
        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
