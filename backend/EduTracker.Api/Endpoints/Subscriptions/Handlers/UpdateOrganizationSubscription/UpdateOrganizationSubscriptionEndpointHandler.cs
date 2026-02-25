using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Subscriptions.UpdateOrganizationSubscription;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.UpdateOrganizationSubscription;

internal static class UpdateOrganizationSubscriptionEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateOrganizationSubscriptionRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        UpdateOrganizationSubscriptionCommand command = new(
            ActorId: actorId,
            OrganizationId: id,
            PlanId: request.PlanId,
            StartsAt: request.StartsAt,
            EndsAt: request.EndsAt,
            AutoRenew: request.AutoRenew
        );

        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
