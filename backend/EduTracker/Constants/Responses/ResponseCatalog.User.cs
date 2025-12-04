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
            StatusCode: 404,
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
    }
}
