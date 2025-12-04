using EduTracker.Common.Responses;
using EduTracker.Enums;
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
                    "Your account has been created successfully. Please verify your email to complete registration.",
                    ResponseSeverity.Info
                )
            ]
        );

        public static readonly OperationFailureResponse EmailAlreadyTaken = new(
            Id: "AUTH_EMAIL_ALREADY_TAKEN",
            StatusCode: 409,
            Title: "Email already in use.",
            Details: [
                new ResponseDetail(
                    "The email address you entered is already registered. Try logging in or use a different email address.",
                    ResponseSeverity.Warning
                )
            ]
        );

        public static readonly OperationFailureResponse UsernameAlreadyTaken = new(
            Id: "AUTH_USERNAME_ALREADY_TAKEN",
            StatusCode: 409,
            Title: "Username already in use.",
            Details: [
                new ResponseDetail(
                    "The username you chose is already taken. Try a different username.",
                    ResponseSeverity.Warning
                )
            ]
        );
    }
}
