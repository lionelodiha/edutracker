using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Sessions.Handlers.GetCurrentUserSessions;
using EduTracker.Api.Endpoints.Sessions.Handlers.RevokeAllCurrentUserSessions;
using EduTracker.Api.Endpoints.Sessions.Handlers.RevokeCurrentUserSession;
using EduTracker.Api.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Sessions;

internal sealed class SessionEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Session.Base)
            .WithTags("Sessions");

        group.MapGet(ApiRoutes.Session.Me, GetCurrentUserSessionsEndpointHandler.Handle)
            .WithName(nameof(GetCurrentUserSessionsEndpointHandler))
            .WithSummary("Get current user sessions")
            .WithDescription(
                $"""
                Retrieves the current user's active sessions.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Notes**:
                - Revoked sessions are not included in the response.

                Possible responses:
                - `200 OK`: Sessions retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<SessionData>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Session.Revoke, RevokeCurrentUserSessionEndpointHandler.Handle)
            .WithName(nameof(RevokeCurrentUserSessionEndpointHandler))
            .WithSummary("Revoke a current user specific session")
            .WithDescription(
                $"""
                Revokes a specific session belonging to the current user.

                **Authentication Required**: A valid session is needed.

                **Route Parameter**:
                - `id` (uuid): The ID of the session to revoke.

                **Behavior**:
                - The specified session will be invalidated in the database.
                - If the revoked session is the current session, the user may be logged out.
                - No other sessions are affected.

                **Possible responses**:
                - `200 OK`: Session successfully revoked.
                - `404 NotFound`: Session ID does not exist or does not belong to the user.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();

        group.MapPost(ApiRoutes.Session.RevokeAll, RevokeAllCurrentUserSessionsEndpointHandler.Handle)
            .WithName(nameof(RevokeAllCurrentUserSessionsEndpointHandler))
            .WithSummary("Revoke all current user sessions")
            .WithDescription(
                $"""
                Revokes all sessions for the current user **except the current one**.

                **Authentication Required**: A valid session is needed.

                **Query Parameter**:
                - `keepCurrentUserSession` (bool, optional): If `true`, the current session will be preserved; default is `false`.

                **Behavior**:
                - All sessions except the one specified (or current session if `keepCurrentUserSession = true`) are revoked.
                - Any revoked session will be logged out automatically.

                **Possible responses**:
                - `200 OK`: All targeted sessions successfully revoked.
                - `500 InternalServerError`: Unexpected server error.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
            .RequireAuthorization();
    }
}
