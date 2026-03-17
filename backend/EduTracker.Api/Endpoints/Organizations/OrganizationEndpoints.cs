using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Organizations.Handlers.AcceptOrganizationInvite;
using EduTracker.Api.Endpoints.Organizations.Handlers.CancelOrganizationInvite;
using EduTracker.Api.Endpoints.Organizations.Handlers.CreateOrganization;
using EduTracker.Api.Endpoints.Organizations.Handlers.DeleteOrganization;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationById;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationInvites;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationMembers;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizations;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetUserInvites;
using EduTracker.Api.Endpoints.Organizations.Handlers.InviteOrganizationMember;
using EduTracker.Api.Endpoints.Organizations.Handlers.RejectOrganizationInvite;
using EduTracker.Api.Endpoints.Organizations.Handlers.RemoveOrganizationMember;
using EduTracker.Api.Endpoints.Organizations.Handlers.TransferOrganizationOwnership;
using EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganization;
using EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganizationMemberRole;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Organizations.Models;
using Scalar.AspNetCore;

namespace EduTracker.Api.Endpoints.Organizations;

internal static class OrganizationEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapOrganizationEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Organization.Base)
                .WithTags("Organizations");

            group.MapPost(ApiRoutes.Organization.List, CreateOrganizationEndpointHandler.Handle)
                .WithName(nameof(CreateOrganizationEndpointHandler))
                .WithSummary("Create organization")
                .WithDescription(
                    $"""
                    Creates a new organization owned by the current user.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Request Body**:
                    - `Name` (string, required): Organization name.

                    Possible responses:
                    - `201 Created`: Organization created successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Organization.List, GetOrganizationsEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationsEndpointHandler))
                .WithSummary("List organizations")
                .WithDescription(
                    $"""
                    Retrieves organizations the current user belongs to.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    The response includes:
                    - `OrganizationId`, `Name`
                    - `Role`, `Status`

                    Possible responses:
                    - `200 OK`: Organizations retrieved successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<IReadOnlyList<OrganizationListItemResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Organization.GetById, GetOrganizationByIdEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationByIdEndpointHandler))
                .WithSummary("Get organization by id")
                .WithDescription(
                    $"""
                    Retrieves organization details by ID. Only active members can access this endpoint.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    Possible responses:
                    - `200 OK`: Organization retrieved successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not an active member of the organization.
                    - `404 NotFound`: Organization not found.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<OrganizationResponse>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapDelete(ApiRoutes.Organization.Delete, DeleteOrganizationEndpointHandler.Handle)
                .WithName(nameof(DeleteOrganizationEndpointHandler))
                .WithSummary("Delete organization")
                .WithDescription(
                    $"""
                    Deletes an organization. Only the owner can delete an organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    Possible responses:
                    - `200 OK`: Organization deleted successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not the organization owner.
                    - `404 NotFound`: Organization not found.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapPatch(ApiRoutes.Organization.Update, UpdateOrganizationEndpointHandler.Handle)
                .WithName(nameof(UpdateOrganizationEndpointHandler))
                .WithSummary("Update organization")
                .WithDescription(
                    $"""
                    Updates an organization name. Only the owner can update the organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    **Request Body**:
                    - `Name` (string, required): New organization name.

                    Possible responses:
                    - `200 OK`: Organization updated successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not the organization owner.
                    - `404 NotFound`: Organization not found.
                    - `409 Conflict`: Organization is locked.
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

            group.MapPost(ApiRoutes.Organization.TransferOwnership, TransferOrganizationOwnershipEndpointHandler.Handle)
                .WithName(nameof(TransferOrganizationOwnershipEndpointHandler))
                .WithSummary("Transfer organization ownership")
                .WithDescription(
                    $"""
                    Transfers organization ownership to another active member.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    **Request Body**:
                    - `MemberId` (uuid, required): Target member ID.

                    Possible responses:
                    - `200 OK`: Ownership transferred successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not the organization owner.
                    - `404 NotFound`: Organization or member not found.
                    - `409 Conflict`: Target member is already the owner.
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

            group.MapPatch(ApiRoutes.Organization.UpdateMemberRole, UpdateOrganizationMemberRoleEndpointHandler.Handle)
                .WithName(nameof(UpdateOrganizationMemberRoleEndpointHandler))
                .WithSummary("Update organization member role")
                .WithDescription(
                    $"""
                    Updates a member's role within the organization. Only owners can update roles.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.
                    - `memberId` (uuid): Target member identifier.

                    **Request Body**:
                    - `Role` (string, required): New role (Member, Moderator).

                    Possible responses:
                    - `200 OK`: Role updated successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not the organization owner.
                    - `404 NotFound`: Organization member not found.
                    - `409 Conflict`: Owner role can only be transferred.
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

            group.MapGet(ApiRoutes.Organization.Members, GetOrganizationMembersEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationMembersEndpointHandler))
                .WithSummary("Get organization members")
                .WithDescription(
                    $"""
                    Retrieves members of the organization with their roles and names. Only active members can access.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    Possible responses:
                    - `200 OK`: Organization members retrieved successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not an active member.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<IReadOnlyList<OrganizationMemberResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapDelete(ApiRoutes.Organization.RemoveMember, RemoveOrganizationMemberEndpointHandler.Handle)
                .WithName(nameof(RemoveOrganizationMemberEndpointHandler))
                .WithSummary("Remove or leave organization member")
                .WithDescription(
                    $"""
                    Removes a member from the organization, or allows a member to leave.
                    - If `memberId` is the current user, the request is treated as a leave action.
                    - Owners cannot leave; ownership must be transferred first.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.
                    - `memberId` (uuid): Member identifier to remove or leave.

                    Possible responses:
                    - `200 OK`: Member removed successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: Insufficient permissions to remove the member.
                    - `404 NotFound`: Organization member not found.
                    - `409 Conflict`: Owner cannot be removed or removed from the organization.
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
}
