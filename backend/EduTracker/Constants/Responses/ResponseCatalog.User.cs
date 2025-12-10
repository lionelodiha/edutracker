using EduTracker.Common.Responses;
using EduTracker.Enums;
using EduTracker.Models;

namespace EduTracker.Constants.Responses;

public static partial class ResponseCatalog
{
    public static class User
    {
        public static readonly OperationFailureResponse NotFound = new(
            Id: "USER_NOT_FOUND",
            StatusCode: StatusCodes.Status404NotFound,
            Title: "User not found.",
            Details: [
                new ResponseDetail(
                    Message: "The user you're trying to access doesn't exist or may have been deleted.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );

        public static readonly OperationOutcomeResponse ProfileRetrieved = new(
            Id: "USER_PROFILE_RETRIEVED",
            Title: "Profile retrieved successfully.",
            Details: [
                new ResponseDetail(
                    Message: "The user's profile has been loaded and is ready for viewing.",
                    Severity: ResponseSeverity.Info
                )
            ]
        );

        public static readonly OperationFailureResponse EmailAlreadyTaken = new(
            Id: "USER_EMAIL_ALREADY_TAKEN",
            StatusCode: StatusCodes.Status409Conflict,
            Title: "Email already in use.",
            Details: [
                new ResponseDetail(
                    Message: "The email address you entered is already registered. Try logging in or use a different email address.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );

        public static readonly OperationFailureResponse UsernameAlreadyTaken = new(
            Id: "USER_USERNAME_ALREADY_TAKEN",
            StatusCode: StatusCodes.Status409Conflict,
            Title: "Username already in use.",
            Details: [
                new ResponseDetail(
                    Message: "The username you chose is already taken. Try a different username.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );
    }
}
