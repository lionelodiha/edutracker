using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Subscriptions.GetOrganizationSubscription;
using EduTracker.Application.Features.Subscriptions.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.GetOrganizationSubscription;

internal static class GetOrganizationSubscriptionEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        GetOrganizationSubscriptionQuery query = new(actorId, id);
        OperationResult<OrganizationSubscriptionResponse> result = await mediator.Send(query, cancellationToken);

        ApiResponse<OrganizationSubscriptionResponse> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
