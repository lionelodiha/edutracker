using EduTracker.Common.Responses;
using EduTracker.Models;

namespace EduTracker.Constants.Responses;

public static partial class ResponseCatalog
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
            StatusCode: StatusCodes.Status401Unauthorized,
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
            StatusCode: StatusCodes.Status401Unauthorized,
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
    }
}
