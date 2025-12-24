using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;
using EduTracker.Application.Enums;
using EduTracker.Application.Models;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Auth
    {
        public static readonly OperationOutcomeResponse RegisterSuccessful = new(
            Id: "AUTH_REGISTER_SUCCESS",
            Title: "Registration successful.",
            Details: [
                new ResponseDetail(
                    Message: "Your account has been created successfully.",
                    Severity: ResponseSeverity.Info
                )
            ]
        );

        public static readonly OperationFailureResponse UnAuthorized = new(
            Id: "AUTH_UNAUTHORIZED",
            StatusCode: HttpStatusCodes.Unauthorized,
            Title: "Unauthorized access.",
            Details: [
                new ResponseDetail(
                    Message: "You need to log in to access this resource.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );

        public static readonly OperationFailureResponse InvalidCredentials = new(
            Id: "AUTH_INVALID_CREDENTIALS",
            StatusCode: HttpStatusCodes.Unauthorized,
            Title: "Sign-in failed.",
            Details: [
                new ResponseDetail(
                    Message: "The email/username or password you entered is incorrect. Please check your details and try again.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );

        public static readonly OperationOutcomeResponse LoginSuccessful = new(
            Id: "AUTH_LOGIN_SUCCESS",
            Title: "Welcome back.",
            Details: [
                new ResponseDetail(
                    Message: "You're now signed in and can continue using your account.",
                    Severity: ResponseSeverity.Info
                )
            ]
        );

        public static OperationOutcomeResponse LogoutSuccessful = new(
            Id: "AUTH_LOGOUT_SUCCESS",
            Title: "You're logged out!",
            Details: [
                new ResponseDetail(
                    Message: "You've successfully logged out. See you next time!",
                    Severity: ResponseSeverity.Info
                )
            ]
        );

        public static readonly OperationFailureResponse SessionNotFound = new(
            Id: "AUTH_SESSION_NOT_FOUND",
            StatusCode: HttpStatusCodes.Unauthorized,
            Title: "Session not found.",
            Details: [
                new ResponseDetail(
                    Message: "Your session could not be found or has expired. Please sign in again.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );

        public static readonly OperationFailureResponse SessionStateInvalid = new(
            Id: "AUTH_SESSION_STATE_INVALID",
            StatusCode: HttpStatusCodes.Unauthorized,
            Title: "Invalid session state.",
            Details: [
                new ResponseDetail(
                    Message: "Your session is in an invalid state. Please sign in again.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );

        public static readonly OperationOutcomeResponse SessionRefreshed = new(
            Id: "AUTH_SESSION_REFRESHED",
            Title: "Session refreshed.",
            Details: [
                new ResponseDetail(
                    Message: "Your session has been refreshed successfully.",
                    Severity: ResponseSeverity.Info
                )
            ]
        );
    }
}
