using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Subscriptions.CreateOrganizationSubscription;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Subscriptions.Handlers.CreateOrganizationSubscription;

internal static class CreateOrganizationSubscriptionEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] CreateOrganizationSubscriptionRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        CreateOrganizationSubscriptionCommand command = new(
            ActorId: actorId,
            OrganizationId: id,
            PlanId: request.PlanId,
            StartsAt: request.StartsAt,
            EndsAt: request.EndsAt,
            AutoRenew: request.AutoRenew
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        Guid subscriptionId = result.Data;
        string location = $"{ApiRoutes.Organization.Base}/{id}/subscription";

        ApiResponse<object> response = result.WithoutData().ToApiResponse();
        return Results.Created(location, response);
    }
}
