using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Auth
    {
        public static readonly OperationOutcomeResponse RegistrationSuccessful = new(
            Id: "AUTH_REGISTRATION_SUCCESSFUL",
            Title: "User registered successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse EmailAlreadyExists = new(
            Id: "AUTH_EMAIL_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Email address already exists.",
            Details: []
        );

        public static readonly OperationOutcomeResponse LoginSuccessful = new(
            Id: "AUTH_LOGIN_SUCCESSFUL",
            Title: "Logged in successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse InvalidCredentials = new(
            Id: "AUTH_INVALID_CREDENTIALS",
            StatusCode: HttpStatusCodes.Unauthorized,
            Title: "Invalid credentials.",
            Details: []
        );

        public static readonly OperationFailureResponse InvalidCurrentPassword = new(
            Id: "AUTH_INVALID_CURRENT_PASSWORD",
            StatusCode: HttpStatusCodes.Unauthorized,
            Title: "Current password is incorrect.",
            Details: []
        );

        public static readonly OperationOutcomeResponse SessionRefreshed = new(
            Id: "AUTH_SESSION_REFRESHED",
            Title: "Session refreshed.",
            Details: []
        );

        public static readonly OperationOutcomeResponse SessionRevoked = new(
            Id: "AUTH_SESSION_REVOKED",
            Title: "Session revoked.",
            Details: []
        );

        public static readonly OperationOutcomeResponse LogoutSuccessful = new(
            Id: "AUTH_LOGOUT_SUCCESSFUL",
            Title: "Logged out.",
            Details: []
        );

        public static readonly OperationFailureResponse InvalidSession = new(
            Id: "AUTH_INVALID_SESSION",
            StatusCode: HttpStatusCodes.Unauthorized,
            Title: "Session invalid or expired.",
            Details: []
        );
    }
}
