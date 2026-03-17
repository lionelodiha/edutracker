using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Users.Handlers.DemoteUser;
using EduTracker.Api.Endpoints.Users.Handlers.GetCurrentUser;
using EduTracker.Api.Endpoints.Users.Handlers.GetUserById;
using EduTracker.Api.Endpoints.Users.Handlers.GetUsers;
using EduTracker.Api.Endpoints.Users.Handlers.LockUser;
using EduTracker.Api.Endpoints.Users.Handlers.PromoteUser;
using EduTracker.Api.Endpoints.Users.Handlers.UnlockUser;
using EduTracker.Api.Endpoints.Users.Handlers.UpdateCurrentUser;
using EduTracker.Api.Endpoints.Users.Handlers.UpdateCurrentUserPassword;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Users;

internal static class UserEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapUserEndpoints()
        {
            RouteGroupBuilder userGroup = app.MapGroup(ApiRoutes.User.Base)
                .WithTags("Users");

            userGroup.MapGet(ApiRoutes.User.List, GetUsersEndpointHandler.Handle)
                .WithName(nameof(GetUsersEndpointHandler))
                .WithSummary("Get users (cursor pagination)")
                .WithDescription(
                    $"""
                    Retrieves users using cursor-based pagination.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) and **Admin or SuperAdmin role** are required.

                    **Query Parameters**:
                    - `cursor` (uuid, optional): Fetch users after this cursor (exclusive).
                    - `limit` (int, optional): Page size (default 20, max 100).
                    - `id` (uuid, optional): Filter by a specific user ID.
                    - `userName` (string, optional): Filter by username (partial match).

                    The response includes:
                    - `Items`: Users for the current page.
                    - `NextCursor`: Cursor value for the next page (if any).
                    - `HasMore`: Indicates whether more users are available.

                    Possible responses:
                    - `200 OK`: Users retrieved successfully.
                    - `403 Forbidden`: Current user does not have Admin or SuperAdmin privileges.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<CursorPage<UserResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization(AuthorizationPolicyNames.AdminOnly);

            userGroup.MapGet(ApiRoutes.User.Me, GetCurrentUserEndpointHandler.Handle)
                .WithName(nameof(GetCurrentUserEndpointHandler))
                .WithSummary("Get current authenticated user")
                .WithDescription(
                    $"""
                    Retrieves the profile of the currently authenticated user.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    The response includes:
                    - `Id`: User's unique identifier.
                    - `UserName`: Display username.
                    - `FirstName`, `MiddleName`, `LastName`: Personal names.
                    - `Role`: User's system role (e.g., Admin, User).

                    Possible responses:
                    - `200 OK`: User profile successfully retrieved.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<UserResponse>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            userGroup.MapGet(ApiRoutes.User.GetById, GetUserByIdEndpointHandler.Handle)
                .WithName(nameof(GetUserByIdEndpointHandler))
                .WithSummary("Get user by ID")
                .WithDescription(
                    $"""
                    Retrieves the public profile of a user by their unique ID.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): The unique identifier of the user to retrieve.

                    The response includes:
                    - `Id`: User's unique identifier.
                    - `UserName`: Display username.
                    - `FirstName`, `MiddleName`, `LastName`: Personal names.
                    - `Role`: User's system role.

                    Possible responses:
                    - `200 OK`: User profile successfully retrieved.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `404 NotFound`: No user exists with the specified ID.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<UserResponse>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            userGroup.MapPatch(ApiRoutes.User.Me, UpdateCurrentUserEndpointHandler.Handle)
                .WithName(nameof(UpdateCurrentUserEndpointHandler))
                .WithSummary("Update current user profile")
                .WithDescription(
                    $"""
                    Updates the profile of the currently authenticated user.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Request Body**:
                    - `UserName` (string, optional): New display username.
                    - `FirstName` (string, optional): Updated first name.
                    - `MiddleName` (string, optional): Updated middle name.
                    - `LastName` (string, optional): Updated last name.
                    - `Email` (string, optional): Updated email address.
                    - `Password` (string, optional): New password (must meet complexity rules).

                    **Notes**:
                    - Fields not included in the request body will remain unchanged.
                    - Attempting to set a username or email that already exists will result in a conflict.

                    **Possible responses**:
                    - `200 OK`: Profile updated successfully.
                    - `400 BadRequest`: Invalid input or failed validation (e.g., invalid email format).
                    - `409 Conflict`: Username or email already in use.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            userGroup.MapPatch(ApiRoutes.User.MePassword, UpdateCurrentUserPasswordEndpointHandler.Handle)
                .WithName(nameof(UpdateCurrentUserPasswordEndpointHandler))
                .WithSummary("Update current user password")
                .WithDescription(
                    $"""
                    Updates the password for the currently authenticated user.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Request Body**:
                    - `CurrentPassword` (string, required): The user's current password.
                    - `NewPassword` (string, required): New password (must meet complexity rules).
                    - `LogoutAll` (boolean, optional): If true, also revoke the current session (full logout).

                    **Notes**:
                    - Other active sessions will be revoked after a successful password change.
                    - When `LogoutAll` is false (default), the current session remains active.

                    **Possible responses**:
                    - `200 OK`: Password updated successfully.
                    - `400 BadRequest`: Invalid input or failed validation (e.g., password complexity).
                    - `401 Unauthorized`: Invalid session or current password is incorrect.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            userGroup.MapPost(ApiRoutes.User.Promote, PromoteUserEndpointHandler.Handle)
                .WithName(nameof(PromoteUserEndpointHandler))
                .WithSummary("Promote user")
                .WithDescription(
                    $"""
                    Promotes a user to the next role in the system hierarchy.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) and **SuperAdmin role** are required.

                    **Request Body**:
                    - `UserId` (uuid, required): The unique identifier of the user to promote.

                    **Role Hierarchy**:
                    - User → Admin → SuperAdmin
                    - Users already at the highest role (SuperAdmin) cannot be promoted.

                    **Notes**:
                    - Only SuperAdmins can perform this action.
                    - Attempting to promote a non-existent user will return `404 NotFound`.
                    - Attempting to promote a user already at the highest role will return `409 Conflict`.

                    **Possible responses**:
                    - `200 OK`: User successfully promoted.
                    - `403 Forbidden`: Current user does not have SuperAdmin privileges.
                    - `404 NotFound`: No user exists with the specified ID.
                    - `409 Conflict`: User is already at the highest role.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization(AuthorizationPolicyNames.SuperAdminOnly);

            userGroup.MapPost(ApiRoutes.User.Demote, DemoteUserEndpointHandler.Handle)
                .WithName(nameof(DemoteUserEndpointHandler))
                .WithSummary("Demote user")
                .WithDescription(
                    $"""
                    Demotes a user to the previous role in the system hierarchy.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) and **SuperAdmin role** are required.

                    **Request Body**:
                    - `UserId` (uuid, required): The unique identifier of the user to demote.

                    **Role Hierarchy**:
                    - SuperAdmin → Admin → User
                    - Users already at the lowest role (User) cannot be demoted.

                    **Notes**:
                    - Only SuperAdmins can perform this action.
                    - Attempting to demote a non-existent user will return `404 NotFound`.
                    - Attempting to demote a user already at the lowest role will return `409 Conflict`.

                    **Possible responses**:
                    - `200 OK`: User successfully demoted.
                    - `403 Forbidden`: Current user does not have SuperAdmin privileges.
                    - `404 NotFound`: No user exists with the specified ID.
                    - `409 Conflict`: User is already at the lowest role.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization(AuthorizationPolicyNames.SuperAdminOnly);

            userGroup.MapPost(ApiRoutes.User.Lock, LockUserEndpointHandler.Handle)
                .WithName(nameof(LockUserEndpointHandler))
                .WithSummary("Lock user account")
                .WithDescription(
                    $"""
                    Locks a user account and revokes all active sessions, preventing the user from logging in until unlocked.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) and **Admin or SuperAdmin role** are required.

                    **Request Body**:
                    - `UserId` (uuid, required): The unique identifier of the user account to lock.

                    **Notes**:
                    - Locked users cannot access the system until an Admin or SuperAdmin unlocks their account.
                    - Attempting to lock a non-existent user will return `404 NotFound`.
                    - Users who are already locked will still return `200 OK` (idempotent operation).

                    **Possible responses**:
                    - `200 OK`: User account successfully locked.
                    - `403 Forbidden`: Current user does not have Admin or SuperAdmin privileges.
                    - `404 NotFound`: No user exists with the specified ID.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization(AuthorizationPolicyNames.AdminOnly);

            userGroup.MapPost(ApiRoutes.User.Unlock, UnlockUserEndpointHandler.Handle)
                .WithName(nameof(UnlockUserEndpointHandler))
                .WithSummary("Unlock user account")
                .WithDescription(
                    $"""
                    Unlocks a previously locked user account, allowing the user to log in again.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) and **Admin or SuperAdmin role** are required.

                    **Request Body**:
                    - `UserId` (uuid, required): The unique identifier of the user account to unlock.

                    **Notes**:
                    - Unlocking a user who is not currently locked will still return `200 OK` (idempotent operation).
                    - Attempting to unlock a non-existent user will return `404 NotFound`.

                    **Possible responses**:
                    - `200 OK`: User account successfully unlocked.
                    - `403 Forbidden`: Current user does not have Admin or SuperAdmin privileges.
                    - `404 NotFound`: No user exists with the specified ID.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization(AuthorizationPolicyNames.AdminOnly);
        }
    }
}
