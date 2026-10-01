using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.OrganizationMembers.Handlers.AddStaffMember;
using EduTracker.Api.Endpoints.OrganizationMembers.Handlers.GetOrganizationMembers;
using EduTracker.Api.Endpoints.OrganizationMembers.Handlers.RemoveOrganizationMember;
using EduTracker.Api.Endpoints.OrganizationMembers.Handlers.TransferOrganizationOwnership;
using EduTracker.Api.Endpoints.OrganizationMembers.Handlers.UpdateOrganizationMemberRole;
using EduTracker.Api.Models;
using EduTracker.Application.Features.OrganizationMembers.Models;

namespace EduTracker.Api.Endpoints.OrganizationMembers;

internal sealed class OrganizationMemberEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Organization.Base)
            .WithTags("Organization Members");

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

        // TEMPORARY — direct staff/teacher/student provisioning. Remove when email-token
        // portal-invite flow ships (see School_API_Requirements.md §2).
        group.MapPost(ApiRoutes.Organization.AddStaffMember, AddStaffMemberEndpointHandler.Handle)
            .WithName(nameof(AddStaffMemberEndpointHandler))
            .WithSummary("[TEMP] Add staff/teacher/student directly")
            .WithDescription(
                $"""
                **TEMPORARY** — directly provisions a new User + OrganizationMember in a single
                atomic call. Used by the admin UI until the email-token portal-invite flow ships.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed,
                and the caller must be an active Owner or Moderator of the target organization.

                **Route Parameters**:
                - `id` (uuid): Organization identifier.

                **Request Body**:
                - `FirstName` (string, required)
                - `MiddleName` (string, optional)
                - `LastName` (string, required)
                - `UserName` (string, required)
                - `Email` (string, required)
                - `Password` (string, required, must meet password policy)
                - `Role` (enum, required): `Admin`, `Teacher`, `Student`, `Moderator`, or `Member`.
                   Owner cannot be provisioned directly.

                Possible responses:
                - `201 Created`: Staff member created successfully.
                - `400 BadRequest`: Validation failed.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: Caller is not an Owner/Moderator, or tried to provision an Owner.
                - `404 NotFound`: Organization not found.
                - `409 Conflict`: Email or username already exists.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
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
    }
}
