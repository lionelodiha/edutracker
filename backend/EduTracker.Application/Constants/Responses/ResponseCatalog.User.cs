using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class User
    {
        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "USER_RETRIEVED",
            Title: "User profile retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "USER_UPDATED",
            Title: "User profile updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse PasswordUpdated = new(
            Id: "USER_PASSWORD_UPDATED",
            Title: "User password updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Promoted = new(
            Id: "USER_PROMOTED",
            Title: "User promoted successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Demoted = new(
            Id: "USER_DEMOTED",
            Title: "User demoted successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "USER_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "The requested user profile was not found.",
            Details: []
        );

        public static readonly OperationFailureResponse UserNameExists = new(
            Id: "USER_USERNAME_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "The provided username is already in use.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyTopRole = new(
            Id: "USER_ALREADY_TOP_ROLE",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "User is already at the highest role.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyBottomRole = new(
            Id: "USER_ALREADY_BOTTOM_ROLE",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "User is already at the lowest role.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Locked = new(
            Id: "USER_LOCKED",
            Title: "User account has been locked successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Unlocked = new(
            Id: "USER_UNLOCKED",
            Title: "User account has been unlocked successfully.",
            Details: []
        );
    }
}
