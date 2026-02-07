using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Subscriptions.Handlers.CancelOrganizationSubscription;
using EduTracker.Api.Endpoints.Subscriptions.Handlers.CreateOrganizationSubscription;
using EduTracker.Api.Endpoints.Subscriptions.Handlers.GetOrganizationSubscription;
using EduTracker.Api.Endpoints.Subscriptions.Handlers.UpdateOrganizationSubscription;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Subscriptions.Models;
using Scalar.AspNetCore;

namespace EduTracker.Api.Endpoints.Subscriptions;

internal static class SubscriptionEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapSubscriptionEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Subscription.Base)
                .WithTags("Subscriptions");

            group.MapPost(ApiRoutes.Subscription.Current, CreateOrganizationSubscriptionEndpointHandler.Handle)
                .WithName(nameof(CreateOrganizationSubscriptionEndpointHandler))
                .WithSummary("Create organization subscription")
                .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Subscription.Current, GetOrganizationSubscriptionEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationSubscriptionEndpointHandler))
                .WithSummary("Get organization subscription")
                .Produces<ApiResponse<OrganizationSubscriptionResponse>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapPatch(ApiRoutes.Subscription.Current, UpdateOrganizationSubscriptionEndpointHandler.Handle)
                .WithName(nameof(UpdateOrganizationSubscriptionEndpointHandler))
                .WithSummary("Update organization subscription")
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapPost(ApiRoutes.Subscription.Cancel, CancelOrganizationSubscriptionEndpointHandler.Handle)
                .WithName(nameof(CancelOrganizationSubscriptionEndpointHandler))
                .WithSummary("Cancel organization subscription")
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .RequireAuthorization();
        }
    }
}
