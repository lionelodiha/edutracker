using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class User
    {
        public static readonly OperationFailureResponse UserNotFound = new(
            Id: "USER_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "User not found.",
            Details: []
        );

        public static readonly OperationOutcomeResponse UserRetrieved = new(
            Id: "USER_RETRIEVED",
            Title: "User retrieved successfully.",
            Details: []
        );
    }
}
