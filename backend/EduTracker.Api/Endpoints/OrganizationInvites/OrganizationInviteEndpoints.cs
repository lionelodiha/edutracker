using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.OrganizationInvites.Handlers.AcceptOrganizationInvite;
using EduTracker.Api.Endpoints.OrganizationInvites.Handlers.CancelOrganizationInvite;
using EduTracker.Api.Endpoints.OrganizationInvites.Handlers.GetOrganizationInvites;
using EduTracker.Api.Endpoints.OrganizationInvites.Handlers.GetUserInvites;
using EduTracker.Api.Endpoints.OrganizationInvites.Handlers.InviteOrganizationMember;
using EduTracker.Api.Endpoints.OrganizationInvites.Handlers.RejectOrganizationInvite;
using EduTracker.Api.Models;
using EduTracker.Application.Features.OrganizationInvites.Models;

namespace EduTracker.Api.Endpoints.OrganizationInvites;

internal sealed class OrganizationInviteEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Organization.Base)
            .WithTags("Organization Invites");

        group.MapGet(ApiRoutes.Organization.OrgInvites, GetOrganizationInvitesEndpointHandler.Handle)
            .WithName(nameof(GetOrganizationInvitesEndpointHandler))
            .WithSummary("Get organization invites")
            .WithDescription(
                $"""
                Retrieves pending invites for the organization. Only owners and moderators can access.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Organization identifier.

                Possible responses:
                - `200 OK`: Invites retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to view invites.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<OrganizationInviteResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Organization.Invite, InviteOrganizationMemberEndpointHandler.Handle)
            .WithName(nameof(InviteOrganizationMemberEndpointHandler))
            .WithSummary("Invite organization member")
            .WithDescription(
                $"""
                Sends an invitation to a user to join the organization. Only owners and moderators can invite.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Organization identifier.

                **Request Body**:
                - `UserId` (uuid, required): User to invite.

                Possible responses:
                - `200 OK`: Invite created successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to invite.
                - `404 NotFound`: Organization or user not found.
                - `409 Conflict`: User is already a member or an invite already exists.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Organization.AcceptInvite, AcceptOrganizationInviteEndpointHandler.Handle)
            .WithName(nameof(AcceptOrganizationInviteEndpointHandler))
            .WithSummary("Accept organization invite")
            .WithDescription(
                $"""
                Accepts a pending organization invite for the current user.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `inviteId` (uuid): Invite identifier.

                Possible responses:
                - `200 OK`: Invite accepted and membership created.
                - `401 Unauthorized`: No valid session or session expired.
                - `404 NotFound`: Invite not found.
                - `409 Conflict`: Invite expired or already responded to, or user is already a member.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Organization.RejectInvite, RejectOrganizationInviteEndpointHandler.Handle)
            .WithName(nameof(RejectOrganizationInviteEndpointHandler))
            .WithSummary("Reject organization invite")
            .WithDescription(
                $"""
                Rejects a pending organization invite for the current user.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `inviteId` (uuid): Invite identifier.

                Possible responses:
                - `200 OK`: Invite rejected successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `404 NotFound`: Invite not found.
                - `409 Conflict`: Invite expired or already responded to.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Organization.CancelInvite, CancelOrganizationInviteEndpointHandler.Handle)
            .WithName(nameof(CancelOrganizationInviteEndpointHandler))
            .WithSummary("Cancel organization invite")
            .WithDescription(
                $"""
                Cancels a pending organization invite. Only owners and moderators can cancel invites.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Organization identifier.
                - `inviteId` (uuid): Invite identifier.

                Possible responses:
                - `200 OK`: Invite cancelled successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to cancel invites.
                - `404 NotFound`: Invite not found.
                - `409 Conflict`: Invite expired or already responded to.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Organization.UserInvites, GetUserInvitesEndpointHandler.Handle)
            .WithName(nameof(GetUserInvitesEndpointHandler))
            .WithSummary("Get user invites")
            .WithDescription(
                $"""
                Retrieves pending organization invites for the current user.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                Possible responses:
                - `200 OK`: Invites retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<UserOrganizationInviteResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();
    }
}
